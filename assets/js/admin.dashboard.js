// Initialize Supabase client
const supabaseUrl = 'https://qjswuwcqyzeuqqqltykz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqc3d1d2NxeXpldXFxcWx0eWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjk0MDUsImV4cCI6MjA3MDgwNTQwNX0.qgH8DMJEoJVuYOXSyr0RAj01Yt7bBR8EYL6qw3YXyAs';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Global state
let currentUser = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', async function () {
    // For demo purposes, we'll simulate a logged-in user
    currentUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Administrator',
        company_id: 1
    };

    // Set up event listeners
    document.getElementById('refresh-data').addEventListener('click', loadAllData);

    // Load initial data
    loadAllData();
});

// Load all data from Supabase
async function loadAllData() {
    // Show loading states
    document.getElementById('activity-loading').style.display = 'block';
    document.getElementById('activity-spinner').style.display = 'block';
    document.getElementById('activity-table').style.display = 'none';

    // Update button state
    const refreshBtn = document.getElementById('refresh-data');
    const originalText = refreshBtn.innerHTML;
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    refreshBtn.disabled = true;

    try {
        // Load companies count
        const { count: companiesCount, error: companiesError } = await supabase
            .from('companies')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        if (!companiesError) {
            document.getElementById('companies-count').textContent = companiesCount || 0;
            document.getElementById('companies-trend').innerHTML = '<i class="fas fa-arrow-up"></i> 8% from last month';
        }

        // Load users count
        const { count: usersCount, error: usersError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        if (!usersError) {
            document.getElementById('users-count').textContent = usersCount || 0;
            document.getElementById('users-trend').innerHTML = '<i class="fas fa-arrow-up"></i> 12% from last month';
        }

        // Load projects count
        const { count: projectsCount, error: projectsError } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        if (!projectsError) {
            document.getElementById('projects-count').textContent = projectsCount || 0;
            document.getElementById('projects-trend').innerHTML = '<i class="fas fa-arrow-up"></i> 5% from last month';
        }

        // Load support tickets count
        const { count: ticketsCount, error: ticketsError } = await supabase
            .from('support_tickets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'open');

        if (!ticketsError) {
            document.getElementById('tickets-count').textContent = ticketsCount || 0;
            document.getElementById('tickets-trend').innerHTML = '<i class="fas fa-arrow-down"></i> 3% from last month';
        }

        // Load revenue data
        const { data: revenueData, error: revenueError } = await supabase
            .from('revenue')
            .select('amount')
            .eq('time_period', 'current_month')
            .single();

        if (!revenueError && revenueData) {
            document.getElementById('revenue-value').textContent = `$${revenueData.amount.toLocaleString()}`;
            document.getElementById('revenue-change').innerHTML = '<i class="fas fa-arrow-up"></i> 15% from last month';
        }

        // Load subscriptions data
        const { count: subscriptionsCount, error: subscriptionsError } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        if (!subscriptionsError) {
            document.getElementById('subscriptions-value').textContent = subscriptionsCount || 0;
            document.getElementById('subscriptions-change').innerHTML = '<i class="fas fa-arrow-up"></i> 7% from last month';
        }

        // Load signups data
        const { count: signupsCount, error: signupsError } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        if (!signupsError) {
            document.getElementById('signups-value').textContent = signupsCount || 0;
            document.getElementById('signups-change').innerHTML = '<i class="fas fa-arrow-up"></i> 10% from previous period';
        }

        // Load completion rate
        const { data: completionData, error: completionError } = await supabase
            .from('projects')
            .select('*');

        if (!completionError && completionData && completionData.length > 0) {
            const completed = completionData.filter(p => p.status === 'completed').length;
            const completionRate = Math.round((completed / completionData.length) * 100);
            document.getElementById('completion-value').textContent = `${completionRate}%`;
            document.getElementById('completion-change').innerHTML = '<i class="fas fa-arrow-up"></i> 5% from last month';
        }

        // Load recent activity
        const { data: activityData, error: activityError } = await supabase
            .from('activities')
            .select(`
                        id,
                        action,
                        created_at,
                        companies (name)
                    `)
            .order('created_at', { ascending: false })
            .limit(5);

        if (!activityError && activityData) {
            const activityBody = document.getElementById('activity-body');
            activityBody.innerHTML = '';

            activityData.forEach(activity => {
                const row = document.createElement('tr');
                row.innerHTML = `
                            <td>${activity.companies?.name || 'Unknown Company'}</td>
                            <td>${activity.action}</td>
                            <td>${new Date(activity.created_at).toLocaleDateString()}</td>
                            <td><span class="status-badge success">Completed</span></td>
                        `;
                activityBody.appendChild(row);
            });

            // Hide loading, show table
            document.getElementById('activity-loading').style.display = 'none';
            document.getElementById('activity-spinner').style.display = 'none';
            document.getElementById('activity-table').style.display = 'table';
        }

        // Update system status
        document.getElementById('api-status').textContent = 'Healthy';
        document.getElementById('db-status').textContent = 'Connected';
        document.getElementById('uptime-value').textContent = '99.97%';
        document.getElementById('response-value').textContent = '142ms';

    } catch (error) {
        console.error('Error loading data:', error);
    } finally {
        // Restore button state
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;
    }
}