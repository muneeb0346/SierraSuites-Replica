// DOM elements
const loginScreen = document.getElementById('loginScreen');
const signupScreen = document.getElementById('signupScreen');
const appContainer = document.getElementById('appContainer');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const showSignUp = document.getElementById('showSignUp');
const showLogin = document.getElementById('showLogin');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const contactsBody = document.getElementById('contactsBody');
const pipelineStages = document.getElementById('pipelineStages');
const dbToast = new bootstrap.Toast(document.getElementById('dbToast'));
const dbToastMessage = document.getElementById('dbToastMessage');
const generateResponseBtn = document.getElementById('generateResponseBtn');
const emailResponse = document.getElementById('emailResponse');
const emailContext = document.getElementById('emailContext');
const copyEmailBtn = document.getElementById('copyEmailBtn');
const sendEmailBtn = document.getElementById('sendEmailBtn');
const tierVerification = document.getElementById('tierVerification');
const sidebarToggle = document.getElementById('sidebarToggle');

// Show database notification
function showDbNotification(message, isError = false) {
    dbToastMessage.innerHTML = message;
    dbToastMessage.style.color = isError ? '#e74c3c' : '#2c3e50';
    dbToast.show();
}

// Authentication state change handler
function setupAuthListener() {
    window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            // User is signed in
            loginScreen.style.display = 'none';
            signupScreen.style.display = 'none';
            appContainer.style.display = 'block';

            // Set user name
            userName.textContent = session.user.email;

            // Check if user has Pro or Enterprise access
            const { data: company, error } = await window.supabaseClient
                .from('companies')
                .select('subscription_tier')
                .eq('id', session.user.user_metadata.company_id)
                .single();

            if (error) {
                console.error('Error fetching company data:', error);
                showDbNotification('Error verifying subscription: ' + error.message, true);
                return;
            }

            if (company.subscription_tier !== 'pro' && company.subscription_tier !== 'enterprise') {
                // User doesn't have access to CRM features
                tierVerification.style.display = 'flex';
                appContainer.style.display = 'none';
                return;
            }

            // Setup database and load data
            setupDatabase();
        } else if (event === 'SIGNED_OUT') {
            // User is signed out
            loginScreen.style.display = 'flex';
            signupScreen.style.display = 'none';
            appContainer.style.display = 'none';
            tierVerification.style.display = 'none';
        }
    });
}

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        showDbNotification('Login error: ' + error.message, true);
    } else {
        showDbNotification('Login successful! Loading your data...');
    }
});

// Signup form submission
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const companyName = document.getElementById('signupCompany').value;

    if (password !== confirmPassword) {
        showDbNotification('Passwords do not match', true);
        return;
    }

    // First create the company
    const { data: company, error: companyError } = await window.supabaseClient
        .from('companies')
        .insert([{
            name: companyName,
            subscription_tier: 'starter' // Default to starter tier
        }])
        .select()
        .single();

    if (companyError) {
        showDbNotification('Error creating company: ' + companyError.message, true);
        return;
    }

    // Then create the user with company_id
    const { user, error } = await window.supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: name,
                company_id: company.id
            }
        }
    });

    if (error) {
        showDbNotification('Signup error: ' + error.message, true);
    } else {
        showDbNotification('Signup successful! Please check your email for verification.');
        // Switch to login screen
        showLogin.click();
    }
});

// Show signup form
showSignUp.addEventListener('click', (e) => {
    e.preventDefault();
    loginScreen.style.display = 'none';
    signupScreen.style.display = 'flex';
});

// Show login form
showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupScreen.style.display = 'none';
    loginScreen.style.display = 'flex';
});

// Logout button
logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const { error } = await window.supabaseClient.auth.signOut();
    if (error) {
        showDbNotification('Logout error: ' + error.message, true);
    }
});

// Toggle sidebar on mobile
sidebarToggle.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('active');
});

// Check and create tables if they don't exist
async function setupDatabase() {
    showDbNotification('Checking database tables...');

    try {
        // Enable RLS on all tables and set up policies
        await setupRLS();

        // Load initial data
        fetchContacts();
        fetchPipeline();

    } catch (error) {
        console.error('Database setup error:', error);
        showDbNotification('Error setting up database: ' + error.message, true);
    }
}

// Set up RLS policies
async function setupRLS() {
    try {
        // Enable RLS on all tables
        const tables = ['quotes', 'email_templates', 'site_visits', 'contacts', 'leads', 'activities'];

        for (const table of tables) {
            // Check if table exists
            const { error: checkError } = await window.supabaseClient
                .from(table)
                .select('id')
                .limit(1);

            if (checkError && checkError.code === '42P01') {
                showDbNotification(`Table ${table} doesn't exist yet. It will be created when needed.`);
                continue;
            }

            // Enable RLS
            const { error: rlsError } = await window.supabaseClient.rpc('enable_rls', { table_name: table });
            if (rlsError && !rlsError.message.includes('already')) {
                console.error(`Error enabling RLS on ${table}:`, rlsError);
            }
        }

        showDbNotification('Security policies configured successfully');
    } catch (error) {
        console.error('RLS setup error:', error);
        throw error;
    }
}

