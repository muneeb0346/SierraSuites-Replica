// Supabase configuration
const SUPABASE_URL = 'https://qjswuwcqyzeuqqqltykz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqc3d1d2NxeXpldXFxcWx0eWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjk0MDAsImV4cCI6MjA3MDgwNTQwMH0.qgH8DMJEoJVuYOXSyr0RAj01Yt7bBR8EYL6qw3YXyAs';

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.querySelector('.sidebar-toggle');
const exportReportBtn = document.getElementById('export-report-btn');
const exportModal = document.getElementById('export-modal');
const customRangeModal = document.getElementById('custom-range-modal');
const modalCloseButtons = document.querySelectorAll('.modal-close');
const exportOptions = document.querySelectorAll('.export-option');
const userTierElement = document.getElementById('user-tier');
const userNameElement = document.getElementById('user-name');
const userEmailElement = document.getElementById('user-email');
const userAvatarElement = document.getElementById('user-avatar');
const reportTypeSelector = document.getElementById('report-type');
const dateRangeSelector = document.getElementById('report-range');
const contentContainer = document.getElementById('content-container');
const applyDateRangeBtn = document.getElementById('apply-date-range');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');

// Set default date values
const today = new Date();
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(today.getDate() - 30);

startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
endDateInput.value = today.toISOString().split('T')[0];

// Global variables
let currentReportType = 'time-tracking';
let currentDateRange = '30';
let currentStartDate = thirtyDaysAgo;
let currentEndDate = today;
let chartInstances = {};
let reportData = {};

// Mobile menu toggle
menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Sidebar toggle for desktop
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const icon = sidebarToggle.querySelector('i');
    if (sidebar.classList.contains('collapsed')) {
        icon.classList.remove('fa-chevron-left');
        icon.classList.add('fa-chevron-right');
    } else {
        icon.classList.remove('fa-chevron-right');
        icon.classList.add('fa-chevron-left');
    }
});

// Export modal
exportReportBtn.addEventListener('click', () => {
    exportModal.classList.add('active');
});

// Close modals
modalCloseButtons.forEach(button => {
    button.addEventListener('click', () => {
        exportModal.classList.remove('active');
        customRangeModal.classList.remove('active');
    });
});

exportOptions.forEach(option => {
    option.addEventListener('click', () => {
        const format = option.getAttribute('data-format');
        exportData(format);
        exportModal.classList.remove('active');
    });
});

// Report type change
reportTypeSelector.addEventListener('change', (e) => {
    currentReportType = e.target.value;
    loadReportData();
});

// Date range change
dateRangeSelector.addEventListener('change', (e) => {
    const value = e.target.value;

    if (value === 'custom') {
        customRangeModal.classList.add('active');
    } else {
        currentDateRange = value;
        calculateDateRange();
        loadReportData();
    }
});

// Apply custom date range
applyDateRangeBtn.addEventListener('click', () => {
    currentStartDate = new Date(startDateInput.value);
    currentEndDate = new Date(endDateInput.value);
    currentDateRange = 'custom';
    customRangeModal.classList.remove('active');
    loadReportData();
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === exportModal) {
        exportModal.classList.remove('active');
    }
    if (e.target === customRangeModal) {
        customRangeModal.classList.remove('active');
    }
});

// Calculate date range based on selection
function calculateDateRange() {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of day

    switch (currentDateRange) {
        case '7':
            currentStartDate = new Date();
            currentStartDate.setDate(today.getDate() - 7);
            currentStartDate.setHours(0, 0, 0, 0);
            break;
        case '30':
            currentStartDate = new Date();
            currentStartDate.setDate(today.getDate() - 30);
            currentStartDate.setHours(0, 0, 0, 0);
            break;
        case 'this-month':
            currentStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
            currentStartDate.setHours(0, 0, 0, 0);
            break;
        case 'last-month':
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            currentStartDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
            currentStartDate.setHours(0, 0, 0, 0);
            currentEndDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
            currentEndDate.setHours(23, 59, 59, 999);
            break;
    }

    if (currentDateRange !== 'last-month' && currentDateRange !== 'custom') {
        currentEndDate = today;
    }
}

