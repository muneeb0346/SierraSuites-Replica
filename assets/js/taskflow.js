// Initialize Supabase client
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-supabase-key';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Initialize user tier (will be fetched from Supabase)
let currentUserTier = 'starter';
let currentUser = null;
let currentCompany = null;

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const menuToggle = document.getElementById('menuToggle');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userAvatar = document.getElementById('user-avatar');
const searchInput = document.getElementById('searchInput');
const notificationBtn = document.getElementById('notificationBtn');
const profileMenu = document.getElementById('profileMenu');
const profileDropdown = document.getElementById('profileDropdown');
const logoutBtn = document.getElementById('logoutBtn');
const createTaskBtn = document.getElementById('createTaskBtn');
const createMilestoneBtn = document.getElementById('createMilestoneBtn');
const useTemplateBtn = document.getElementById('useTemplateBtn');
const calendarViewBtn = document.getElementById('calendarViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const resourceViewBtn = document.getElementById('resourceViewBtn');
const ganttViewBtn = document.getElementById('ganttViewBtn');
const calendarView = document.getElementById('calendarView');
const tasksListView = document.getElementById('tasksListView');
const resourceView = document.getElementById('resourceView');
const ganttView = document.getElementById('ganttView');
const currentMonth = document.getElementById('currentMonth');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const todayBtn = document.getElementById('todayBtn');
const calendarGrid = document.getElementById('calendarGrid');
const statusFilter = document.getElementById('statusFilter');
const priorityFilter = document.getElementById('priorityFilter');
const assigneeFilter = document.getElementById('assigneeFilter');
const projectFilter = document.getElementById('projectFilter');
const tasksContainer = document.getElementById('tasksContainer');
const milestonesContainer = document.getElementById('milestonesContainer');
const remindersContainer = document.getElementById('remindersContainer');
const taskModal = document.getElementById('taskModal');
const milestoneModal = document.getElementById('milestoneModal');
const templateModal = document.getElementById('templateModal');
const modalTitle = document.getElementById('modalTitle');
const milestoneModalTitle = document.getElementById('milestoneModalTitle');
const templateModalTitle = document.getElementById('templateModalTitle');
const taskForm = document.getElementById('taskForm');
const milestoneForm = document.getElementById('milestoneForm');
const templateForm = document.getElementById('templateForm');
const taskId = document.getElementById('taskId');
const milestoneId = document.getElementById('milestoneId');
const templateId = document.getElementById('templateId');
const taskProject = document.getElementById('taskProject');
const milestoneProject = document.getElementById('milestoneProject');
const closeModal = document.getElementById('closeModal');
const closeMilestoneModal = document.getElementById('closeMilestoneModal');
const closeTemplateModal = document.getElementById('closeTemplateModal');
const cancelTask = document.getElementById('cancelTask');
const cancelMilestone = document.getElementById('cancelMilestone');
const cancelTemplate = document.getElementById('cancelTemplate');
const saveTask = document.getElementById('saveTask');
const saveMilestone = document.getElementById('saveMilestone');
const saveTemplate = document.getElementById('saveTemplate');
const teamMembers = document.getElementById('teamMembers');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const syncGoogleBtn = document.getElementById('syncGoogleBtn');
const syncOutlookBtn = document.getElementById('syncOutlookBtn');
const syncCalendarBtn = document.getElementById('syncCalendarBtn');
const resourceTimeline = document.getElementById('resourceTimeline');
const prevWeekBtn = document.getElementById('prevWeekBtn');
const nextWeekBtn = document.getElementById('nextWeekBtn');
const thisWeekBtn = document.getElementById('thisWeekBtn');
const addReminderBtn = document.getElementById('addReminderBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const completeTasksPill = document.getElementById('completeTasksPill');
const teamAssignmentPill = document.getElementById('teamAssignmentPill');
const createTemplateBtn = document.getElementById('createTemplateBtn');
const templateSelector = document.getElementById('templateSelector');
const addTemplateTaskBtn = document.getElementById('addTemplateTaskBtn');
const templateTasks = document.getElementById('templateTasks');
const aiAssistant = document.getElementById('aiAssistant');
const aiMessages = document.getElementById('aiMessages');
const aiInput = document.getElementById('aiInput');
const sendAIMessage = document.getElementById('sendAIMessage');
const closeAIAssistant = document.getElementById('closeAIAssistant');
const teamLink = document.getElementById('teamLink');
const calendarSyncLink = document.getElementById('calendarSyncLink');
const milestonesLink = document.getElementById('milestonesLink');
const ganttLink = document.getElementById('ganttLink');
const aiAssistantLink = document.getElementById('aiAssistantLink');
const taskCommentsSection = document.getElementById('taskCommentsSection');
const taskComments = document.getElementById('taskComments');
const commentInput = document.getElementById('commentInput');
const addCommentBtn = document.getElementById('addCommentBtn');
const taskAttachmentsSection = document.getElementById('taskAttachmentsSection');
const taskAttachments = document.getElementById('taskAttachments');
const taskAttachment = document.getElementById('taskAttachment');
const ganttTimeline = document.getElementById('ganttTimeline');
const ganttPeriod = document.getElementById('ganttPeriod');
const prevWeekGanttBtn = document.getElementById('prevWeekGanttBtn');
const nextWeekGanttBtn = document.getElementById('nextWeekGanttBtn');
const thisWeekGanttBtn = document.getElementById('thisWeekGanttBtn');
const milestoneProjectFilter = document.getElementById('milestoneProjectFilter');
const milestoneStatusFilter = document.getElementById('milestoneStatusFilter');

// State
let currentDate = new Date();
let currentView = 'calendar';
let tasks = [];
let milestones = [];
let reminders = [];
let projects = [];
let teamMembersList = [];
let templates = [];
let selectedAssignee = 'current';
let currentWeekStart = new Date();
let currentTaskId = null;

// Initialize the page
async function initTaskFlowPage() {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (userError) {
        console.error('Error fetching user:', userError);
        showToast('Error loading user data', 'error');
        return;
    }

    currentUser = userData;

    // Get company data
    const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userData.company_id)
        .single();

    if (companyError) {
        console.error('Error fetching company:', companyError);
        showToast('Error loading company data', 'error');
        return;
    }

    currentCompany = companyData;
    currentUserTier = companyData.subscription_tier;

    // Set user info
    userName.textContent = `${userData.first_name} ${userData.last_name}`;
    userEmail.textContent = userData.email;
    userAvatar.textContent = userData.first_name.charAt(0) + userData.last_name.charAt(0);

    // Set user tier features
    setupUserTierFeatures();

    // Load data
    await loadData();

    // Set up event listeners
    setupEventListeners();

    // Render views
    renderCalendar();
    renderTasksList();
    renderMilestonesList();
    renderRemindersList();
    renderResourceTimeline();
    renderTemplates();

    // Show toast notification
    showToast('TaskFlow initialized successfully', 'success');

    // Set up real-time subscriptions
    setupRealtimeSubscriptions();
}

// Setup user tier features
function setupUserTierFeatures() {
    // Hide pro features if user is not on pro or enterprise tier
    if (currentUserTier !== 'pro' && currentUserTier !== 'enterprise') {
        document.querySelectorAll('.pro-feature').forEach(el => {
            el.style.display = 'none';
        });

        completeTasksPill.style.display = 'none';
        teamAssignmentPill.style.display = 'none';
        useTemplateBtn.style.display = 'none';
        resourceViewBtn.style.display = 'none';
        ganttViewBtn.style.display = 'none';

        // Hide pro tabs
        document.querySelectorAll('.tab[data-tab="sync"], .tab[data-tab="templates"]').forEach(tab => {
            tab.style.display = 'none';
        });
    }

    // Hide enterprise features if user is not on enterprise tier
    if (currentUserTier !== 'enterprise') {
        ganttViewBtn.style.display = 'none';
        aiAssistantLink.style.display = 'none';
    }
}

// Load data from Supabase
async function loadData() {
    try {
        // Load projects
        const { data: projectsData, error: projectsError } = await supabase
            .from('projects_crm')
            .select('*')
            .eq('company_id', currentCompany.id);

        if (projectsError) throw projectsError;
        projects = projectsData || [];

        // Load tasks
        const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('company_id', currentCompany.id);

        if (tasksError) throw tasksError;
        tasks = tasksData || [];

        // Load milestones
        const { data: milestonesData, error: milestonesError } = await supabase
            .from('milestones')
            .select('*')
            .eq('company_id', currentCompany.id);

        if (milestonesError) throw milestonesError;
        milestones = milestonesData || [];

        // Load team members
        const { data: teamData, error: teamError } = await supabase
            .from('users')
            .select('*')
            .eq('company_id', currentCompany.id);

        if (teamError) throw teamError;
        teamMembersList = teamData || [];

        // Load templates if pro or enterprise tier
        if (currentUserTier === 'pro' || currentUserTier === 'enterprise') {
            const { data: templatesData, error: templatesError } = await supabase
                .from('task_templates')
                .select('*')
                .eq('company_id', currentCompany.id);

            if (templatesError) throw templatesError;
            templates = templatesData || [];
        }

        // Populate project dropdowns
        taskProject.innerHTML = '<option value="">Select Project</option>';
        milestoneProject.innerHTML = '<option value="">Select Project</option>';
        projectFilter.innerHTML = '<option value="all">All Projects</option>';
        milestoneProjectFilter.innerHTML = '<option value="all">All Projects</option>';

        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            taskProject.appendChild(option.cloneNode(true));
            milestoneProject.appendChild(option.cloneNode(true));
            projectFilter.appendChild(option.cloneNode(true));
            milestoneProjectFilter.appendChild(option.cloneNode(true));
        });

        // Populate team members
        teamMembers.innerHTML = '';
        teamMembersList.forEach(member => {
            const memberElement = document.createElement('div');
            memberElement.className = 'team-member';
            memberElement.setAttribute('data-user-id', member.id);
            memberElement.innerHTML = `
                        <div class="assignee-avatar">${member.first_name.charAt(0)}${member.last_name.charAt(0)}</div>
                        <span>${member.first_name} ${member.last_name}</span>
                    `;
            teamMembers.appendChild(memberElement);
        });

    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data', 'error');
    }
}

