// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const projectsMenuToggle = document.getElementById('menuToggle');
const userName = document.getElementById('userName');
const userCompany = document.getElementById('userCompany');
const userAvatar = document.getElementById('userAvatar');
const totalProjects = document.getElementById('totalProjects');
const activeProjects = document.getElementById('activeProjects');
const completedProjects = document.getElementById('completedProjects');
const onHoldProjects = document.getElementById('onHoldProjects');
const projectsGrid = document.getElementById('projectsGrid');
const projectsList = document.getElementById('projectsList');
const createProjectBtn = document.getElementById('createProjectBtn');
const searchInput = document.getElementById('searchInput');
const notificationBtn = document.getElementById('notificationBtn');
const profileMenu = document.getElementById('profileMenu');
const profileDropdown = document.getElementById('profileDropdown');
const logoutBtn = document.getElementById('logoutBtn');
const statusFilter = document.getElementById('statusFilter');
const typeFilter = document.getElementById('typeFilter');
const sortBy = document.getElementById('sortBy');
const viewButtons = document.querySelectorAll('.view-btn');
const projectModal = document.getElementById('projectModal');
const modalTitle = document.getElementById('modalTitle');
const projectForm = document.getElementById('projectForm');
const projectId = document.getElementById('projectId');
const closeProjectModal = document.getElementById('closeModal');
const cancelProject = document.getElementById('cancelProject');
const saveProject = document.getElementById('saveProject');
const toastContainer = document.getElementById('toastContainer');

// State
let userData = null;
let companyData = null;
let projects = [];
let currentView = 'grid';
let filteredProjects = [];

// Check authentication and load data
async function initProjectsPage() {
    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();

    if (sessionError || !session) {
        window.location.href = 'login.html';
        return;
    }

    // Get user data
    const { data: user, error: userError } = await window.supabaseClient.auth.getUser();
    if (userError) {
        console.error('Error getting user:', userError);
        showToast('error', 'Authentication Error', 'Unable to verify your session. Please try again.');
        return;
    }

    userData = user.user;

    // Get user profile
    const { data: profile, error: profileError } = await window.supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('id', userData.id)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
    }

    // Get company data
    const { data: company, error: companyError } = await window.supabaseClient
        .from('companies')
        .select('*')
        .eq('id', userData.user_metadata.company_id)
        .single();

    if (companyError) {
        console.error('Error fetching company:', companyError);
    } else {
        companyData = company;
    }

    // Update UI with user data
    updateUserUI(profile, company);

    // Load projects data
    loadProjectsData();

    // Set up event listeners
    setupEventListeners();
}

// Update UI with user data
function updateUserUI(profile, company) {
    const firstName = profile?.first_name || userData.user_metadata.first_name || 'User';
    const lastName = profile?.last_name || userData.user_metadata.last_name || 'Name';
    const companyName = company?.name || userData.user_metadata.company_name || 'Company';

    userName.textContent = `${firstName} ${lastName}`;
    userCompany.textContent = companyName;
    userAvatar.src = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=2563eb&color=fff`;
}

// Load projects data
async function loadProjectsData() {
    projectsGrid.innerHTML = `
                <div class="skeleton-text" style="width: 70%"></div>
                <div class="skeleton-text" style="width: 50%"></div>
                <div class="skeleton-text" style="width: 30%"></div>
            `;

    // Load projects
    const { data: projectsData, error: projectsError } = await window.supabaseClient
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (projectsError) {
        console.error('Error loading projects:', projectsError);
        showToast('error', 'Load Error', 'Unable to load projects. Please try again.');
        projectsGrid.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h4>Unable to load projects</h4>
                        <p>There was an error loading your projects. Please try again.</p>
                        <button class="btn btn-primary" id="retryLoadBtn">Retry</button>
                    </div>
                `;
        document.getElementById('retryLoadBtn').addEventListener('click', loadProjectsData);
        return;
    }

    projects = projectsData || [];
    filteredProjects = [...projects];

    // Update stats
    updateProjectStats(projects);

    // Render projects
    renderProjects(filteredProjects);
}