// Load user data from Supabase
async function loadUserData() {
    try {
        // Get the current user from Supabase
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            console.error('Error fetching user:', error);
            return;
        }

        if (user) {
            // Update user info in the UI
            userNameElement.textContent = user.user_metadata?.full_name || 'User';
            userEmailElement.textContent = user.email;
            userAvatarElement.textContent = user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U';

            // Fetch user profile from your profiles table
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!profileError && profile) {
                // Update tier information if available
                if (profile.tier) {
                    userTierElement.textContent = `${profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)} Plan`;
                    userTierElement.className = `tier-label tier-${profile.tier}`;

                    // Show/hide features based on tier
                    document.getElementById('starter-feature').style.display = 'block';
                    document.getElementById('pro-feature').style.display = profile.tier === 'pro' || profile.tier === 'enterprise' ? 'block' : 'none';
                    document.getElementById('enterprise-feature').style.display = profile.tier === 'enterprise' ? 'block' : 'none';
                    document.getElementById('project-analytics-feature').style.display = profile.tier === 'pro' || profile.tier === 'enterprise' ? 'block' : 'none';
                    document.getElementById('financial-reporting-feature').style.display = profile.tier === 'pro' || profile.tier === 'enterprise' ? 'block' : 'none';
                    document.getElementById('operations-efficiency-feature').style.display = 'block';
                }
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load report data from Supabase
async function loadReportData() {
    // Show loading state
    contentContainer.classList.add('loading');

    try {
        // Calculate date range
        calculateDateRange();

        // Format dates for Supabase query
        const startDateStr = currentStartDate.toISOString();
        const endDateStr = currentEndDate.toISOString();

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error('No user logged in');
            return;
        }

        // Fetch data based on report type
        switch (currentReportType) {
            case 'time-tracking':
                await fetchTimeTrackingData(user.id, startDateStr, endDateStr);
                break;
            case 'project-progress':
                await fetchProjectProgressData(user.id, startDateStr, endDateStr);
                break;
            case 'financial-overview':
                await fetchFinancialData(user.id, startDateStr, endDateStr);
                break;
            case 'task-completion':
                await fetchTaskCompletionData(user.id, startDateStr, endDateStr);
                break;
            case 'project-analytics':
                await fetchProjectPerformanceData(user.id, startDateStr, endDateStr);
                break;
            case 'financial-reporting':
                await fetchFinancialReportingData(user.id, startDateStr, endDateStr);
                break;
            case 'operations-efficiency':
                await fetchOperationsEfficiencyData(user.id, startDateStr, endDateStr);
                break;
        }

        // Update UI with new data
        updateReportUI();

    } catch (error) {
        console.error('Error loading report data:', error);
        alert('Failed to load report data. Please try again.');
    } finally {
        // Remove loading state
        contentContainer.classList.remove('loading');
    }
}

// Fetch time tracking data from Supabase
async function fetchTimeTrackingData(userId, startDate, endDate) {
    try {
        // Fetch time entries for the user within the date range
        const { data: timeEntries, error } = await supabase
            .from('time_entries')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching time entries:', error);
            return;
        }

        // Fetch projects for the user
        const { data: projects } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId);

        // Fetch milestones for the user
        const { data: milestones } = await supabase
            .from('milestones')
            .select('*')
            .eq('user_id', userId)
            .order('due_date', { ascending: true });

        // Calculate summary data
        const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
        const activeProjects = projects ? projects.filter(p => p.status === 'active').length : 0;

        // For demo purposes, we'll use mock data for charts
        // In a real implementation, you would process your actual data
        reportData = {
            totalHours: totalHours,
            hoursChange: 12, // This would be calculated by comparing to previous period
            activeProjects: activeProjects,
            completedTasks: 24, // This would come from your tasks data
            tasksChange: 8, // This would be calculated by comparing to previous period
            estimatedRevenue: 24500, // This would be calculated from your projects
            timeEntries: timeEntries.map(entry => ({
                project: entry.project_name || 'Unknown Project',
                task: entry.task_description || 'No description',
                date: entry.date,
                hours: entry.hours
            })),
            milestones: milestones ? milestones.map(milestone => ({
                name: milestone.name,
                project: milestone.project_name || 'Unknown Project',
                status: milestone.status,
                date: milestone.due_date
            })) : [],
            timeChartData: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                data: [6.5, 8, 7.5, 9, 8.5, 4]
            },
            progressChartData: {
                labels: ['Completed', 'In Progress', 'Not Started'],
                data: [45, 35, 20]
            },
            taskChartData: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                data: [12, 19, 15, 24]
            },
            financialChartData: {
                labels: ['Materials', 'Labor', 'Subcontractors', 'Equipment', 'Other'],
                budget: [12000, 15000, 8000, 4000, 3000],
                actual: [12500, 14500, 8500, 4200, 3200]
            }
        };

    } catch (error) {
        console.error('Error fetching time tracking data:', error);
    }
}

