import * as THREE from 'three';

// ----------------------------------------------------
// 1. POPULATE GALLERY DOM
// ----------------------------------------------------
const galleryWrapper = document.getElementById('gallery-wrapper');
let artworks = [];
if (window.artworks) {
    artworks = window.artworks;
}

// Generate slides
let slidesHTML = '';
artworks.forEach((art, index) => {
    // Determine target link
    const linkUrl = art.projectUrl || (art.links && art.links[0] ? art.links[0].url : '#');
    const displayZeroIndex = (index + 1) < 10 ? `0${index + 1}` : index + 1;
    
    // Choose the first image of gallery if available, or just the main image
    let imageSrc = art.imageUrl;
    
    // For local paths, we must account for being in /alt directory
    // If image path doesn't start with http, prepend '../'
    if (imageSrc && !imageSrc.startsWith('http')) {
        imageSrc = `../${imageSrc}`;
    }

    slidesHTML += `
        <section class="slide project-slide" data-index="${displayZeroIndex}">
            <div class="content-grid">
                <div class="project-info">
                    <span class="project-category">${art.category}</span>
                    <h2 class="project-title">${art.title}</h2>
                    <div class="project-meta">
                        <span>${art.year}</span>
                        <span>&mdash;</span>
                        <span>${art.medium}</span>
                    </div>
                    <p class="project-description">${art.description}</p>
                    <a href="${linkUrl}" target="_blank" class="explore-btn hover-target">Esplora Progetto</a>
                </div>
                <div class="project-image-container hover-target">
                    <img src="${imageSrc}" alt="${art.title}" />
                </div>
            </div>
        </section>
    `;
});
galleryWrapper.innerHTML = slidesHTML;


// ----------------------------------------------------
// 2. GSAP HORIZONTAL SCROLL & INFINITE LOOP
// ----------------------------------------------------
gsap.registerPlugin(ScrollTrigger);

const sliderContainer = document.querySelector('.slider-container');

// Aggiungiamo un clone della prima slide alla fine per l'effetto loop infinito
const introClone = document.querySelector('.intro-slide').cloneNode(true);
sliderContainer.appendChild(introClone);

// Inizializza Lenis per scorrimento fluido nativo
const lenis = new window.Lenis({
    lerp: 0.07,
    smoothWheel: true
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0, 0);

// Calculate total width to scroll
function getScrollAmount() {
    let sliderWidth = sliderContainer.scrollWidth;
    return -(sliderWidth - window.innerWidth);
}

// Calcolo dinamico dei punti di snap per rendere lo scroll "sticky"
function calculateSnaps() {
    let snaps = [];
    const w = window.innerWidth;
    const max = sliderContainer.scrollWidth - w;
    let acc = 0;
    
    // 1. Intro (inizio pagina)
    snaps.push(0);
    acc += w; // Intro width è 100vw
    
    // 2. Progetti
    const projects = document.querySelectorAll('.project-slide');
    projects.forEach((proj) => {
        // I progetti occupano 80vw (w * 0.8)
        // Per centrarli nello schermo (100vw), sottraiamo 10vw (w * 0.1)
        let snapPoint = (acc - (w * 0.1)) / max;
        snaps.push(Math.max(0, Math.min(1, snapPoint)));
        acc += (w * 0.8);
    });
    
    // 3. Outro (100vw, quindi si allinea dritto)
    snaps.push(Math.max(0, Math.min(1, acc / max)));
    acc += w;
    
    // 4. Intro Clone (Fine del Loop)
    snaps.push(1);
    
    return snaps;
}

const tween = gsap.to(sliderContainer, {
    x: getScrollAmount,
    duration: 3,
    ease: "none"
});

ScrollTrigger.create({
    trigger: ".slider-container",
    start: "top top",
    end: () => `+=${getScrollAmount() * -1}`,
    pin: true,
    animation: tween,
    scrub: true, // Il vero "smooth" ora lo fa Lenis
    invalidateOnRefresh: true,
    snap: {
        snapTo: (value) => gsap.utils.snap(calculateSnaps(), value), // Ricalcola dinamicamente i punti
        duration: { min: 0.3, max: 0.8 },
        delay: 0.2, // Attende che l'inerzia di Lenis finisca
        ease: "power2.inOut"
    },
    onUpdate: (self) => {
        // Se raggiungiamo il limite estremo dove il clone dell'Intro è in full-screen
        // saltiamo brutalmente all'avvio: la transizione è invisibile
        if (self.progress >= 0.999) {
            lenis.scrollTo(0, { immediate: true });
        }
    }
});


// ----------------------------------------------------
// 3. THREE.JS BACKGROUND
// ----------------------------------------------------
const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
camera.position.z = 5;

// Create particles
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 2000;
const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
    // Spread particles across a wide area to account for horizontal scrolling
    posArray[i] = (Math.random() - 0.5) * 20;
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

// Determine initial color based on body class
const isLightInit = document.body.classList.contains('light-mode');
let particleColor = isLightInit ? 0x000000 : 0xffffff;

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.02,
    color: particleColor,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Mouse interaction tracking for ThreeJS
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
});

