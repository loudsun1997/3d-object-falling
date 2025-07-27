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