// Fetch project performance data (Pro/Enterprise tier)
async function fetchProjectPerformanceData(userId, startDate, endDate) {
    try {
        // Fetch projects with budget and actual costs
        const { data: projects, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        if (error) {
            console.error('Error fetching projects:', error);
            return;
        }

        // Calculate profitability and EVM metrics (simplified)
        const profitabilityData = {
            labels: projects ? projects.map(p => p.name) : ['Project A', 'Project B', 'Project C'],
            budget: projects ? projects.map(p => p.budget || 0) : [50000, 75000, 60000],
            actual: projects ? projects.map(p => p.actual_cost || 0) : [52000, 70000, 62000]
        };

        const evmData = {
            labels: ['PV', 'EV', 'AC'],
            data: [30000, 25000, 28000] // Example values
        };

        // Add to reportData
        reportData.profitabilityData = profitabilityData;
        reportData.evmData = evmData;

        // Update summary data for this report type
        reportData.totalHours = 92.5;
        reportData.hoursChange = 8;
        reportData.activeProjects = projects ? projects.length : 3;
        reportData.completedTasks = 32;
        reportData.tasksChange = 12;
        reportData.estimatedRevenue = 38500;

    } catch (error) {
        console.error('Error fetching project performance data:', error);
    }
}

// Fetch financial reporting data (Pro/Enterprise tier)
async function fetchFinancialReportingData(userId, startDate, endDate) {
    try {
        // Mock data for demonstration - replace with actual Supabase queries
        // Example: fetch invoices and payments
        const agingData = {
            labels: ['0-30 days', '31-60 days', '61-90 days', '90+ days'],
            data: [15000, 5000, 3000, 1000] // Example values
        };

        const cashflowData = {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            inflow: [10000, 15000, 12000, 18000],
            outflow: [8000, 12000, 10000, 14000]
        };

        // Add to reportData
        reportData.agingData = agingData;
        reportData.cashflowData = cashflowData;

        // Update summary data for this report type
        reportData.totalHours = 87.3;
        reportData.hoursChange = 5;
        reportData.activeProjects = 4;
        reportData.completedTasks = 28;
        reportData.tasksChange = 9;
        reportData.estimatedRevenue = 42500;

    } catch (error) {
        console.error('Error fetching financial reporting data:', error);
    }
}

// Fetch operations efficiency data (All tiers)
async function fetchOperationsEfficiencyData(userId, startDate, endDate) {
    try {
        // Mock data for demonstration - replace with actual Supabase queries
        // Example: fetch equipment and safety data
        const equipmentData = {
            labels: ['Excavator', 'Bulldozer', 'Crane', 'Truck'],
            utilization: [75, 60, 85, 90] // Percentage
        };

        const safetyData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            incidents: [5, 3, 2, 4, 1, 2]
        };

        // Add to reportData
        reportData.equipmentData = equipmentData;
        reportData.safetyData = safetyData;

        // Update summary data for this report type
        reportData.totalHours = 105.2;
        reportData.hoursChange = 15;
        reportData.activeProjects = 5;
        reportData.completedTasks = 38;
        reportData.tasksChange = 18;
        reportData.estimatedRevenue = 51200;

    } catch (error) {
        console.error('Error fetching operations efficiency data:', error);
    }
}

