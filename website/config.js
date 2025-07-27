/**
 * @file config.js
 * @description Configuration settings for the 3D falling objects animation
 * @author AI Coding Agent
 * @date July 26, 2025
 */

// ========================================
// CONFIGURATION PARAMETERS
// ========================================
// All tunable parameters are centralized here for easy modification

// --- SCENE SETTINGS ---
export const SCENE_CONFIG = {
    BACKGROUND_COLOR: 0xf4f4ed, // baby_powder DEFAULT - soft neutral background
};

// --- CAMERA SETTINGS ---
export const CAMERA_CONFIG = {
    FOV: 75, // Field of view in degrees
    NEAR: 0.1, // Near clipping plane
    FAR: 3000, // Far clipping plane
    POSITION_X: 10.22, // Initial camera X position
    POSITION_Y: 4.21, // Initial camera Y position
    POSITION_Z: 197.27, // Initial camera Z position
    
    // Camera panning settings
    ENABLE_AUTO_PAN: true, // Enable automatic camera panning
    PAN_SPEED: 0.2, // Speed of Y-axis rotation (radians per frame)
    PAN_RADIUS: 200, // Distance from center point during panning
    PAN_HEIGHT: 4.21, // Y height to maintain during panning
};

// --- OBJECT SETTINGS ---
export const OBJECT_CONFIG = {
    // Density-based object generation (objects per million cubic units)
    TARGET_DENSITY: 4, // Target density: objects per million cubic units
    // Note: Object count will be calculated automatically based on density and space volume
    
    // Object spread parameters
    X_SPREAD: 200, // Horizontal spread of objects
    Y_SPREAD: 600, // Vertical spread of objects
    Z_SPREAD: 100, // Depth spread of objects
    Y_OFFSET: 0, // Vertical offset for starting positions
    
    // Object scale parameters
    MIN_SCALE: 0.02, // Minimum object scale
    MAX_SCALE: 0.1, // Maximum object scale
};

// --- OBJECT COLORS ---
// Colors randomly assigned to falling objects using the provided palette
export const OBJECT_COLORS = [
    // Plum (Web) variants
    0xf7aef8, // plum DEFAULT
    0x990e9c, // plum 200
    0xef61f1, // plum 400
    0xf8bff9, // plum 600
    0xfacffb, // plum 700
    
    // Lavender (Floral) variants
    0xb388eb, // lavender DEFAULT
    0x43167f, // lavender 200
    0x8b4ae0, // lavender 400
    0xc3a1ef, // lavender 600
    0xd2b8f3, // lavender 700
    
    // Vista Blue variants
    0x8093f1, // vista_blue DEFAULT
    0x0f2284, // vista_blue 200
    0x3c59e9, // vista_blue 400
    0x98a7f4, // vista_blue 600
    0xb2bdf6, // vista_blue 700
    
    // Sky Blue variants
    0x72ddf7, // sky_blue DEFAULT
    0x086f89, // sky_blue 200
    0x2fccf3, // sky_blue 400
    0x8fe3f8, // sky_blue 600
    0xabeafa, // sky_blue 700
];

// --- ANIMATION PARAMETERS ---
export const ANIMATION_CONFIG = {
    FALL_SPEED: 0.8, // How fast objects fall (higher = faster)
    MAX_ROTATION_SPEED: 0.5, // Maximum rotation speed for objects
    ROTATION_MULTIPLIER: 0.02, // Rotation speed multiplier
    
    // Frame rate control
    TARGET_FPS: 120, // Target frames per second (0 = uncapped, uses browser's requestAnimationFrame)
    ENABLE_FPS_LIMIT: false, // Set to true to enable FPS limiting
};

// --- MATERIAL PROPERTIES ---
export const MATERIAL_CONFIG = {
    // Current material type - change this to switch material styles
    TYPE: 'LAMBERT', // Options: 'BASIC', 'LAMBERT', 'PHONG', 'STANDARD', 'TOON', 'MATCAP'
    
    // Standard Material settings (metallic/rough workflow)
    METALNESS: 0.45, // Material metalness (0-1)
    ROUGHNESS: 0.9, // Material roughness (0-1)
    
    // Phong Material settings (plastic-like)
    SHININESS: 100, // Shininess for MeshPhongMaterial (0-1000)
    SPECULAR: 0x111111, // Specular highlight color for MeshPhongMaterial
    
    // Toon Material settings
    // (Uses default gradient map for toon shading)
};

// --- LIGHTING SETTINGS ---
export const LIGHTING_CONFIG = {
    // Ambient Light
    AMBIENT_LIGHT: {
        COLOR: 0xffffff,
        INTENSITY: 0.5,
    },
    
    // Main Directional Light
    DIRECTIONAL_LIGHT_1: {
        COLOR: 0xffffff,
        INTENSITY: 1,
        POSITION: [5, 5, 5],
    },
    
    // Secondary Directional Light (cool tone)
    DIRECTIONAL_LIGHT_2: {
        COLOR: 0x87CEEB, // Sky blue
        INTENSITY: 0.6,
        POSITION: [-5, 3, 2],
    },
    
    // Point Light 1
    POINT_LIGHT_1: {
        COLOR: 0xFF69B4, // Hot pink
        INTENSITY: 0.8,
        DISTANCE: 100,
        POSITION: [10, 10, 10],
    },
};

// --- VISUAL HELPERS ---
export const HELPERS_CONFIG = {
    SHOW_AXES_HELPER: true, // Show XYZ axes
    AXES_HELPER_SIZE: 10, // Size of axes helper
    SHOW_AXIS_LABELS: true, // Show X, Y, Z labels
};

// --- CONTROLS ---
export const CONTROLS_CONFIG = {
    ENABLE_ORBIT_CONTROLS: true, // Enable camera orbit controls
    ENABLE_DAMPING: true, // Enable smooth camera movement
};

// --- MODEL SETTINGS ---
export const MODEL_CONFIG = {
    DIRECTORY: 'models/', // Model directory path
    FALLBACK_MODELS: [
        'models/dd.glb',
        'models/Gemini_Generated_Image_1ngjh61ngjh61ngj.glb',
        'models/Gemini_Generated_Image_99jcve99jcve99jc.glb',
        'models/Gemini_Generated_Image_cwr7vxcwr7vxcwr7.glb',
        'models/Gemini_Generated_Image_nkujwpnkujwpnkuj.glb',
        'models/Gemini_Generated_Image_tbskldtbskldtbsk.glb',
        'models/Gemini_Generated_Image_w7lk6xw7lk6xw7lk.glb',
        'models/Gemini_Generated_Image_xvlftixvlftixvlf.glb'
    ],
};
