
// Animation on scroll for About Us page sections (CSS-based, consistent with index page)
function animateAboutUsOnScroll() {
    const elements = document.querySelectorAll('.features-highlight, .about-cta, .value-card, .feature-highlight, .stat-item, .mission-image, .experience-image');
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('animate');
        }
    });
}

const throttledAnimateAboutUsOnScroll = throttle(animateAboutUsOnScroll, 16);
window.addEventListener('scroll', throttledAnimateAboutUsOnScroll);
animateAboutUsOnScroll();
