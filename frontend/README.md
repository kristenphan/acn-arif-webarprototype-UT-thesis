./frontend directory contains the source code for the frontend of a WebAR application. 

The frontend of the WebAR application is built using MindAR as the tracking engine and ThreeJS as the rendering engine. TensorFlow pre-trained model fingerpose is implemented for hand gesture commands. The TensorFlow model is executed by the browser. 

Build tools included:
1. babel
2. webpack

Using SAM CLI, the frontend's source code is built and uploaded to a S3 bucket. These static assets are then delivered to browser via a CloudFront distribution which is connected to the S3 bucket. Using CloudFront allows for HTTPS traffic, which is required by most browsers to access webcam required for webAR application.

./frontend and ./backend services are part of a CI/CD pipeline defined in azure-pipelines.yml to enable automatic build and deployment. Once a new commit is made to Azure DevOps repo, the pipeline is automatically kicked off to:
(1) build the frontend and backend, 
(2) upload the build artifacts to a S3 bucket - see ./frontend/samconfig.toml and ./backend/samconfig.toml, 
(3) deploy the frontend and backend on AWS resources defined in SAM templates - see ./frontend/template.yaml and ./backend/template.yaml.