// Set up real-time subscriptions
function setupRealtimeSubscriptions() {
    // Subscribe to task changes
    supabase
        .channel('tasks-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
            console.log('Task change received!', payload);
            loadData().then(() => {
                renderCalendar();
                renderTasksList();
                renderResourceTimeline();
            });
        })
        .subscribe();

    // Subscribe to milestone changes
    supabase
        .channel('milestones-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'milestones' }, payload => {
            console.log('Milestone change received!', payload);
            loadData().then(() => {
                renderCalendar();
                renderMilestonesList();
            });
        })
        .subscribe();
}

// Show create task modal
function showCreateModal() {
    modalTitle.textContent = 'Create New Task';
    taskForm.reset();
    taskId.value = '';

    // Set default values
    document.getElementById('taskStatus').value = 'pending';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskReminder').value = '';
    document.getElementById('taskBudget').value = '';

    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('taskDueDate').value = today;

    // Reset team member selection
    document.querySelectorAll('.team-member').forEach(member => {
        member.classList.remove('selected');
    });
    document.querySelector('.team-member[data-user-id="current"]').classList.add('selected');
    selectedAssignee = currentUser.id;

    // Hide comments and attachments sections for new tasks
    taskCommentsSection.style.display = 'none';
    taskAttachmentsSection.style.display = 'none';

    taskModal.classList.add('active');
}

