// Initialize Supabase with your credentials
const supabaseUrl = 'https://qjswuwcqyzeuqqqltykz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqc3d1d2NxeXpldXFxcWx0eWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjk0MDUsImV4cCI6MjA3MDgwNTQwNX0.qgH8DMJEoJVuYOXSyr0RAj01Yt7bBR8EYL6qw3YXyAs';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Global variables
let currentUser = null;
let currentCompanyId = null;
let currentSubscriptionTier = 'starter';
let calendar = null;

// Authentication state listener
supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
        currentUser = session.user;
        await loadUserCompanyData();
        // Only initialize TaskFlow on pages that declare the scope class
        if (document.body && document.body.classList.contains('page-taskflow')) {
            initializeTaskFlow();
        }
    } else {
        // Redirect to login or show login UI
        console.log('User not authenticated');
    }
});

async function loadUserCompanyData() {
    // Get user's company and subscription data
    const { data, error } = await supabase
        .from('user_companies')
        .select('company_id, companies(subscription_tier)')
        .eq('user_id', currentUser.id)
        .single();

    if (data) {
        currentCompanyId = data.company_id;
        currentSubscriptionTier = data.companies.subscription_tier;
    }
}

// CRUD Operations for Tasks
async function createTask(taskData) {
    const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...taskData, company_id: currentCompanyId, created_by: currentUser.id }])
        .select();

    if (error) {
        console.error('Error creating task:', error);
        showNotification('Failed to create task', 'error');
        return null;
    }

    showNotification('Task created successfully!', 'success');
    return data[0];
}

async function getTasks(filters = {}) {
    let query = supabase
        .from('tasks')
        .select('*, projects(name), users(full_name)')
        .eq('company_id', currentCompanyId);

    // Apply filters
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.project_id) query = query.eq('project_id', filters.project_id);
    if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);

    const { data, error } = await query.order('due_date', { ascending: true });

    if (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }

    return data;
}

async function updateTask(taskId, updates) {
    const { data, error } = await supabase
        .from('tasks')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', taskId)
        .select();

    if (error) {
        console.error('Error updating task:', error);
        showNotification('Failed to update task', 'error');
        return null;
    }

    showNotification('Task updated successfully!', 'success');
    return data[0];
}

async function deleteTask(taskId) {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

    if (error) {
        console.error('Error deleting task:', error);
        showNotification('Failed to delete task', 'error');
        return false;
    }

    showNotification('Task deleted successfully!', 'success');
    return true;
}

// CRUD Operations for Events
async function createEvent(eventData) {
    const { data, error } = await supabase
        .from('events')
        .insert([{ ...eventData, company_id: currentCompanyId, created_by: currentUser.id }])
        .select();

    if (error) {
        console.error('Error creating event:', error);
        showNotification('Failed to create event', 'error');
        return null;
    }

    showNotification('Event created successfully!', 'success');
    return data[0];
}

async function getEvents(startDate, endDate) {
    const { data, error } = await supabase
        .from('events')
        .select('*, projects(name), users(full_name)')
        .eq('company_id', currentCompanyId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: true });

    if (error) {
        console.error('Error fetching events:', error);
        return [];
    }

    return data;
}

async function updateEvent(eventId, updates) {
    const { data, error } = await supabase
        .from('events')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', eventId)
        .select();

    if (error) {
        console.error('Error updating event:', error);
        showNotification('Failed to update event', 'error');
        return null;
    }

    showNotification('Event updated successfully!', 'success');
    return data[0];
}

async function deleteEvent(eventId) {
    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

    if (error) {
        console.error('Error deleting event:', error);
        showNotification('Failed to delete event', 'error');
        return false;
    }

    showNotification('Event deleted successfully!', 'success');
    return true;
}

// TaskFlow initialization
function initializeTaskFlow() {
    loadTasksAndEvents();
    setupEventListeners();
    checkSubscriptionTier();
    initProjectsPage();
}

async function loadTasksAndEvents() {
    // Load tasks
    const tasks = await getTasks();
    renderTasks(tasks);

    // Load events for the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const events = await getEvents(startOfMonth, endOfMonth);
    renderEvents(events);
}

