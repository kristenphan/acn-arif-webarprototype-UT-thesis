import axios from "axios";

export default async function getMoistureData(lamdbaFunctionURL, sensorId) {
  try {
    const response = await axios.get(lamdbaFunctionURL, {
      params: {
        sensorId: sensorId
      }
    });
    return response.data;
  } catch (error) {
    console.error(error);
  }
}