/**
 * @file helpers.js
 * @description Visual helpers and debugging aids for the 3D scene
 * @author AI Coding Agent
 * @date July 26, 2025
 */

import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { CSS2DObject } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/renderers/CSS2DRenderer.js';
import { HELPERS_CONFIG } from './config.js';

/**
 * Set up visual helpers for the scene
 * @param {THREE.Scene} scene - The Three.js scene
 */
export function setupHelpers(scene) {
    // Add AxesHelper for visualizing the XYZ axes (if enabled)
    if (HELPERS_CONFIG.SHOW_AXES_HELPER) {
        const axesHelper = new THREE.AxesHelper(HELPERS_CONFIG.AXES_HELPER_SIZE);
        scene.add(axesHelper);
    }

    // Create labels for the axes (if enabled)
    if (HELPERS_CONFIG.SHOW_AXIS_LABELS) {
        const p = document.createElement('p');
        p.className = 'label';

        const xLabel = new CSS2DObject(p.cloneNode(true));
        xLabel.element.textContent = 'X';
        xLabel.element.style.color = '#ff0000';
        xLabel.position.set(HELPERS_CONFIG.AXES_HELPER_SIZE + 1, 0, 0);
        scene.add(xLabel);

        const yLabel = new CSS2DObject(p.cloneNode(true));
        yLabel.element.textContent = 'Y';
        yLabel.element.style.color = '#00ff00';
        yLabel.position.set(0, HELPERS_CONFIG.AXES_HELPER_SIZE + 1, 0);
        scene.add(yLabel);

        const zLabel = new CSS2DObject(p.cloneNode(true));
        zLabel.element.textContent = 'Z';
        zLabel.element.style.color = '#0000ff';
        zLabel.position.set(0, 0, HELPERS_CONFIG.AXES_HELPER_SIZE + 1);
        scene.add(zLabel);
    }
}