// Update project statistics
function updateProjectStats(projects) {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'active').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const onHold = projects.filter(p => p.status === 'on_hold').length;

    totalProjects.textContent = total;
    activeProjects.textContent = active;
    completedProjects.textContent = completed;
    onHoldProjects.textContent = onHold;
}

// Filter and sort projects
function filterAndSortProjects() {
    const statusValue = statusFilter.value;
    const typeValue = typeFilter.value;
    const sortValue = sortBy.value;

    // Filter projects
    filteredProjects = projects.filter(project => {
        let statusMatch = true;
        let typeMatch = true;

        if (statusValue) {
            statusMatch = project.status === statusValue;
        }

        if (typeValue) {
            typeMatch = project.type === typeValue;
        }

        return statusMatch && typeMatch;
    });

    // Sort projects
    switch (sortValue) {
        case 'newest':
            filteredProjects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'oldest':
            filteredProjects.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'name':
            filteredProjects.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'progress':
            filteredProjects.sort((a, b) => (b.progress || 0) - (a.progress || 0));
            break;
    }

    // Update stats with filtered projects
    updateProjectStats(filteredProjects);

    // Render projects
    renderProjects(filteredProjects);
}

// Render projects based on current view
function renderProjects(projects) {
    if (currentView === 'grid') {
        renderProjectsGrid(projects);
    } else {
        renderProjectsList(projects);
    }
}

// Render projects in grid view
function renderProjectsGrid(projects) {
    projectsGrid.innerHTML = '';
    projectsList.style.display = 'none';
    projectsGrid.style.display = 'grid';

    if (projects.length === 0) {
        projectsGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <h4>No projects found</h4>
                        <p>Try adjusting your filters or create a new project</p>
                        <button class="btn btn-primary" id="createFirstProjectBtn">Create Project</button>
                    </div>
                `;
        document.getElementById('createFirstProjectBtn').addEventListener('click', showCreateModal);
        return;
    }

    projects.forEach(project => {
        const statusClass = getStatusClass(project.status);
        const statusText = getStatusText(project.status);

        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.innerHTML = `
                    <div class="project-card-header">
                        <div>
                            <h3>${project.name}</h3>
                            <p>${project.type || 'No type specified'}</p>
                            ${project.location ? `
                                <div class="project-location">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${project.location}</span>
                                </div>
                            ` : ''}
                            ${project.start_date ? `
                                <div class="project-timeline">
                                    <i class="fas fa-calendar-alt"></i>
                                    <span>${formatDate(project.start_date)}${project.end_date ? ` - ${formatDate(project.end_date)}` : ''}</span>
                                </div>
                            ` : ''}
                        </div>
                        <span class="project-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="project-card-body">
                        <div class="project-meta">
                            <div class="project-meta-item">
                                <div class="value">$${project.budget ? formatBudget(project.budget) : '0'}</div>
                                <div class="label">Budget</div>
                            </div>
                            <div class="project-meta-item">
                                <div class="value">${getDaysRemaining(project.end_date)}</div>
                                <div class="label">Days Left</div>
                            </div>
                            <div class="project-meta-item">
                                <div class="value">${project.team_count || 0}</div>
                                <div class="label">Team</div>
                            </div>
                        </div>
                        <div class="project-progress">
                            <div class="progress-header">
                                <span>Progress</span>
                                <span>${project.progress || 0}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${project.progress || 0}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="project-card-footer">
                        <div class="project-team">
                            <div class="team-member">${getInitials(userName.textContent)}</div>
                        </div>
                        <div class="project-actions">
                            <button class="btn btn-icon edit-project" data-id="${project.id}" title="Edit project">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-icon view-project" data-id="${project.id}" title="View project details">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                `;

        projectsGrid.appendChild(projectCard);
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.edit-project').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.currentTarget.getAttribute('data-id');
            editProject(projectId);
        });
    });

    document.querySelectorAll('.view-project').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.currentTarget.getAttribute('data-id');
            viewProject(projectId);
        });
    });
}

