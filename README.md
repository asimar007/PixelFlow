# PixelFlow

PixelFlow is a cloud-based, scalable video transcoding service inspired by [MUX](https://www.mux.com/). It enables users to upload high-quality videos, which are then processed into multiple resolutions for optimized streaming, ensuring compatibility across various devices and network conditions.

## Diagram

![Diagram](https://github.com/asimar007/Cross-Region-Migration-of-AWS-EBS-Volumes/blob/main/Screenshot/PlexFlow/MUX%20clone.png?raw=true)

1.  **Video Upload**: Users upload 4K videos (e.g., 100MB) to an S3 bucket (`temp-s3`).
2.  **Message Queue**: An SQS message is triggered upon video upload, which the Node.js service polls to start processing.
3.  **Validation**: The Node.js service validates incoming video files to ensure they are in the correct format.
4.  **Transcoding**: A Docker container running FFmpeg downloads the video from `temp-s3`, transcodes it into multiple resolutions, and uploads the output to a production S3 bucket (`Production-S3`).
5.  **Storage**: Videos are stored in `Production-S3` in various formats (360p, 480p, 720p) to support adaptive bitrate streaming.

## Demo


https://github.com/user-attachments/assets/ecd6dd4d-2295-42f1-987e-425f4f913ca8





## Table of Contents

-   [Tech Stack](#tech-stack)
-   [Features](#features)
-   [What I Learned](#what-i-learned)
-   [Uses](#uses)
-   [Getting Started](#getting-started)
    -   [Prerequisites](#prerequisites)
    -   [Installation](#installation)
    -   [Configuration](#configuration)
    -   [Usage](#usage)
    -   [Testing](#testing)
-   [Acknowledgments](#acknowledgments)

## Tech Stack

-   **Node.js**: Backend logic, SQS polling, validation, and transcoding orchestration.
-   **TypeScript**: Strongly-typed code for better maintainability and readability.
-   **Docker**: Isolated, scalable environment for running FFmpeg, deployed with ECS and ECR.
-   **FFmpeg**: Video transcoding engine for converting videos into multiple resolutions.
-   **AWS Services**:
    -   **S3**: For temporary and production video storage.
    -   **SQS**: Queue for processing new uploads.
    -   **ECS**: Orchestrates Docker containers for transcoding.
    -   **ECR**: Stores Docker images for ECS tasks.
    -   **AWS Lambda**: Manages automation tasks in a serverless fashion.

## Features

-   **Scalable Transcoding**: Processes videos in parallel using a containerized approach to handle large volumes efficiently.
-   **Adaptive Bitrate Streaming (ABR)**: Generates multiple resolutions to enable adaptive bitrate streaming, allowing viewers to experience the best video quality based on their network speed and device capabilities.
-   **Multi-Resolution Output**: Outputs videos in multiple resolutions (360p, 480p, 720p) for adaptive streaming support.
-   **Cost-Effective Architecture**: Uses serverless resources like AWS Lambda to optimize costs.
-   **Automated Workflow**: Uses AWS S3, SQS, and ECS to orchestrate a seamless video processing pipeline.

## Getting Started

### Prerequisites

-   **AWS Account** with permissions for S3, SQS, ECS, ECR, and Lambda.
-   **Docker** installed locally for container development and testing.
-   **Node.js** and **npm** installed.

### Installation

1.  **Clone the repository**
  ```
    git clone https://github.com/asimar007/PixelFlow.git
    cd PixelFlow
``` 
    
2.  **Install dependencies**
    
   ```
    npm install
 ``` 
 ```
 cd container
 npm install
 ```
    
4.  **Set up AWS CLI** and **configure AWS credentials** for deploying the infrastructure.
    

### Configuration

1.  Create an `.env` file with the following environment variables
 - This is for Parent Directory
```
QUEUE_URL=your-queue-url
TASK_DEFINITION=your-task-arn
CLUSTER=arn:your-cluster-arn
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
   ``` 
- This is for `/container` Directory  `.env`
```
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```
#### Give Extra Permission to SQS to Access `temp-s3`
```
{
  "Version": "2012-10-17",
  "Id": "__default_policy_ID",
  "Statement": [
    {
      "Sid": "__owner_statement",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789011:root"
      },
      "Action": "SQS:*",
      "Resource": "arn:aws:sqs:ap-south-1:123456789011:VideoQueueS3"
    },
    {
      "Sid": "allowS3BucketToSendMessage",
      "Effect": "Allow",
      "Principal": {
        "Service": "s3.amazonaws.com"
      },
      "Action": "SQS:SendMessage",
      "Resource": "arn:aws:sqs:ap-south-1:123456789011:VideoQueueS3",
      "Condition": {
        "ArnLike": {
          "aws:SourceArn": "arn:aws:s3:::temp-video-s3"
        }
      }
    }
  ]
}
```
### Usage

1.  **Run the Node.js service** to poll SQS for new video processing tasks
    
 ```
    npm run dev
 ``` 
    
2.  **Build and push Docker image** for FFmpeg processing
   - Step-1
 ```
    docker build -t pixel-flow .
   ``` 
  - Step-2
  ```
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_DEFAULT_REGION=ap-south-1
```
 - Step-2
 Authenticate your Docker client to the **Amazon ECR registry** to which you intend to push your image. Authentication tokens must be obtained for each registry used, and the tokens are valid for 12 hours. For more information, see [Private registry authentication in Amazon ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/registry_auth.html).
 ```
 aws ecr get-login-password --region region | docker login --username AWS --password-stdin aws_account_id.dkr.ecr.region.amazonaws.com
 ```
 Tag your image with the Amazon ECR registry, repository, and optional **image tag** name combination to use.
 ```
 docker tag e9ae3c220b23 aws_account_id.dkr.ecr.region.amazonaws.com/pixel-flow:latest
 ```
 Push the image using the **docker push** command:
 ```
 docker push aws_account_id.dkr.ecr.region.amazonaws.com/pixel-flow:latest
 ```
3.  **Deploy to ECS** using your AWS setup to orchestrate transcoding tasks on the cloud.

## What I Learned

-   **Serverless Architecture**: Leveraging AWS Lambda for scalable, cost-effective processing.
-   **AWS Services**: Deepened understanding of using AWS S3 for storage, SQS for queuing, and ECS for container orchestration.
-   **FFmpeg**: Learned to use FFmpeg for adaptive bitrate transcoding, converting videos into multiple resolutions.
-   **Containerization**: Used Docker to create isolated environments for transcoding tasks, ensuring consistent builds.
-   **TypeScript**: Reinforced best practices with TypeScript for reliable, type-safe code in a Node.js environment.

## Uses

-   **Video Streaming Platforms**: Ideal for services needing adaptive bitrate streaming to serve users with different bandwidths and device capabilities.
-   **E-Learning**: Enables high-quality video delivery at various resolutions, enhancing accessibility for students with diverse internet connections.
-   **Media & Entertainment**: Perfect for content delivery networks (CDNs) requiring scalable, multi-resolution video processing for efficient streaming.

## Acknowledgments

-   [MUX](https://www.mux.com/) for the inspiration behind this project.
-   [AWS Documentation](https://aws.amazon.com/documentation/) for guidance on using AWS services.
-   [FFmpeg Documentation](https://ffmpeg.org/documentation.html) for video processing resources.
