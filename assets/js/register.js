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