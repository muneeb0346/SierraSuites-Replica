// Animation on scroll
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

window.addEventListener('scroll', animateOnScroll);
// Initial call to check elements in view on page load
animateOnScroll();