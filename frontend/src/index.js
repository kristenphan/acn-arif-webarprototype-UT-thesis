import { mockWithImage, mockWithVideo } from "../assets/libs/camera-mock";
import { loadGLTF } from "../assets/libs/loader";
import { CSS3DObject} from "three/examples/jsm/renderers/CSS3DRenderer";
import * as THREE from "three";
import getMoistureData from "./getmoisturedata";
import transformTimestamp from "./transformtimestamp";
import getWateringHistory from "./getwateringhistory";
import * as handpose from "@tensorflow-models/handpose";
import * as fp from "fingerpose";

//const LambdaFunctionURLSensorDataSelect = "https://7krqpeuuicfgvw2soeojunszlu0aqepm.lambda-url.eu-central-1.on.aws/";
const LambdaFunctionURLSensorDataSelect = process.env.LAMBDAFUNCTIONURLSENSORDATASELECT;
const LambdaFunctionURLWaterMeSelect = process.env.LAMBDAFUNCTIONURLWATERMESELECT;
const moistureSensorId = "1";
const plantId = "1";
const LSURL = "https://liquidstudio.nl/";

// Load .js after html doc has loaded
document.addEventListener("DOMContentLoaded", () => {
  const start = async() => {
		// Use mock webcam for testing: mockWithVideo is more stable
		/* mockWithImage("../assets/mock-videos/kp-horizontal.png"); */
		/* mockWithVideo("../assets/mock-videos/acn-horizontal.mp4"); */
		
		// Instantiate MindARThree object which auto instantiates three.js renderder, CSSRenderer, scene, CSSScene, perspective camera
		const mindarThree = new window.MINDAR.IMAGE.MindARThree({
			container: document.body, // size of three.js renderer <canvas>
			/* imageTargetSrc: "../assets/targets/kp.mind", */ // compiled image target
			imageTargetSrc: "../assets/targets/ls.mind",
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

		// Load and position gltf model
		// plantGLTF.scene.type = GROUP
		// plantGLTF.scene.children.length = 1
		// plantGLTF.scene.children[0].visible = true by default
		const plantGLTF = await loadGLTF("../assets/models/plant/scene.gltf");
		plantGLTF.scene.position.set(0, -1.2, 0);
		// Make gltf model invisible until "About Me" button on the Home dashboard is clicked
		plantGLTF.scene.children[0].visible = false;
		// Mark GLTF model as clickable and with an URL so that a webpage is opened when users click on the model
		plantGLTF.scene.userData.clickable = true;
		plantGLTF.scene.userData.URL = LSURL;
		// Add a MindAr anchor for the first image target idx=0 and add gltf to anchor
		const anchor = mindarThree.addAnchor(0);
		anchor.group.add(plantGLTF.scene); // causing error

		// Add event listeners for dashboard-home-button
		document.getElementById("home-waterme-button").addEventListener("click", () => {
			window.location.href = "../waterme.html";
		});

		document.getElementById("home-viewhistory-button").addEventListener("click", async() => {
			document.getElementById("dashboard-home").classList.add("hidden");
			document.getElementById("dashboard-viewhistory").classList.remove("hidden");
			const records = await getWateringHistory(LambdaFunctionURLWaterMeSelect, plantId);
			// populate the history table with the latest watering records
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

		// Go to About Me page 1 when "About me" button on Home page is clicked
		document.getElementById("home-aboutme-button").addEventListener("click", () => {
			// Resize dashboard
			document.getElementById("dashboard").style.height = "730px";
			// Update dashboard content
			document.getElementById("dashboard-home").classList.add("hidden");
			document.getElementById("dashboard-aboutme-page1").classList.remove("hidden");
			// Render gltf model
			plantGLTF.scene.children[0].visible = true;
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
			} else if (moisturePercentage <= 30 && moisturePercentage < 60) {
				document.getElementById("water-cup").src = "../assets/images/water-medium.png";	
			} else {
				document.getElementById("water-cup").src = "../assets/images/water-high.png";
			}
		});

		// Return to Home page when "Back" button on About Me page 1 is clicked
		document.getElementById("aboutme-page1-back-button").addEventListener("click", () => {
			// Resize dashboard
			document.getElementById("dashboard").style.height = "700px";
			// Update dashboard content
			document.getElementById("dashboard-home").classList.remove("hidden");
			document.getElementById("dashboard-aboutme-page1").classList.add("hidden");
			plantGLTF.scene.children[0].visible = false;
		});

		// Go to About Me page 2 when "Next" button on About Me page 1 is clicked
		document.getElementById("aboutme-page1-next-button").addEventListener("click", () => {
			// Resize dashboard
			document.getElementById("dashboard").style.height = "980px";
			// Update dashboard content
			document.getElementById("dashboard-aboutme-page2").classList.remove("hidden");
			document.getElementById("dashboard-aboutme-page1").classList.add("hidden");
			plantGLTF.scene.children[0].visible = false;
		});

		// Go to About Me page 1 when "Back" button on About Me page 1 is clicked
		document.getElementById("aboutme-page2-back-button").addEventListener("click", () => {
			// Resize dashboard
			document.getElementById("dashboard").style.height = "730px";
			// Update dashboard content
			document.getElementById("dashboard-aboutme-page2").classList.add("hidden");
			document.getElementById("dashboard-aboutme-page1").classList.remove("hidden");
			plantGLTF.scene.children[0].visible = true;
		});

		// Return to Home page when "Return" button on About Me page 2 is clicked
		document.getElementById("aboutme-page2-return-button").addEventListener("click", () => {
			// Resize dashboard
			document.getElementById("dashboard").style.height = "700px";
			// Update dashboard content
			document.getElementById("dashboard-aboutme-page2").classList.add("hidden");
			document.getElementById("dashboard-home").classList.remove("hidden");
		});

		// Return to Home page when "Return" button on View History page is clicked
		document.getElementById("viewhistory-return-button").addEventListener("click", () => {
			// Update dashboard content
			document.getElementById("dashboard-viewhistory").classList.add("hidden");
			document.getElementById("dashboard-home").classList.remove("hidden");
		});

		// Use raycasting to check if GLTF model is clicked. If yes, open a webpage from a hyperlink
		document.body.addEventListener("click", (e) => {
			// Calculate and normalize the x- and y-coord of the click event on html document body i.e., the three.js renderer canvas
			const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
			const mouseY = -1 * ((e.clientY / window.innerHeight) *2 - 1);
      		const mouse = new THREE.Vector2(mouseX, mouseY);
			// Cast a virtual ray from camera to click event coords and check if this ray intersects with the plant GLTF model
			const raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(mouse, camera);
			const intersects = raycaster.intersectObjects(scene.children, true);
			if (intersects.length > 0) {
				let o = intersects[0].object;
				while (o.parent && !o.userData.clickable) {
					o = o.parent;
				}
				if (o.userData.clickable) {
					if (o === plantGLTF.scene) {
						window.open(o.userData.URL);
					}
				}
			}
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

		// Set up a clock
		const clock = new THREE.Clock();
		// Start MindAR engine
		await mindarThree.start();
		// After MindAR engine has started, start renderer's loop to (re)render content for every video frame
		renderer.setAnimationLoop(() => {
			// Update dashboard's position before re-rendering cssScene (dashboard is attached to cssScene)
			// so that dashboard always face towards camera
			dashboardCSS3DObject.lookAt(camera.position);

			// Rotate gltf model continuously around y-axis
			const delta = clock.getDelta(); // = time in secs since clock.getDelta() was last called
			plantGLTF.scene.rotation.set(0, plantGLTF.scene.rotation.y + delta/2, 0);

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
        // Estimate the gestures of the detected hand with threshold of 9
        // 10 = highest confidence for an estimated gesture
        const estimatedGestures = GE.estimate(predictions[0].landmarks, 9)
        // Find the best gesture based on estimated score
        if (estimatedGestures.gestures.length > 0) {
          	const best = estimatedGestures.gestures.sort((g1, g2) => g2.confidence - g1.confidence)[0];
          	// Play the animation according to the detected gesture with fade-in effect
          	if (best.name === 'thumbs_up') {
            	alert("Recorded a new watering record with plant status 'Good'.");
				setTimeout(() => {
					console.log(".");
					}, "500"
				);
    		}
			if (best.name === 'thumbs_down') {
            	alert("Recorded a new watering record with plant status 'Not good'.");
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