gsap.registerPlugin(ScrollTrigger);

window.addEventListener("DOMContentLoaded", () => {
  gsap.fromTo(
    "#navbar",
    { opacity: 0, y: -50 },
    {
      opacity: 1,
      y: 0,
      duration: 0.25,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#hero",
        start: "bottom top",
        toggleActions: "play none none reverse",
      },
    },
  );

  const quotes = document.querySelectorAll(".quote-section");

  quotes.forEach((quote, index) => {
    gsap.fromTo(
      quote,
      {
        opacity: 0,
        y: 50,
        filter: "blur(10px) saturate(0)",
      },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px) saturate(100%)",
        duration: 2.5,
        stagger: 0.05,
        scrollTrigger: {
          trigger: quote,
          start: "top center",
          end: "+=150%",
          pin: true,
          scrub: true,
        },
      },
    );
  });
});
