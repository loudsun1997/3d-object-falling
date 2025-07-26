import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/renderers/CSS2DRenderer.js';

/**
 * @file main.js
 * @description Script for creating a falling 3D objects effect with Three.js.
 * @author AI Coding Agent
 * @date July 25, 2025
 * This file contains a step-by-step plan to be implemented.
 */

// --- GLOBAL CONTEXT ---
// The goal is to create a full-screen animation where 3D objects fall from the sky,
// rotate, and loop endlessly. This script will handle all the 3D logic.
// The user has already created the index.html and style.css files.

// --- PHASE 1: BASIC SCENE FOUNDATION (CONTINUED) ---

// ✅ Task 1.3: Initialize Three.js

// 1. Get a reference to the canvas element with the class 'webgl' from the HTML.
const canvas = document.querySelector('canvas.webgl');

// 2. Create a new THREE.Scene. This will be the container for all our objects.
const scene = new THREE.Scene();

// 3. Define scene dimensions based on the browser window size.
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

// 4. Create a PerspectiveCamera.
//    - Field of View (FOV): 75 is a good default.
//    - Aspect Ratio: window width / window height.
//    - Near/Far clipping plane: 0.1 and 100.
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
//    - Set the camera's initial position so it's not at the center of the scene.
camera.position.z = 35;
scene.add(camera);

// 5. Create a WebGLRenderer.
//    - Pass the canvas element to it.
//    - Set antialias to true for smoother edges.
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true // Make the background transparent if needed
});
//    - Set the renderer's size to match our defined dimensions.
renderer.setSize(sizes.width, sizes.height);
//    - Set the pixel ratio for sharper images on high-resolution screens.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
//    - Set a clear color (or leave transparent if alpha is true).
renderer.setClearColor(0x111111); // A dark gray background

// Add a renderer for CSS 2D labels
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none'; // So controls aren't blocked
document.body.appendChild(labelRenderer.domElement);

// Add AxesHelper for visualizing the XYZ axes
const axesHelper = new THREE.AxesHelper(10); // The number defines the size of the axes
scene.add(axesHelper);

// Create labels for the axes
const p = document.createElement('p');
p.className = 'label';

const xLabel = new CSS2DObject(p.cloneNode(true));
xLabel.element.textContent = 'X';
xLabel.element.style.color = '#ff0000';
xLabel.position.set(11, 0, 0);
scene.add(xLabel);

const yLabel = new CSS2DObject(p.cloneNode(true));
yLabel.element.textContent = 'Y';
yLabel.element.style.color = '#00ff00';
yLabel.position.set(0, 11, 0);
scene.add(yLabel);

const zLabel = new CSS2DObject(p.cloneNode(true));
zLabel.element.textContent = 'Z';
zLabel.element.style.color = '#0000ff';
zLabel.position.set(0, 0, 11);
scene.add(zLabel);

// 7. Add OrbitControls for camera interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Adds a smooth inertia effect

// 6. Add lighting to the scene.
//    - Create an AmbientLight for basic overall illumination (color: 0xffffff, intensity: 0.5).
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
//    - Create a DirectionalLight for highlights and shadows.
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5); // Position it to cast light from the top-right.
scene.add(directionalLight);


// --- PHASE 2: SPAWNING THE OBJECTS ---

// ✅ Task 2.1 & 2.2: Load the Model and Implement Instancing

// Define the number of objects to create.
const objectCount = 50;

// Create a new GLTFLoader instance.
const gltfLoader = new GLTFLoader();

// Create a dummy Object3D to easily manipulate matrices.
const dummy = new THREE.Object3D();