// Render projects in list view
function renderProjectsList(projects) {
    projectsGrid.style.display = 'none';
    projectsList.style.display = 'flex';
    projectsList.innerHTML = '';

    if (projects.length === 0) {
        projectsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <h4>No projects found</h4>
                        <p>Try adjusting your filters or create a new project</p>
                        <button class="btn btn-primary" id="createFirstProjectBtn">Create Project</button>
                    </div>
                `;
        document.getElementById('createFirstProjectBtn').addEventListener('click', showCreateModal);
        return;
    }

    projects.forEach(project => {
        const statusClass = getStatusClass(project.status);
        const statusText = getStatusText(project.status);

        const projectRow = document.createElement('div');
        projectRow.className = 'project-row';
        projectRow.innerHTML = `
                    <div class="project-info">
                        <div>
                            <h3>${project.name}</h3>
                            <p>${project.type || 'No type specified'}</p>
                        </div>
                        <div>
                            <span class="project-status ${statusClass}">${statusText}</span>
                        </div>
                        <div>
                            <div class="value">$${project.budget ? formatBudget(project.budget) : '0'}</div>
                            <div class="label">Budget</div>
                        </div>
                        <div>
                            <div class="value">${project.progress || 0}%</div>
                            <div class="label">Progress</div>
                        </div>
                        <div>
                            <div class="value">${getDaysRemaining(project.end_date)}</div>
                            <div class="label">Days Left</div>
                        </div>
                    </div>
                    <div class="project-actions">
                        <button class="btn btn-icon edit-project" data-id="${project.id}" title="Edit project">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon view-project" data-id="${project.id}" title="View project details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                `;

        projectsList.appendChild(projectRow);
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.edit-project').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.currentTarget.getAttribute('data-id');
            editProject(projectId);
        });
    });

    document.querySelectorAll('.view-project').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.currentTarget.getAttribute('data-id');
            viewProject(projectId);
        });
    });
}

// Show create project modal
function showCreateModal() {
    modalTitle.textContent = 'Create New Project';
    projectForm.reset();
    projectId.value = '';

    // Set default values
    document.getElementById('projectStatus').value = 'planning';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('projectStartDate').value = today;

    projectModal.classList.add('active');
}

// Edit project
async function editProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    modalTitle.textContent = 'Edit Project';
    projectForm.reset();

    // Fill form with project data
    projectId.value = project.id;
    document.getElementById('projectName').value = project.name || '';
    document.getElementById('projectType').value = project.type || '';
    document.getElementById('projectLocation').value = project.location || '';
    document.getElementById('projectStatus').value = project.status || 'planning';
    document.getElementById('projectBudget').value = project.budget || '';
    document.getElementById('projectStartDate').value = project.start_date || '';
    document.getElementById('projectEndDate').value = project.end_date || '';
    document.getElementById('projectDescription').value = project.description || '';

    projectModal.classList.add('active');
}

// View project details
function viewProject(id) {
    // In a real application, this would navigate to a project detail page
    // For now, we'll just show an alert
    const project = projects.find(p => p.id === id);
    if (project) {
        showToast('info', 'Project View', `Viewing details for ${project.name}`);
    }
}

// Save project
async function saveProjectHandler() {
    const formData = new FormData(projectForm);
    const projectData = {
        name: formData.get('projectName'),
        type: formData.get('projectType'),
        location: formData.get('projectLocation'),
        status: formData.get('projectStatus'),
        budget: formData.get('projectBudget') ? parseFloat(formData.get('projectBudget')) : null,
        start_date: formData.get('projectStartDate'),
        end_date: formData.get('projectEndDate') || null,
        description: formData.get('projectDescription'),
        updated_at: new Date().toISOString()
    };

    // Validate required fields
    if (!projectData.name || !projectData.type || !projectData.location || !projectData.start_date) {
        showToast('error', 'Validation Error', 'Please fill in all required fields');
        return;
    }

    const id = projectId.value;
    let error = null;

    if (id) {
        // Update existing project
        const { error: updateError } = await window.supabaseClient
            .from('projects')
            .update(projectData)
            .eq('id', id);

        error = updateError;
    } else {
        // Create new project
        projectData.created_at = new Date().toISOString();
        projectData.company_id = userData.user_metadata.company_id;
        projectData.created_by = userData.id;

        const { error: insertError } = await window.supabaseClient
            .from('projects')
            .insert([projectData]);

        error = insertError;
    }

    if (error) {
        console.error('Error saving project:', error);
        showToast('error', 'Save Error', 'Unable to save project. Please try again.');
        return;
    }

    // Close modal and reload projects
    projectModal.classList.remove('active');
    showToast('success', 'Project Saved', `Project ${id ? 'updated' : 'created'} successfully`);
    loadProjectsData();
}

// Show toast notification
function showToast(type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
                <div class="toast-icon">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                </div>
                <div class="toast-content">
                    <div class="toast-title">${title}</div>
                    <div class="toast-message">${message}</div>
                </div>
                <button class="toast-close">
                    <i class="fas fa-times"></i>
                </button>
            `;

    toastContainer.appendChild(toast);

    // Add event listener to close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// Set up event listeners
function setupEventListeners() {
    // Sidebar toggle
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        const icon = sidebarToggle.querySelector('i');
        if (sidebar.classList.contains('active')) {
            icon.classList.remove('fa-chevron-left');
            icon.classList.add('fa-chevron-right');
        } else {
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-left');
        }
    });

    projectsMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Profile dropdown
    profileMenu.addEventListener('click', () => {
        profileDropdown.classList.toggle('active');
    });

    // Logout functionality
    logoutBtn.addEventListener('click', async () => {
        const { error } = await window.supabaseClient.auth.signOut();
        if (!error) {
            window.location.href = 'login.html';
        }
    });

    // Create project button
    createProjectBtn.addEventListener('click', showCreateModal);

    // Search functionality
    searchInput.addEventListener('input', debounce(() => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        if (searchTerm) {
            filteredProjects = projects.filter(project =>
                project.name.toLowerCase().includes(searchTerm) ||
                (project.type && project.type.toLowerCase().includes(searchTerm)) ||
                (project.location && project.location.toLowerCase().includes(searchTerm))
            );
            renderProjects(filteredProjects);
        } else {
            filteredProjects = [...projects];
            renderProjects(filteredProjects);
        }
    }, 300));

    // Filter and sort events
    statusFilter.addEventListener('change', filterAndSortProjects);
    typeFilter.addEventListener('change', filterAndSortProjects);
    sortBy.addEventListener('change', filterAndSortProjects);

    // View toggle
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.getAttribute('data-view');
            renderProjects(filteredProjects);
        });
    });

    // Modal events
    closeProjectModal.addEventListener('click', () => {
        projectModal.classList.remove('active');
    });

    cancelProject.addEventListener('click', () => {
        projectModal.classList.remove('active');
    });

    saveProject.addEventListener('click', saveProjectHandler);

    // Close modal when clicking outside
    projectModal.addEventListener('click', (e) => {
        if (e.target === projectModal) {
            projectModal.classList.remove('active');
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!profileMenu.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('active');
        }
    });
}

// Utility functions
function getStatusClass(status) {
    switch (status) {
        case 'active': return 'status-active';
        case 'planning': return 'status-planning';
        case 'on_hold': return 'status-on-hold';
        case 'completed': return 'status-completed';
        default: return 'status-planning';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'active': return 'Active';
        case 'planning': return 'Planning';
        case 'on_hold': return 'On Hold';
        case 'completed': return 'Completed';
        default: return 'Planning';
    }
}

function formatBudget(budget) {
    return new Intl.NumberFormat('en-US').format(budget);
}

function getDaysRemaining(endDate) {
    if (!endDate) return '-';
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function debounce(func, wait) {
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

// End of main logic

// Throttled scroll-triggered dashboard animations
// Animation targets: project cards, project rows, stats

document.addEventListener('DOMContentLoaded', function () {
    // Initialize the projects page
    initProjectsPage();

    const animatedEls = document.querySelectorAll('.project-card, .project-row, .project-status, .project-meta-item, .progress-bar, .empty-state');

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