// Fetch project progress data (placeholder)
async function fetchProjectProgressData(userId, startDate, endDate) {
    // Similar implementation to fetchTimeTrackingData but for project progress
    // This would query your projects table and related data
    await new Promise(resolve => setTimeout(resolve, 800));

    // Different mock data for project progress report
    reportData = {
        totalHours: 92.3,
        hoursChange: -5,
        activeProjects: 4,
        completedTasks: 32,
        tasksChange: 15,
        estimatedRevenue: 31200,
        // ... other data specific to project progress
    };
}

// Fetch financial data (placeholder)
async function fetchFinancialData(userId, startDate, endDate) {
    // Similar implementation to fetchTimeTrackingData but for financial data
    // This would query your financial data tables
    await new Promise(resolve => setTimeout(resolve, 800));

    // Different mock data for financial report
    reportData = {
        totalHours: 67.8,
        hoursChange: 8,
        activeProjects: 3,
        completedTasks: 28,
        tasksChange: 12,
        estimatedRevenue: 28750,
        // ... other data specific to financial overview
    };
}

// Fetch task completion data (placeholder)
async function fetchTaskCompletionData(userId, startDate, endDate) {
    // Similar implementation to fetchTimeTrackingData but for task completion
    // This would query your tasks table
    await new Promise(resolve => setTimeout(resolve, 800));

    // Different mock data for task completion report
    reportData = {
        totalHours: 78.2,
        hoursChange: 15,
        activeProjects: 3,
        completedTasks: 42,
        tasksChange: 22,
        estimatedRevenue: 26500,
        // ... other data specific to task completion
    };
}

// Update UI with report data
function updateReportUI() {
    // Update summary cards
    document.getElementById('total-hours').textContent = reportData.totalHours.toFixed(1);
    document.getElementById('hours-change').textContent =
        `${reportData.hoursChange >= 0 ? '+' : ''}${reportData.hoursChange}% from last period`;
    document.getElementById('hours-change').className = `summary-change ${reportData.hoursChange >= 0 ? 'up' : 'down'}`;

    document.getElementById('active-projects').textContent = reportData.activeProjects;

    document.getElementById('completed-tasks').textContent = reportData.completedTasks;
    document.getElementById('tasks-change').textContent =
        `${reportData.tasksChange >= 0 ? '+' : ''}${reportData.tasksChange}% from last period`;
    document.getElementById('tasks-change').className = `summary-change ${reportData.tasksChange >= 0 ? 'up' : 'down'}`;

    document.getElementById('estimated-revenue').textContent = `$${reportData.estimatedRevenue.toLocaleString()}`;

    // Update time entries
    const timeEntriesList = document.getElementById('time-entries-list');
    timeEntriesList.innerHTML = '';

    if (reportData.timeEntries && reportData.timeEntries.length > 0) {
        reportData.timeEntries.forEach(entry => {
            const entryElement = document.createElement('div');
            entryElement.className = 'time-entry';
            entryElement.innerHTML = `
                        <div class="entry-info">
                            <h4>${entry.project}</h4>
                            <p>${entry.task}</p>
                        </div>
                        <div class="entry-details">
                            <span>${new Date(entry.date).toLocaleDateString()}</span>
                            <span class="entry-hours">${entry.hours} hours</span>
                        </div>
                    `;
            timeEntriesList.appendChild(entryElement);
        });
    } else {
        timeEntriesList.innerHTML = `
                    <div class="time-entry">
                        <div class="entry-info">
                            <h4>No time entries found</h4>
                            <p>Try selecting a different date range</p>
                        </div>
                        <div class="entry-details">
                            <span>--</span>
                            <span class="entry-hours">0 hours</span>
                        </div>
                    </div>
                `;
    }

    // Update milestones
    const milestonesList = document.getElementById('milestones-list');
    milestonesList.innerHTML = '';

    if (reportData.milestones && reportData.milestones.length > 0) {
        reportData.milestones.forEach(milestone => {
            const milestoneElement = document.createElement('div');
            milestoneElement.className = `milestone-item ${milestone.status}`;
            milestoneElement.innerHTML = `
                        <div class="milestone-icon">
                            <i class="fas ${milestone.status === 'completed' ? 'fa-check-circle' : 'fa-flag'}"></i>
                        </div>
                        <div class="milestone-content">
                            <h4>${milestone.name}</h4>
                            <p>${milestone.project} • ${milestone.status === 'completed' ? 'Completed ' : 'Due '}${new Date(milestone.date).toLocaleDateString()}</p>
                        </div>
                    `;
            milestonesList.appendChild(milestoneElement);
        });
    } else {
        milestonesList.innerHTML = `
                    <div class="milestone-item upcoming">
                        <div class="milestone-icon">
                            <i class="fas fa-flag"></i>
                        </div>
                        <div class="milestone-content">
                            <h4>No milestones found</h4>
                            <p>Try selecting a different date range</p>
                        </div>
                    </div>
                `;
    }

    // Update charts
    updateCharts();
}

