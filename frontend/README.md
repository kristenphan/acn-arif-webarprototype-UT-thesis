./frontend directory contains the source code for the frontend of a WebAR application. 

Build tools included:
1. babel
2. webpack

Using SAM CLI, the source code is built and uploaded to a S3 bucket. These static assets are then delivered to browser via a CloudFront distribution which is connected to the S3 bucket. Using CloudFront allows for HTTPS traffic, which is required by most browsers to access webcam when running the webAR application.

./frontend and ./backend services are part of a CI/CD pipeline defined in azure-pipelines.yml to enable automatic build and deployment.  