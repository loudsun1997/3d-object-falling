import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/renderers/CSS2DRenderer.js';

// Import configuration and utilities
import { 
    SCENE_CONFIG, 
    CAMERA_CONFIG, 
    OBJECT_CONFIG, 
    OBJECT_COLORS, 
    ANIMATION_CONFIG, 
    MATERIAL_CONFIG,
    CONTROLS_CONFIG 
} from './config.js';
import { calculateObjectCount, logDensityVerification, logCameraPosition } from './utils.js';
import { setupLighting } from './lighting.js';
import { setupHelpers } from './helpers.js';
import { loadAllModels } from './modelLoader.js';

/**
 * @file main.js
 * @description Main script for creating a falling 3D objects effect with Three.js
 * @author AI Coding Agent
 * @date July 26, 2025
 */

// ========================================
// MAIN APPLICATION CODE
// ========================================

// Calculate object count based on density
const OBJECT_COUNT = calculateObjectCount();

// Create a dummy Object3D to easily manipulate matrices
const dummy = new THREE.Object3D();

// --- PHASE 1: BASIC SCENE FOUNDATION ---

// 1. Get a reference to the canvas element with the class 'webgl' from the HTML
const canvas = document.querySelector('canvas.webgl');

// 2. Create a new THREE.Scene
const scene = new THREE.Scene();

// 3. Define scene dimensions based on the browser window size
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

// 4. Create a PerspectiveCamera
const camera = new THREE.PerspectiveCamera(
    CAMERA_CONFIG.FOV, 
    sizes.width / sizes.height, 
    CAMERA_CONFIG.NEAR, 
    CAMERA_CONFIG.FAR
);
camera.position.set(CAMERA_CONFIG.POSITION_X, CAMERA_CONFIG.POSITION_Y, CAMERA_CONFIG.POSITION_Z);
scene.add(camera);

// Log initial camera position
logCameraPosition(camera, 'INITIAL CAMERA');

// 5. Create a WebGLRenderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(SCENE_CONFIG.BACKGROUND_COLOR);

// Add a renderer for CSS 2D labels
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

// 6. Set up visual helpers
setupHelpers(scene);

// 7. Add OrbitControls for camera interaction (if enabled)
let controls;
if (CONTROLS_CONFIG.ENABLE_ORBIT_CONTROLS) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = CONTROLS_CONFIG.ENABLE_DAMPING;
}

// 8. Set up lighting
setupLighting(scene);

// --- PHASE 2: SPAWNING THE OBJECTS ---

