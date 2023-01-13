import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

// Call GLFTLoader.js to load a gltf model and return a Promise
export function loadGLTF(path) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(path, (gltf) => {
      resolve(gltf);
    });
  });
}