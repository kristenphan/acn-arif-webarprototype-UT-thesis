./backend directory contains the source code for 3 lambda functions and 2 dynamodb tables which collectively serve as the backend services for a WebAR application:
1. webar-lambda-sensordataselect
2. webar-lambda-watermeselect
3. webar-lambda-watermeinsert
4. webar-ddb-sensordata
5. webar-ddb-wateringhistory

The backend services are deployed to AWS using SAM CLI. 

./frontend and ./backend services are part of a CI/CD pipeline defined in azure-pipelines.yml to enable automatic build and deployment. 