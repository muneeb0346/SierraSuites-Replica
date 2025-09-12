// Initialize Stripe with your publishable key
// Replace 'pk_test_your_publishable_key_here' with your actual Stripe publishable key
const stripe = Stripe('pk_test_your_publishable_key_here');
const elements = stripe.elements();

// Create card element
const cardElement = elements.create('card', {
    style: {
        base: {
            color: '#f8fafc',
            fontFamily: '"Inter", sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
                color: '#94a3b8'
            }
        },
        invalid: {
            color: '#ef4444',
            iconColor: '#ef4444'
        }
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
const careersModal = document.getElementById('careersModal');

const termsLinks = document.querySelectorAll('.terms-link');
const privacyLinks = document.querySelectorAll('.privacy-link');
const careersLinks = document.querySelectorAll('.careers-link');

const closeTerms = document.getElementById('closeTerms');
const closePrivacy = document.getElementById('closePrivacy');
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

// Close Careers modal
closeCareers.addEventListener('click', function () {
    careersModal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

// Close modal when clicking outside
[termsModal, privacyModal, careersModal].forEach(modal => {
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
        careersModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Plan selection in registration form
let selectedPlan = null;
document.querySelectorAll('.plan-option-form').forEach(option => {
    option.addEventListener('click', function () {
        document.querySelectorAll('.plan-option-form').forEach(opt => {
            opt.classList.remove('selected');
        });
        this.classList.add('selected');
        selectedPlan = {
            name: this.querySelector('.plan-name-form').textContent,
            price: this.dataset.price,
            id: this.dataset.plan
        };
    });
});

// Form validation
document.getElementById('registerForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    if (!selectedPlan) {
        alert('Please select a subscription plan');
        return;
    }

    // Show payment modal
    document.getElementById('selectedPlanName').textContent = selectedPlan.name + ' Plan';
    document.getElementById('selectedPlanPrice').textContent = '$' + selectedPlan.price + '/month';

    // Mount card element if not already mounted
    try {
        cardElement.mount('#card-element');
    } catch (e) {
        // Already mounted, continue
    }

    // Show payment modal
    document.getElementById('paymentModal').classList.add('active');
    document.body.style.overflow = 'hidden';
});

// Cancel payment
document.getElementById('cancel-payment').addEventListener('click', function () {
    document.getElementById('paymentModal').classList.remove('active');
    document.body.style.overflow = 'auto';
});

// Handle payment form submission
const paymentForm = document.getElementById('payment-form');
paymentForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Show loading state
    document.getElementById('paymentLoading').classList.add('active');
    document.getElementById('submit-payment').disabled = true;

    try {
        // Create payment method
        const { paymentMethod, error } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
        });

        if (error) {
            // Show error to customer
            const errorElement = document.getElementById('card-errors');
            errorElement.textContent = error.message;
            document.getElementById('paymentLoading').classList.remove('active');
            document.getElementById('submit-payment').disabled = false;
        } else {
            // In a real application, you would send the paymentMethod.id to your server
            // For demonstration, we'll simulate a successful payment after 2 seconds
            setTimeout(() => {
                document.getElementById('paymentLoading').classList.remove('active');
                document.getElementById('payment-form').style.display = 'none';
                document.getElementById('paymentSuccess').classList.add('active');

                // Redirect after a delay
                setTimeout(() => {
                    alert('Registration and payment successful! In a real application, you would be redirected to the dashboard.');
                    window.location.href = 'index.html'; // Redirect to home page
                }, 3000);
            }, 2000);
        }
    } catch (err) {
        console.error('Error:', err);
        alert('An error occurred. Please try again.');
        document.getElementById('paymentLoading').classList.remove('active');
        document.getElementById('submit-payment').disabled = false;
    }
});

// Close payment modal when clicking outside
document.getElementById('paymentModal').addEventListener('click', function (e) {
    if (e.target === this) {
        this.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Close payment modal with Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.getElementById('paymentModal').classList.contains('active')) {
        document.getElementById('paymentModal').classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});