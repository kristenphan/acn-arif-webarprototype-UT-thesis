import axios from "axios";

export default async function getMoistureData(lamdbaFunctionURL, sensorId) {
  try {
    const response = await axios.post(lamdbaFunctionURL, {
      sensorId: sensorId
    });
    return response.data;
  } catch (error) {
    console.error(error);
  }
}