// Function to load all models and start the animation
async function initializeScene() {
    try {
        const loadedModels = await loadAllModels();
        
        if (loadedModels.length === 0) {
            console.error('No models could be loaded!');
            return;
        }

        // Create instanced meshes for each model
        const instancedMeshes = [];
        const objectsPerModel = Math.ceil(OBJECT_COUNT / loadedModels.length);
        
        let totalObjectsCreated = 0;

        loadedModels.forEach((model, modelIndex) => {
            const objectsForThisModel = Math.min(
                objectsPerModel, 
                OBJECT_COUNT - totalObjectsCreated
            );
            
            if (objectsForThisModel <= 0) return;

            // Create a base material (white) that will be colored per instance
            const baseMaterial = new THREE.MeshStandardMaterial({
                metalness: MATERIAL_CONFIG.METALNESS,
                roughness: MATERIAL_CONFIG.ROUGHNESS,
                color: 0xffffff // Base white color
            });

            const instancedMesh = new THREE.InstancedMesh(
                model.geometry, 
                baseMaterial, 
                objectsForThisModel
            );

            // Create color array for this mesh
            const colorArray = new Float32Array(objectsForThisModel * 3);
            
            scene.add(instancedMesh);
            instancedMeshes.push({
                mesh: instancedMesh,
                objects: [],
                count: objectsForThisModel,
                colorArray: colorArray
            });

            totalObjectsCreated += objectsForThisModel;
        });

        // Create an array to hold the state of all objects
        const allObjects = [];

        // Initialize all instanced meshes with random positions and rotations
        instancedMeshes.forEach((meshData, meshIndex) => {
            for (let i = 0; i < meshData.count; i++) {
                const objectState = {
                    meshIndex: meshIndex,
                    instanceIndex: i,
                    position: new THREE.Vector3(
                        (Math.random() - 0.5) * OBJECT_CONFIG.X_SPREAD,
                        OBJECT_CONFIG.Y_OFFSET + (Math.random() - 0.5) * OBJECT_CONFIG.Y_SPREAD,
                        (Math.random() - 0.5) * OBJECT_CONFIG.Z_SPREAD
                    ),
                    rotation: new THREE.Euler(
                        Math.random() * Math.PI,
                        Math.random() * Math.PI,
                        Math.random() * Math.PI
                    ),
                    scale: Math.random() * (OBJECT_CONFIG.MAX_SCALE - OBJECT_CONFIG.MIN_SCALE) + OBJECT_CONFIG.MIN_SCALE,
                    rotationSpeedX: (Math.random() - 0.5) * ANIMATION_CONFIG.MAX_ROTATION_SPEED,
                    rotationSpeedZ: (Math.random() - 0.5) * ANIMATION_CONFIG.MAX_ROTATION_SPEED
                };
                
                meshData.objects.push(objectState);
                allObjects.push(objectState);

                // Randomly assign one of the colors to this instance
                const randomColor = OBJECT_COLORS[Math.floor(Math.random() * OBJECT_COLORS.length)];
                const color = new THREE.Color(randomColor);
                
                // Set the color in the color array
                meshData.colorArray[i * 3] = color.r;
                meshData.colorArray[i * 3 + 1] = color.g;
                meshData.colorArray[i * 3 + 2] = color.b;

                // Set initial matrix for the instanced mesh
                dummy.position.copy(objectState.position);
                dummy.rotation.copy(objectState.rotation);
                dummy.scale.set(objectState.scale, objectState.scale, objectState.scale);
                dummy.updateMatrix();
                meshData.mesh.setMatrixAt(i, dummy.matrix);
            }
            
            // Apply the instance colors to the mesh
            meshData.mesh.instanceColor = new THREE.InstancedBufferAttribute(meshData.colorArray, 3);
            
            // Update the mesh
            meshData.mesh.instanceMatrix.needsUpdate = true;
        });

        console.log(`Created ${totalObjectsCreated} falling objects using ${loadedModels.length} different models`);
        
        // Log density verification
        logDensityVerification(totalObjectsCreated, OBJECT_COUNT);

        // --- PHASE 3: BRINGING IT TO LIFE (ANIMATION) ---

        // Create a clock to manage animation timing
        const clock = new THREE.Clock();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();

            // Log camera position every 5 seconds
            if (Math.floor(elapsedTime) % 5 === 0 && Math.floor(elapsedTime) !== animate.lastLoggedTime) {
                logCameraPosition(camera);
                animate.lastLoggedTime = Math.floor(elapsedTime);
            }

            // Update all objects
            allObjects.forEach(obj => {
                // Update position (make it fall)
                obj.position.y -= ANIMATION_CONFIG.FALL_SPEED;

                // Update rotation using individual speeds
                obj.rotation.x += obj.rotationSpeedX * ANIMATION_CONFIG.ROTATION_MULTIPLIER;
                obj.rotation.z += obj.rotationSpeedZ * ANIMATION_CONFIG.ROTATION_MULTIPLIER;

                // Check if object is off-screen (recycling)
                const recycleThreshold = OBJECT_CONFIG.Y_OFFSET - OBJECT_CONFIG.Y_SPREAD / 2 - 10;
                if (obj.position.y < recycleThreshold) {
                    obj.position.y = OBJECT_CONFIG.Y_OFFSET + OBJECT_CONFIG.Y_SPREAD / 2;
                    obj.position.x = (Math.random() - 0.5) * OBJECT_CONFIG.X_SPREAD;
                    obj.position.z = (Math.random() - 0.5) * OBJECT_CONFIG.Z_SPREAD;
                }

                // Update the dummy object and the instance matrix
                dummy.position.copy(obj.position);
                dummy.rotation.copy(obj.rotation);
                dummy.scale.set(obj.scale, obj.scale, obj.scale);
                dummy.updateMatrix();
                
                const meshData = instancedMeshes[obj.meshIndex];
                meshData.mesh.setMatrixAt(obj.instanceIndex, dummy.matrix);
            });

            // Update all meshes
            instancedMeshes.forEach(meshData => {
                meshData.mesh.instanceMatrix.needsUpdate = true;
            });

            // Update the controls (if enabled)
            if (controls) {
                controls.update();
            }

            // Render the scene with the updated camera
            renderer.render(scene, camera);
            labelRenderer.render(scene, camera);

            // Call animate again on the next frame
            window.requestAnimationFrame(animate);
        };

        // Start the animation
        animate();

    } catch (error) {
        console.error('Failed to initialize scene:', error);
    }
}

