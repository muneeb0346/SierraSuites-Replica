// Throttle function for performance optimization
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// DOM ready utility function
function domReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// Mobile menu toggle functionality
const menuToggle = document.querySelector(".mobile-menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");

if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", function () {
        mobileNav.classList.toggle("active");

        const icon = this.querySelector("i");
        if (icon) {
            icon.classList.toggle("fa-bars", !mobileNav.classList.contains("active"));
            icon.classList.toggle("fa-times", mobileNav.classList.contains("active"));
        }

        document.body.style.overflow = mobileNav.classList.contains("active") ? "hidden" : "auto";
    });

    document.querySelectorAll(".mobile-nav a").forEach(link => {
        link.addEventListener("click", () => {
            mobileNav.classList.remove("active");
            const icon = menuToggle.querySelector("i");
            if (icon) {
                icon.classList.add("fa-bars");
                icon.classList.remove("fa-times");
            }
            document.body.style.overflow = "auto";
        });
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        const targetId = this.getAttribute("href");
        if (targetId && targetId !== "#") {
            e.preventDefault();
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: "smooth",
                });
            }
        }
    });
});

// Active navigation highlighting with throttling for performance
// Cache selectors for better performance
let cachedSections = null;
let cachedNavLinks = null;
let cachedHeader = null;

const handleScroll = throttle(() => {
    // Lazy initialization of cached selectors
    if (!cachedSections) {
        cachedSections = document.querySelectorAll("section[id]");
        cachedNavLinks = document.querySelectorAll(".nav a[href^='#'], .mobile-nav a[href^='#']");
        cachedHeader = document.querySelector(".header");
    }

    let current = "";
    cachedSections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            current = section.id;
        }
    });

    cachedNavLinks.forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
    });

    if (cachedHeader) {
        cachedHeader.classList.toggle("scrolled", window.scrollY > 50);
    }
}, 16); // ~60fps

window.addEventListener("scroll", handleScroll);

// Modal functionality - consolidated and optimized
function closeModal(modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
}

function openModal(modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function setupModal(triggerSelector, modalId, closeId) {
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeId);

    if (!modal) return;

    document.querySelectorAll(triggerSelector).forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            openModal(modal);
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener("click", () => closeModal(modal));
    }

    modal.addEventListener("click", e => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
}

// Initialize all modals from configuration
const modalConfigs = [
    { trigger: ".terms-link", modal: "termsModal", close: "closeTerms" },
    { trigger: ".privacy-link", modal: "privacyModal", close: "closePrivacy" },
    { trigger: ".cookie-link", modal: "cookieModal", close: "closeCookie" },
    { trigger: ".careers-link", modal: "careersModal", close: "closeCareers" },
    { trigger: ".contact-link", modal: "contactModal", close: "closeContact" }
];

modalConfigs.forEach(config => setupModal(config.trigger, config.modal, config.close));

// Close modal with Escape key
document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        document.querySelectorAll(".modal-overlay.active").forEach(modal => closeModal(modal));
    }
});

// Billing toggle functionality for pricing sections
function initBillingToggle() {
    const billingToggle = document.querySelector('.billing-toggle input');
    if (!billingToggle) return; // Exit if no billing toggle found on page

    const pricingCards = document.querySelectorAll('.pricing-card');

    // Store original prices from the DOM
    const prices = [];
    pricingCards.forEach(card => {
        const amountElement = card.querySelector('.price .amount');
        if (amountElement) {
            prices.push(parseInt(amountElement.textContent));
        }
    });

    const annualDiscount = 0.8; // 20% discount

    billingToggle.addEventListener('change', function () {
        pricingCards.forEach((card, index) => {
            const amountElement = card.querySelector('.price .amount');
            const annualElement = card.querySelector('.billed-annually');

            if (!amountElement || !prices[index]) return;

            if (this.checked) {
                // Switch to annual pricing (monthly rate with discount)
                const discountedMonthly = Math.round(prices[index] * annualDiscount);
                const annualTotal = Math.round(prices[index] * 12 * annualDiscount);
                amountElement.textContent = discountedMonthly;
                if (annualElement) {
                    annualElement.textContent = `$${annualTotal} billed annually`;
                }
            } else {
                // Switch back to monthly pricing
                const annualTotal = Math.round(prices[index] * 12 * annualDiscount);
                amountElement.textContent = prices[index];
                if (annualElement) {
                    annualElement.textContent = `$${annualTotal} billed annually`;
                }
            }
        });
    });
}

// Universal animation on scroll for all pages
function initAnimateOnScroll() {
    // Select all elements that should animate on scroll across all pages
    const elements = document.querySelectorAll(
        '.metric-card, .feature-card, .pricing-card, .benefit-card, .benefits-cta, ' +
        '.faq-card, .login-card, .register-card, ' +
        '.features-highlight, .about-cta, .value-card, .feature-highlight, ' +
        '.stat-item, .mission-image, .experience-image'
    );

    elements.forEach(element => {
        // Skip if already animated
        if (element.classList.contains('animate')) return;

        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('animate');
        }
    });
}

// Use throttle for performance optimization
const throttledAnimateOnScroll = throttle(initAnimateOnScroll, 16); // ~60fps

// Initialize all DOM-dependent functionality when ready
domReady(() => {
    initBillingToggle();
    initAnimateOnScroll();
});

// Add scroll listener for animations
window.addEventListener('scroll', throttledAnimateOnScroll);

// Generic modal handlers with event delegation
document.addEventListener("click", (e) => {
    // Open modal with [data-modal] attribute
    const trigger = e.target.closest("[data-modal]");
    if (trigger) {
        e.preventDefault();
        const modalId = trigger.getAttribute("data-modal");
        const modal = modalId ? document.getElementById(modalId) : null;
        if (modal) {
            openModal(modal);
        }
        return;
    }

    // Close modal with .modal-close button
    const closeBtn = e.target.closest(".modal-close");
    if (closeBtn) {
        const modal = closeBtn.closest(".modal");
        if (modal) {
            closeModal(modal);
        }
        return;
    }

    // Close modal when clicking on overlay
    if (e.target.classList && e.target.classList.contains("modal-overlay")) {
        closeModal(e.target);
    }
});
