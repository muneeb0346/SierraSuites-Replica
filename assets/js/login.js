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
        // Check if Supabase is initialized
        if (!window.supabaseClient) {
            throw new Error('Supabase client not initialized. Please ensure init_supabase.js is loaded.');
        }

        // Sign in with Supabase
        const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
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
        const { data: companyData, error: companyError } = await window.supabaseClient
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