// Initialize the scene
initializeScene();

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
const CAMERA_POSITION_X = -78.78; // Initial camera X position
const CAMERA_POSITION_Y = -135.02; // Initial camera Y position
const CAMERA_POSITION_Z = 120.84; // Initial camera Z position

// --- OBJECT SETTINGS ---
// Density-based object generation (objects per million cubic units)
const TARGET_DENSITY = 3; // Target density: objects per million cubic units
// Note: Object count will be calculated automatically based on density and space volume

// --- MODEL PATHS ---
// Dynamically discover all GLB models in the models directory
const MODEL_DIRECTORY = 'models/';

// Function to dynamically load model paths
async function discoverModelPaths() {
    try {
        // Try to fetch the models directory listing
        const response = await fetch(MODEL_DIRECTORY);
        if (response.ok) {
            const text = await response.text();
            // Parse HTML directory listing to extract .glb files
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const links = Array.from(doc.querySelectorAll('a[href$=".glb"]'));
            return links.map(link => MODEL_DIRECTORY + link.getAttribute('href'));
        }
    } catch (error) {
        console.warn('Could not auto-discover models, using fallback list:', error);
    }
    
    // Fallback: hardcoded list of known models
    return [
        'models/dd.glb',
        'models/Gemini_Generated_Image_1ngjh61ngjh61ngj.glb',
        'models/Gemini_Generated_Image_99jcve99jcve99jc.glb',
        'models/Gemini_Generated_Image_cwr7vxcwr7vxcwr7.glb',
        'models/Gemini_Generated_Image_nkujwpnkujwpnkuj.glb',
        'models/Gemini_Generated_Image_tbskldtbskldtbsk.glb',
        'models/Gemini_Generated_Image_w7lk6xw7lk6xw7lk.glb',
        'models/Gemini_Generated_Image_xvlftixvlftixvlf.glb'
    ];
}

// --- OBJECT COLORS ---
// Colors randomly assigned to falling objects using the provided palette
const OBJECT_COLORS = [
    // Powder Blue variants
    0x93b5c6, // powder_blue DEFAULT
    0x6797af, // powder_blue 400
    0xa9c4d2, // powder_blue 600
    0xbfd3dd, // powder_blue 700
    
    // Tea Green variants
    0xddedaa, // tea_green DEFAULT
    0xc3df68, // tea_green 400
    0xe4f1bc, // tea_green 600
    0xebf4cd, // tea_green 700
    
    // Naples Yellow variants
    0xf0cf65, // naples_yellow DEFAULT
    0xeabc28, // naples_yellow 400
    0xf3d984, // naples_yellow 600
    0xf6e3a3, // naples_yellow 700
    
    // Burnt Sienna variants
    0xd7816a, // burnt_sienna DEFAULT
    0xca5737, // burnt_sienna 400
    0xdf9b88, // burnt_sienna 600
    0xe7b4a6, // burnt_sienna 700
    
    // Fuchsia Rose variants
    0xbd4f6c, // fuchsia_rose DEFAULT
    0x9d3b55, // fuchsia_rose 400
    0xca748b, // fuchsia_rose 600
    0xd797a8  // fuchsia_rose 700
];