// Show create milestone modal
function showCreateMilestoneModal() {
    milestoneModalTitle.textContent = 'Create New Milestone';
    milestoneForm.reset();
    milestoneId.value = '';

    // Set default values
    document.getElementById('milestoneStatus').value = 'upcoming';

    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('milestoneDate').value = today;

    milestoneModal.classList.add('active');
}

// Show create template modal
function showCreateTemplateModal() {
    templateModalTitle.textContent = 'Create New Template';
    templateForm.reset();
    templateId.value = '';
    templateTasks.innerHTML = '';

    templateModal.classList.add('active');
}

// Show AI Assistant
function showAIAssistant() {
    aiAssistant.style.display = 'flex';
}

// Switch to calendar view
function switchToCalendarView() {
    calendarViewBtn.classList.add('active');
    listViewBtn.classList.remove('active');
    resourceViewBtn.classList.remove('active');
    ganttViewBtn.classList.remove('active');
    calendarView.style.display = 'flex';
    tasksListView.style.display = 'none';
    resourceView.style.display = 'none';
    ganttView.style.display = 'none';
    currentView = 'calendar';
}

// Switch to list view
function switchToListView() {
    listViewBtn.classList.add('active');
    calendarViewBtn.classList.remove('active');
    resourceViewBtn.classList.remove('active');
    ganttViewBtn.classList.remove('active');
    calendarView.style.display = 'none';
    tasksListView.style.display = 'flex';
    resourceView.style.display = 'none';
    ganttView.style.display = 'none';
    currentView = 'list';
}

// Switch to resource view
function switchToResourceView() {
    resourceViewBtn.classList.add('active');
    calendarViewBtn.classList.remove('active');
    listViewBtn.classList.remove('active');
    ganttViewBtn.classList.remove('active');
    calendarView.style.display = 'none';
    tasksListView.style.display = 'none';
    resourceView.style.display = 'block';
    ganttView.style.display = 'none';
    currentView = 'resource';
    renderResourceTimeline();
}

// Switch to Gantt view
function switchToGanttView() {
    ganttViewBtn.classList.add('active');
    calendarViewBtn.classList.remove('active');
    listViewBtn.classList.remove('active');
    resourceViewBtn.classList.remove('active');
    calendarView.style.display = 'none';
    tasksListView.style.display = 'none';
    resourceView.style.display = 'none';
    ganttView.style.display = 'block';
    currentView = 'gantt';
    renderGanttChart();
}

// Switch tabs
function switchTab(tabName) {
    // Update active tab
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Update active content
    tabContents.forEach(content => {
        if (content.id === `${tabName}Tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Render calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update month header
    currentMonth.textContent = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Clear previous calendar
    while (calendarGrid.children.length > 7) {
        calendarGrid.removeChild(calendarGrid.lastChild);
    }

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }

    // Add cells for each day of the month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        const date = new Date(year, month, i);

        day.className = 'calendar-day';
        if (date.getTime() === today.getTime()) {
            day.classList.add('today');
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = i;
        day.appendChild(dayNumber);

        // Add tasks for this day
        const dayTasks = tasks.filter(task => {
            if (!task.due_date) return false;
            const taskDate = new Date(task.due_date);
            return taskDate.getDate() === i &&
                taskDate.getMonth() === month &&
                taskDate.getFullYear() === year;
        });

        dayTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.priority}-priority ${task.status === 'completed' ? 'completed' : ''}`;
            taskElement.textContent = task.title;
            taskElement.title = task.title;
            taskElement.addEventListener('click', (e) => {
                e.stopPropagation();
                editTask(task.id);
            });
            day.appendChild(taskElement);
        });

        // Add milestones for this day
        const dayMilestones = milestones.filter(milestone => {
            if (!milestone.date) return false;
            const milestoneDate = new Date(milestone.date);
            return milestoneDate.getDate() === i &&
                milestoneDate.getMonth() === month &&
                milestoneDate.getFullYear() === year;
        });

        dayMilestones.forEach(milestone => {
            const milestoneElement = document.createElement('div');
            milestoneElement.className = `milestone-item ${milestone.status}`;
            milestoneElement.textContent = `${milestone.title} (Milestone)`;
            milestoneElement.title = milestone.title;
            milestoneElement.addEventListener('click', (e) => {
                e.stopPropagation();
                editMilestone(milestone.id);
            });
            day.appendChild(milestoneElement);
        });

        day.addEventListener('click', () => {
            // Create new task for this date
            showCreateModal();
            document.getElementById('taskDueDate').value = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        });

        calendarGrid.appendChild(day);
    }
}

