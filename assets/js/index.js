// Animation on scroll with throttling for performance
function animateOnScroll() {
    const elements = document.querySelectorAll('.metric-card, .feature-card, .pricing-card, .benefit-card, .benefits-cta');

    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('animate');
        }
    });
}

// Use throttle function from main.js for performance optimization
const throttledAnimateOnScroll = throttle(animateOnScroll, 16); // ~60fps

window.addEventListener('scroll', throttledAnimateOnScroll);
// Initial call to check elements in view on page load
animateOnScroll();