// --- OBJECT SPREAD PARAMETERS ---
const X_SPREAD = 400; // Horizontal spread of objects
const Y_SPREAD = 400; // Vertical spread of objects
const Z_SPREAD = 100; // Depth spread of objects
const Y_OFFSET = 0; // Vertical offset for starting positions

// --- CALCULATED OBJECT COUNT ---
// Calculate object count based on target density and space volume
function calculateObjectCount() {
    const volume = X_SPREAD * Y_SPREAD * Z_SPREAD; // cubic units
    const densityPerCubicUnit = TARGET_DENSITY / 1000000; // convert from per million to per unit
    const calculatedCount = Math.round(volume * densityPerCubicUnit);
    
    console.log('=== DENSITY-BASED OBJECT CALCULATION ===');
    console.log(`Space dimensions: ${X_SPREAD} × ${Y_SPREAD} × ${Z_SPREAD} units`);
    console.log(`Total volume: ${volume.toLocaleString()} cubic units`);
    console.log(`Target density: ${TARGET_DENSITY} objects per million cubic units`);
    console.log(`Calculated object count: ${calculatedCount}`);
    console.log('==========================================');
    
    return calculatedCount;
}

const OBJECT_COUNT = calculateObjectCount(); // Dynamic object count based on density

// --- OBJECT SCALE PARAMETERS ---
const MIN_SCALE = 0.02; // Minimum object scale
const MAX_SCALE = 0.1; // Maximum object scale

// --- ANIMATION PARAMETERS ---
const FALL_SPEED = 0.5; // How fast objects fall (higher = faster)
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
camera.position.set(CAMERA_POSITION_X, CAMERA_POSITION_Y, CAMERA_POSITION_Z);
scene.add(camera);

// Log initial camera position
console.log('=== INITIAL CAMERA POSITION ===');
console.log(`X: ${camera.position.x.toFixed(2)}`);
console.log(`Y: ${camera.position.y.toFixed(2)}`);
console.log(`Z: ${camera.position.z.toFixed(2)}`);
console.log('================================');

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

