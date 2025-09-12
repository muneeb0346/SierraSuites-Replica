// Initialize Supabase
const supabaseUrl = 'https://qjswuwcqyzeuqqqltykz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqc3d1d2NxeXpldXFxcWx0eWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjk0MDUsImV4cCI6MjA3MDgwNTQwNX0.qgH8DMJEoJVuYOXSyr0RAj01Yt7bBR8EYL6qw3YXyAs';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const loginSpinner = document.getElementById('loginSpinner');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

// Show notification function
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

// Toggle password visibility
togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    // Toggle eye icon
    const eyeIcon = this.querySelector('i');
    eyeIcon.classList.toggle('fa-eye');
    eyeIcon.classList.toggle('fa-eye-slash');
});

// Form validation and submission
loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;

    // Basic validation
    if (!email || !password) {
        showNotification('Please fill in all fields!', 'error');
        return;
    }

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showNotification('Please enter a valid email address!', 'error');
        return;
    }

    // Show loading state
    loginSpinner.style.display = 'inline-block';
    loginButton.disabled = true;

    try {
        // Sign in with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) {
            throw authError;
        }

        if (!authData.user) {
            throw new Error('No user data returned');
        }

        // Get user's company data to check if they're an admin
        const { data: companyData, error: companyError } = await supabase
            .from('user_companies')
            .select('company_id, companies(subscription_tier)')
            .eq('user_id', authData.user.id)
            .single();

        if (companyError) {
            console.error('Error fetching company data:', companyError);
            showNotification('Error verifying your account. Please try again.', 'error');
            return;
        }

        // Check if user is an admin (subscription_tier = 'admin')
        if (companyData && companyData.companies.subscription_tier === 'admin') {
            // Redirect to admin dashboard
            showNotification('Login successful! Redirecting to admin dashboard...', 'success');
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1500);
        } else {
            // Redirect to regular user dashboard
            showNotification('Login successful! Redirecting to your dashboard...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }

    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'Login failed. Please check your credentials and try again.', 'error');
    } finally {
        // Hide loading state
        loginSpinner.style.display = 'none';
        loginButton.disabled = false;
    }
});

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

// Modal functionality
const termsModal = document.getElementById('termsModal');
const privacyModal = document.getElementById('privacyModal');
const cookieModal = document.getElementById('cookieModal');
const careersModal = document.getElementById('careersModal');
const contactModal = document.getElementById('contactModal');

const termsLinks = document.querySelectorAll('.terms-link');
const privacyLinks = document.querySelectorAll('.privacy-link');
const cookieLinks = document.querySelectorAll('.cookie-link');
const careersLinks = document.querySelectorAll('.careers-link');
const contactLinks = document.querySelectorAll('.contact-link');

const closeTerms = document.getElementById('closeTerms');
const closePrivacy = document.getElementById('closePrivacy');
const closeCookie = document.getElementById('closeCookie');
const closeCareers = document.getElementById('closeCareers');
const closeContact = document.getElementById('closeContact');

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

// Open Contact modal
contactLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        contactModal.classList.add('active');
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

// Close Contact modal
closeContact.addEventListener('click', function () {
    contactModal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

// Close modal when clicking outside
[termsModal, privacyModal, cookieModal, careersModal, contactModal].forEach(modal => {
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
        contactModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});