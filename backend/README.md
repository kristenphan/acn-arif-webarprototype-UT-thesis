./backend directory contains the source code for 3 lambda functions and 2 dynamodb tables which collectively serve as the backend services for a webAR application:
1. webar-lambda-sensordataselect
2. webar-lambda-watermeselect
3. webar-lambda-watermeinsert
4. webar-ddb-sensordata
5. webar-ddb-wateringhistory

The backend services are deployed to AWS using SAM CLI. 