import * as THREE from 'three';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Scene setup
const canvas = document.getElementById('hero-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false // Disabled for dithering effect
});

// Renderer settings - OPTIMIZED for performance
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1); // Fixed to 1 for better performance (was: Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x000000, 0);

// Camera positioning - EXTREMELY CLOSE to model, lowered further
camera.position.set(0, -0.6, 0.35);
camera.lookAt(0, 0, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight1.position.set(5, 5, 5);
scene.add(directionalLight1);

const directionalLight2 = new THREE.DirectionalLight(0x4080ff, 0.5);
directionalLight2.position.set(-5, -3, -5);
scene.add(directionalLight2);

// 5 COLOR PALETTES - One chosen randomly at page load (VERY LOW SATURATION)
const colorPalettes = [
    {
        name: "Monochrome",
        color1: [0.0, 0.0, 0.0],      // Black
        color2: [0.5, 0.5, 0.5],      // Medium gray
        accent: [0.3, 0.3, 0.3]       // Dark gray
    },
    {
        name: "Cyber",
        color1: [0.05, 0.0, 0.12],    // Very subtle purple
        color2: [0.0, 0.3, 0.4],      // Very subtle cyan
        accent: [0.3, 0.1, 0.4]       // Very subtle magenta
    },
    {
        name: "Neon",
        color1: [0.4, 0.0, 0.2],      // Very subtle pink
        color2: [0.0, 0.4, 0.4],      // Very subtle cyan
        accent: [0.4, 0.4, 0.0]       // Very subtle yellow
    },
    {
        name: "Sunset",
        color1: [0.1, 0.0, 0.12],     // Very subtle dark purple
        color2: [0.4, 0.2, 0.0],      // Very subtle orange
        accent: [0.4, 0.25, 0.3]      // Very subtle pink
    },
    {
        name: "Matrix",
        color1: [0.0, 0.05, 0.0],     // Very subtle dark green
        color2: [0.0, 0.4, 0.1],      // Very subtle bright green
        accent: [0.2, 0.4, 0.2]       // Very subtle light green
    }
];

// Select random palette

const selectedPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

// Advanced Glitch + Dithering shader material FOR POINT CLOUD
const ditherShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        pointSize: { value: 2.5 },  // Size of points
        color1: { value: new THREE.Vector3(...selectedPalette.color1) },
        color2: { value: new THREE.Vector3(...selectedPalette.color2) },
        accentColor: { value: new THREE.Vector3(...selectedPalette.accent) }
    },
    vertexShader: `
        uniform float time;
        uniform float pointSize;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        
        // Hash function for pseudo-random noise
        float hash(float n) {
            return fract(sin(n) * 43758.5453123);
        }
        
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            
            // Smooth wave distortion only (removed glitchy displacement)
            vec3 pos = position;
            float wave = sin(position.y * 5.0 + time * 3.0) * 0.015;
            pos.x += wave;
            pos.z += cos(position.x * 5.0 + time * 2.0) * 0.015;
            
            vec4 worldPos = modelMatrix * vec4(pos, 1.0);
            vWorldPosition = worldPos.xyz;
            
            // Set point size with slight variation
            gl_PointSize = pointSize * (1.0 + hash(position.x + position.y) * 0.5);
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec2 uResolution;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 accentColor;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        
        // Bayer matrix 4x4 for ordered dithering
        float bayer4x4(vec2 coord) {
            mat4 bayerMatrix = mat4(
                0.0,  8.0,  2.0, 10.0,
                12.0,  4.0, 14.0,  6.0,
                3.0, 11.0,  1.0,  9.0,
                15.0,  7.0, 13.0,  5.0
            );
            int x = int(mod(coord.x, 4.0));
            int y = int(mod(coord.y, 4.0));
            
            float value = 0.0;
            for(int i = 0; i < 4; i++) {
                for(int j = 0; j < 4; j++) {
                    if(i == x && j == y) {
                        value = bayerMatrix[i][j];
                    }
                }
            }
            return value / 16.0;
        }
        
        // Noise function
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
            // Lighting calculation
            vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
            float diff = max(dot(vNormal, lightDir), 0.0);
            
            // Fresnel effect
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
            
            // Base colors from selected palette
            vec3 baseColor = mix(color1, color2, diff * 0.7 + 0.3);
            baseColor = mix(baseColor, accentColor, fresnel * 0.4);
            
            // Dithering effect
            vec2 ditherCoord = gl_FragCoord.xy;
            float dither = bayer4x4(ditherCoord) * 1.5;
            
            // Quantize to fewer colors
            float levels = 2.5;
            vec3 quantized = floor(baseColor * levels + dither) / levels;
            
            // Darken center for text readability
            vec2 uv = gl_FragCoord.xy / uResolution.xy;
            float dist = distance(uv, vec2(0.5));
            // Mask: 0.0 at center, 1.0 at edges (0.5 distance)
            float centerMask = smoothstep(0.0, 0.6, dist);
            // Brightness: 0.4 at center, 1.0 at edges
            float brightness = 0.4 + 0.6 * centerMask;
            
            gl_FragColor = vec4(quantized * brightness, 1.0);
        }
    `
});

