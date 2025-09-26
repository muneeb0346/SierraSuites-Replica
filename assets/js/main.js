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
const handleScroll = throttle(() => {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav a[href^='#'], .mobile-nav a[href^='#']");
    const header = document.querySelector(".header");

    let current = "";
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            current = section.id;
        }
    });

    navLinks.forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
    });

    if (header) {
        header.classList.toggle("scrolled", window.scrollY > 50);
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

setupModal(".terms-link", "termsModal", "closeTerms");
setupModal(".privacy-link", "privacyModal", "closePrivacy");
setupModal(".cookie-link", "cookieModal", "closeCookie");
setupModal(".careers-link", "careersModal", "closeCareers");
setupModal(".contact-link", "contactModal", "closeContact");

// Close modal with Escape key
document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        document.querySelectorAll(".modal-overlay.active").forEach(modal => closeModal(modal));
    }
});

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