// Load the .glb file from the 'models' folder.
gltfLoader.load(
    'models/dd.glb',
    (gltf) => {
        // This function runs when the model has successfully loaded.
        console.log('Model loaded successfully');
        console.log('GLTF Scene:', gltf.scene); // Log the scene structure for debugging

        let modelGeometry;
        // Traverse the loaded scene to find the first mesh
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                modelGeometry = child.geometry;
            }
        });

        if (!modelGeometry) {
            console.error("Could not find any geometry in the loaded GLTF file.");
            return; // Stop if no geometry is found
        }

        // 2. Create a material for the objects. MeshStandardMaterial works well with lights.
        const modelMaterial = new THREE.MeshStandardMaterial({
            metalness: 0.6,
            roughness: 0.4,
            color: 0xcccccc // A light gray color
        });

        // 3. Create the InstancedMesh.
        //    - Pass the geometry, material, and the total count.
        const instancedMesh = new THREE.InstancedMesh(modelGeometry, modelMaterial, objectCount);
        scene.add(instancedMesh);

        // 4. Set initial positions and rotations for each instance.
        //    - Use a loop from 0 to objectCount.
        for (let i = 0; i < objectCount; i++) {
            // Randomize position
            dummy.position.set(
                (Math.random() - 0.5) * 30, // x: spread out horizontally
                (Math.random() - 0.5) * 30, // y: spread out vertically
                (Math.random() - 0.5) * 20  // z: spread out in depth
            );

            // Randomize rotation
            dummy.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            // Randomize scale - Made objects much smaller
            const scale = Math.random() * 0.005 + 0.002; // scale between 0.02 and 0.07
            dummy.scale.set(scale, scale, scale);

            // Apply these transformations to the dummy object's matrix.
            dummy.updateMatrix();

            // Set the matrix for the i-th instance.
            instancedMesh.setMatrixAt(i, dummy.matrix);
        }
        
        // Let Three.js know the instance matrices have been updated.
        instancedMesh.instanceMatrix.needsUpdate = true;

        // --- PHASE 3: BRINGING IT TO LIFE (ANIMATION) ---

        // Create a clock to manage animation timing.
        const clock = new THREE.Clock();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();

            // Loop through each instance to update it.
            for (let i = 0; i < objectCount; i++) {
                // Get the current matrix of the instance.
                instancedMesh.getMatrixAt(i, dummy.matrix);
                
                // Decompose the matrix into position, quaternion, and scale.
                dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

                // Update position (make it fall).
                dummy.position.y -= 0.02; // Adjust this value for fall speed.

                // Update rotation - Set rotation based on elapsed time for smooth animation
                dummy.rotation.x = elapsedTime * 0.3;
                dummy.rotation.z = elapsedTime * 0.3;


                // Check if object is off-screen (recycling).
                if (dummy.position.y < -15) {
                    dummy.position.y = 15; // Reset to the top.
                    dummy.position.x = (Math.random() - 0.5) * 30; // Re-randomize horizontal position.
                }

                // Recompose the matrix from the updated properties.
                dummy.updateMatrix();

                // Set the new matrix for the instance.
                instancedMesh.setMatrixAt(i, dummy.matrix);
            }
            // Tell Three.js that the matrices need to be updated on the GPU.
            instancedMesh.instanceMatrix.needsUpdate = true;

            // Update the controls
            controls.update();

            // Render the scene with the updated camera.
            renderer.render(scene, camera);
            labelRenderer.render(scene, camera);

            // Call animate again on the next frame.
            window.requestAnimationFrame(animate);
        };

        // Now that the mesh is created and positioned, start the animation.
        animate();
    },
    undefined, // We don't need the 'onProgress' function
    (error) => {
        // This function runs if there's an error loading the model.
        console.error('An error happened while loading the model:', error);
    }
);


// --- PHASE 3: BRINGING IT TO LIFE (ANIMATION) ---

// Create a clock to manage animation timing.
// const clock = new THREE.Clock();

// ✅ Task 3.1: Create the Animation Loop
// const animate = () => {
//     const elapsedTime = clock.getElapsedTime();

//     // ✅ Task 3.2 & 3.3: Implement Falling, Rotation, and Recycling
    
//     // Check if the instancedMesh exists before trying to animate it.
//     const instancedMesh = scene.getObjectByProperty('isInstancedMesh', true);
//     if (instancedMesh) {
//         // Loop through each instance to update it.
//         for (let i = 0; i < objectCount; i++) {
//             // Get the current matrix of the instance.
//             instancedMesh.getMatrixAt(i, dummy.matrix);
            
//             // Decompose the matrix into position, quaternion, and scale.
//             dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

//             // Update position (make it fall).
//             dummy.position.y -= 0.02; // Adjust this value for fall speed.

//             // Update rotation.
//             dummy.rotation.x += 0.005;
//             dummy.rotation.z += 0.005;

//             // Check if object is off-screen (recycling).
//             if (dummy.position.y < -15) {
//                 dummy.position.y = 15; // Reset to the top.
//                 dummy.position.x = (Math.random() - 0.5) * 30; // Re-randomize horizontal position.
//             }

//             // Recompose the matrix from the updated properties.
//             dummy.updateMatrix();

//             // Set the new matrix for the instance.
//             instancedMesh.setMatrixAt(i, dummy.matrix);
//         }
//         // Tell Three.js that the matrices need to be updated on the GPU.
//         instancedMesh.instanceMatrix.needsUpdate = true;
//     }


//     // Render the scene with the updated camera.
//     renderer.render(scene, camera);

//     // Call animate again on the next frame.
//     window.requestAnimationFrame(animate);
// };


// --- PHASE 4: REFINEMENT & POLISH ---

// ✅ Task 4.1: Handle Window Resizing
window.addEventListener('resize', () => {
    // Update sizes object
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera's aspect ratio
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer's size
    renderer.setSize(sizes.width, sizes.height);
    labelRenderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});