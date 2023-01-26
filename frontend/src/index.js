import { mockWithImage, mockWithVideo } from "../assets/libs/camera-mock";
import { CSS3DObject} from "three/examples/jsm/renderers/CSS3DRenderer";
import * as THREE from "three";
import * as handpose from "@tensorflow-models/handpose";
import * as fp from "fingerpose";
import getMoistureData from "./getmoisturedata";
import transformTimestamp from "./transformtimestamp";
import getWateringHistory from "./getwateringhistory";
import insertWateringRecord from "./insertwateringrecord";

const LambdaFunctionURLSensorDataSelect = process.env.LAMBDAFUNCTIONURLSENSORDATASELECT;
const LambdaFunctionURLWaterMeSelect = process.env.LAMBDAFUNCTIONURLWATERMESELECT;
const LambdaFunctionURLWaterMeInsert = process.env.LAMBDAFUNCTIONURLWATERMEINSERT; 
const moistureSensorId = 1;
const plantId = 1;
const LSURL = "https://liquidstudio.nl/";

// Load .js after html doc has loaded
document.addEventListener("DOMContentLoaded", () => {
  const start = async() => {
		// Use mock webcam for testing: mockWithVideo is more stable
		/* mockWithImage("../assets/mock-videos/ls-horizontal.png"); */
		
		// Instantiate MindARThree object which auto instantiates three.js renderder, CSSRenderer, scene, CSSScene, perspective camera
		const mindarThree = new window.MINDAR.IMAGE.MindARThree({
			container: document.body, // size of three.js renderer <canvas>
			imageTargetSrc: "../assets/targets/acn.mind",
		});
		const {renderer, cssRenderer, scene, cssScene, camera} = mindarThree;
		// Add light to scene to "light up" GLTF model. Otherwise, model will be completely dark
		const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    	scene.add(light);

		// Create a CSS3DObject from a <div> which has "visibility: hidden" css styling 
		// so that <div> does not show before MindAR camera starts
		// dashboardCSSObject.children = [] since only 1 object is created using new CSS3DObject(). No child objects are auto created
		// for <div>'s embeded inside <div id="dashboard">
		const dashboardCSS3DObject = new CSS3DObject(document.getElementById("dashboard"));
		const cssAnchor = mindarThree.addCSSAnchor(0);
		cssAnchor.group.add(dashboardCSS3DObject);

		document.getElementById("home-viewhistory-button").addEventListener("click", async() => {
			// Update dashboard content
			document.getElementById("dashboard-home").classList.add("hidden");
			document.getElementById("dashboard-viewhistory").classList.remove("hidden");
			// Invoke lambda to retrieve watering history from dynamodb
			const records = await getWateringHistory(LambdaFunctionURLWaterMeSelect, plantId);
			// populate the dashboard with the latest watering records
			for (let i = 0; i < records.length; i++) {
				const recordIdTag = "record" + (i+1).toString();;
				const iconIdTag = "status" + (i+1).toString();
				const plantStatus = records[i]["plantStatus"]["S"].toLowerCase();
				const timestamp = transformTimestamp(records[i]["timeEpoch"]["N"]);
				// display a thumb-up or thumb-down icon corresponding to plantStatus
				if (plantStatus === "good") {
					const iconName = "thumb-up";
					const img = document.getElementById(iconIdTag);
					img.src = `../assets/images/${iconName}.png`;
					img.classList.add("thumb-up");
					img.classList.remove("thumb-down");
				}
				else if (plantStatus === "not good") {
					const iconName = "thumb-down";
					const img = document.getElementById(iconIdTag);
					img.src = `../assets/images/${iconName}.png`;
					img.classList.add("thumb-down");
					img.classList.remove("thumb-up");
				}
				else {
					console.log("plantStatus is neither Good or Bad. Unable to find correct thumb-up/-down icon");
				}
				// display the watering records
				document.getElementById(recordIdTag).innerHTML = `Status ${plantStatus} @ ${timestamp}`;
			}
		});

		// Go to About Me page when "About me" button on Home page is clicked
		document.getElementById("home-aboutme-button").addEventListener("click", () => {
			// Resize dashboard
			document.getElementById("dashboard").style.height = "1150px";
			// Update dashboard content
			document.getElementById("dashboard-home").classList.add("hidden");
			document.getElementById("dashboard-aboutme-page").classList.remove("hidden");
		});

		document.getElementById("home-getupdates-button").addEventListener("click", async () => {
			// Invoke lambda function url to retrieve sensor value and timestamp from dynamodb
			const moistureData = await getMoistureData(LambdaFunctionURLSensorDataSelect, moistureSensorId);
			const moisturePercentage = moistureData.sensorValue;
			const moistureTimestamp = transformTimestamp(moistureData.timeEpoch);

			// Display updated moisture data
			document.getElementById("moisture-reading").innerHTML = `Soil moisture: ${moisturePercentage}%`; 
			document.getElementById("moisture-timestamp").innerHTML = `As of: ${moistureTimestamp}`; 

			// Update water cup image depending on the moisture reading
			if (moisturePercentage < 30) {
				document.getElementById("water-cup").src = "../assets/images/water-low.png";	
			} else if (moisturePercentage >= 30 && moisturePercentage < 60) {
				document.getElementById("water-cup").src = "../assets/images/water-medium.png";	
			} else {
				document.getElementById("water-cup").src = "../assets/images/water-high.png";
			}
		});

		// Return to Home page when "Return" button on About Me page is clicked
		document.getElementById("aboutme-page-return-button").addEventListener("click", () => {
			// Resize dashboard
			document.getElementById("dashboard").style.height = "700px";
			// Update dashboard content
			document.getElementById("dashboard-aboutme-page").classList.add("hidden");
			document.getElementById("dashboard-home").classList.remove("hidden");
		});

		// Return to Home page when "Return" button on View History page is clicked
		document.getElementById("viewhistory-return-button").addEventListener("click", () => {
			// Update dashboard content
			document.getElementById("dashboard-viewhistory").classList.add("hidden");
			document.getElementById("dashboard-home").classList.remove("hidden");
		});

		// Load handpose tensowflow model
		const model = await handpose.load();
		// Define "👎" gesture. "👍" gesture is pre-defined by fingerpose fp
		const thumbsDownGesture = new fp.GestureDescription('thumbs_down');

		thumbsDownGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl);
		thumbsDownGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalDown, 1.0);
		thumbsDownGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalDownLeft, 0.9);
		thumbsDownGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalDownRight, 0.9);
		// do this for all other fingers
		for(let finger of [fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
			thumbsDownGesture.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
			thumbsDownGesture.addCurl(finger, fp.FingerCurl.HalfCurl, 0.9);
		}

		// Create GestureEstimator GE with the above gestures
		const GE = new fp.GestureEstimator([fp.Gestures.ThumbsUpGesture, thumbsDownGesture]);

		// Start MindAR engine
		await mindarThree.start();
		// After MindAR engine has started, start renderer's loop to (re)render content for every video frame
		renderer.setAnimationLoop(() => {
			// Update dashboard's position before re-rendering cssScene (dashboard is attached to cssScene)
			// so that dashboard always face towards camera
			dashboardCSS3DObject.lookAt(camera.position);

			// Re-render scene and cssScene
			renderer.render(scene, camera);
			cssRenderer.render(cssScene, camera);
		});

    // Get camera stream
    const cameraStream = mindarThree.video;
    // Detect hand in camera stream. Estimate gestures of detected hand. Play actions accordingly
    let skipCount = 0;
    // Create detect() to recursively call window.requestAnimationFrame(detect) 
    // to detect hand gestures and play corresponding animations
    const detect = async () => {
      // Use skipCount to skip detecting hands, which is an expensive operation, in #skipCount of video frames 
      if (skipCount < 10) {
        skipCount += 1;
        window.requestAnimationFrame(detect);
        return;
      }
      skipCount = 0;
      // Detect hands using hand pose model + camera stream
      // "predictions" is an array of objects describing each detected hand
      // as described here https://github.com/tensorflow/tfjs-models/tree/master/handpose
      const predictions = await model.estimateHands(cameraStream);
      // If hand is detected, estimate the gesture using the first hand detected idx=0
      // using threshold of 7.5 
      if (predictions.length > 0) {
        // Estimate the gestures of the detected hand with threshold of 9.5
        // 10 = highest confidence for an estimated gesture
        const estimatedGestures = GE.estimate(predictions[0].landmarks, 9.5);
        // Find the best gesture based on estimated score
        if (estimatedGestures.gestures.length > 0) {
					const best = estimatedGestures.gestures.sort((g1, g2) => g2.confidence - g1.confidence)[0];
					// Play the animation according to the detected gesture with fade-in effect
					if (best.name === 'thumbs_up') {
						alert("Recorded a new watering record with plant status 'Good'.");
						// Obtain epoch time and plant status
						const timeEpoch = Math.floor(Date.now() / 1000);
						const plantStatus = "Good";
						// Invoke lambda to write a new watering record to database
						await insertWateringRecord(LambdaFunctionURLWaterMeInsert, plantId, timeEpoch, plantStatus);
						setTimeout(() => {
							console.log(".");
							}, "500"
						);
					}
				if (best.name === 'thumbs_down') {
					alert("Recorded a new watering record with plant status 'Not good'.");
					// Obtain epoch time and plant status
					const timeEpoch = Math.floor(Date.now() / 1000);
					const plantStatus = "Not good";
					// Invoke lambda to write a new watering record to database
					await insertWateringRecord(LambdaFunctionURLWaterMeInsert, plantId, timeEpoch, plantStatus);
					setTimeout(() => {
						console.log(".");
						}, "500"
					);
							}
					}
				}
      window.requestAnimationFrame(detect);
    };
    window.requestAnimationFrame(detect);
	};
	start();
});