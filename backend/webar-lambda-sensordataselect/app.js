import {DynamoDBClient, QueryCommand} from "@aws-sdk/client-dynamodb";
let response;
const AWSREGION = process.env.AWSREGION;
const DDBTABLENAME = process.env.DDBTABLENAME;

// Return the latest sensor value and the associated timestamp for a sensor identified by sensor Id 
export const handler = async (event) => {
	// Extract params from event
	const sensorIdStr = event.queryStringParameters.sensorId;

	// Create a DynamoDBClient which auto marshalls JSON-like params to DynamoDB JSON
	const ddbClient = new DynamoDBClient({region: AWSREGION});
	
	const params = {
		TableName: DDBTABLENAME,
		ExpressionAttributeValues: {
			":sensorId": {"N": sensorIdStr},
		},
		KeyConditionExpression: "sensorId = :sensorId", // sensorId = partition key
		ScanIndexForward: false, // timestamp = sort key: False = sort from newest to oldest
		Limit: 1 // Show n item
	};
	
	// Run query. Lambda is given IAM role to access Dynamodb table
	try {
		const data = await ddbClient.send(new QueryCommand(params));
		const sensorValue = data.Items[0].sensorValue["N"]; 
		const timeEpoch = data.Items[0].timeEpoch["N"];
		console.log("Command success!");
		console.log("data.Items = ", data.Items);
		console.log("event = ", event);
		response = {
			"statusCode": 200,
			"body": JSON.stringify({
					sensorValue: sensorValue,
					timeEpoch: timeEpoch
			})
		}		
	} catch (err) {
			console.log("error = ", err);
			return err;
	}
	return response;
};