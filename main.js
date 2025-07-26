import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/renderers/CSS2DRenderer.js';

/**
 * @file main.js
 * @description Script for creating a falling 3D objects effect with Three.js.
 * @author AI Coding Agent
 * @date July 25, 2025
 */

// ========================================
// CONFIGURATION PARAMETERS
// ========================================
// All tunable parameters are centralized here for easy modification

// --- SCENE SETTINGS ---
const BACKGROUND_COLOR = 0x6b2d5c; // Deep purple background color

// --- CAMERA SETTINGS ---
const CAMERA_FOV = 75; // Field of view in degrees
const CAMERA_NEAR = 0.1; // Near clipping plane
const CAMERA_FAR = 3000; // Far clipping plane
const CAMERA_POSITION_Z = 35; // Initial camera Z position

// --- OBJECT SETTINGS ---
const OBJECT_COUNT = 500; // Total number of falling objects
const MODEL_PATH = 'models/dd.glb'; // Path to the 3D model file

// --- OBJECT COLORS ---
// Colors randomly assigned to falling objects (excluding background color)
const OBJECT_COLORS = [
    0xf0386b, // Pink
    0xff5376, // Coral pink
    0xf8c0c8, // Light pink
    0xe2c290  // Beige/gold
];

// --- OBJECT SPREAD PARAMETERS ---
const X_SPREAD = 850; // Horizontal spread of objects
const Y_SPREAD = 850; // Vertical spread of objects
const Z_SPREAD = 1200; // Depth spread of objects
const Y_OFFSET = 0; // Vertical offset for starting positions

// --- OBJECT SCALE PARAMETERS ---
const MIN_SCALE = 0.02; // Minimum object scale
const MAX_SCALE = 0.1; // Maximum object scale

// --- ANIMATION PARAMETERS ---
const FALL_SPEED = 0.8; // How fast objects fall (higher = faster)
const MAX_ROTATION_SPEED = 0.5; // Maximum rotation speed for objects
const ROTATION_MULTIPLIER = 0.02; // Rotation speed multiplier

// --- MATERIAL PROPERTIES ---
const MATERIAL_METALNESS = 0.6; // Material metalness (0-1)
const MATERIAL_ROUGHNESS = 0.4; // Material roughness (0-1)

// --- LIGHTING SETTINGS ---
// Ambient Light
const AMBIENT_LIGHT_COLOR = 0xffffff;
const AMBIENT_LIGHT_INTENSITY = 0.5;

// Main Directional Light
const DIR_LIGHT_1_COLOR = 0xffffff;
const DIR_LIGHT_1_INTENSITY = 1;
const DIR_LIGHT_1_POSITION = [5, 5, 5];

// Secondary Directional Light (cool tone)
const DIR_LIGHT_2_COLOR = 0x87CEEB; // Sky blue
const DIR_LIGHT_2_INTENSITY = 0.6;
const DIR_LIGHT_2_POSITION = [-5, 3, 2];

// Third Directional Light (warm tone)
const DIR_LIGHT_3_COLOR = 0xFFB347; // Warm orange
const DIR_LIGHT_3_INTENSITY = 0.4;
const DIR_LIGHT_3_POSITION = [0, -3, 5];

// Point Light 1
const POINT_LIGHT_1_COLOR = 0xFF69B4; // Hot pink
const POINT_LIGHT_1_INTENSITY = 0.8;
const POINT_LIGHT_1_DISTANCE = 100;
const POINT_LIGHT_1_POSITION = [10, 10, 10];

// Point Light 2
const POINT_LIGHT_2_COLOR = 0x00CED1; // Dark turquoise
const POINT_LIGHT_2_INTENSITY = 0.6;
const POINT_LIGHT_2_DISTANCE = 80;
const POINT_LIGHT_2_POSITION = [-10, -5, -10];

// Spot Light
const SPOT_LIGHT_COLOR = 0xFFFFFF; // White
const SPOT_LIGHT_INTENSITY = 1.5;
const SPOT_LIGHT_ANGLE = Math.PI / 8;
const SPOT_LIGHT_PENUMBRA = 0.2;
const SPOT_LIGHT_POSITION = [0, 20, 0];
const SPOT_LIGHT_TARGET = [0, 0, 0];

// --- VISUAL HELPERS ---
const SHOW_AXES_HELPER = true; // Show XYZ axes
const AXES_HELPER_SIZE = 10; // Size of axes helper
const SHOW_AXIS_LABELS = true; // Show X, Y, Z labels

