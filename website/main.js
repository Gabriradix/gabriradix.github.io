// Artwork data
const artworks = window.artworks;

// State
let currentCategory = 'All';
let currentArtworkId = null;
let currentGalleryIndex = 0;

// Scroll to section
function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Close mobile menu
    document.getElementById('mobile-menu').classList.remove('active');
}

// Navigation scroll effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('nav');
    if (window.scrollY > 100) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// Mobile menu toggle
document.getElementById('mobile-toggle').addEventListener('click', () => {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('active');
});

// Render gallery
function renderGallery(category = 'All') {
    const grid = document.getElementById('gallery-grid');
    const filtered = category === 'All'
        ? artworks
        : artworks.filter(art => {
            if (Array.isArray(art.category)) {
                return art.category.includes(category);
            }
            return art.category === category;
        });

    grid.innerHTML = filtered.map((artwork, index) => `
        <div class="gallery-item" data-id="${artwork.id}" style="animation-delay: ${index * 0.05}s">
            <div class="gallery-item-image">
                <img src="${artwork.imageUrl}" alt="${artwork.title}" loading="lazy" />
                <div class="gallery-item-overlay">
                    <div class="gallery-item-info">
                        <h3>${artwork.title}</h3>
                        <p>${artwork.year} • ${artwork.medium}</p>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Add click listeners
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            openLightbox(id);
        });
    });
}

// Filter buttons
document.getElementById('filters').addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
        // Update active state
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');

        // Filter gallery
        const category = e.target.dataset.category;
        currentCategory = category;
        renderGallery(category);
    }
});

// Lightbox & Slideshow
let slideshowInterval = null;

function openLightbox(id) {
    const artwork = artworks.find(art => art.id === id);
    if (!artwork) return;

    currentArtworkId = id;
    currentGalleryIndex = 0; // Reset index

    const lightbox = document.getElementById('lightbox');
    const content = document.getElementById('lightbox-content');

    // Check if gallery exists
    const hasGallery = artwork.gallery && artwork.gallery.length > 0;
    const currentImage = hasGallery ? artwork.gallery[0] : artwork.imageUrl;

    // Start slideshow if gallery exists
    if (hasGallery) {
        startSlideshow();
    }

    // Generate buttons HTML
    let buttonsHtml = '';
    if (artwork.links) {
        buttonsHtml = artwork.links.map(link =>
            `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="lightbox-btn">${link.text}</a>`
        ).join(' ');
    } else if (artwork.projectUrl) {
        buttonsHtml = `<a href="${artwork.projectUrl}" target="_blank" rel="noopener noreferrer" class="lightbox-btn">${artwork.linkText || 'Esplora'}</a>`;
    }

    const mediaHtml = `<img id="lightbox-img" src="${currentImage}" alt="${artwork.title}" />`;

    content.innerHTML = `
        <div class="lightbox-image-container" ${hasGallery ? 'onclick="openFullScreenGallery()"' : ''} style="${hasGallery ? 'cursor: pointer;' : ''}">
            <div class="lightbox-image">
                ${mediaHtml}
            </div>
        </div>
        <div class="lightbox-info">
            <h2>${artwork.title}</h2>
            <div class="lightbox-details">
                <p>Year: ${artwork.year}</p>
                <p>Medium: ${artwork.medium}</p>
                <p>Category: ${Array.isArray(artwork.category) ? artwork.category.join(', ') : artwork.category}</p>
                ${hasGallery ? `<p id="gallery-counter">1 / ${artwork.gallery.length}</p>` : ''}
            </div>
            <div class="lightbox-description">
                ${artwork.description}
            </div>
            <div class="lightbox-buttons">
                ${buttonsHtml}
            </div>
        </div>
    `;

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function startSlideshow() {
    stopSlideshow();
    slideshowInterval = setInterval(() => {
        changeLightboxImage(1);
    }, 3000);
}

function stopSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
    }
}

window.changeLightboxImage = function (direction) {
    const artwork = artworks.find(art => art.id === currentArtworkId);
    if (!artwork || !artwork.gallery) return;

    currentGalleryIndex += direction;

    if (currentGalleryIndex >= artwork.gallery.length) {
        currentGalleryIndex = 0;
    } else if (currentGalleryIndex < 0) {
        currentGalleryIndex = artwork.gallery.length - 1;
    }

    const newImage = artwork.gallery[currentGalleryIndex];
    const imgContainer = document.querySelector('.lightbox-image');
    const counter = document.getElementById('gallery-counter');

    if (imgContainer) {
        // Fade out
        imgContainer.style.opacity = '0';

        setTimeout(() => {
            imgContainer.innerHTML = `<img id="lightbox-img" src="${newImage}" alt="${artwork.title}" />`;

            // Fade in
            setTimeout(() => {
                imgContainer.style.opacity = '1';
            }, 50);
        }, 300);
    }

    if (counter) {
        counter.textContent = `${currentGalleryIndex + 1} / ${artwork.gallery.length}`;
    }
};

// Fullscreen Gallery
window.openFullScreenGallery = function () {
    stopSlideshow();

    const artwork = artworks.find(art => art.id === currentArtworkId);
    if (!artwork || !artwork.gallery) return;

    const fullscreen = document.createElement('div');
    fullscreen.id = 'fullscreen-gallery';
    fullscreen.className = 'fullscreen-gallery';
    fullscreen.innerHTML = `
        <button class="fullscreen-close" onclick="closeFullScreenGallery()">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <button class="fullscreen-nav prev" onclick="changeFullScreenImage(-1)">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div class="fullscreen-image-wrapper">
            <img id="fullscreen-img" src="${artwork.gallery[currentGalleryIndex]}" alt="${artwork.title}" />
        </div>
        <button class="fullscreen-nav next" onclick="changeFullScreenImage(1)">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
    `;

    document.body.appendChild(fullscreen);

    // Fade in
    requestAnimationFrame(() => {
        fullscreen.classList.add('active');
    });
};

window.closeFullScreenGallery = function () {
    const fullscreen = document.getElementById('fullscreen-gallery');
    if (fullscreen) {
        fullscreen.classList.remove('active');
        setTimeout(() => {
            fullscreen.remove();
        }, 300);
    }
};

window.changeFullScreenImage = function (direction) {
    const artwork = artworks.find(art => art.id === currentArtworkId);
    if (!artwork || !artwork.gallery) return;

    currentGalleryIndex += direction;

    if (currentGalleryIndex < 0) {
        currentGalleryIndex = artwork.gallery.length - 1;
    } else if (currentGalleryIndex >= artwork.gallery.length) {
        currentGalleryIndex = 0;
    }

    const img = document.getElementById('fullscreen-img');
    if (img) {
        img.style.opacity = '0.5';
        img.src = artwork.gallery[currentGalleryIndex];
        img.onload = () => {
            img.style.opacity = '1';
        };
    }
};

function closeLightbox() {
    stopSlideshow();
    closeFullScreenGallery();
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

document.getElementById('lightbox-close').addEventListener('click', closeLightbox);

document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') {
        closeLightbox();
    }
});

// Close lightbox on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe elements on scroll
window.addEventListener('load', () => {
    document.querySelectorAll('.observe').forEach(el => {
        observer.observe(el);
    });
});

// Initialize gallery
renderGallery();
