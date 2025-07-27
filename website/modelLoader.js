/**
 * @file modelLoader.js
 * @description Model loading and geometry processing utilities
 * @author AI Coding Agent
 * @date July 26, 2025
 */

import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';
import { discoverModelPaths } from './utils.js';

const gltfLoader = new GLTFLoader();

/**
 * Load all available models
 * @returns {Promise<Array>} Array of loaded model objects
 */
export async function loadAllModels() {
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
                            modelGeometry = mergeGeometries(geometries);
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
        return [];
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

    return loadedModels;
}

/**
 * Merge multiple geometries into a single geometry
 * @param {Array<THREE.BufferGeometry>} geometries - Array of geometries to merge
 * @returns {THREE.BufferGeometry} Merged geometry
 */
function mergeGeometries(geometries) {
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
    return mergedGeometry;
}
