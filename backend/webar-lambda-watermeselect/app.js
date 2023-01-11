import {DynamoDBClient, QueryCommand} from "@aws-sdk/client-dynamodb";

const REGION = "eu-central-1";
const DDBTABLENAME = "webar-ddb-wateringhistory";

export const handler = async (event) => {
    // Extract params from event
    const body = JSON.parse(event.body);
    const plantIdStr = String(body.plantId);

    // Create a DynamoDBClient which auto marshalls JSON-like params to DynamoDB JSON
    const ddbClient = new DynamoDBClient({region: REGION});
    
    const params = {
        TableName: DDBTABLENAME,
        KeyConditionExpression: "plantId = :plantId",
        ExpressionAttributeValues: {
            ":plantId": {"N": plantIdStr},
        },
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