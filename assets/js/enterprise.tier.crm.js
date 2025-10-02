// Chart initialization
document.addEventListener('DOMContentLoaded', function () {
    const ctx = document.getElementById('costChart').getContext('2d');
    const costChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Lumber', 'Concrete', 'Electrical', 'Plumbing', 'Roofing'],
            datasets: [{
                label: 'Cost Variance from Estimate',
                data: [5, -3, 8, -2, 4],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 99, 132, 0.7)'
                ],
                borderColor: [
                    'rgb(54, 162, 235)',
                    'rgb(75, 192, 192)',
                    'rgb(255, 159, 64)',
                    'rgb(153, 102, 255)',
                    'rgb(255, 99, 132)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Material Cost Variance by Category (%)',
                    color: '#1f2a37',
                    font: {
                        size: 16,
                        weight: 'normal'
                    }
                },
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Variance %'
                    }
                }
            }
        }
    });

    // Add form submission handler
    document.getElementById('newProjectForm').addEventListener('submit', handleNewProject);
});

// Modal functions
function showNewProjectModal() {
    document.getElementById('newProjectModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function (event) {
    if (event.target.className === 'modal') {
        event.target.style.display = 'none';
    }
}

// Handle new project form submission
async function handleNewProject(event) {
    event.preventDefault();

    // Check if Supabase is initialized
    if (!window.supabaseClient) {
        alert('Supabase client not initialized. Please ensure init_supabase.js is loaded.');
        return;
    }

    const projectData = {
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDescription').value,
        site_address: document.getElementById('projectAddress').value,
        status: document.getElementById('projectStatus').value,
        budget: document.getElementById('projectBudget').value || null,
        start_date: document.getElementById('startDate').value || null,
        estimated_end_date: document.getElementById('endDate').value || null
    };

    try {
        const { data, error } = await window.supabaseClient
            .from('projects')
            .insert([projectData])
            .select();

        if (error) {
            throw error;
        }

        alert('Project created successfully!');
        closeModal('newProjectModal');
        document.getElementById('newProjectForm').reset();

        // Refresh the page to show the new project
        location.reload();

    } catch (error) {
        console.error('Error creating project:', error);
        alert('Error creating project: ' + error.message);
    }
}

// Database initialization function
async function initializeDatabase() {
    const dbStatus = document.getElementById('db-status');

    // Check if Supabase is initialized
    if (!window.supabaseClient) {
        dbStatus.style.display = 'flex';
        dbStatus.className = 'db-status status-error';
        dbStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Supabase client not initialized. Please ensure init_supabase.js is loaded.</span>';
        return;
    }

    try {
        dbStatus.style.display = 'flex';
        dbStatus.className = 'db-status status-success';
        dbStatus.innerHTML = '<i class="fas fa-sync fa-spin"></i><span>Initializing database...</span>';

        // SQL statements to create tables
        const sqlStatements = [
            `CREATE TABLE IF NOT EXISTS clients (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        company_name TEXT NOT NULL,
                        contact_name TEXT,
                        email TEXT,
                        phone TEXT,
                        address TEXT,
                        notes TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )`,

            `CREATE TABLE IF NOT EXISTS projects (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        name TEXT NOT NULL,
                        description TEXT,
                        site_address TEXT,
                        latitude DECIMAL(10, 8),
                        longitude DECIMAL(11, 8),
                        status TEXT CHECK (status IN ('Design', 'Permitting', 'Framing', 'Finishing', 'Completed')),
                        client_id UUID REFERENCES clients(id),
                        start_date DATE,
                        estimated_end_date DATE,
                        actual_end_date DATE,
                        budget DECIMAL(12, 2),
                        actual_cost DECIMAL(12, 2),
                        assigned_team JSONB,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )`,

            `CREATE TABLE IF NOT EXISTS proposal_templates (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        name TEXT NOT NULL,
                        description TEXT,
                        content JSONB NOT NULL,
                        project_type TEXT,
                        variables_schema JSONB,
                        pricing_model JSONB,
                        version INTEGER DEFAULT 1,
                        is_active BOOLEAN DEFAULT TRUE,
                        effectiveness_score DECIMAL(3, 2),
                        used_count INTEGER DEFAULT 0,
                        accepted_count INTEGER DEFAULT 0,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )`,

            `CREATE TABLE IF NOT EXISTS proposals (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        project_id UUID REFERENCES projects(id),
                        template_id UUID REFERENCES proposal_templates(id),
                        content JSONB NOT NULL,
                        pricing_data JSONB,
                        variables JSONB,
                        status TEXT CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Rejected')),
                        version INTEGER DEFAULT 1,
                        sent_date TIMESTAMP WITH TIME ZONE,
                        response_date TIMESTAMP WITH TIME ZONE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        created_by UUID
                    )`,

            `CREATE TABLE IF NOT EXISTS subcontractors (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        company_name TEXT NOT NULL,
                        contact_name TEXT,
                        email TEXT,
                        phone TEXT,
                        trades TEXT[],
                        service_regions TEXT[],
                        license_number TEXT,
                        license_expiry DATE,
                        insurance_provider TEXT,
                        insurance_policy_number TEXT,
                        insurance_expiry DATE,
                        rating DECIMAL(2, 1),
                        is_preferred BOOLEAN DEFAULT FALSE,
                        performance_metrics JSONB,
                        notes TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )`,

            `CREATE TABLE IF NOT EXISTS project_subcontractors (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        project_id UUID REFERENCES projects(id),
                        subcontractor_id UUID REFERENCES subcontractors(id),
                        role TEXT,
                        agreed_price DECIMAL(12, 2),
                        start_date DATE,
                        end_date DATE,
                        status TEXT CHECK (status IN ('Pending', 'Active', 'Completed', 'Terminated')),
                        performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
                        notes TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        UNIQUE(project_id, subcontractor_id)
                    )`,

            `CREATE TABLE IF NOT EXISTS documents (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        project_id UUID REFERENCES projects(id),
                        name TEXT NOT NULL,
                        type TEXT CHECK (type IN ('Permit', 'Drawing', 'Change Order', 'Contract', 'Photo', 'Other')),
                        file_path TEXT,
                        version INTEGER DEFAULT 1,
                        expiry_date DATE,
                        status TEXT CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected', 'Expired')),
                        shared_with JSONB,
                        metadata JSONB,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        created_by UUID
                    )`,

            `CREATE TABLE IF NOT EXISTS suppliers (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        name TEXT NOT NULL,
                        contact_name TEXT,
                        email TEXT,
                        phone TEXT,
                        materials_supplied TEXT[],
                        standard_pricing JSONB,
                        negotiated_rates JSONB,
                        rating DECIMAL(2, 1),
                        performance_metrics JSONB,
                        notes TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )`,

            `CREATE TABLE IF NOT EXISTS project_materials (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        project_id UUID REFERENCES projects(id),
                        supplier_id UUID REFERENCES suppliers(id),
                        material_type TEXT NOT NULL,
                        quantity DECIMAL(10, 2),
                        unit_price DECIMAL(10, 2),
                        total_price DECIMAL(12, 2),
                        delivery_date DATE,
                        status TEXT CHECK (status IN ('Ordered', 'Delivered', 'Installed')),
                        notes TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )`,

            `CREATE TABLE IF NOT EXISTS ai_training_data (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        proposal_id UUID REFERENCES proposals(id),
                        template_id UUID REFERENCES proposal_templates(id),
                        success_metrics JSONB,
                        feedback TEXT,
                        variables_used JSONB,
                        outcome TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )`,

            `CREATE TABLE IF NOT EXISTS company_users (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        company_id UUID REFERENCES clients(id),
                        user_id UUID,
                        role TEXT CHECK (role IN ('admin', 'manager', 'user')),
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        UNIQUE(company_id, user_id)
                    )`
        ];

        // Execute each SQL statement
        for (const sql of sqlStatements) {
            const { error } = await window.supabaseClient.rpc('exec_sql', { query: sql });
            if (error) {
                console.warn('SQL execution warning:', error.message);
                // Continue with next statement
            }
        }

        dbStatus.innerHTML = '<i class="fas fa-check-circle"></i><span>Database initialized successfully! You can now use all CRM features.</span>';

    } catch (error) {
        console.error('Error initializing database:', error);
        dbStatus.className = 'db-status status-error';
        dbStatus.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>Error: ${error.message}. Please run the SQL manually in Supabase SQL editor.</span>`;
    }
}

// Throttled scroll-triggered dashboard animations
// Animation targets: dashboard cards, stats, tables

document.addEventListener('DOMContentLoaded', function () {
    const animatedEls = document.querySelectorAll('.dashboard-card, .dashboard-stat, .dashboard-table');

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