// Load PLY model
let model;
const loader = new PLYLoader();

loader.load(
    'assets/astratto.ply',
    function (geometry) {
        // Compute normals for proper lighting
        geometry.computeVertexNormals();

        // OPTIMIZATION: Vertex count tracked internally
        const positionAttribute = geometry.getAttribute('position');
        const vertexCount = positionAttribute ? positionAttribute.count : 0;

        // Center and scale the geometry
        geometry.center();
        geometry.computeBoundingBox();
        const size = new THREE.Vector3();
        geometry.boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.0 / maxDim;
        geometry.scale(scale, scale, scale);

        // Create POINT CLOUD with dithering material
        model = new THREE.Points(geometry, ditherShaderMaterial);
        scene.add(model);
    },
    function (xhr) {
        // Loading progress tracked silently
        const percent = Math.min((xhr.loaded / xhr.total * 100), 100);
    },
    function (error) {
        console.error('Error loading PLY model:', error);
    }
);

// --- POST-PROCESSING SETUP ---

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Custom Radial Chromatic Aberration Shader
const RadialAberrationShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'uResolution': { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        'uStrength': { value: 4.0 } // Strength of the effect
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 uResolution;
        uniform float uStrength;
        varying vec2 vUv;

        void main() {
            vec2 uv = vUv;
            
            // Calculate distance from center (0.5, 0.5)
            vec2 dist = uv - 0.5;
            float d = length(dist);
            
            // Cubic falloff for stronger effect at edges
            float factor = uStrength * d * d * d;
            
            // Calculate offsets for RGB channels
            vec2 offsetR = dist * factor * 0.02;
            vec2 offsetB = dist * factor * 0.01; // Different offset for Blue
            
            float r = texture2D(tDiffuse, uv - offsetR).r;
            float g = texture2D(tDiffuse, uv).g;
            float b = texture2D(tDiffuse, uv + offsetB).b;
            
            // Get alpha from original pixel to maintain transparency if needed
            float a = texture2D(tDiffuse, uv).a;
            
            gl_FragColor = vec4(r, g, b, a);
        }
    `
};

const aberrationPass = new ShaderPass(RadialAberrationShader);
composer.addPass(aberrationPass);

// Animation loop
let time = 0;
function animate() {
    requestAnimationFrame(animate);

    time += 0.001;

    // Slow automatic rotation
    if (model) {
        model.rotation.y += 0.002; // Very slow rotation
        model.rotation.x = Math.sin(time * 0.5) * 0.1; // Subtle bobbing
    }

    // Update shader time uniform
    ditherShaderMaterial.uniforms.time.value = time;

    // Render via composer
    composer.render();
}

animate();

// Handle window resize - OPTIMIZED
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(1); // Fixed to 1 for performance

    composer.setSize(width, height);
    aberrationPass.uniforms.uResolution.value.set(width, height);
    ditherShaderMaterial.uniforms.uResolution.value.set(width, height);
});
