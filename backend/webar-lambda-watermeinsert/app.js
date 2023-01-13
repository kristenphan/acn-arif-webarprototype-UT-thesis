import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, PutCommand} from "@aws-sdk/lib-dynamodb";

const AWSREGION = process.env.AWSREGION;
const DDBTABLENAME = process.env.DDBTABLENAME;

// Return true if function executes successfully. Otherwise, return false
export const handler = async (event) => {
    // Extract params from event
    const body = JSON.parse(event.body);
    const plantId = body.plantId;
    const timeEpoch = body.timeEpoch;
    const plantStatus = body.plantStatus;
    
    // Create a DynamoDBClient which auto marshalls JSON-like params to DynamoDB JSON
    const ddbClient = new DynamoDBClient({region: AWSREGION});
    const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
    
    // Create params of PutCommand ie., putItem()
    const params = {
        TableName: DDBTABLENAME,
        Item: {
            "plantId": plantId, // partition key type NUMBER
            "timeEpoch": timeEpoch, // sort key NUMBER
            "plantStatus": plantStatus 
          }
    };
    
    // Run query. Lambda is given IAM role to access Dynamodb table
    try {
        const data = await ddbDocClient.send(new PutCommand(params));
        console.log("PutCommand success!");
        console.log("data = ", data);
        return true;
    } catch (err) {
        console.log("error = ", err.stack);
        return false;
    }
};