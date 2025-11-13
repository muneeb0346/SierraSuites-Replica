// Animation on scroll with throttling for performance
function animateOnScroll() {
    const elements = document.querySelectorAll('.pricing-card, .faq-card');
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('animate');
        }
    });
}

// Use global throttle from main.js
const throttledAnimateOnScroll = throttle(animateOnScroll, 16); // ~60fps
window.addEventListener('scroll', throttledAnimateOnScroll);
window.addEventListener('DOMContentLoaded', animateOnScroll);

// Billing toggle functionality is now in main.js