// Fetch contacts from Supabase
async function fetchContacts() {
    try {
        showDbNotification('Loading contacts...');

        let { data: contacts, error } = await window.supabaseClient
            .from('contacts')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        // Update counters
        document.getElementById('totalContacts').textContent = contacts.length;
        document.getElementById('totalClients').textContent = contacts.filter(c => c.type === 'client').length;
        document.getElementById('totalLeads').textContent = contacts.filter(c => c.type === 'lead').length;
        document.getElementById('totalSuppliers').textContent = contacts.filter(c => c.type === 'supplier').length;

        // Render contacts table
        contactsBody.innerHTML = '';
        contacts.forEach(contact => {
            const row = document.createElement('tr');

            // Determine badge class based on client type
            let badgeClass = 'badge-residential';
            if (contact.client_type === 'commercial') badgeClass = 'badge-commercial';
            if (contact.client_type === 'government') badgeClass = 'badge-government';

            // Get initials for avatar
            const names = contact.name.split(' ');
            const initials = names[0].charAt(0) + (names[1] ? names[1].charAt(0) : '');

            row.innerHTML = `
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <div class="contact-avatar me-2">${initials}</div>
                                            <div>${contact.name}</div>
                                        </div>
                                    </td>
                                    <td><span class="badge ${badgeClass}">${contact.client_type || 'N/A'}</span></td>
                                    <td><span class="badge bg-secondary">${contact.role || 'N/A'}</span></td>
                                    <td>${contact.project_count || 0} Projects</td>
                                    <td>${formatDate(contact.last_contact) || 'N/A'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i></button>
                                        <button class="btn btn-sm btn-outline-secondary"><i class="fas fa-edit"></i></button>
                                    </td>
                                `;

            contactsBody.appendChild(row);
        });

        showDbNotification('Contacts loaded successfully');
    } catch (error) {
        console.error('Error fetching contacts:', error.message);
        contactsBody.innerHTML = `<tr><td colspan="6" class="text-center">Error loading contacts: ${error.message}</td></tr>`;
        showDbNotification('Error loading contacts: ' + error.message, true);
    }
}

// Fetch pipeline data from Supabase
async function fetchPipeline() {
    try {
        showDbNotification('Loading pipeline data...');

        let { data: leads, error } = await window.supabaseClient
            .from('leads')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Define pipeline stages
        const stages = [
            { id: 'lead', title: 'Lead' },
            { id: 'qualified', title: 'Qualified' },
            { id: 'estimate', title: 'Estimate' },
            { id: 'contract', title: 'Contract' },
            { id: 'progress', title: 'Progress' },
            { id: 'complete', title: 'Complete' }
        ];

        // Render pipeline stages
        pipelineStages.innerHTML = '';
        stages.forEach(stage => {
            const stageLeads = leads ? leads.filter(lead => lead.status === stage.id) : [];

            const stageCol = document.createElement('div');
            stageCol.className = 'col-md-2';
            stageCol.innerHTML = `
                                    <div class="pipeline-stage" data-stage="${stage.id}">
                                        <div class="pipeline-header">
                                            <span>${stage.title}</span>
                                            <span class="badge bg-secondary">${stageLeads.length}</span>
                                        </div>
                                        ${stageLeads.length > 0 ? stageLeads.map(lead => `
                                            <div class="lead-card ${stage.id}" data-id="${lead.id}" draggable="true">
                                                <h6>${lead.project_name}</h6>
                                                <p class="mb-1">${lead.contact_name}</p>
                                                <small class="text-muted">${lead.notes || 'No notes'}</small>
                                            </div>
                                        `).join('') : '<p class="text-center text-muted mt-4">No leads</p>'}
                                    </div>
                                `;

            pipelineStages.appendChild(stageCol);
        });

        // Add drag and drop functionality
        setupDragAndDrop();
        showDbNotification('Pipeline data loaded successfully');
    } catch (error) {
        console.error('Error fetching pipeline:', error.message);
        pipelineStages.innerHTML = `<div class="col-12"><div class="alert alert-info">No pipeline data yet. Add some leads to get started.</div></div>`;
    }
}