// Render tasks list
function renderTasksList() {
    tasksContainer.innerHTML = '';

    if (tasks.length === 0) {
        tasksContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-tasks"></i>
                        <h4>No tasks yet</h4>
                        <p>Get started by creating your first task</p>
                        <button class="btn btn-primary" id="createFirstTaskBtn">Create Task</button>
                    </div>
                `;
        document.getElementById('createFirstTaskBtn').addEventListener('click', showCreateModal);
        return;
    }

    // Filter tasks based on selected filters
    const statusValue = statusFilter.value;
    const priorityValue = priorityFilter.value;
    const assigneeValue = assigneeFilter.value;
    const projectValue = projectFilter.value;

    const filteredTasks = tasks.filter(task => {
        let statusMatch = true;
        let priorityMatch = true;
        let assigneeMatch = true;
        let projectMatch = true;

        if (statusValue !== 'all') {
            statusMatch = task.status === statusValue;
        }

        if (priorityValue !== 'all') {
            priorityMatch = task.priority === priorityValue;
        }

        if (assigneeValue !== 'all') {
            if (assigneeValue === 'me') {
                assigneeMatch = task.assigned_to === currentUser.id;
            } else if (assigneeValue === 'team') {
                assigneeMatch = task.assigned_to !== currentUser.id;
            }
        }

        if (projectValue !== 'all') {
            projectMatch = task.project_id === projectValue;
        }

        return statusMatch && priorityMatch && assigneeMatch && projectMatch;
    });

    if (filteredTasks.length === 0) {
        tasksContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h4>No tasks match your filters</h4>
                        <p>Try adjusting your filters to see more tasks</p>
                    </div>
                `;
        return;
    }

    // Render tasks
    filteredTasks.forEach(task => {
        const project = projects.find(p => p.id === task.project_id);
        const isCompleted = task.status === 'completed';
        const assignee = teamMembersList.find(m => m.id === task.assigned_to);

        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${isCompleted ? 'completed' : ''}`;
        taskCard.innerHTML = `
                    <div class="task-card-header">
                        <div class="task-title">${task.title}</div>
                        <span class="task-priority ${task.priority}-priority">${task.priority}</span>
                    </div>
                    <div class="task-card-body">
                        <div class="task-description">${task.description || 'No description'}</div>
                        <div class="task-meta">
                            <div class="task-meta-item">
                                <i class="fas fa-project-diagram"></i>
                                <span>${project ? project.name : 'No Project'}</span>
                            </div>
                            <div class="task-meta-item">
                                <i class="fas fa-calendar"></i>
                                <span>${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                            </div>
                            <div class="task-meta-item">
                                <i class="fas fa-${task.status === 'completed' ? 'check-circle' : 'clock'}"></i>
                                <span>${task.status.replace('-', ' ')}</span>
                            </div>
                            ${task.budgeted_hours ? `
                            <div class="task-meta-item">
                                <i class="fas fa-dollar-sign"></i>
                                <span>${task.budgeted_hours} hrs budgeted</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="task-card-footer">
                        <div class="task-assignee">
                            ${assignee ? `
                                <div class="assignee-avatar">${assignee.first_name.charAt(0)}${assignee.last_name.charAt(0)}</div>
                                <span>${assignee.first_name} ${assignee.last_name}</span>
                            ` : `
                                <div class="assignee-avatar">?</div>
                                <span>Unassigned</span>
                            `}
                        </div>
                        <div class="task-actions">
                            <input type="checkbox" id="complete-${task.id}" class="complete-checkbox" ${isCompleted ? 'checked' : ''}>
                            <label for="complete-${task.id}" class="complete-label">Complete</label>
                            <button class="btn btn-icon edit-task" data-id="${task.id}" title="Edit task">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-icon delete-task" data-id="${task.id}" title="Delete task">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;

        tasksContainer.appendChild(taskCard);

        // Add event listener to complete checkbox
        const completeCheckbox = document.getElementById(`complete-${task.id}`);
        completeCheckbox.addEventListener('change', () => {
            toggleTaskCompletion(task.id);
        });
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.edit-task').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.currentTarget.getAttribute('data-id');
            editTask(taskId);
        });
    });

    document.querySelectorAll('.delete-task').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.currentTarget.getAttribute('data-id');
            deleteTask(taskId);
        });
    });
}

// Render milestones list
function renderMilestonesList() {
    milestonesContainer.innerHTML = '';

    if (milestones.length === 0) {
        milestonesContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-flag"></i>
                        <h4>No milestones yet</h4>
                        <p>Get started by creating your first milestone</p>
                    </div>
                `;
        return;
    }

    // Filter milestones based on selected project and status
    const projectValue = milestoneProjectFilter.value;
    const statusValue = milestoneStatusFilter.value;

    const filteredMilestones = milestones.filter(milestone => {
        let projectMatch = true;
        let statusMatch = true;

        if (projectValue !== 'all') {
            projectMatch = milestone.project_id === projectValue;
        }

        if (statusValue !== 'all') {
            statusMatch = milestone.status === statusValue;
        }

        return projectMatch && statusMatch;
    });

    if (filteredMilestones.length === 0) {
        milestonesContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h4>No milestones match your filters</h4>
                        <p>Try adjusting your filters to see more milestones</p>
                    </div>
                `;
        return;
    }

    // Render milestones
    filteredMilestones.forEach(milestone => {
        const project = projects.find(p => p.id === milestone.project_id);

        const milestoneCard = document.createElement('div');
        milestoneCard.className = 'task-card';
        milestoneCard.innerHTML = `
                    <div class="task-card-header">
                        <div class="task-title">${milestone.title}</div>
                        <span class="task-priority ${milestone.status}-priority">${milestone.status}</span>
                    </div>
                    <div class="task-card-body">
                        <div class="task-description">${milestone.description || 'No description'}</div>
                        <div class="task-meta">
                            <div class="task-meta-item">
                                <i class="fas fa-project-diagram"></i>
                                <span>${project ? project.name : 'No Project'}</span>
                            </div>
                            <div class="task-meta-item">
                                <i class="fas fa-calendar"></i>
                                <span>${new Date(milestone.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="task-card-footer">
                        <div class="task-assignee">
                            <i class="fas fa-flag"></i>
                            <span>Project Milestone</span>
                        </div>
                        <div class="task-actions">
                            <button class="btn btn-icon edit-milestone" data-id="${milestone.id}" title="Edit milestone">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-icon delete-milestone" data-id="${milestone.id}" title="Delete milestone">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;

        milestonesContainer.appendChild(milestoneCard);
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.edit-milestone').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const milestoneId = e.currentTarget.getAttribute('data-id');
            editMilestone(milestoneId);
        });
    });

    document.querySelectorAll('.delete-milestone').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const milestoneId = e.currentTarget.getAttribute('data-id');
            deleteMilestone(milestoneId);
        });
    });
}

