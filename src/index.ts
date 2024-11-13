import { config } from "dotenv";
config();
import {
  ReceiveMessageCommand,
  SQSClient,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { S3Event } from "aws-lambda";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";

const client = new SQSClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const ecsClient = new ECSClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function init() {
  const command = new ReceiveMessageCommand({
    QueueUrl: process.env.QUEUE_URL!,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 20,
  });

  while (true) {
    const { Messages } = await client.send(command);
    if (!Messages) {
      console.log(`No Message in Queue`);
      continue;
    }
    try {
      for (const message of Messages) {
        const { MessageId, Body } = message;
        console.log(`Message Received`, { MessageId, Body });

        // ! Validate & Parse the event
        if (!Body) continue;
        const event = JSON.parse(Body) as S3Event;
        // Ignore the Test Event
        if ("Service" in event && "Event" in event) {
          if (event.Event === "s3:TestEvent") {
            await client.send(
              new DeleteMessageCommand({
                QueueUrl: process.env.QUEUE_URL!,
                ReceiptHandle: message.ReceiptHandle,
              })
            );
            continue;
          }
        }

        for (const record of event.Records) {
          const { s3 } = record;
          const {
            bucket,
            object: { key },
          } = s3;

          // Move the RunTaskCommand inside the loop
          const runTaskCommand = new RunTaskCommand({
            taskDefinition: process.env.TASK_DEFINITION!,
            cluster: process.env.CLUSTER!,
            launchType: "FARGATE",
            networkConfiguration: {
              awsvpcConfiguration: {
                assignPublicIp: "ENABLED",
                securityGroups: ["sg-0beb15366cb1f0770"],
                subnets: [
                  "subnet-01d35e881cd89c2ab",
                  "subnet-004c394ff8ef4fe91",
                  "subnet-0d146f0dea5382f8d",
                ],
              },
            },
            overrides: {
              containerOverrides: [
                {
                  name: "mux-clone",
                  environment: [
                    { name: "BUCKET_NAME", value: bucket.name },
                    { name: "KEY", value: key },
                  ],
                },
              ],
            },
          });
          await ecsClient.send(runTaskCommand);
          // ! Delete the Message from Queue
          await client.send(
            new DeleteMessageCommand({
              QueueUrl: process.env.QUEUE_URL!,
              ReceiptHandle: message.ReceiptHandle,
            })
          );
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
}
init();
