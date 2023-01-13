import axios from "axios";

export default async function insertWateringRecord(lamdbaFunctionURL, plantId, timeEpoch, plantStatus) {
  try {
    const response = await axios.post(lamdbaFunctionURL, {
      plantId: plantId,
      timeEpoch: timeEpoch,
      plantStatus: plantStatus
    });
    return response;
  } catch (error) {
    console.error(error);
    return error;
  }
}