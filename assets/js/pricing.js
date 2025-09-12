// Mobile menu toggle functionality
document.querySelector('.mobile-menu-toggle').addEventListener('click', function () {
    const mobileNav = document.querySelector('.mobile-nav');
    mobileNav.classList.toggle('active');

    // Toggle hamburger icon
    const icon = this.querySelector('i');
    if (mobileNav.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
        document.body.style.overflow = 'hidden';
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
        document.body.style.overflow = 'auto';
    }
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.mobile-nav a').forEach(link => {
    link.addEventListener('click', function () {
        const mobileNav = document.querySelector('.mobile-nav');
        const toggleBtn = document.querySelector('.mobile-menu-toggle i');

        mobileNav.classList.remove('active');
        toggleBtn.classList.remove('fa-times');
        toggleBtn.classList.add('fa-bars');
        document.body.style.overflow = 'auto';
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Active navigation highlighting
window.addEventListener('scroll', function () {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav a[href^="#"], .mobile-nav a[href^="#"]');

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });

    // Header scroll effect
    const header = document.querySelector('.header');
    if (window.pageYOffset > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Animation on scroll
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

window.addEventListener('scroll', animateOnScroll);
// Initial call to check elements in view on page load
animateOnScroll();

// Modal functionality
const termsModal = document.getElementById('termsModal');
const privacyModal = document.getElementById('privacyModal');
const cookieModal = document.getElementById('cookieModal');
const careersModal = document.getElementById('careersModal');

const termsLinks = document.querySelectorAll('.terms-link');
const privacyLinks = document.querySelectorAll('.privacy-link');
const cookieLinks = document.querySelectorAll('.cookie-link');
const careersLinks = document.querySelectorAll('.careers-link');

const closeTerms = document.getElementById('closeTerms');
const closePrivacy = document.getElementById('closePrivacy');
const closeCookie = document.getElementById('closeCookie');
const closeCareers = document.getElementById('closeCareers');

// Open Terms modal
termsLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        termsModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
});

// Open Privacy modal
privacyLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        privacyModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
});

// Open Cookie modal
cookieLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        cookieModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
});

// Open Careers modal
careersLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        careersModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
});

// Close Terms modal
closeTerms.addEventListener('click', function () {
    termsModal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

// Close Privacy modal
closePrivacy.addEventListener('click', function () {
    privacyModal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

// Close Cookie modal
closeCookie.addEventListener('click', function () {
    cookieModal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

// Close Careers modal
closeCareers.addEventListener('click', function () {
    careersModal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

// Close modal when clicking outside
[termsModal, privacyModal, cookieModal, careersModal].forEach(modal => {
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
});

// Close modal with Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        termsModal.classList.remove('active');
        privacyModal.classList.remove('active');
        cookieModal.classList.remove('active');
        careersModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Billing toggle functionality
const billingToggle = document.querySelector('.billing-toggle input');
const monthlyPrices = document.querySelectorAll('.price .amount');
const annualPrices = document.querySelectorAll('.billed-annually');
const originalPrices = [44, 80, 228];
const annualDiscount = 0.8; // 20% discount

billingToggle.addEventListener('change', function () {
    if (this.checked) {
        // Switch to annual pricing
        monthlyPrices.forEach((element, index) => {
            const annualPrice = Math.round(originalPrices[index] * 12 * annualDiscount);
            element.textContent = Math.round(originalPrices[index] * annualDiscount);
            annualPrices[index].textContent = `$${annualPrice} billed annually`;
        });
    } else {
        // Switch to monthly pricing
        monthlyPrices.forEach((element, index) => {
            element.textContent = originalPrices[index];
            const annualPrice = Math.round(originalPrices[index] * 12 * annualDiscount);
            annualPrices[index].textContent = `$${annualPrice} billed annually`;
        });
    }
});