// Set up drag and drop for pipeline
function setupDragAndDrop() {
    const stages = document.querySelectorAll('.pipeline-stage');
    const leadCards = document.querySelectorAll('.lead-card');

    leadCards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', card.dataset.id);
            setTimeout(() => card.classList.add('opacity-50'), 0);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('opacity-50');
        });
    });

    stages.forEach(stage => {
        stage.addEventListener('dragover', (e) => {
            e.preventDefault();
            stage.classList.add('drag-over');
        });

        stage.addEventListener('dragleave', () => {
            stage.classList.remove('drag-over');
        });

        stage.addEventListener('drop', async (e) => {
            e.preventDefault();
            stage.classList.remove('drag-over');

            const leadId = e.dataTransfer.getData('text/plain');
            const newStatus = stage.dataset.stage;

            try {
                showDbNotification('Updating lead status...');

                // Update lead status in Supabase
                const { error } = await window.supabaseClient
                    .from('leads')
                    .update({ status: newStatus })
                    .eq('id', leadId);

                if (error) throw error;

                // Refresh the pipeline view
                fetchPipeline();
                showDbNotification('Lead status updated successfully');
            } catch (error) {
                console.error('Error updating lead status:', error.message);
                showDbNotification('Error updating lead status: ' + error.message, true);
            }
        });
    });
}

// Generate AI email response
generateResponseBtn.addEventListener('click', () => {
    const context = emailContext.value.trim();
    if (!context) {
        showDbNotification('Please provide some context for the email response', true);
        return;
    }

    // Simple rule-based response generation
    let response = "";

    if (context.toLowerCase().includes('quote') || context.toLowerCase().includes('price')) {
        response = "Thank you for your inquiry about our services. Based on your project requirements, I've prepared a detailed quote for your review. The quote includes all materials and labor costs, with a breakdown of each phase of the project. We would be happy to discuss any aspects of this quote and make adjustments based on your feedback.";
    } else if (context.toLowerCase().includes('schedule') || context.toLowerCase().includes('timeline')) {
        response = "Thank you for asking about our schedule availability. We typically require 2-3 weeks of lead time for new projects, depending on the scope of work. I can check our current schedule and provide you with specific available start dates. Would you prefer a morning or afternoon site visit for our initial consultation?";
    } else if (context.toLowerCase().includes('problem') || context.toLowerCase().includes('issue')) {
        response = "I'm sorry to hear you're experiencing this issue. Our team takes all concerns seriously and we want to resolve this promptly. Could you please provide more details about the problem, including when it started and any specific areas affected? I will immediately dispatch our project manager to assess the situation and develop a solution.";
    } else {
        response = "Thank you for reaching out to Sierra Suites. We appreciate your interest in our construction services. Our team specializes in high-quality residential and commercial projects, and we would be delighted to discuss how we can assist with your needs. Would you be available for a brief call this week to discuss your project in more detail?";
    }

    response += "\n\nBest regards,\n[Your Name]\nSierra Suites Construction";

    emailResponse.innerHTML = response;
});

// Copy email response
copyEmailBtn.addEventListener('click', () => {
    const range = document.createRange();
    range.selectNode(emailResponse);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();

    showDbNotification('Response copied to clipboard!');
});

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';

    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    // Setup authentication listener
    setupAuthListener();

    // Check if user is already logged in
    window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            loginScreen.style.display = 'none';
            signupScreen.style.display = 'none';
            appContainer.style.display = 'block';
            userName.textContent = session.user.email;

            // Check if user has Pro or Enterprise access
            window.supabaseClient
                .from('companies')
                .select('subscription_tier')
                .eq('id', session.user.user_metadata.company_id)
                .single()
                .then(({ data: company, error }) => {
                    if (error) {
                        console.error('Error fetching company data:', error);
                        showDbNotification('Error verifying subscription: ' + error.message, true);
                        return;
                    }

                    if (company.subscription_tier !== 'pro' && company.subscription_tier !== 'enterprise') {
                        // User doesn't have access to CRM features
                        tierVerification.style.display = 'flex';
                        appContainer.style.display = 'none';
                        return;
                    }

                    // Setup database and load data
                    setupDatabase();
                });
        }
    });

    // Set up filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;
            console.log('Filtering by:', filter);
        });
    });

    // Set up pipeline analytics toggle
    document.getElementById('pipelineAnalyticsBtn').addEventListener('click', function () {
        document.getElementById('pipelineAnalytics').classList.toggle('d-none');
    });

    // Throttled scroll-triggered dashboard animations
    // Animation targets: dashboard cards, stats, tables, pipeline stages, lead cards

    const animatedEls = document.querySelectorAll('.dashboard-card, .dashboard-stat, .dashboard-table, .pipeline-stage, .lead-card');

    function animateOnScroll() {
        animatedEls.forEach((el, i) => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight - 60) {
                el.classList.add('animate');
                el.style.animationDelay = `${i * 80}ms`;
            }
        });
    }

    // Use global throttle from main.js
    const throttledScroll = window.throttle ? window.throttle(animateOnScroll, 16) : animateOnScroll;
    window.addEventListener('scroll', throttledScroll);
    animateOnScroll(); // Initial trigger
});