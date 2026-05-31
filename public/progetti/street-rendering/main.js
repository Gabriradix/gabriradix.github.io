import * as THREE from 'three';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505); // Match CSS bg
scene.fog = new THREE.FogExp2(0x050505, 0.05); // Add fog for depth

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10); // Initial position

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.2;
controls.enableZoom = false;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Global mesh reference
let pointCloud;

// Load Point Cloud
const loader = new PLYLoader();
loader.load(
    'assets/pointcloud.ply',
    function (geometry) {
        geometry.computeVertexNormals();

        // Center the model
        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        geometry.center(); // Center the geometry itself

        // Normalize scale
        const size = new THREE.Vector3();
        geometry.boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = 15 / maxDim; // Scale to size 15

        const material = new THREE.PointsMaterial({
            size: 0.02,
            vertexColors: true,
            sizeAttenuation: true
        });

        pointCloud = new THREE.Points(geometry, material);
        pointCloud.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Initial rotation correction
        pointCloud.rotation.x = -Math.PI / 2;
        pointCloud.position.y = 0;

        scene.add(pointCloud);

        // Adjust camera
        camera.position.set(0, -0.5, 2);
        camera.lookAt(0, -1.0, 0);
        controls.target.set(0, -1.0, 0);
        controls.update();

        // Hide loader
        const loadingScreen = document.getElementById('loading-screen');
        const canvasContainer = document.getElementById('canvas-container');
        const heroOverlay = document.querySelector('.hero-overlay');

        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (canvasContainer) canvasContainer.classList.add('loaded');
        if (heroOverlay) heroOverlay.classList.add('visible');

        console.log('Point cloud loaded');
    },
    (xhr) => {
        const percent = Math.min(100, (xhr.loaded / xhr.total * 100));
        const progressBar = document.getElementById('progress');
        const percentageText = document.getElementById('percentage');

        if (progressBar && percentageText) {
            progressBar.style.width = percent + '%';
            percentageText.innerText = Math.round(percent) + '%';
        }
    },
    (error) => {
        console.error('An error happened loading the PLY', error);
    }
);

// Window Resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    controls.update();

    renderer.render(scene, camera);
}

animate();

// Lightbox Logic
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.querySelector('.lightbox-close');
const prevBtn = document.querySelector('.lightbox-prev');
const nextBtn = document.querySelector('.lightbox-next');
const galleryImages = document.querySelectorAll('.gallery-item img');

let currentImageIndex = 0;

function openLightbox(index) {
    currentImageIndex = index;
    const imgSrc = galleryImages[index].src;
    lightboxImg.src = imgSrc;
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeLightbox() {
    lightbox.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scrolling
}

function showNext() {
    currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
    openLightbox(currentImageIndex);
}

function showPrev() {
    currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
    openLightbox(currentImageIndex);
}

// Event Listeners
galleryImages.forEach((img, index) => {
    img.parentElement.addEventListener('click', () => openLightbox(index));
});

if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
if (lightbox) {
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
}

if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showPrev();
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showNext();
    });
}

document.addEventListener('keydown', (e) => {
    if (lightbox && lightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
});

// Mobile Navbar Logic
const hamburger = document.querySelector('.hamburger');
const mobileNav = document.querySelector('.mobile-nav');
const mobileNavLinks = document.querySelectorAll('.mobile-nav a');

if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileNav.classList.toggle('active');
    });

    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            mobileNav.classList.remove('active');
        });
    });

    // Close menu when clicking on backdrop
    mobileNav.addEventListener('click', (e) => {
        if (e.target === mobileNav) {
            hamburger.classList.remove('active');
            mobileNav.classList.remove('active');
        }
    });
}
