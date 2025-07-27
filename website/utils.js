/**
 * @file utils.js
 * @description Utility functions for the 3D falling objects animation
 * @author AI Coding Agent
 * @date July 26, 2025
 */

import { OBJECT_CONFIG, MODEL_CONFIG, MATERIAL_CONFIG, ANIMATION_CONFIG } from './config.js';
import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';

/**
 * Calculate object count based on target density and space volume
 * @returns {number} Calculated object count
 */
export function calculateObjectCount() {
    const volume = OBJECT_CONFIG.X_SPREAD * OBJECT_CONFIG.Y_SPREAD * OBJECT_CONFIG.Z_SPREAD; // cubic units
    const densityPerCubicUnit = OBJECT_CONFIG.TARGET_DENSITY / 1000000; // convert from per million to per unit
    const calculatedCount = Math.round(volume * densityPerCubicUnit);
    
    console.log('=== DENSITY-BASED OBJECT CALCULATION ===');
    console.log(`Space dimensions: ${OBJECT_CONFIG.X_SPREAD} × ${OBJECT_CONFIG.Y_SPREAD} × ${OBJECT_CONFIG.Z_SPREAD} units`);
    console.log(`Total volume: ${volume.toLocaleString()} cubic units`);
    console.log(`Target density: ${OBJECT_CONFIG.TARGET_DENSITY} objects per million cubic units`);
    console.log(`Calculated object count: ${calculatedCount}`);
    console.log('==========================================');
    
    return calculatedCount;
}

/**
 * Dynamically discover all GLB models in the models directory
 * @returns {Promise<string[]>} Array of model paths
 */
export async function discoverModelPaths() {
    try {
        // Try to fetch the models directory listing
        const response = await fetch(MODEL_CONFIG.DIRECTORY);
        if (response.ok) {
            const text = await response.text();
            // Parse HTML directory listing to extract .glb files
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const links = Array.from(doc.querySelectorAll('a[href$=".glb"]'));
            return links.map(link => MODEL_CONFIG.DIRECTORY + link.getAttribute('href'));
        }
    } catch (error) {
        console.warn('Could not auto-discover models, using fallback list:', error);
    }
    
    // Fallback: hardcoded list of known models
    return MODEL_CONFIG.FALLBACK_MODELS;
}

/**
 * Log density verification information
 * @param {number} totalObjectsCreated - Actual number of objects created
 * @param {number} targetObjectCount - Target number of objects
 */
export function logDensityVerification(totalObjectsCreated, targetObjectCount) {
    const volume = OBJECT_CONFIG.X_SPREAD * OBJECT_CONFIG.Y_SPREAD * OBJECT_CONFIG.Z_SPREAD; // in cubic units
    const actualDensity = totalObjectsCreated / volume; // objects per cubic unit
    const actualDensityPerMillion = actualDensity * 1000000;
    const densityDifference = actualDensityPerMillion - OBJECT_CONFIG.TARGET_DENSITY;
    
    console.log('=== DENSITY VERIFICATION ===');
    console.log(`Target density: ${OBJECT_CONFIG.TARGET_DENSITY} objects per million cubic units`);
    console.log(`Actual density: ${actualDensityPerMillion.toFixed(2)} objects per million cubic units`);
    console.log(`Difference: ${densityDifference > 0 ? '+' : ''}${densityDifference.toFixed(2)} objects per million cubic units`);
    console.log(`Objects created: ${totalObjectsCreated} (target was ${targetObjectCount})`);
    console.log('============================');
}

/**
 * Log camera position information
 * @param {THREE.Camera} camera - The camera object
 * @param {string} context - Context label (e.g., 'INITIAL', 'CURRENT')
 */
export function logCameraPosition(camera, context = 'CAMERA') {
    console.log(`=== ${context} POSITION ===`);
    console.log(`X: ${camera.position.x.toFixed(2)}`);
    console.log(`Y: ${camera.position.y.toFixed(2)}`);
    console.log(`Z: ${camera.position.z.toFixed(2)}`);
    console.log('================================');
}

/**
 * Create a material based on the configured material type
 * @returns {THREE.Material} The configured material
 */
export function createMaterial() {
    const config = MATERIAL_CONFIG;
    
    switch (config.TYPE) {
        case 'BASIC':
            return new THREE.MeshBasicMaterial({
                color: 0xffffff
            });
            
        case 'LAMBERT':
            return new THREE.MeshLambertMaterial({
                color: 0xffffff
            });
            
        case 'PHONG':
            return new THREE.MeshPhongMaterial({
                color: 0xffffff,
                shininess: config.SHININESS,
                specular: config.SPECULAR
            });
            
        case 'STANDARD':
            return new THREE.MeshStandardMaterial({
                metalness: config.METALNESS,
                roughness: config.ROUGHNESS,
                color: 0xffffff
            });
            
        case 'TOON':
            return new THREE.MeshToonMaterial({
                color: 0xffffff
            });
            
        case 'MATCAP':
            return new THREE.MeshMatcapMaterial({
                color: 0xffffff
            });
            
        default:
            console.warn(`Unknown material type: ${config.TYPE}, falling back to STANDARD`);
            return new THREE.MeshStandardMaterial({
                metalness: config.METALNESS,
                roughness: config.ROUGHNESS,
                color: 0xffffff
            });
    }
}

/**
 * Create a frame rate limited animation function
 * @param {Function} animateFunction - The animation function to call
 * @param {number} targetFPS - Target frames per second
 * @returns {Function} The frame rate controlled animation function
 */
export function createFrameRateLimitedAnimation(animateFunction, targetFPS) {
    if (targetFPS <= 0) {
        // No FPS limit, use standard requestAnimationFrame
        return function animate() {
            animateFunction();
            window.requestAnimationFrame(animate);
        };
    }
    
    const targetFrameTime = 1000 / targetFPS; // Target time per frame in milliseconds
    let lastFrameTime = 0;
    
    return function animate(currentTime) {
        // If enough time has passed since last frame
        if (currentTime - lastFrameTime >= targetFrameTime) {
            animateFunction();
            lastFrameTime = currentTime;
        }
        
        window.requestAnimationFrame(animate);
    };
}
