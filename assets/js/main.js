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

// Active navigation highlighting
window.addEventListener("scroll", () => {
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
});

// Modal functionality
function setupModal(triggerSelector, modalId, closeId) {
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeId);

    if (!modal) return;

    document.querySelectorAll(triggerSelector).forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            modal.classList.add("active");
            document.body.style.overflow = "hidden";
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            modal.classList.remove("active");
            document.body.style.overflow = "auto";
        });
    }

    modal.addEventListener("click", e => {
        if (e.target === modal) {
            modal.classList.remove("active");
            document.body.style.overflow = "auto";
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
        document.querySelectorAll(".modal.active").forEach(modal => modal.classList.remove("active"));
        document.body.style.overflow = "auto";
    }
});
