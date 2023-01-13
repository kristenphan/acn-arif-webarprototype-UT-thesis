import insertWateringRecord from "./insertwateringrecord";

const plantId = 1;
const LambdaFunctionURLWaterMeInsert = "https://7fnzpjplpoorwao2zg3ckrylge0natas.lambda-url.eu-central-1.on.aws/"; 

// Wait until html finishes loading, 
// then invoke a lambda function to write a new watering record in backend database
document.addEventListener("DOMContentLoaded", () => {
  // If button Submit is clicked, add a new watering record to backend database
  document.getElementById("button-submit").addEventListener("click", async() => {
    // Obtain epoch time when the form is submitted
    const timeEpoch = Math.floor(Date.now() / 1000);

    // Obtain the plant status and write it to a database
    // Radio button "Good" is checked by default
    const radioButtonGroup = document.getElementsByName("plant-status");
    const checkedRadio = Array.from(radioButtonGroup).find((radio) => radio.checked);
    const plantStatus = checkedRadio.value;

    // Invoke lambda to write a new watering record to database
    await insertWateringRecord(LambdaFunctionURLWaterMeInsert, plantId, timeEpoch, plantStatus);
    // Return to main dashboard
    window.location.href = "./index.html";
  });
});