function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    taskList.innerHTML = '';

    tasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        taskItem.dataset.taskId = task.id;

        const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date';
        const projectName = task.projects ? task.projects.name : 'No project';
        const assignedTo = task.users ? task.users.full_name : 'Unassigned';

        taskItem.innerHTML = `
                    <div class="task-checkbox">
                        <input type="checkbox" ${task.status === 'completed' ? 'checked' : ''}>
                    </div>
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        <div class="task-desc">${task.description || 'No description'}</div>
                        <div class="task-meta">
                            <span>Due: ${dueDate}</span>
                            <span>Project: ${projectName}</span>
                            <span>Assigned to: ${assignedTo}</span>
                            <span class="task-priority priority-${task.priority || 'medium'}">${task.priority || 'Medium'} Priority</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="edit-task" title="Edit"><i>✏️</i></button>
                        <button class="delete-task" title="Delete"><i>🗑️</i></button>
                    </div>
                `;

        taskList.appendChild(taskItem);
    });

    // Update task count
    const totalTasksEl = document.querySelector('.card-value');
    if (totalTasksEl) {
        totalTasksEl.textContent = tasks.length;
    }
}

function renderEvents(events) {
    if (!calendar) return;

    // Clear existing events
    calendar.getEvents().forEach(event => event.remove());

    // Add new events
    events.forEach(event => {
        calendar.addEvent({
            id: event.id,
            title: event.title,
            start: event.start_time,
            end: event.end_time,
            allDay: event.all_day,
            color: getEventColor(event.event_type)
        });
    });
}

function getEventColor(eventType) {
    // Map to CSS variable-based theme colors
    const styles = getComputedStyle(document.documentElement);
    const map = {
        meeting: styles.getPropertyValue('--primary-light')?.trim() || '#3B82F6',
        deadline: styles.getPropertyValue('--danger-color')?.trim() || '#EF4444',
        inspection: styles.getPropertyValue('--success-color')?.trim() || '#10B981',
        milestone: styles.getPropertyValue('--warning-color')?.trim() || '#F59E0B',
        general: styles.getPropertyValue('--primary-dark')?.trim() || '#1E3A8A'
    };
    return map[eventType] || map.general;
}

function setupEventListeners() {
    // Event form submission
    const saveEventBtn = document.getElementById('save-event');
    if (saveEventBtn) {
        saveEventBtn.addEventListener('click', handleEventSave);
    }

    // Task form submission
    const saveTaskBtn = document.getElementById('save-task');
    if (saveTaskBtn) {
        saveTaskBtn.addEventListener('click', handleTaskSave);
    }

    // Task completion toggle
    document.addEventListener('change', function (e) {
        if (e.target.matches('.task-checkbox input')) {
            const taskItem = e.target.closest('.task-item');
            const taskId = taskItem.dataset.taskId;
            const isCompleted = e.target.checked;

            const updates = {
                status: isCompleted ? 'completed' : 'pending',
                completed_at: isCompleted ? new Date() : null
            };

            updateTask(taskId, updates).then(success => {
                if (!success) {
                    e.target.checked = !isCompleted; // Revert UI if update failed
                } else {
                    if (isCompleted) {
                        taskItem.style.opacity = '0.7';
                        taskItem.style.textDecoration = 'line-through';
                    } else {
                        taskItem.style.opacity = '1';
                        taskItem.style.textDecoration = 'none';
                    }
                }
            });
        }
    });

    // Edit and delete task buttons
    document.addEventListener('click', function (e) {
        if (e.target.closest('.edit-task')) {
            const taskItem = e.target.closest('.task-item');
            const taskId = taskItem.dataset.taskId;
            // Implement edit functionality
            console.log('Edit task:', taskId);
        }

        if (e.target.closest('.delete-task')) {
            const taskItem = e.target.closest('.task-item');
            const taskId = taskItem.dataset.taskId;

            if (confirm('Are you sure you want to delete this task?')) {
                deleteTask(taskId).then(success => {
                    if (success) {
                        taskItem.remove();
                    }
                });
            }
        }
    });

    // Filter functionality
    const projectFilter = document.getElementById('project-filter');
    const statusFilter = document.getElementById('status-filter');

    if (projectFilter) {
        projectFilter.addEventListener('change', filterTasks);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', filterTasks);
    }

    // Global Escape and modal-close handling is centralized in main.js
}