// Render reminders list
function renderRemindersList() {
    remindersContainer.innerHTML = '';

    // In a real app, you would fetch reminders from the database
    // For now, we'll just show a placeholder message

    remindersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell"></i>
                    <h4>No reminders yet</h4>
                    <p>Set reminders for your important tasks</p>
                </div>
            `;
}

// Render resource timeline
function renderResourceTimeline() {
    // Clear previous timeline
    resourceTimeline.innerHTML = '';

    // Add day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        resourceTimeline.appendChild(dayHeader);
    });

    // Calculate dates for the week
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        weekDates.push(date);

        const dayCell = document.createElement('div');
        dayCell.className = 'timeline-day';

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayCell.appendChild(dayNumber);

        // Add tasks for this day
        const dayTasks = tasks.filter(task => {
            if (!task.due_date) return false;
            const taskDate = new Date(task.due_date);
            return taskDate.toDateString() === date.toDateString();
        });

        dayTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `timeline-task ${task.priority}-priority`;
            taskElement.textContent = task.title;
            taskElement.title = `${task.title}`;
            dayCell.appendChild(taskElement);
        });

        resourceTimeline.appendChild(dayCell);
    }

    // Check for resource conflicts
    checkResourceConflicts();
}

// Render Gantt chart
function renderGanttChart() {
    // Clear previous Gantt chart
    ganttPeriod.innerHTML = '';

    // Calculate dates for the month
    const startDate = new Date(currentDate);
    startDate.setDate(1);
    const endDate = new Date(currentDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);

    const daysInMonth = endDate.getDate();

    // Add day headers
    for (let i = 1; i <= daysInMonth; i++) {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'gantt-day';
        dayHeader.textContent = i;
        ganttPeriod.appendChild(dayHeader);
    }

    // In a real implementation, you would add task bars to the Gantt chart
    // This is a simplified version for demonstration
}

// Render templates
function renderTemplates() {
    templateSelector.innerHTML = '';

    if (templates.length === 0) {
        templateSelector.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-layer-group"></i>
                        <h4>No templates yet</h4>
                        <p>Get started by creating your first template</p>
                    </div>
                `;
        return;
    }

    templates.forEach(template => {
        const templateCard = document.createElement('div');
        templateCard.className = 'template-card';
        templateCard.innerHTML = `
                    <div class="template-name">${template.name}</div>
                    <div class="template-desc">${template.description || 'No description'}</div>
                    <div class="template-meta">
                        <small>Project type: ${template.project_type}</small>
                    </div>
                `;

        templateCard.addEventListener('click', () => {
            useTemplate(template.id);
        });

        templateSelector.appendChild(templateCard);
    });
}

// Check for resource conflicts
function checkResourceConflicts() {
    // Simple conflict detection - same person assigned to multiple tasks on same day
    const conflicts = {};

    tasks.forEach(task => {
        if (task.assigned_to && task.due_date) {
            const key = `${task.assigned_to}-${task.due_date}`;
            if (conflicts[key]) {
                conflicts[key].count++;
            } else {
                conflicts[key] = {
                    count: 1,
                    assignee: task.assigned_to,
                    date: task.due_date
                };
            }
        }
    });

    // Highlight conflicts
    Object.values(conflicts).forEach(conflict => {
        if (conflict.count > 1) {
            const conflictDate = new Date(conflict.date);
            const dayIndex = Math.floor((conflictDate - currentWeekStart) / (1000 * 60 * 60 * 24)) + 7; // +7 for day headers

            if (dayIndex >= 7 && dayIndex < 14) {
                const dayCell = resourceTimeline.children[dayIndex];
                const conflictMarker = document.createElement('div');
                conflictMarker.className = 'timeline-task conflict';
                conflictMarker.textContent = `Resource conflict: ${conflict.count} tasks`;
                conflictMarker.title = `Has ${conflict.count} tasks on this day`;
                dayCell.appendChild(conflictMarker);
            }
        }
    });
}

// Toggle task completion
async function toggleTaskCompletion(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    // Update task in database
    const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', id);

    if (error) {
        console.error('Error updating task:', error);
        showToast('Error updating task', 'error');
        return;
    }

    // Update local state
    task.status = newStatus;

    // Re-render the views
    renderCalendar();
    renderTasksList();

    // Show notification
    showToast(`Task marked as ${newStatus}`, 'success');
}

// Edit task
async function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    modalTitle.textContent = 'Edit Task';
    taskForm.reset();

    // Fill form with task data
    taskId.value = task.id;
    document.getElementById('taskTitle').value = task.title || '';
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskProject').value = task.project_id || '';
    document.getElementById('taskDueDate').value = task.due_date || '';
    document.getElementById('taskPriority').value = task.priority || 'medium';
    document.getElementById('taskStatus').value = task.status || 'pending';
    document.getElementById('taskReminder').value = task.reminder_minutes || '';
    document.getElementById('taskBudget').value = task.budgeted_hours || '';

    // Set assigned team member
    document.querySelectorAll('.team-member').forEach(member => {
        member.classList.remove('selected');
        if (member.getAttribute('data-user-id') === task.assigned_to) {
            member.classList.add('selected');
            selectedAssignee = task.assigned_to;
        }
    });

    // Show comments and attachments sections for existing tasks
    taskCommentsSection.style.display = 'block';
    taskAttachmentsSection.style.display = 'block';

    // Load comments and attachments
    await loadTaskComments(id);
    await loadTaskAttachments(id);

    currentTaskId = id;

    taskModal.classList.add('active');
}

