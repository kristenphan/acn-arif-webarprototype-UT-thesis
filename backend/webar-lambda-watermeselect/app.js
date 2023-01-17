import {DynamoDBClient, QueryCommand} from "@aws-sdk/client-dynamodb";

const AWSREGION = process.env.AWSREGION;
const DDBTABLENAME = process.env.DDBTABLENAME;

export const handler = async (event) => {
    // Extract params from event
    const plantIdStr = event.queryStringParameters.plantId;
    
    // Create a DynamoDBClient which auto marshalls JSON-like params to DynamoDB JSON
    const ddbClient = new DynamoDBClient({region: AWSREGION});
    
    const params = {
        TableName: DDBTABLENAME,
        ExpressionAttributeValues: {
            ":plantId": {"N": plantIdStr},
        },
        KeyConditionExpression: "plantId = :plantId",
        ScanIndexForward: false, // Sort by sort key "timestamp": False = newest to oldest
        Limit: 3, // Show 3 items
    };
    
    // Run query. Lambda is given IAM role to access Dynamodb table
    try {
        const data = await ddbClient.send(new QueryCommand(params));
        console.log("Command success!");
        console.log("data.Items = ", data.Items);
        return data.Items;
    } catch (err) {
        console.log("error = ", err);
        return err;
    }
};