// Function to load all models and start the animation
async function initializeScene() {
    try {
        console.log('Discovering available models...');
        const modelPaths = await discoverModelPaths();
        console.log(`Found ${modelPaths.length} models:`, modelPaths);

        // Load all models
        console.log('Loading all models...');
        const loadPromises = modelPaths.map(path => {
            return new Promise((resolve, reject) => {
                gltfLoader.load(
                    path,
                    (gltf) => {
                        let modelGeometry = null;
                        const geometries = [];
                        
                        // Collect all geometries from the model
                        gltf.scene.traverse((child) => {
                            if (child.isMesh && child.geometry) {
                                geometries.push(child.geometry);
                            }
                        });
                        
                        if (geometries.length === 0) {
                            console.warn(`No geometries found in ${path}`);
                            resolve(null);
                            return;
                        }
                        
                        if (geometries.length === 1) {
                            // Single geometry - use as is, but ensure it has normals
                            modelGeometry = geometries[0].clone();
                            if (!modelGeometry.attributes.normal) {
                                console.log(`Computing normals for ${path}`);
                                modelGeometry.computeVertexNormals();
                            }
                        } else {
                            // Multiple geometries - merge them
                            console.log(`Merging ${geometries.length} geometries from ${path}`);
                            try {
                                const mergedGeometry = new THREE.BufferGeometry();
                                const positions = [];
                                const normals = [];
                                const uvs = [];
                                
                                geometries.forEach(geom => {
                                    if (geom.attributes.position) {
                                        const pos = geom.attributes.position.array;
                                        for (let i = 0; i < pos.length; i++) {
                                            positions.push(pos[i]);
                                        }
                                    }
                                    if (geom.attributes.normal) {
                                        const norm = geom.attributes.normal.array;
                                        for (let i = 0; i < norm.length; i++) {
                                            normals.push(norm[i]);
                                        }
                                    }
                                    if (geom.attributes.uv) {
                                        const uv = geom.attributes.uv.array;
                                        for (let i = 0; i < uv.length; i++) {
                                            uvs.push(uv[i]);
                                        }
                                    }
                                });
                                
                                mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                                if (normals.length > 0) {
                                    mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
                                } else {
                                    // Compute normals if missing
                                    mergedGeometry.computeVertexNormals();
                                }
                                if (uvs.length > 0) {
                                    mergedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
                                }
                                
                                mergedGeometry.computeBoundingSphere();
                                modelGeometry = mergedGeometry;
                            } catch (error) {
                                console.warn(`Failed to merge geometries for ${path}, using first geometry:`, error);
                                modelGeometry = geometries[0];
                            }
                        }
                        
                        resolve({ path, geometry: modelGeometry });
                    },
                    undefined,
                    (error) => {
                        console.warn(`Failed to load model ${path}:`, error);
                        resolve(null); // Don't reject, just return null
                    }
                );
            });
        });

        const loadedModels = (await Promise.all(loadPromises)).filter(model => model && model.geometry);
        
        if (loadedModels.length === 0) {
            console.error('No models could be loaded!');
            return;
        }

        console.log(`Successfully loaded ${loadedModels.length} models`);
        
        // Debug: Log information about each loaded model
        loadedModels.forEach((model, index) => {
            const geom = model.geometry;
            const vertexCount = geom.attributes.position ? geom.attributes.position.count : 0;
            const hasNormals = !!geom.attributes.normal;
            const hasUVs = !!geom.attributes.uv;
            console.log(`Model ${index} (${model.path}): ${vertexCount} vertices, normals: ${hasNormals}, UVs: ${hasUVs}`);
        });

        // Create instanced meshes for each model (one per model, not per color)
        const instancedMeshes = [];
        const objectsPerModel = Math.ceil(OBJECT_COUNT / loadedModels.length);
        
        let totalObjectsCreated = 0;

        loadedModels.forEach((model, modelIndex) => {
            const objectsForThisModel = Math.min(
                objectsPerModel, 
                OBJECT_COUNT - totalObjectsCreated
            );
            
            if (objectsForThisModel <= 0) return;

            // Create a base material (white) that will be colored per instance
            const baseMaterial = new THREE.MeshStandardMaterial({
                metalness: MATERIAL_METALNESS,
                roughness: MATERIAL_ROUGHNESS,
                color: 0xffffff // Base white color
            });

            const instancedMesh = new THREE.InstancedMesh(
                model.geometry, 
                baseMaterial, 
                objectsForThisModel
            );

            // Create color array for this mesh
            const colorArray = new Float32Array(objectsForThisModel * 3);
            
            scene.add(instancedMesh);
            instancedMeshes.push({
                mesh: instancedMesh,
                objects: [],
                count: objectsForThisModel,
                colorArray: colorArray
            });

            totalObjectsCreated += objectsForThisModel;
        });

        // Create an array to hold the state of all objects
        const allObjects = [];

        // Initialize all instanced meshes with random positions and rotations
        instancedMeshes.forEach((meshData, meshIndex) => {
            for (let i = 0; i < meshData.count; i++) {
                const objectState = {
                    meshIndex: meshIndex,
                    instanceIndex: i,
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
                    rotationSpeedX: (Math.random() - 0.5) * MAX_ROTATION_SPEED,
                    rotationSpeedZ: (Math.random() - 0.5) * MAX_ROTATION_SPEED
                };
                
                meshData.objects.push(objectState);
                allObjects.push(objectState);

                // Randomly assign one of the 4 colors to this instance
                const randomColor = OBJECT_COLORS[Math.floor(Math.random() * OBJECT_COLORS.length)];
                const color = new THREE.Color(randomColor);
                
                // Set the color in the color array
                meshData.colorArray[i * 3] = color.r;
                meshData.colorArray[i * 3 + 1] = color.g;
                meshData.colorArray[i * 3 + 2] = color.b;

                // Set initial matrix for the instanced mesh
                dummy.position.copy(objectState.position);
                dummy.rotation.copy(objectState.rotation);
                dummy.scale.set(objectState.scale, objectState.scale, objectState.scale);
                dummy.updateMatrix();
                meshData.mesh.setMatrixAt(i, dummy.matrix);
            }
            
            // Apply the instance colors to the mesh
            meshData.mesh.instanceColor = new THREE.InstancedBufferAttribute(meshData.colorArray, 3);
            
            // Update the mesh
            meshData.mesh.instanceMatrix.needsUpdate = true;
        });

        console.log(`Created ${totalObjectsCreated} falling objects using ${loadedModels.length} different models`);
        
        // --- DENSITY VERIFICATION ---
        // Verify that the actual density matches the target density
        const volume = X_SPREAD * Y_SPREAD * Z_SPREAD; // in cubic units
        const actualDensity = totalObjectsCreated / volume; // objects per cubic unit
        const actualDensityPerMillion = actualDensity * 1000000;
        const densityDifference = actualDensityPerMillion - TARGET_DENSITY;
        
        console.log('=== DENSITY VERIFICATION ===');
        console.log(`Target density: ${TARGET_DENSITY} objects per million cubic units`);
        console.log(`Actual density: ${actualDensityPerMillion.toFixed(2)} objects per million cubic units`);
        console.log(`Difference: ${densityDifference > 0 ? '+' : ''}${densityDifference.toFixed(2)} objects per million cubic units`);
        console.log(`Objects created: ${totalObjectsCreated} (target was ${OBJECT_COUNT})`);
        console.log('============================');

        // --- PHASE 3: BRINGING IT TO LIFE (ANIMATION) ---

        // Create a clock to manage animation timing.
        const clock = new THREE.Clock();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();

            // Log camera position every 5 seconds
            if (Math.floor(elapsedTime) % 5 === 0 && Math.floor(elapsedTime) !== animate.lastLoggedTime) {
                console.log(`=== CAMERA POSITION ===`);
                console.log(`X: ${camera.position.x.toFixed(2)}`);
                console.log(`Y: ${camera.position.y.toFixed(2)}`);
                console.log(`Z: ${camera.position.z.toFixed(2)}`);
                console.log(`======================`);
                animate.lastLoggedTime = Math.floor(elapsedTime);
            }

            // Update all objects
            allObjects.forEach(obj => {
                // Update position (make it fall)
                obj.position.y -= FALL_SPEED;

                // Update rotation using individual speeds
                obj.rotation.x += obj.rotationSpeedX * ROTATION_MULTIPLIER;
                obj.rotation.z += obj.rotationSpeedZ * ROTATION_MULTIPLIER;

                // Check if object is off-screen (recycling)
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
                
                const meshData = instancedMeshes[obj.meshIndex];
                meshData.mesh.setMatrixAt(obj.instanceIndex, dummy.matrix);
            });

            // Update all meshes
            instancedMeshes.forEach(meshData => {
                meshData.mesh.instanceMatrix.needsUpdate = true;
            });

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

        // Start the animation
        animate();

    } catch (error) {
        console.error('Failed to initialize scene:', error);
    }
}

// Initialize the scene
initializeScene();

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