// Edit milestone
function editMilestone(id) {
    const milestone = milestones.find(m => m.id === id);
    if (!milestone) return;

    milestoneModalTitle.textContent = 'Edit Milestone';
    milestoneForm.reset();

    // Fill form with milestone data
    milestoneId.value = milestone.id;
    document.getElementById('milestoneTitle').value = milestone.title || '';
    document.getElementById('milestoneDescription').value = milestone.description || '';
    document.getElementById('milestoneProject').value = milestone.project_id || '';
    document.getElementById('milestoneDate').value = milestone.date || '';
    document.getElementById('milestoneStatus').value = milestone.status || 'upcoming';

    milestoneModal.classList.add('active');
}

// Load task comments
async function loadTaskComments(taskId) {
    try {
        const { data: comments, error } = await supabase
            .from('task_comments')
            .select(`
                        *,
                        user:users(first_name, last_name)
                    `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        taskComments.innerHTML = '';

        if (comments.length === 0) {
            taskComments.innerHTML = '<p>No comments yet</p>';
            return;
        }

        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                        <div class="comment-avatar">${comment.user.first_name.charAt(0)}${comment.user.last_name.charAt(0)}</div>
                        <div class="comment-content">
                            <div class="comment-author">${comment.user.first_name} ${comment.user.last_name}</div>
                            <div class="comment-time">${new Date(comment.created_at).toLocaleString()}</div>
                            <div class="comment-text">${comment.comment}</div>
                        </div>
                    `;
            taskComments.appendChild(commentElement);
        });
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// Load task attachments
async function loadTaskAttachments(taskId) {
    try {
        const { data: attachments, error } = await supabase
            .from('task_attachments')
            .select(`
                        *,
                        user:users(first_name, last_name)
                    `)
            .eq('task_id', taskId)
            .order('uploaded_at', { ascending: false });

        if (error) throw error;

        taskAttachments.innerHTML = '';

        if (attachments.length === 0) {
            taskAttachments.innerHTML = '<p>No attachments yet</p>';
            return;
        }

        attachments.forEach(attachment => {
            const attachmentElement = document.createElement('div');
            attachmentElement.className = 'attachment-item';
            attachmentElement.innerHTML = `
                        <div class="attachment-icon">
                            <i class="fas fa-file"></i>
                        </div>
                        <div class="attachment-info">
                            <div class="attachment-name">${attachment.file_name}</div>
                            <div class="attachment-size">Uploaded by ${attachment.user.first_name} on ${new Date(attachment.uploaded_at).toLocaleDateString()}</div>
                        </div>
                        <button class="btn btn-icon download-attachment" data-url="${attachment.file_url}">
                            <i class="fas fa-download"></i>
                        </button>
                    `;
            taskAttachments.appendChild(attachmentElement);
        });

        // Add event listeners to download buttons
        document.querySelectorAll('.download-attachment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.currentTarget.getAttribute('data-url');
                window.open(url, '_blank');
            });
        });
    } catch (error) {
        console.error('Error loading attachments:', error);
    }
}

// Add comment to task
async function addComment() {
    const comment = commentInput.value.trim();
    if (!comment || !currentTaskId) return;

    try {
        const { error } = await supabase
            .from('task_comments')
            .insert({
                task_id: currentTaskId,
                user_id: currentUser.id,
                comment: comment
            });

        if (error) throw error;

        // Clear input
        commentInput.value = '';

        // Reload comments
        await loadTaskComments(currentTaskId);

        showToast('Comment added', 'success');
    } catch (error) {
        console.error('Error adding comment:', error);
        showToast('Error adding comment', 'error');
    }
}

// Upload attachment
async function uploadAttachment() {
    if (!taskAttachment.files.length || !currentTaskId) return;

    const file = taskAttachment.files[0];
    const fileName = `${Date.now()}_${file.name}`;

    try {
        // Upload file to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
            .from('task-attachments')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('task-attachments')
            .getPublicUrl(fileName);

        // Add attachment record to database
        const { error: dbError } = await supabase
            .from('task_attachments')
            .insert({
                task_id: currentTaskId,
                file_name: file.name,
                file_url: publicUrl,
                uploaded_by: currentUser.id
            });

        if (dbError) throw dbError;

        // Clear input
        taskAttachment.value = '';

        // Reload attachments
        await loadTaskAttachments(currentTaskId);

        showToast('Attachment uploaded', 'success');
    } catch (error) {
        console.error('Error uploading attachment:', error);
        showToast('Error uploading attachment', 'error');
    }
}

// Delete task
async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Remove from local state
        tasks = tasks.filter(task => task.id !== id);

        // Re-render views
        renderCalendar();
        renderTasksList();
        renderResourceTimeline();

        showToast('Task deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting task:', error);
        showToast('Error deleting task', 'error');
    }
}

// Delete milestone
async function deleteMilestone(id) {
    if (!confirm('Are you sure you want to delete this milestone?')) return;

    try {
        const { error } = await supabase
            .from('milestones')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Remove from local state
        milestones = milestones.filter(milestone => milestone.id !== id);

        // Re-render views
        renderCalendar();
        renderMilestonesList();

        showToast('Milestone deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting milestone:', error);
        showToast('Error deleting milestone', 'error');
    }
}

// Delete reminder
function deleteReminder(id) {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    // In a real app, you would delete from the database
    reminders = reminders.filter(reminder => reminder.id !== id);
    renderRemindersList();

    showToast('Reminder deleted successfully', 'success');
}

// Save task
async function saveTaskHandler() {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const project_id = document.getElementById('taskProject').value;
    const due_date = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;
    const reminder_minutes = document.getElementById('taskReminder').value;
    const budgeted_hours = document.getElementById('taskBudget').value;
    const id = taskId.value;

    // Validate required fields
    if (!title || !project_id || !due_date) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const taskData = {
        title,
        description,
        project_id,
        due_date,
        priority,
        status,
        assigned_to: selectedAssignee,
        reminder_minutes: reminder_minutes || null,
        budgeted_hours: budgeted_hours || null,
        company_id: currentCompany.id
    };

    try {
        if (id) {
            // Update existing task
            const { error } = await supabase
                .from('tasks')
                .update(taskData)
                .eq('id', id);

            if (error) throw error;

            showToast('Task updated successfully', 'success');
        } else {
            // Create new task
            const { data, error } = await supabase
                .from('tasks')
                .insert([taskData])
                .select();

            if (error) throw error;

            // Add to local state
            tasks.push(data[0]);

            showToast('Task created successfully', 'success');
        }

        // Close modal and reload tasks
        taskModal.classList.remove('active');
        renderCalendar();
        renderTasksList();
        renderResourceTimeline();

    } catch (error) {
        console.error('Error saving task:', error);
        showToast('Error saving task', 'error');
    }
}

// Save milestone
async function saveMilestoneHandler() {
    const title = document.getElementById('milestoneTitle').value;
    const description = document.getElementById('milestoneDescription').value;
    const project_id = document.getElementById('milestoneProject').value;
    const date = document.getElementById('milestoneDate').value;
    const status = document.getElementById('milestoneStatus').value;
    const id = milestoneId.value;

    // Validate required fields
    if (!title || !project_id || !date) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const milestoneData = {
        title,
        description,
        project_id,
        date,
        status,
        company_id: currentCompany.id
    };

    try {
        if (id) {
            // Update existing milestone
            const { error } = await supabase
                .from('milestones')
                .update(milestoneData)
                .eq('id', id);

            if (error) throw error;

            showToast('Milestone updated successfully', 'success');
        } else {
            // Create new milestone
            const { data, error } = await supabase
                .from('milestones')
                .insert([milestoneData])
                .select();

            if (error) throw error;

            // Add to local state
            milestones.push(data[0]);

            showToast('Milestone created successfully', 'success');
        }

        // Close modal and reload milestones
        milestoneModal.classList.remove('active');
        renderCalendar();
        renderMilestonesList();

    } catch (error) {
        console.error('Error saving milestone:', error);
        showToast('Error saving milestone', 'error');
    }
}

// Save template
async function saveTemplateHandler() {
    const name = document.getElementById('templateName').value;
    const description = document.getElementById('templateDescription').value;
    const project_type = document.getElementById('templateProjectType').value;
    const id = templateId.value;

    // Validate required fields
    if (!name || !project_type) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    // In a real app, you would save the template to the database
    // This is a simplified version for demonstration

    showToast('Template functionality would be fully implemented in a production version', 'info');
    templateModal.classList.remove('active');
}

// Use template
function useTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    showCreateModal();
    showToast(`Template "${template.name}" selected. Tasks would be created based on this template.`, 'info');
}

// Sync with Google Calendar
function syncWithGoogle() {
    // Show syncing status
    const syncStatus = document.querySelector('.sync-status');
    if (syncStatus) {
        syncStatus.className = 'sync-status syncing';
        syncStatus.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i><span>Syncing with Google Calendar...</span>';
    }

    // Simulate API call
    setTimeout(() => {
        if (syncStatus) {
            syncStatus.className = 'sync-status success';
            syncStatus.innerHTML = '<i class="fas fa-check-circle"></i><span>Synced with Google Calendar</span>';
        }
        showToast('Successfully synced with Google Calendar!', 'success');
    }, 2000);
}

// Sync with Outlook
function syncWithOutlook() {
    // Show syncing status
    const syncStatus = document.querySelectorAll('.sync-status')[1];
    if (syncStatus) {
        syncStatus.className = 'sync-status syncing';
        syncStatus.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i><span>Connecting to Outlook...</span>';
    }

    // Simulate API call
    setTimeout(() => {
        if (syncStatus) {
            syncStatus.className = 'sync-status success';
            syncStatus.innerHTML = '<i class="fas fa-check-circle"></i><span>Connected to Outlook</span>';
        }
        showToast('Successfully connected to Outlook!', 'success');
    }, 2000);
}

// AI Assistant message
function sendAIMessage() {
    const message = aiInput.value.trim();
    if (!message) return;

    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'ai-message user';
    userMessage.textContent = message;
    aiMessages.appendChild(userMessage);

    // Clear input
    aiInput.value = '';

    // Simulate AI response
    setTimeout(() => {
        const aiResponse = document.createElement('div');
        aiResponse.className = 'ai-message';

        // Simple response logic based on message content
        if (message.toLowerCase().includes('schedule') || message.toLowerCase().includes('calendar')) {
            aiResponse.textContent = 'I can help you with scheduling. Would you like me to find available time slots for your team?';
        } else if (message.toLowerCase().includes('task') || message.toLowerCase().includes('assign')) {
            aiResponse.textContent = 'I can assist with task assignment. Which team member would you like to assign tasks to?';
        } else if (message.toLowerCase().includes('report') || message.toLowerCase().includes('status')) {
            aiResponse.textContent = 'I can generate a status report for you. Which project would you like a report for?';
        } else {
            aiResponse.textContent = 'I\'m here to help with your task management needs. How can I assist you today?';
        }

        aiMessages.appendChild(aiResponse);
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }, 1000);
}

// Show toast notification
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
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

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Profile dropdown
    profileMenu.addEventListener('click', () => {
        profileDropdown.classList.toggle('active');
    });

    // Logout
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });

    // Create task button
    createTaskBtn.addEventListener('click', showCreateModal);

    // Create milestone button
    createMilestoneBtn.addEventListener('click', showCreateMilestoneModal);

    // Use template button
    useTemplateBtn.addEventListener('click', () => {
        switchTab('templates');
    });

    // Create template button
    createTemplateBtn.addEventListener('click', showCreateTemplateModal);

    // View toggle
    calendarViewBtn.addEventListener('click', switchToCalendarView);
    listViewBtn.addEventListener('click', switchToListView);
    resourceViewBtn.addEventListener('click', switchToResourceView);
    ganttViewBtn.addEventListener('click', switchToGanttView);

    // Calendar navigation
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });

    // Resource view navigation
    prevWeekBtn.addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        renderResourceTimeline();
    });

    nextWeekBtn.addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        renderResourceTimeline();
    });

    thisWeekBtn.addEventListener('click', () => {
        currentWeekStart = new Date();
        // Set to Monday of this week
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1);
        renderResourceTimeline();
    });

    // Gantt view navigation
    prevWeekGanttBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderGanttChart();
    });

    nextWeekGanttBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderGanttChart();
    });

    thisWeekGanttBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderGanttChart();
    });

    // Filter events
    statusFilter.addEventListener('change', renderTasksList);
    priorityFilter.addEventListener('change', renderTasksList);
    assigneeFilter.addEventListener('change', renderTasksList);
    projectFilter.addEventListener('change', renderTasksList);
    milestoneProjectFilter.addEventListener('change', renderMilestonesList);
    milestoneStatusFilter.addEventListener('change', renderMilestonesList);

    // Search functionality
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = searchInput.value.trim().toLowerCase();
            // In a real app, this would filter tasks
            showToast(`Searching for: ${searchTerm}`, 'info');
        }
    });

    // Team member selection
    document.addEventListener('click', (e) => {
        if (e.target.closest('.team-member')) {
            const member = e.target.closest('.team-member');
            document.querySelectorAll('.team-member').forEach(m => {
                m.classList.remove('selected');
            });
            member.classList.add('selected');
            selectedAssignee = member.getAttribute('data-user-id');
        }
    });

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Add reminder button
    addReminderBtn.addEventListener('click', () => {
        showToast('Add reminder functionality would be implemented here', 'info');
    });

    // Sync buttons
    syncGoogleBtn.addEventListener('click', syncWithGoogle);
    syncOutlookBtn.addEventListener('click', syncWithOutlook);
    syncCalendarBtn.addEventListener('click', () => {
        showToast('Calendar sync started', 'info');
    });

    // AI Assistant
    aiAssistantLink.addEventListener('click', showAIAssistant);
    closeAIAssistant.addEventListener('click', () => {
        aiAssistant.style.display = 'none';
    });
    sendAIMessage.addEventListener('click', sendAIMessage);
    aiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendAIMessage();
    });

    // Add comment
    addCommentBtn.addEventListener('click', addComment);
    commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addComment();
    });

    // Upload attachment
    taskAttachment.addEventListener('change', uploadAttachment);

    // Modal events
    closeModal.addEventListener('click', () => {
        taskModal.classList.remove('active');
    });

    closeMilestoneModal.addEventListener('click', () => {
        milestoneModal.classList.remove('active');
    });

    closeTemplateModal.addEventListener('click', () => {
        templateModal.classList.remove('active');
    });

    cancelTask.addEventListener('click', () => {
        taskModal.classList.remove('active');
    });

    cancelMilestone.addEventListener('click', () => {
        milestoneModal.classList.remove('active');
    });

    cancelTemplate.addEventListener('click', () => {
        templateModal.classList.remove('active');
    });

    saveTask.addEventListener('click', saveTaskHandler);

    saveMilestone.addEventListener('click', saveMilestoneHandler);

    saveTemplate.addEventListener('click', saveTemplateHandler);

    // Add template task
    addTemplateTaskBtn.addEventListener('click', () => {
        const taskElement = document.createElement('div');
        taskElement.className = 'form-group';
        taskElement.innerHTML = `
                    <input type="text" class="form-control" placeholder="Task title">
                    <textarea class="form-control" placeholder="Task description" rows="2"></textarea>
                `;
        templateTasks.appendChild(taskElement);
    });

    // Close modal when clicking outside
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            taskModal.classList.remove('active');
        }
    });

    milestoneModal.addEventListener('click', (e) => {
        if (e.target === milestoneModal) {
            milestoneModal.classList.remove('active');
        }
    });

    templateModal.addEventListener('click', (e) => {
        if (e.target === templateModal) {
            templateModal.classList.remove('active');
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!profileMenu.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('active');
        }
    });

    // Pro feature links
    teamLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUserTier !== 'pro' && currentUserTier !== 'enterprise') {
            showToast('Team features require a Pro subscription', 'info');
        } else {
            showToast('Team management would open here', 'info');
        }
    });

    calendarSyncLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUserTier !== 'pro' && currentUserTier !== 'enterprise') {
            showToast('Calendar sync requires a Pro subscription', 'info');
        } else {
            switchTab('sync');
        }
    });

    milestonesLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUserTier !== 'pro' && currentUserTier !== 'enterprise') {
            showToast('Milestones require a Pro subscription', 'info');
        } else {
            switchTab('milestones');
        }
    });

    ganttLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUserTier !== 'enterprise') {
            showToast('Gantt charts require an Enterprise subscription', 'info');
        } else {
            switchToGanttView();
        }
    });

    aiAssistantLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUserTier !== 'enterprise') {
            showToast('AI Assistant requires an Enterprise subscription', 'info');
        } else {
            showAIAssistant();
        }
    });
}

// Initialize TaskFlow page
initTaskFlowPage();