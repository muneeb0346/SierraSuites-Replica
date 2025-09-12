// Initialize Supabase
const supabaseUrl = 'https://qjswuwcqyzeuqqqltykz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhbmFzZSIsInJlZiI6InFqc3d1d2NxeXpldXFxcWx0eWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjk0MDUsImV4cCI6MjA3MDgwNTQwNX0.qgH8DMJEoJVuYOXSyr0RAj01Yt7bBR8EYL6qw3YXyAs';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const userName = document.getElementById('userName');
const userCompany = document.getElementById('userCompany');
const userAvatar = document.getElementById('userAvatar');
const welcomeMessage = document.getElementById('welcomeMessage');
const dashboardSummary = document.getElementById('dashboardSummary');
const activeProjectsCount = document.getElementById('activeProjectsCount');
const dueTasksCount = document.getElementById('dueTasksCount');
const statProjects = document.getElementById('statProjects');
const statTasks = document.getElementById('statTasks');
const statEstimates = document.getElementById('statEstimates');
const statPhotos = document.getElementById('statPhotos');
const projectsList = document.getElementById('projectsList');
const activitiesList = document.getElementById('activitiesList');
const tasksList = document.getElementById('tasksList');
const timelineList = document.getElementById('timelineList');
const crmNavItem = document.getElementById('crmNavItem');
const proposalsNavItem = document.getElementById('proposalsNavItem');
const subcontractorsNavItem = document.getElementById('subcontractorsNavItem');
const advancedCrmNavItem = document.getElementById('advancedCrmNavItem');
const aiProposalsNavItem = document.getElementById('aiProposalsNavItem');
const profileMenu = document.getElementById('profileMenu');
const profileDropdown = document.getElementById('profileDropdown');
const logoutBtn = document.getElementById('logoutBtn');
const searchInput = document.getElementById('searchInput');
const projectFilter = document.getElementById('project-filter');
const statusFilter = document.getElementById('status-filter');
const verificationBanner = document.getElementById('verification-banner');

// State
let userData = null;
let companyData = null;
let subscriptionTier = 'starter';
let userProjects = [];

// Check authentication and load data
async function initDashboard() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        window.location.href = 'login.html';
        return;
    }

    // Get user data
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError) {
        console.error('Error getting user:', userError);
        return;
    }

    userData = user.user;

    // Check if user needs email verification
    if (userData && !userData.email_confirmed_at) {
        verificationBanner.style.display = 'block';
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userData.id)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Create default profile if doesn't exist
        const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert([{
                id: userData.id,
                first_name: userData.user_metadata.first_name || 'User',
                last_name: userData.user_metadata.last_name || 'Name',
                company_name: userData.user_metadata.company_name || 'Company'
            }])
            .select()
            .single();

        if (insertError) {
            console.error('Error creating profile:', insertError);
        } else {
            profile = newProfile;
        }
    }

    // Get company data
    const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userData.user_metadata.company_id)
        .single();

    if (companyError) {
        console.error('Error fetching company:', companyError);
    } else {
        companyData = company;
        subscriptionTier = company.subscription_tier || 'starter';
    }

    // Update UI with user data
    updateUserUI(profile, company);

    // Load dashboard data
    await loadDashboardData();

    // Handle feature locking based on subscription tier
    handleFeatureLocking();

    // Initialize calendar
    initCalendar();
}

// Initialize calendar
function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (calendarEl) {
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: []
        });

        calendar.render();
    }
}

