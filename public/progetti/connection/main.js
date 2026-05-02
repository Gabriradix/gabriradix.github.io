/* ============================================
   CONNECTION — Template JS
   Lightbox + Mobile Navigation + Scroll Reveal
   ============================================ */

// === Lightbox ===
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const closeBtn = document.querySelector(".lightbox-close");
const prevBtn = document.querySelector(".lightbox-prev");
const nextBtn = document.querySelector(".lightbox-next");
const galleryImages = document.querySelectorAll(".gallery-item img");

let currentImageIndex = 0;

function openLightbox(index) {
  currentImageIndex = index;
  const imgSrc = galleryImages[index].src;
  lightboxImg.src = imgSrc;
  lightbox.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.add("hidden");
  document.body.style.overflow = "";
}

function showNext() {
  currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
  openLightbox(currentImageIndex);
}

function showPrev() {
  currentImageIndex =
    (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
  openLightbox(currentImageIndex);
}

// Gallery click handlers
galleryImages.forEach((img, index) => {
  img.parentElement.addEventListener("click", () => openLightbox(index));
});

// Close lightbox
if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
if (lightbox) {
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}

// Lightbox nav buttons
if (prevBtn) {
  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showPrev();
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showNext();
  });
}

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (lightbox && lightbox.classList.contains("hidden")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") showPrev();
  if (e.key === "ArrowRight") showNext();
});

// === Mobile Navigation ===
const hamburger = document.querySelector(".hamburger");
const mobileNav = document.querySelector(".mobile-nav");
const mobileNavLinks = document.querySelectorAll(".mobile-nav a");

if (hamburger && mobileNav) {
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    mobileNav.classList.toggle("active");
  });

  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      mobileNav.classList.remove("active");
    });
  });

  // Close menu on backdrop click
  mobileNav.addEventListener("click", (e) => {
    if (e.target === mobileNav) {
      hamburger.classList.remove("active");
      mobileNav.classList.remove("active");
    }
  });
}

// === Scroll Reveal Animation ===
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Animate text blocks on scroll
document.querySelectorAll(".text-block").forEach((block) => {
  block.style.opacity = "0";
  block.style.transform = "translateY(30px)";
  block.style.transition = "opacity 0.8s ease, transform 0.8s ease";
  observer.observe(block);
});

// Animate gallery items on scroll
document.querySelectorAll(".gallery-item").forEach((item, i) => {
  item.style.opacity = "0";
  item.style.transform = "translateY(30px)";
  item.style.transition = `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`;
  observer.observe(item);
});

// Animate material items on scroll
document.querySelectorAll(".material-item").forEach((item, i) => {
  item.style.opacity = "0";
  item.style.transform = "translateY(20px)";
  item.style.transition = `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`;
  observer.observe(item);
});

// Animate credit blocks on scroll
document.querySelectorAll(".credit-block").forEach((block, i) => {
  block.style.opacity = "0";
  block.style.transform = "translateY(20px)";
  block.style.transition = `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`;
  observer.observe(block);
});