// Initialize and update charts
function updateCharts() {
    // Destroy existing chart instances
    Object.values(chartInstances).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });

    // Reinitialize charts with new data
    initCharts();
}

// Initialize charts
function initCharts() {
    // Time Tracking Chart
    const timeCtx = document.getElementById('timeChart').getContext('2d');
    chartInstances.timeChart = new Chart(timeCtx, {
        type: 'bar',
        data: {
            labels: reportData.timeChartData?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            datasets: [{
                label: 'Hours Tracked',
                data: reportData.timeChartData?.data || [6.5, 8, 7.5, 9, 8.5, 4],
                backgroundColor: '#3b82f6',
                borderColor: '#2563eb',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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

    // Project Progress Chart
    const progressCtx = document.getElementById('progressChart').getContext('2d');
    chartInstances.progressChart = new Chart(progressCtx, {
        type: 'doughnut',
        data: {
            labels: reportData.progressChartData?.labels || ['Completed', 'In Progress', 'Not Started'],
            datasets: [{
                data: reportData.progressChartData?.data || [45, 35, 20],
                backgroundColor: ['#10b981', '#3b82f6', '#e5e7eb'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Task Completion Chart
    const taskCtx = document.getElementById('taskChart').getContext('2d');
    chartInstances.taskChart = new Chart(taskCtx, {
        type: 'line',
        data: {
            labels: reportData.taskChartData?.labels || ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Tasks Completed',
                data: reportData.taskChartData?.data || [12, 19, 15, 24],
                fill: false,
                backgroundColor: '#8b5cf6',
                borderColor: '#8b5cf6',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Financial Overview Chart
    const financialCtx = document.getElementById('financialChart').getContext('2d');
    chartInstances.financialChart = new Chart(financialCtx, {
        type: 'bar',
        data: {
            labels: reportData.financialChartData?.labels || ['Materials', 'Labor', 'Subcontractors', 'Equipment', 'Other'],
            datasets: [{
                label: 'Budget',
                data: reportData.financialChartData?.budget || [12000, 15000, 8000, 4000, 3000],
                backgroundColor: '#3b82f6',
                borderColor: '#2563eb',
                borderWidth: 1
            }, {
                label: 'Actual',
                data: reportData.financialChartData?.actual || [12500, 14500, 8500, 4200, 3200],
                backgroundColor: '#10b981',
                borderColor: '#059669',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'USD'
                    }
                }
            }
        }
    });

    // Labor Productivity Chart (Starter feature)
    const laborCtx = document.getElementById('laborChart').getContext('2d');
    chartInstances.laborChart = new Chart(laborCtx, {
        type: 'bar',
        data: {
            labels: ['Project A', 'Project B', 'Project C'],
            datasets: [{
                label: 'Estimated Hours',
                data: [120, 180, 150],
                backgroundColor: '#3b82f6',
                borderColor: '#2563eb',
                borderWidth: 1
            }, {
                label: 'Actual Hours',
                data: [115, 195, 145],
                backgroundColor: '#10b981',
                borderColor: '#059669',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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

    // Material Cost Chart (Pro feature)
    const materialCtx = document.getElementById('materialChart').getContext('2d');
    chartInstances.materialChart = new Chart(materialCtx, {
        type: 'bar',
        data: {
            labels: ['Lumber', 'Concrete', 'Electrical', 'Plumbing', 'Finishing'],
            datasets: [{
                label: 'Budget',
                data: [5000, 3500, 2800, 3200, 4500],
                backgroundColor: '#3b82f6',
                borderColor: '#2563eb',
                borderWidth: 1
            }, {
                label: 'Actual',
                data: [5200, 3700, 3000, 3100, 4800],
                backgroundColor: '#10b981',
                borderColor: '#059669',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'USD'
                    }
                }
            }
        }
    });

    // Subcontractor Performance Chart (Enterprise feature)
    const subcontractorCtx = document.getElementById('subcontractorChart').getContext('2d');
    chartInstances.subcontractorChart = new Chart(subcontractorCtx, {
        type: 'radar',
        data: {
            labels: ['Timeliness', 'Quality', 'Communication', 'Cost Efficiency', 'Safety'],
            datasets: [{
                label: 'ABC Electrical',
                data: [85, 90, 75, 80, 95],
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: '#3b82f6',
                pointBackgroundColor: '#3b82f6'
            }, {
                label: 'XYZ Plumbing',
                data: [75, 85, 90, 70, 80],
                backgroundColor: 'var(--green-20)',
                borderColor: '#10b981',
                pointBackgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }
        }
    });

    // Project Profitability Chart (Pro/Enterprise feature)
    const profitabilityCtx = document.getElementById('profitabilityChart').getContext('2d');
    if (profitabilityCtx) {
        chartInstances.profitabilityChart = new Chart(profitabilityCtx, {
            type: 'bar',
            data: {
                labels: reportData.profitabilityData?.labels || ['Project A', 'Project B', 'Project C'],
                datasets: [{
                    label: 'Budget',
                    data: reportData.profitabilityData?.budget || [50000, 75000, 60000],
                    backgroundColor: '#3b82f6',
                    borderColor: '#2563eb',
                    borderWidth: 1
                }, {
                    label: 'Actual',
                    data: reportData.profitabilityData?.actual || [52000, 70000, 62000],
                    backgroundColor: '#10b981',
                    borderColor: '#059669',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'USD'
                        }
                    }
                }
            }
        });
    }

    // Earned Value Management Chart (Pro/Enterprise feature)
    const evmCtx = document.getElementById('evmChart').getContext('2d');
    if (evmCtx) {
        chartInstances.evmChart = new Chart(evmCtx, {
            type: 'bar',
            data: {
                labels: reportData.evmData?.labels || ['PV', 'EV', 'AC'],
                datasets: [{
                    label: 'Value',
                    data: reportData.evmData?.data || [30000, 25000, 28000],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(255, 99, 132, 0.5)'
                    ],
                    borderColor: [
                        'rgb(54, 162, 235)',
                        'rgb(75, 192, 192)',
                        'rgb(255, 99, 132)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'USD'
                        }
                    }
                }
            }
        });
    }

    // Accounts Aging Chart (Pro/Enterprise feature)
    const agingCtx = document.getElementById('agingChart').getContext('2d');
    if (agingCtx) {
        chartInstances.agingChart = new Chart(agingCtx, {
            type: 'doughnut',
            data: {
                labels: reportData.agingData?.labels || ['0-30 days', '31-60 days', '61-90 days', '90+ days'],
                datasets: [{
                    data: reportData.agingData?.data || [15000, 5000, 3000, 1000],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(255, 205, 86, 0.7)',
                        'rgba(255, 99, 132, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.label + ': $' + context.raw.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // Cash Flow Forecast Chart (Pro/Enterprise feature)
    const cashflowCtx = document.getElementById('cashflowChart').getContext('2d');
    if (cashflowCtx) {
        chartInstances.cashflowChart = new Chart(cashflowCtx, {
            type: 'line',
            data: {
                labels: reportData.cashflowData?.labels || ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Cash Inflow',
                    data: reportData.cashflowData?.inflow || [10000, 15000, 12000, 18000],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.3
                }, {
                    label: 'Cash Outflow',
                    data: reportData.cashflowData?.outflow || [8000, 12000, 10000, 14000],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'USD'
                        }
                    }
                }
            }
        });
    }

    // Equipment Utilization Chart (All tiers)
    const equipmentCtx = document.getElementById('equipmentChart').getContext('2d');
    if (equipmentCtx) {
        chartInstances.equipmentChart = new Chart(equipmentCtx, {
            type: 'bar',
            data: {
                labels: reportData.equipmentData?.labels || ['Excavator', 'Bulldozer', 'Crane', 'Truck'],
                datasets: [{
                    label: 'Utilization %',
                    data: reportData.equipmentData?.utilization || [75, 60, 85, 90],
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: '#3b82f6',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Percentage'
                        }
                    }
                }
            }
        });
    }

    // Safety Incidents Chart (All tiers)
    const safetyCtx = document.getElementById('safetyChart').getContext('2d');
    if (safetyCtx) {
        chartInstances.safetyChart = new Chart(safetyCtx, {
            type: 'line',
            data: {
                labels: reportData.safetyData?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Safety Incidents',
                    data: reportData.safetyData?.incidents || [5, 3, 2, 4, 1, 2],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Incidents'
                        }
                    }
                }
            }
        });
    }
}

// Export data function
function exportData(format) {
    // Use the current reportData
    const data = reportData.timeEntries || [];
    const filename = `${currentReportType}_report_${new Date().toISOString().slice(0, 10)}`;

    switch (format) {
        case 'csv':
            exportToCSV(data, filename);
            break;
        case 'excel':
            exportToExcel(data, filename);
            break;
        case 'pdf':
            exportToPDF(data, `${currentReportType.replace(/-/g, ' ')} Report`.toUpperCase());
            break;
    }
}

function exportToCSV(data, filename) {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportToExcel(data, filename) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

function exportToPDF(data, title) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);

    // Add date range info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date Range: ${currentStartDate.toLocaleDateString()} - ${currentEndDate.toLocaleDateString()}`, 14, 22);

    // Add table
    doc.autoTable({
        startY: 30,
        head: [Object.keys(data[0])],
        body: data.map(row => Object.values(row))
    });

    // Save the PDF
    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// Save user preferences
async function saveUserPreferences() {
    try {
        const preferences = {
            report_type: currentReportType,
            date_range: currentDateRange,
            start_date: currentStartDate.toISOString(),
            end_date: currentEndDate.toISOString()
        };

        // In a real implementation, this would save to Supabase
        localStorage.setItem('reportCenterPreferences', JSON.stringify(preferences));
    } catch (error) {
        console.error('Error saving preferences:', error);
    }
}

// Load user preferences
function loadUserPreferences() {
    try {
        const preferences = JSON.parse(localStorage.getItem('reportCenterPreferences'));

        if (preferences) {
            currentReportType = preferences.report_type || 'time-tracking';
            currentDateRange = preferences.date_range || '30';

            if (preferences.start_date) {
                currentStartDate = new Date(preferences.start_date);
            }

            if (preferences.end_date) {
                currentEndDate = new Date(preferences.end_date);
            }

            // Update UI to match preferences
            reportTypeSelector.value = currentReportType;
            dateRangeSelector.value = currentDateRange;

            if (currentDateRange === 'custom') {
                startDateInput.value = currentStartDate.toISOString().split('T')[0];
                endDateInput.value = currentEndDate.toISOString().split('T')[0];
            }
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Load user data
    await loadUserData();

    // Load user preferences
    loadUserPreferences();

    // Initialize charts with empty data first
    initCharts();

    // Load initial report data
    await loadReportData();

    // Set up periodic data refresh (every 5 minutes)
    setInterval(loadReportData, 5 * 60 * 1000);

    // Save preferences when leaving the page
    window.addEventListener('beforeunload', saveUserPreferences);
});

// End of main logic

// Throttled scroll-triggered dashboard animations
// Animation targets: summary cards, time entries, milestones, charts, empty states

document.addEventListener('DOMContentLoaded', function () {
    const animatedEls = document.querySelectorAll('.summary-card, .time-entry, .milestone-item, .chart-container, .empty-state');

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