// Update UI with user data
function updateUserUI(profile, company) {
    const firstName = profile?.first_name || userData.user_metadata.first_name || 'User';
    const lastName = profile?.last_name || userData.user_metadata.last_name || 'Name';
    const companyName = company?.name || userData.user_metadata.company_name || 'Company';

    userName.textContent = `${firstName} ${lastName}`;
    userCompany.textContent = companyName;
    userAvatar.src = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=2563eb&color=fff`;

    welcomeMessage.textContent = `Welcome back, ${firstName}!`;
}

// Load dashboard data
async function loadDashboardData() {
    // Load projects
    const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (!projectsError && projects) {
        userProjects = projects;
        statProjects.textContent = projects.length;
        activeProjectsCount.textContent = projects.length;
        renderProjects(projects);

        // Populate project filter dropdown with user's actual projects
        populateProjectFilter(projects);
    }

    // Load tasks
    const today = new Date().toISOString().split('T')[0];
    const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .gte('due_date', today)
        .lte('due_date', today)
        .order('due_date', { ascending: true });

    if (!tasksError && tasks) {
        statTasks.textContent = tasks.length;
        dueTasksCount.textContent = tasks.length;
        renderTasks(tasks);
    }

    // Load activities
    const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

    if (!activitiesError && activities) {
        renderActivities(activities);
    }

    // Load timeline events (from tasks with due dates)
    const { data: timelineTasks, error: timelineError } = await supabase
        .from('tasks')
        .select('*')
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(5);

    if (!timelineError && timelineTasks) {
        renderTimeline(timelineTasks);
    }
}

// Populate project filter dropdown with user's projects
function populateProjectFilter(projects) {
    if (!projectFilter) return;

    // Clear existing options except the first one
    while (projectFilter.options.length > 1) {
        projectFilter.remove(1);
    }

    // Add user's projects to the dropdown
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectFilter.appendChild(option);
    });
}

// Render projects
function renderProjects(projects) {
    projectsList.innerHTML = '';

    if (projects.length === 0) {
        projectsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <h4>No projects yet</h4>
                        <p>Get started by creating your first project</p>
                        <a href="projects.html" class="btn btn-primary">Create Project</a>
                    </div>
                `;
        return;
    }

    // Show only the first 3 projects
    const projectsToShow = projects.slice(0, 3);

    projectsToShow.forEach(project => {
        const projectItem = document.createElement('div');
        projectItem.className = 'project-item';
        projectItem.innerHTML = `
                    <div class="project-info">
                        <h4>${project.name}</h4>
                        <p>${project.type || 'No type specified'}</p>
                        <div class="project-progress">
                            <div class="progress-bar" style="width: ${project.progress || 0}%"></div>
                            <span>${project.progress || 0}% complete</span>
                        </div>
                    </div>
                    <div class="project-actions">
                        <button class="btn btn-icon">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                `;
        projectsList.appendChild(projectItem);
    });
}

// Render tasks
function renderTasks(tasks) {
    tasksList.innerHTML = '';

    if (tasks.length === 0) {
        tasksList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-tasks"></i>
                        <h4>No tasks due</h4>
                        <p>You're all caught up on tasks</p>
                        <a href="taskflow.html" class="btn btn-primary">Create Task</a>
                    </div>
                `;
        return;
    }

    tasks.forEach(task => {
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const isToday = dueDate.toDateString() === today.toDateString();
        const isHighPriority = task.priority === 'high';
        const isMediumPriority = task.priority === 'medium';
        const isCompleted = task.completed;

        // Get project name for this task
        const project = userProjects.find(p => p.id === task.project_id);
        const projectName = project ? project.name : 'No Project';

        // Determine priority class
        let priorityClass = '';
        let priorityText = '';
        if (isHighPriority) {
            priorityClass = 'priority-high';
            priorityText = 'High Priority';
        } else if (isMediumPriority) {
            priorityClass = 'priority-medium';
            priorityText = 'Medium Priority';
        } else {
            priorityClass = 'priority-low';
            priorityText = 'Low Priority';
        }

        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${isHighPriority ? 'priority-high' : isMediumPriority ? 'priority-medium' : ''} ${isCompleted ? 'completed' : ''}`;
        taskItem.innerHTML = `
                    <label class="checkbox-container">
                        <input type="checkbox" ${isCompleted ? 'checked' : ''}>
                        <span class="checkmark"></span>
                    </label>
                    <div class="task-content">
                        <h4>${task.title}</h4>
                        <p>Project: ${projectName} • Due ${isToday ? 'today' : dueDate.toLocaleDateString()}</p>
                        <div class="task-meta">
                            <span>Due: ${isToday ? 'Today' : dueDate.toLocaleDateString()}</span>
                            <span>Project: ${projectName}</span>
                            <span>Assigned to: You</span>
                            <span class="task-priority ${priorityClass}">${priorityText}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-icon" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-icon" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                `;
        tasksList.appendChild(taskItem);
    });
}