async function handleEventSave() {
    const form = document.getElementById('event-form');
    if (!form) return;

    const formData = new FormData(form);
    const eventData = {
        title: formData.get('title'),
        description: formData.get('description'),
        start_time: formData.get('start_time'),
        end_time: formData.get('end_time'),
        project_id: formData.get('project_id'),
        event_type: formData.get('event_type') || 'general'
    };

    const event = await createEvent(eventData);
    if (event) {
        calendar.addEvent({
            id: event.id,
            title: event.title,
            start: event.start_time,
            end: event.end_time,
            allDay: event.all_day,
            color: getEventColor(event.event_type)
        });

        const modal = document.getElementById('event-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        form.reset();
    }
}

async function handleTaskSave() {
    const form = document.getElementById('task-form');
    if (!form) return;

    const formData = new FormData(form);
    const taskData = {
        title: formData.get('title'),
        description: formData.get('description'),
        due_date: formData.get('due_date'),
        priority: formData.get('priority'),
        project_id: formData.get('project_id')
    };

    const task = await createTask(taskData);
    if (task) {
        // Add the new task to the DOM
        const tasks = await getTasks();
        renderTasks(tasks);

        const modal = document.getElementById('task-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        form.reset();
    }
}

async function filterTasks() {
    const projectValue = document.getElementById('project-filter')?.value || 'all';
    const statusValue = document.getElementById('status-filter')?.value || 'all';

    const filters = {};
    if (projectValue !== 'all') filters.project_id = projectValue;
    if (statusValue !== 'all') filters.status = statusValue;

    const tasks = await getTasks(filters);
    renderTasks(tasks);
}

function checkSubscriptionTier() {
    if (currentSubscriptionTier === 'pro' || currentSubscriptionTier === 'enterprise') {
        enableTeamFeatures();
    }
}

function enableTeamFeatures() {
    // Enable team assignment selects
    document.querySelectorAll('.team-assign-select').forEach(select => {
        select.disabled = false;

        // Load team members
        loadTeamMembers().then(members => {
            select.innerHTML = '<option value="">Select Team Member</option>' +
                members.map(m => `<option value="${m.id}">${m.full_name}</option>`).join('');
        });
    });

    // Show sync button
    const syncBtn = document.getElementById('sync-calendar-btn');
    if (syncBtn) {
        syncBtn.classList.remove('hidden');

        // Set up calendar sync
        syncBtn.addEventListener('click', setupCalendarSync);
    }
}

async function loadTeamMembers() {
    // Get users from the same company
    const { data, error } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('company_id', currentCompanyId);

    if (error) {
        console.error('Error loading team members:', error);
        return [];
    }

    return data;
}

function setupCalendarSync() {
    // This would integrate with Google Calendar API
    // For now, we'll show a placeholder
    showNotification('Calendar sync requires additional setup with Google API', 'info');
}

function showNotification(message, type = 'info') {
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
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
}

// Project-related functions
async function initProjectsPage() {
    // Check if we're on a projects page
    const projectsPage = document.querySelector('.projects-page');
    if (!projectsPage) return;

    // Load clients for dropdown (if needed)
    await loadClients();

    // Set up event listeners for new functionality
    setupProjectInteractions();
}

// Load clients for dropdown
async function loadClients() {
    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

    if (!error && clients) {
        // You can use this to populate a client dropdown if needed
        window.clients = clients;
    }
}

// Setup project interaction event listeners
function setupProjectInteractions() {
    // Create project button
    const createProjectBtn = document.getElementById('create-project-btn');
    if (createProjectBtn) {
        createProjectBtn.addEventListener('click', () => {
            document.getElementById('create-project-modal').classList.add('active');
        });
    }

    // Close modal buttons
    document.getElementById('close-project-modal').addEventListener('click', closeProjectModal);
    document.getElementById('cancel-project-btn').addEventListener('click', closeProjectModal);

    // Save project button
    document.getElementById('save-project-btn').addEventListener('click', createNewProject);

    // Close modal when clicking outside
    const projectModal = document.getElementById('create-project-modal');
    if (projectModal) {
        projectModal.addEventListener('click', (e) => {
            if (e.target === projectModal) {
                closeProjectModal();
            }
        });
    }
}

// Close modal function
function closeProjectModal() {
    const modal = document.getElementById('create-project-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    const form = document.getElementById('create-project-form');
    if (form) {
        form.reset();
    }
}

// Create new project function
async function createNewProject() {
    const form = document.getElementById('create-project-form');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const projectData = {
        name: document.getElementById('project-name').value,
        type: document.getElementById('project-type').value,
        address: document.getElementById('project-address').value,
        start_date: document.getElementById('project-start-date').value || null,
        end_date: document.getElementById('project-end-date').value || null,
        budget: document.getElementById('project-budget').value ?
            parseFloat(document.getElementById('project-budget').value) : null,
        description: document.getElementById('project-description').value,
        status: 'planning',
        progress: 0,
        company_id: currentCompanyId,
        created_by: currentUser.id
    };

    try {
        const { data, error } = await supabase
            .from('projects')
            .insert([projectData])
            .select();

        if (error) {
            throw error;
        }

        // Add activity log
        await supabase
            .from('activities')
            .insert([{
                project_id: data[0].id,
                type: 'project_created',
                description: `Project "${projectData.name}" was created`,
                user_id: currentUser.id
            }]);

        // Close modal and refresh projects
        closeProjectModal();

        // Show success message
        showNotification('Project created successfully!', 'success');

    } catch (error) {
        console.error('Error creating project:', error);
        showNotification('Error creating project. Please try again.', 'error');
    }
}

// Helper functions for projects
function getStatusClass(status) {
    const statusClasses = {
        'planning': 'status-planning',
        'active': 'status-active',
        'on_hold': 'status-on-hold',
        'completed': 'status-completed'
    };
    return statusClasses[status] || 'status-planning';
}

function getStatusText(status) {
    const statusText = {
        'planning': 'Planning',
        'active': 'Active',
        'on_hold': 'On Hold',
        'completed': 'Completed'
    };
    return statusText[status] || 'Planning';
}

function formatBudget(budget) {
    return new Intl.NumberFormat('en-US').format(budget);
}

function getDaysRemaining(endDate) {
    if (!endDate) return 'N/A';

    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 'Overdue';
}

function getInitials(name) {
    if (!name) return 'UU';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

// Your existing DOMContentLoaded code
document.addEventListener('DOMContentLoaded', function () {
    // Only run TaskFlow-specific DOM wiring on TaskFlow pages
    if (!document.body.classList.contains('page-taskflow')) {
        return;
    }

    // Theme colors from CSS variables (used by charts and UI)
    const styles = getComputedStyle(document.documentElement);
    const primaryDark = styles.getPropertyValue('--primary-dark')?.trim() || '#1E3A8A';
    const secondary = styles.getPropertyValue('--secondary-color')?.trim() || '#F97316';
    const success = styles.getPropertyValue('--success-color')?.trim() || '#10B981';
    const primaryLight = styles.getPropertyValue('--primary-light')?.trim() || '#3B82F6';
    const grayLight = styles.getPropertyValue('--gray-light')?.trim() || '#E5E7EB';
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', function () {
            sidebar.classList.toggle('active');
        });
    }

    // Menu toggle for dashboard
    const dashboardMenuToggle = document.querySelector('.dashboard-page .menu-toggle');

    if (dashboardMenuToggle && sidebar) {
        dashboardMenuToggle.addEventListener('click', function () {
            sidebar.classList.toggle('active');
        });
    }

    // Sidebar toggle button
    const sidebarToggle = document.querySelector('.sidebar-toggle');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Modal functionality is handled globally in main.js via [data-modal] and .modal-close

    // Calendar initialization
    const calendarEl = document.getElementById('calendar');

    if (calendarEl) {
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: [
                {
                    title: 'Submit Building Permit',
                    start: new Date(),
                    color: getEventColor('deadline')
                },
                {
                    title: 'Client Meeting',
                    start: '2023-06-15T10:00:00',
                    end: '2023-06-15T11:30:00',
                    color: getEventColor('meeting')
                },
                {
                    title: 'Electrical Inspection',
                    start: '2023-06-18T13:00:00',
                    color: getEventColor('inspection')
                }
            ],
            dateClick: function (info) {
                const selectedDateEl = document.getElementById('selected-date');
                if (selectedDateEl) {
                    selectedDateEl.textContent = info.dateStr;
                }

                // Open event modal with pre-filled date
                const eventModal = document.getElementById('event-modal');
                if (eventModal) {
                    const startInput = eventModal.querySelector('input[type="datetime-local"]');
                    if (startInput) {
                        startInput.value = info.dateStr + 'T09:00:00';
                    }
                    eventModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            }
        });

        calendar.render();
    }

    // Chart initialization
    const timeChartEl = document.getElementById('timeChart');

    if (timeChartEl) {
        const timeChart = new Chart(timeChartEl, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Hours Tracked',
                    data: [6.5, 8, 7.5, 9, 6, 0, 0],
                    backgroundColor: primaryDark,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours'
                        }
                    }
                }
            }
        });
    }

    const progressChartEl = document.getElementById('progressChart');

    if (progressChartEl) {
        const progressChart = new Chart(progressChartEl, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'In Progress', 'Not Started'],
                datasets: [{
                    data: [35, 45, 20],
                    backgroundColor: [success, primaryLight, grayLight],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                cutout: '70%'
            }
        });
    }

    const taskChartEl = document.getElementById('taskChart');

    if (taskChartEl) {
        const taskChart = new Chart(taskChartEl, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Tasks Completed',
                    data: [12, 19, 15, 24],
                    borderColor: secondary,
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    const financialChartEl = document.getElementById('financialChart');

    if (financialChartEl) {
        const financialChart = new Chart(financialChartEl, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'Revenue',
                        data: [12000, 19000, 15000, 18000, 22000, 24500],
                        backgroundColor: primaryDark,
                        borderRadius: 4
                    },
                    {
                        label: 'Expenses',
                        data: [8000, 12000, 10000, 11000, 15000, 13000],
                        backgroundColor: secondary,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount ($)'
                        }
                    }
                }
            }
        });
    }
});