// Render loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;

    particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
    particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);
    particlesMesh.rotation.z += 0.001;

    // Subtle wave effect
    const positions = particlesGeometry.attributes.position.array;
    for(let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        const x = positions[i3];
        positions[i3 + 1] += Math.sin(elapsedTime + x) * 0.002;
    }
    particlesGeometry.attributes.position.needsUpdate = true;

    // React to scroll
    const scrollY = window.scrollY;
    particlesMesh.position.y = -scrollY * 0.001;
    
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// ----------------------------------------------------
// 4. CUSTOM CURSOR
// ----------------------------------------------------
const cursor = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursor-follower');

// Cursor position variables
let followerX = 0;
let followerY = 0;

document.addEventListener('mousemove', (e) => {
    // Instant cursor update
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    
    // Store target for follower interpolation
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Smooth follower using GSAP ticker
gsap.ticker.add(() => {
    // Lerp follower
    followerX += (mouseX - followerX) * 0.15;
    followerY += (mouseY - followerY) * 0.15;
    cursorFollower.style.transform = `translate(${followerX}px, ${followerY}px)`;
});

// Interactive hover states
const hoverTargets = document.querySelectorAll('.hover-target, button, a');
hoverTargets.forEach(target => {
    target.addEventListener('mouseenter', () => {
        document.body.classList.add('hovering');
    });
    target.addEventListener('mouseleave', () => {
        document.body.classList.remove('hovering');
    });
});


// ----------------------------------------------------
// 5. DARK / LIGHT MODE TOGGLE
// ----------------------------------------------------
const themeToggleBtn = document.getElementById('theme-toggle');
const lightIcon = themeToggleBtn.querySelector('.light-icon');
const darkIcon = themeToggleBtn.querySelector('.dark-icon');

// Set default
if (!document.body.classList.contains('light-mode')) {
    document.body.classList.add('dark-mode');
}

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    document.body.classList.toggle('dark-mode');
    
    const isLight = document.body.classList.contains('light-mode');
    
    if (isLight) {
        // Switch to Light
        lightIcon.style.display = 'inline-block';
        darkIcon.style.display = 'none';
        
        // Update ThreeJS material
        gsap.to(particlesMaterial.color, {
            r: 0, g: 0, b: 0,
            duration: 0.5
        });
        particlesMaterial.blending = THREE.NormalBlending;
    } else {
        // Switch to Dark
        lightIcon.style.display = 'none';
        darkIcon.style.display = 'inline-block';
        
        // Update ThreeJS material
        gsap.to(particlesMaterial.color, {
            r: 1, g: 1, b: 1,
            duration: 0.5
        });
        particlesMaterial.blending = THREE.AdditiveBlending;
    }
});