// --- CONTROLS ---
const ENABLE_ORBIT_CONTROLS = true; // Enable camera orbit controls
const ENABLE_DAMPING = true; // Enable smooth camera movement

// ========================================
// MAIN APPLICATION CODE
// ========================================

// --- GLOBAL CONTEXT ---
// The goal is to create a full-screen animation where 3D objects fall from the sky,
// rotate, and loop endlessly. This script will handle all the 3D logic.

// --- PHASE 1: BASIC SCENE FOUNDATION ---

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
const camera = new THREE.PerspectiveCamera(CAMERA_FOV, sizes.width / sizes.height, CAMERA_NEAR, CAMERA_FAR);
camera.position.z = CAMERA_POSITION_Z;
scene.add(camera);

// 5. Create a WebGLRenderer.
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(BACKGROUND_COLOR);

// Add a renderer for CSS 2D labels
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

// Add AxesHelper for visualizing the XYZ axes (if enabled)
if (SHOW_AXES_HELPER) {
    const axesHelper = new THREE.AxesHelper(AXES_HELPER_SIZE);
    scene.add(axesHelper);
}

// Create labels for the axes (if enabled)
if (SHOW_AXIS_LABELS) {
    const p = document.createElement('p');
    p.className = 'label';

    const xLabel = new CSS2DObject(p.cloneNode(true));
    xLabel.element.textContent = 'X';
    xLabel.element.style.color = '#ff0000';
    xLabel.position.set(AXES_HELPER_SIZE + 1, 0, 0);
    scene.add(xLabel);

    const yLabel = new CSS2DObject(p.cloneNode(true));
    yLabel.element.textContent = 'Y';
    yLabel.element.style.color = '#00ff00';
    yLabel.position.set(0, AXES_HELPER_SIZE + 1, 0);
    scene.add(yLabel);

    const zLabel = new CSS2DObject(p.cloneNode(true));
    zLabel.element.textContent = 'Z';
    zLabel.element.style.color = '#0000ff';
    zLabel.position.set(0, 0, AXES_HELPER_SIZE + 1);
    scene.add(zLabel);
}

// 7. Add OrbitControls for camera interaction (if enabled)
let controls;
if (ENABLE_ORBIT_CONTROLS) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = ENABLE_DAMPING;
}

// 6. Add lighting to the scene.
// Ambient Light
const ambientLight = new THREE.AmbientLight(AMBIENT_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY);
scene.add(ambientLight);

// Main Directional Light
const directionalLight = new THREE.DirectionalLight(DIR_LIGHT_1_COLOR, DIR_LIGHT_1_INTENSITY);
directionalLight.position.set(...DIR_LIGHT_1_POSITION);
scene.add(directionalLight);

// Secondary Directional Light (cool tone)
const directionalLight2 = new THREE.DirectionalLight(DIR_LIGHT_2_COLOR, DIR_LIGHT_2_INTENSITY);
directionalLight2.position.set(...DIR_LIGHT_2_POSITION);
scene.add(directionalLight2);

// Third Directional Light (warm tone)
const directionalLight3 = new THREE.DirectionalLight(DIR_LIGHT_3_COLOR, DIR_LIGHT_3_INTENSITY);
directionalLight3.position.set(...DIR_LIGHT_3_POSITION);
scene.add(directionalLight3);

// Point Light 1
const pointLight1 = new THREE.PointLight(POINT_LIGHT_1_COLOR, POINT_LIGHT_1_INTENSITY, POINT_LIGHT_1_DISTANCE);
pointLight1.position.set(...POINT_LIGHT_1_POSITION);
scene.add(pointLight1);

// Point Light 2
const pointLight2 = new THREE.PointLight(POINT_LIGHT_2_COLOR, POINT_LIGHT_2_INTENSITY, POINT_LIGHT_2_DISTANCE);
pointLight2.position.set(...POINT_LIGHT_2_POSITION);
scene.add(pointLight2);

// Spot Light
const spotLight = new THREE.SpotLight(SPOT_LIGHT_COLOR, SPOT_LIGHT_INTENSITY, 0, SPOT_LIGHT_ANGLE, SPOT_LIGHT_PENUMBRA);
spotLight.position.set(...SPOT_LIGHT_POSITION);
spotLight.target.position.set(...SPOT_LIGHT_TARGET);
scene.add(spotLight);
scene.add(spotLight.target);


