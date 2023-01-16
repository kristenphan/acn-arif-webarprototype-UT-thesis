./backend directory contains the source code for 3 lambda functions and 2 dynamodb tables which collectively serve as the backend services for a WebAR application:
1. webar-lambda-sensordataselect: query the latest sensor data from ddb table webar-ddb-sensordata
2. webar-lambda-watermeselect: query the latest watering records from ddb table webar-ddb-wateringhistory
3. webar-lambda-watermeinsert: insert a new watering record to ddb table webar-ddb-wateringhistory
4. webar-ddb-sensordata: store sensor data streamed from IoT Core
5. webar-ddb-wateringhistory: store watering history recorded by users when using WebAR application

The backend services are deployed to AWS using SAM CLI. 

./frontend and ./backend services are part of a CI/CD pipeline defined in azure-pipelines.yml to enable automatic build and deployment. 