import axios from "axios";

export default async function getWateringHistory(lamdbaFunctionURL, plantId) {
  try {
    const response = await axios.post(lamdbaFunctionURL, {
      plantId: plantId
    });
    return response.data;
  } catch (error) {
    console.error(error);
  }
}