// --- PHASE 2: SPAWNING THE OBJECTS ---

// Create a new GLTFLoader instance.
const gltfLoader = new GLTFLoader();

// Create a dummy Object3D to easily manipulate matrices.
const dummy = new THREE.Object3D();

// Load the .glb file from the 'models' folder.
gltfLoader.load(
    MODEL_PATH,
    (gltf) => {
        // This function runs when the model has successfully loaded.
        console.log('Model loaded successfully');

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

        // Create a material for the objects.
        const modelMaterial = new THREE.MeshStandardMaterial({
            metalness: MATERIAL_METALNESS,
            roughness: MATERIAL_ROUGHNESS,
            color: 0xffffff // Base white color, will be tinted by instance colors
        });

        // Create the InstancedMesh.
        const instancedMesh = new THREE.InstancedMesh(modelGeometry, modelMaterial, OBJECT_COUNT);
        
        // Create color array for instanced mesh
        const colorArray = new Float32Array(OBJECT_COUNT * 3);
        
        scene.add(instancedMesh);

        // Create an array to hold the state of each object
        const objects = [];

        // Set initial positions and rotations for each instance.
        for (let i = 0; i < OBJECT_COUNT; i++) {
            // Store state for each object
            const objectState = {
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * X_SPREAD,
                    Y_OFFSET + (Math.random() - 0.5) * Y_SPREAD,
                    (Math.random() - 0.5) * Z_SPREAD
                ),
                rotation: new THREE.Euler(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                ),
                scale: Math.random() * (MAX_SCALE - MIN_SCALE) + MIN_SCALE,
                // Add random rotation speeds for each object
                rotationSpeedX: (Math.random() - 0.5) * MAX_ROTATION_SPEED,
                rotationSpeedZ: (Math.random() - 0.5) * MAX_ROTATION_SPEED
            };
            objects.push(objectState);

            // Randomly assign one of the 4 colors to this instance
            const randomColor = OBJECT_COLORS[Math.floor(Math.random() * OBJECT_COLORS.length)];
            const color = new THREE.Color(randomColor);
            
            // Set the color in the color array
            colorArray[i * 3] = color.r;
            colorArray[i * 3 + 1] = color.g;
            colorArray[i * 3 + 2] = color.b;

            // Set initial matrix for the instanced mesh
            dummy.position.copy(objectState.position);
            dummy.rotation.copy(objectState.rotation);
            dummy.scale.set(objectState.scale, objectState.scale, objectState.scale);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
        }
        
        // Apply the instance colors to the mesh
        instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
        
        // Let Three.js know the instance matrices have been updated.
        instancedMesh.instanceMatrix.needsUpdate = true;

        // --- PHASE 3: BRINGING IT TO LIFE (ANIMATION) ---

        // Create a clock to manage animation timing.
        const clock = new THREE.Clock();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();

            // Loop through each instance to update it.
            for (let i = 0; i < OBJECT_COUNT; i++) {
                const obj = objects[i];

                // Update position (make it fall).
                obj.position.y -= FALL_SPEED;

                // Update rotation using individual speeds
                obj.rotation.x += obj.rotationSpeedX * ROTATION_MULTIPLIER;
                obj.rotation.z += obj.rotationSpeedZ * ROTATION_MULTIPLIER;

                // Check if object is off-screen (recycling).
                const recycleThreshold = Y_OFFSET - Y_SPREAD / 2 - 10;
                if (obj.position.y < recycleThreshold) {
                    obj.position.y = Y_OFFSET + Y_SPREAD / 2;
                    obj.position.x = (Math.random() - 0.5) * X_SPREAD;
                    obj.position.z = (Math.random() - 0.5) * Z_SPREAD;
                }

                // Update the dummy object and the instance matrix
                dummy.position.copy(obj.position);
                dummy.rotation.copy(obj.rotation);
                dummy.scale.set(obj.scale, obj.scale, obj.scale);
                dummy.updateMatrix();
                instancedMesh.setMatrixAt(i, dummy.matrix);
            }
            // Tell Three.js that the matrices need to be updated on the GPU.
            instancedMesh.instanceMatrix.needsUpdate = true;

            // Update the controls (if enabled)
            if (controls) {
                controls.update();
            }

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

// --- PHASE 4: REFINEMENT & POLISH ---

// Handle Window Resizing
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