// Render activities
function renderActivities(activities) {
    activitiesList.innerHTML = '';

    if (activities.length === 0) {
        activitiesList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <h4>No activity yet</h4>
                        <p>Your recent activity will appear here</p>
                    </div>
                `;
        return;
    }

    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';

        // Determine icon based on activity type
        let iconClass = 'fas fa-';
        switch (activity.type) {
            case 'photo':
                iconClass += 'camera';
                break;
            case 'estimate':
                iconClass += 'file-invoice-dollar';
                break;
            case 'task':
                iconClass += 'check-circle';
                break;
            case 'message':
                iconClass += 'comment';
                break;
            default:
                iconClass += 'bell';
        }

        const timeAgo = getTimeAgo(new Date(activity.created_at));

        activityItem.innerHTML = `
                    <div class="activity-icon">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="activity-content">
                        <p>${activity.description}</p>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                `;
        activitiesList.appendChild(activityItem);
    });
}

// Render timeline
function renderTimeline(tasks) {
    timelineList.innerHTML = '';

    if (tasks.length === 0) {
        timelineList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar"></i>
                        <h4>No upcoming events</h4>
                        <p>Your project timeline will appear here</p>
                    </div>
                `;
        return;
    }

    tasks.forEach(task => {
        const dueDate = new Date(task.due_date);
        // Get project name for this task
        const project = userProjects.find(p => p.id === task.project_id);
        const projectName = project ? project.name : 'No Project';

        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.innerHTML = `
                    <div class="timeline-date">${dueDate.toLocaleDateString()}</div>
                    <div class="timeline-content">
                        <h4>${task.title}</h4>
                        <p>${projectName}</p>
                    </div>
                `;
        timelineList.appendChild(timelineItem);
    });
}

// Handle feature locking based on subscription tier
function handleFeatureLocking() {
    // Enable features based on subscription tier
    if (subscriptionTier === 'pro' || subscriptionTier === 'enterprise') {
        crmNavItem.classList.remove('nav-item-locked');
        proposalsNavItem.classList.remove('nav-item-locked');
    }

    if (subscriptionTier === 'enterprise') {
        subcontractorsNavItem.classList.remove('nav-item-locked');
        advancedCrmNavItem.classList.remove('nav-item-locked');
        aiProposalsNavItem.classList.remove('nav-item-locked');
    }
}

// Utility function to get time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Resend verification email
async function resendVerificationEmail() {
    if (!userData || !userData.email) {
        alert('No email found. Please log in again.');
        return;
    }

    const { error } = await supabase.auth.resend({
        type: "signup",
        email: userData.email
    });

    if (error) {
        alert("Error: " + error.message);
    } else {
        alert("Verification email resent! Please check your inbox.");
    }
}

// Dismiss banner
function dismissBanner() {
    verificationBanner.style.display = 'none';
}

// Filter functionality
function filterTasks() {
    // This would filter tasks based on selected criteria
    console.log('Filtering tasks...');
}

// Event Listeners
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Profile dropdown
profileMenu.addEventListener('click', () => {
    profileDropdown.classList.toggle('active');
});

// Logout functionality
logoutBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        window.location.href = 'login.html';
    }
});

// Search functionality
searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            window.location.href = `search.html?q=${encodeURIComponent(searchTerm)}`;
        }
    }
});

// Filter event listeners
if (projectFilter) {
    projectFilter.addEventListener('change', filterTasks);
}

if (statusFilter) {
    statusFilter.addEventListener('change', filterTasks);
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!profileMenu.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove('active');
    }
});

// Initialize dashboard
initDashboard();