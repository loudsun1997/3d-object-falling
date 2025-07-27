/**
 * @file lighting.js
 * @description Lighting setup for the 3D falling objects animation
 * @author AI Coding Agent
 * @date July 26, 2025
 */

import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { LIGHTING_CONFIG } from './config.js';

/**
 * Set up all lights for the scene
 * @param {THREE.Scene} scene - The Three.js scene
 */
export function setupLighting(scene) {
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(
        LIGHTING_CONFIG.AMBIENT_LIGHT.COLOR, 
        LIGHTING_CONFIG.AMBIENT_LIGHT.INTENSITY
    );
    scene.add(ambientLight);

    // Main Directional Light
    const directionalLight = new THREE.DirectionalLight(
        LIGHTING_CONFIG.DIRECTIONAL_LIGHT_1.COLOR, 
        LIGHTING_CONFIG.DIRECTIONAL_LIGHT_1.INTENSITY
    );
    directionalLight.position.set(...LIGHTING_CONFIG.DIRECTIONAL_LIGHT_1.POSITION);
    scene.add(directionalLight);

    // Secondary Directional Light (cool tone)
    const directionalLight2 = new THREE.DirectionalLight(
        LIGHTING_CONFIG.DIRECTIONAL_LIGHT_2.COLOR, 
        LIGHTING_CONFIG.DIRECTIONAL_LIGHT_2.INTENSITY
    );
    directionalLight2.position.set(...LIGHTING_CONFIG.DIRECTIONAL_LIGHT_2.POSITION);
    scene.add(directionalLight2);

    // Point Light 1
    const pointLight1 = new THREE.PointLight(
        LIGHTING_CONFIG.POINT_LIGHT_1.COLOR, 
        LIGHTING_CONFIG.POINT_LIGHT_1.INTENSITY, 
        LIGHTING_CONFIG.POINT_LIGHT_1.DISTANCE
    );
    pointLight1.position.set(...LIGHTING_CONFIG.POINT_LIGHT_1.POSITION);
    scene.add(pointLight1);
}
