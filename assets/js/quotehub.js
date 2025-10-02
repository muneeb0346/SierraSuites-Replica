// Global variables
let currentUser = null;
let currentCompanyId = null;
let currentSubscriptionTier = 'starter';
let estimates = [];
let currentPage = 1;
const itemsPerPage = 10;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    setupEventListeners();
});

// Initialize the application
async function initializeApp() {
    try {
        // Get current session
        const { data: { session } } = await window.supabaseClient.auth.getSession();

        if (session) {
            currentUser = session.user;
            await loadUserCompanyData();
            await loadEstimates();
            await loadProjects();
            await loadClients();

            // Update user info in sidebar
            updateUserInfo();
        } else {
            // If no session, show a message but don't redirect
            showNotification('Please log in to access all features', 'info');

            // You can still try to load public data or show a login prompt
            document.getElementById('estimates-list').innerHTML = `
                        <div class="table-row">
                            <div class="table-col" colspan="7" style="text-align: center; padding: 20px;">
                                Please log in to view estimates.
                            </div>
                        </div>
                    `;
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Error initializing application', 'error');
    }
}

// Update user info in sidebar
async function updateUserInfo() {
    try {
        if (!currentUser) return;

        // Get user profile
        const { data: profile, error } = await window.supabaseClient
            .from('user_profiles')
            .select('first_name, last_name, company_name')
            .eq('id', currentUser.id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return;
        }

        // Update DOM elements
        document.getElementById('userName').textContent = `${profile.first_name} ${profile.last_name}`;
        document.getElementById('userCompany').textContent = profile.company_name;

    } catch (error) {
        console.error('Error updating user info:', error);
    }
}

// Load user company data
async function loadUserCompanyData() {
    if (!currentUser) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('user_companies')
            .select('company_id, companies(subscription_tier)')
            .eq('user_id', currentUser.id)
            .single();

        if (data) {
            currentCompanyId = data.company_id;
            currentSubscriptionTier = data.companies.subscription_tier || 'starter';

            // Show/hide features based on subscription
            updateFeatureVisibility();
        }
    } catch (error) {
        console.error('Error loading user company data:', error);
    }
}

// Update feature visibility based on subscription tier
function updateFeatureVisibility() {
    // Rate Library (Pro/Enterprise)
    if (hasFeature('rate_library')) {
        document.getElementById('browse-rate-library').style.display = 'inline-block';
    }

    // Proposal Builder (Enterprise)
    if (hasFeature('proposal_builder')) {
        document.getElementById('create-proposal').style.display = 'inline-block';
    }

    // Subcontractor Quoting (Enterprise)
    if (hasFeature('subcontractor_quoting')) {
        document.querySelectorAll('.request-quote').forEach(el => {
            el.style.display = 'inline-block';
        });
    }

    // DocuSign (Enterprise)
    if (hasFeature('docusign')) {
        document.getElementById('send-for-signature').style.display = 'inline-block';
        document.getElementById('docusign-option').style.display = 'block';
    }

    // Change Orders (Enterprise)
    if (hasFeature('change_orders')) {
        document.querySelector('.change-orders-section').style.display = 'block';
    }
}

// Check if user has access to a feature
function hasFeature(feature) {
    const featuresByTier = {
        'rate_library': ['pro', 'enterprise'],
        'proposal_builder': ['enterprise'],
        'change_orders': ['enterprise'],
        'subcontractor_quoting': ['enterprise'],
        'in_app_email': ['pro', 'enterprise'],
        'docusign': ['enterprise']
    };
    return featuresByTier[feature]?.includes(currentSubscriptionTier);
}

// Show upgrade prompt for features
function showUpgradePrompt(feature) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Upgrade Required</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="subscription-upgrade-prompt">
                            <h4>This feature requires a ${feature === 'proposal_builder' || feature === 'change_orders' || feature === 'subcontractor_quoting' || feature === 'docusign' ? 'Enterprise' : 'Pro'} plan</h4>
                            <p>Upgrade your subscription to access this feature and more.</p>
                            <a href="pricing.html" class="btn btn-primary">View Plans</a>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" id="close-upgrade-prompt">Maybe Later</button>
                    </div>
                </div>
            `;
    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });

    modal.querySelector('#close-upgrade-prompt').addEventListener('click', () => {
        modal.remove();
    });
}

// Load estimates from Supabase
async function loadEstimates() {
    if (!currentCompanyId) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('estimates')
            .select(`*, projects(name), clients(name, email, phone)`)
            .eq('company_id', currentCompanyId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading estimates:', error);
            showNotification('Failed to load estimates', 'error');
            return;
        }

        estimates = data || [];
        renderEstimates();
        updateSummary();
    } catch (error) {
        console.error('Error loading estimates:', error);
        showNotification('Failed to load estimates', 'error');
    }
}

// Load projects for dropdown
async function loadProjects() {
    if (!currentCompanyId) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('projects')
            .select('id, name')
            .eq('company_id', currentCompanyId)
            .eq('status', 'active')
            .order('name');

        if (error) {
            console.error('Error loading projects:', error);
            return;
        }

        const projectSelect = document.getElementById('estimate-project');
        projectSelect.innerHTML = '<option value="">Select Project</option>';

        data.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Load clients for dropdown
async function loadClients() {
    if (!currentCompanyId) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('clients')
            .select('id, name')
            .eq('company_id', currentCompanyId)
            .order('name');

        if (error) {
            console.error('Error loading clients:', error);
            return;
        }

        const clientSelect = document.getElementById('estimate-client');
        clientSelect.innerHTML = '<option value="">Select Client</option>';

        data.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            clientSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

// Load rate library items
async function loadRateLibrary() {
    if (!currentCompanyId) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('rate_libraries')
            .select('*')
            .eq('company_id', currentCompanyId)
            .order('name');

        if (error) {
            console.error('Error loading rate library:', error);
            return;
        }

        const rateLibraryContainer = document.getElementById('rate-library-items');
        rateLibraryContainer.innerHTML = '';

        if (data.length === 0) {
            rateLibraryContainer.innerHTML = '<p>No rate library items found. Add some in your company settings.</p>';
            return;
        }

        data.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'rate-library-item';
            itemElement.innerHTML = `
                        <strong>${item.name}</strong> - $${item.unit_price}
                        <div>${item.description || 'No description'}</div>
                    `;
            itemElement.addEventListener('click', () => {
                // Add this item to the estimate
                addLineItemFromLibrary(item);
                document.getElementById('rate-library-modal').classList.remove('active');
            });
            rateLibraryContainer.appendChild(itemElement);
        });
    } catch (error) {
        console.error('Error loading rate library:', error);
    }
}

// Add line item from rate library
function addLineItemFromLibrary(item) {
    const lineItemsBody = document.getElementById('line-items-body');
    const newItem = document.createElement('div');
    newItem.className = 'table-row line-item';
    newItem.innerHTML = `
                <div class="table-col">
                    <input type="text" placeholder="Item name" class="item-name" value="${item.name}">
                </div>
                <div class="table-col">
                    <input type="text" placeholder="Description" class="item-description" value="${item.description || ''}">
                </div>
                <div class="table-col">
                    <input type="number" placeholder="Qty" class="item-quantity" value="1" min="1">
                </div>
                <div class="table-col">
                    <input type="number" placeholder="Unit Price" class="item-price" value="${item.unit_price}" min="0" step="0.01">
                </div>
                <div class="table-col item-total">
                    <span>$${item.unit_price.toFixed(2)}</span>
                </div>
                <div class="table-col actions">
                    <button class="btn btn-icon remove-item">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-icon request-quote" style="${hasFeature('subcontractor_quoting') ? 'display: inline-block;' : 'display: none;'}">
                        <i class="fas fa-file-alt"></i>
                    </button>
                </div>
            `;
    lineItemsBody.appendChild(newItem);

    // Add event listeners
    newItem.querySelector('.item-quantity').addEventListener('input', () => {
        calculateLineItemTotal(newItem);
        calculateEstimateTotal();
    });

    newItem.querySelector('.item-price').addEventListener('input', () => {
        calculateLineItemTotal(newItem);
        calculateEstimateTotal();
    });

    newItem.querySelector('.remove-item').addEventListener('click', () => {
        newItem.remove();
        calculateEstimateTotal();
    });

    if (hasFeature('subcontractor_quoting')) {
        newItem.querySelector('.request-quote').addEventListener('click', () => {
            const itemName = newItem.querySelector('.item-name').value;
            const itemDescription = newItem.querySelector('.item-description').value;
            openSubcontractorQuoteModal(itemName, itemDescription);
        });
    }

    calculateEstimateTotal();
}

// Load subcontractors for dropdown
async function loadSubcontractors() {
    if (!currentCompanyId) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('contacts')
            .select('id, name, email')
            .eq('company_id', currentCompanyId)
            .eq('contact_type', 'Subcontractor')
            .order('name');

        if (error) {
            console.error('Error loading subcontractors:', error);
            return;
        }

        const subcontractorSelect = document.getElementById('subcontractor-select');
        subcontractorSelect.innerHTML = '<option value="">Select Subcontractor</option>';

        data.forEach(subcontractor => {
            const option = document.createElement('option');
            option.value = subcontractor.id;
            option.textContent = `${subcontractor.name} (${subcontractor.email})`;
            subcontractorSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading subcontractors:', error);
    }
}

// Load proposal templates
async function loadProposalTemplates() {
    if (!currentCompanyId) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('proposal_templates')
            .select('*')
            .eq('company_id', currentCompanyId)
            .order('name');

        if (error) {
            console.error('Error loading proposal templates:', error);
            return;
        }

        const templateSelect = document.getElementById('proposal-template');
        templateSelect.innerHTML = '<option value="">Select Template</option>';

        data.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.name;
            templateSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading proposal templates:', error);
    }
}

// Render estimates in the table
function renderEstimates() {
    const estimatesList = document.getElementById('estimates-list');

    // Apply filters
    const statusFilter = document.getElementById('status-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    let filteredEstimates = estimates;

    if (statusFilter !== 'all') {
        filteredEstimates = filteredEstimates.filter(estimate => estimate.status === statusFilter);
    }

    if (searchTerm) {
        filteredEstimates = filteredEstimates.filter(estimate =>
            estimate.estimate_number.toLowerCase().includes(searchTerm) ||
            (estimate.projects && estimate.projects.name.toLowerCase().includes(searchTerm)) ||
            (estimate.clients && estimate.clients.name.toLowerCase().includes(searchTerm))
        );
    }

    // Pagination
    const totalPages = Math.ceil(filteredEstimates.length / itemsPerPage);
    updatePagination(totalPages);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedEstimates = filteredEstimates.slice(startIndex, startIndex + itemsPerPage);

    if (paginatedEstimates.length === 0) {
        estimatesList.innerHTML = `
                    <div class="table-row">
                        <div class="table-col" colspan="7" style="text-align: center; padding: 20px;">
                            No estimates found
                        </div>
                    </div>
                `;
        return;
    }

    estimatesList.innerHTML = '';

    paginatedEstimates.forEach(estimate => {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
                    <div class="table-col">${estimate.estimate_number}</div>
                    <div class="table-col">${estimate.projects?.name || 'N/A'}</div>
                    <div class="table-col">${estimate.clients?.name || 'N/A'}</div>
                    <div class="table-col">${new Date(estimate.estimate_date).toLocaleDateString()}</div>
                    <div class="table-col">$${estimate.total_amount.toLocaleString()}</div>
                    <div class="table-col">
                        <span class="status-badge ${estimate.status}">${estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}</span>
                    </div>
                    <div class="table-col actions">
                        <button class="btn btn-icon view-estimate" data-id="${estimate.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-icon download-estimate" data-id="${estimate.id}">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-icon more-actions" data-id="${estimate.id}">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                `;
        estimatesList.appendChild(row);
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.view-estimate').forEach(button => {
        button.addEventListener('click', () => viewEstimate(button.dataset.id));
    });

    document.querySelectorAll('.download-estimate').forEach(button => {
        button.addEventListener('click', () => downloadEstimate(button.dataset.id));
    });

    document.querySelectorAll('.more-actions').forEach(button => {
        button.addEventListener('click', () => showMoreActions(button.dataset.id));
    });
}

// Update summary cards
function updateSummary() {
    const totalEstimates = estimates.length;
    const pendingEstimates = estimates.filter(e => e.status === 'pending').length;
    const approvedEstimates = estimates.filter(e => e.status === 'approved').length;
    const totalValue = estimates.reduce((sum, estimate) => sum + estimate.total_amount, 0);

    document.getElementById('total-estimates').textContent = totalEstimates;
    document.getElementById('pending-estimates').textContent = pendingEstimates;
    document.getElementById('approved-estimates').textContent = approvedEstimates;
    document.getElementById('total-value').textContent = `$${totalValue.toLocaleString()}`;
}

// Update pagination controls
function updatePagination(totalPages) {
    const pageNumbers = document.getElementById('page-numbers');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');

    pageNumbers.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const page = document.createElement('span');
        page.textContent = i;
        if (i === currentPage) {
            page.className = 'active';
        }
        page.addEventListener('click', () => {
            currentPage = i;
            renderEstimates();
        });
        pageNumbers.appendChild(page);
    }

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages || totalPages === 0;

    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderEstimates();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderEstimates();
        }
    });
}

// View estimate details
async function viewEstimate(estimateId) {
    try {
        const { data, error } = await window.supabaseClient
            .from('estimates')
            .select(`*, projects(name, address), clients(name, email, phone), estimate_items(*)`)
            .eq('id', estimateId)
            .single();

        if (error) {
            console.error('Error loading estimate:', error);
            showNotification('Failed to load estimate details', 'error');
            return;
        }

        // Populate the view modal
        document.getElementById('view-estimate-number').textContent = data.estimate_number;
        document.getElementById('view-estimate-date').textContent = `Date: ${new Date(data.estimate_date).toLocaleDateString()}`;
        document.getElementById('view-estimate-status').textContent = data.status.charAt(0).toUpperCase() + data.status.slice(1);
        document.getElementById('view-estimate-status').className = `status-badge ${data.status}`;

        document.getElementById('view-client-name').textContent = data.clients?.name || 'N/A';
        document.getElementById('view-client-email').textContent = data.clients?.email || 'N/A';
        document.getElementById('view-client-phone').textContent = data.clients?.phone || 'N/A';

        document.getElementById('view-project-name').textContent = data.projects?.name || 'N/A';
        document.getElementById('view-project-address').textContent = data.projects?.address || 'N/A';

        // Populate line items
        const itemsList = document.getElementById('view-items-list');
        itemsList.innerHTML = '';

        if (data.estimate_items && data.estimate_items.length > 0) {
            data.estimate_items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                            <td>${item.description}</td>
                            <td>${item.quantity}</td>
                            <td>$${item.unit_price.toFixed(2)}</td>
                            <td>$${(item.quantity * item.unit_price).toFixed(2)}</td>
                        `;
                itemsList.appendChild(row);
            });
        }

        // Populate totals
        document.getElementById('view-subtotal').textContent = `$${data.subtotal.toFixed(2)}`;
        document.getElementById('view-discount').textContent = `-$${data.discount_amount.toFixed(2)}`;
        document.getElementById('view-tax').textContent = `$${data.tax_amount.toFixed(2)}`;
        document.getElementById('view-grand-total').textContent = `$${data.total_amount.toFixed(2)}`;

        // Populate notes
        document.getElementById('view-notes').textContent = data.notes || 'No notes provided.';

        // Load change orders if Enterprise plan
        if (hasFeature('change_orders')) {
            await loadChangeOrders(estimateId);
        }

        // Show the modal
        document.getElementById('view-estimate-modal').classList.add('active');
    } catch (error) {
        console.error('Error viewing estimate:', error);
        showNotification('Failed to load estimate details', 'error');
    }
}

// Load change orders for an estimate
async function loadChangeOrders(estimateId) {
    try {
        const { data, error } = await window.supabaseClient
            .from('change_orders')
            .select('*')
            .eq('estimate_id', estimateId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading change orders:', error);
            return;
        }

        const changeOrdersList = document.getElementById('change-orders-list');
        changeOrdersList.innerHTML = '';

        if (data.length === 0) {
            changeOrdersList.innerHTML = '<p>No change orders found.</p>';
            return;
        }

        data.forEach(changeOrder => {
            const changeOrderElement = document.createElement('div');
            changeOrderElement.className = 'change-order-item';
            changeOrderElement.innerHTML = `
                        <div><strong>Change Order #${changeOrder.id.slice(-4)}</strong> - $${changeOrder.total_amount.toFixed(2)}</div>
                        <div>Status: <span class="status-badge ${changeOrder.status}">${changeOrder.status}</span></div>
                        <div>Reason: ${changeOrder.reason || 'No reason provided'}</div>
                    `;
            changeOrdersList.appendChild(changeOrderElement);
        });
    } catch (error) {
        console.error('Error loading change orders:', error);
    }
}

// Download estimate as PDF
async function downloadEstimate(estimateId) {
    try {
        const { data, error } = await window.supabaseClient
            .from('estimates')
            .select(`*, projects(name, address), clients(name, email, phone), estimate_items(*), companies(name, address, phone, email)`)
            .eq('id', estimateId)
            .single();

        if (error) {
            console.error('Error loading estimate:', error);
            showNotification('Failed to download estimate', 'error');
            return;
        }

        // Create PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add company info
        doc.setFontSize(16);
        doc.text(data.companies.name, 20, 20);
        doc.setFontSize(10);
        doc.text(data.companies.address, 20, 30);
        doc.text(`Phone: ${data.companies.phone} | Email: ${data.companies.email}`, 20, 40);

        // Add estimate info
        doc.setFontSize(14);
        doc.text(`ESTIMATE: ${data.estimate_number}`, 20, 60);
        doc.setFontSize(10);
        doc.text(`Date: ${new Date(data.estimate_date).toLocaleDateString()}`, 20, 70);
        doc.text(`Status: ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`, 20, 80);

        // Add client info
        doc.text(`Client: ${data.clients.name}`, 20, 100);
        doc.text(`Email: ${data.clients.email}`, 20, 110);
        doc.text(`Phone: ${data.clients.phone}`, 20, 120);

        // Add project info
        doc.text(`Project: ${data.projects.name}`, 20, 140);
        doc.text(`Address: ${data.projects.address}`, 20, 150);

        // Add line items
        doc.setFontSize(12);
        doc.text('Description', 20, 170);
        doc.text('Qty', 120, 170);
        doc.text('Unit Price', 140, 170);
        doc.text('Total', 170, 170);

        let y = 180;
        data.estimate_items.forEach(item => {
            doc.setFontSize(10);
            doc.text(item.description, 20, y);
            doc.text(item.quantity.toString(), 120, y);
            doc.text(`$${item.unit_price.toFixed(2)}`, 140, y);
            doc.text(`$${(item.quantity * item.unit_price).toFixed(2)}`, 170, y);
            y += 10;
        });

        // Add totals
        y += 10;
        doc.text(`Subtotal: $${data.subtotal.toFixed(2)}`, 140, y);
        y += 10;
        doc.text(`Discount: -$${data.discount_amount.toFixed(2)}`, 140, y);
        y += 10;
        doc.text(`Tax: $${data.tax_amount.toFixed(2)}`, 140, y);
        y += 10;
        doc.setFontSize(12);
        doc.text(`TOTAL: $${data.total_amount.toFixed(2)}`, 140, y);

        // Add notes
        if (data.notes) {
            y += 20;
            doc.setFontSize(10);
            doc.text('Notes:', 20, y);
            y += 10;
            const splitNotes = doc.splitTextToSize(data.notes, 170);
            doc.text(splitNotes, 20, y);
        }

        // Save the PDF
        doc.save(`Estimate-${data.estimate_number}.pdf`);
    } catch (error) {
        console.error('Error downloading estimate:', error);
        showNotification('Failed to download estimate', 'error');
    }
}

// Show more actions menu
function showMoreActions(estimateId) {
    // This would typically show a context menu with options like Edit, Duplicate, Delete, etc.
    // For simplicity, we'll just show an alert
    alert(`More actions for estimate ${estimateId}`);
}

// Open subcontractor quote modal
function openSubcontractorQuoteModal(itemName, itemDescription) {
    if (!hasFeature('subcontractor_quoting')) {
        showUpgradePrompt('subcontractor_quoting');
        return;
    }

    document.getElementById('quote-item-description').value = `${itemName}: ${itemDescription}`;
    document.getElementById('subcontractor-quote-modal').classList.add('active');
}

// Open proposal builder modal
function openProposalBuilderModal() {
    if (!hasFeature('proposal_builder')) {
        showUpgradePrompt('proposal_builder');
        return;
    }

    document.getElementById('proposal-builder-modal').classList.add('active');
}

// Open email composer modal
function openEmailComposer(clientEmail) {
    if (!hasFeature('in_app_email')) {
        showUpgradePrompt('in_app_email');
        return;
    }

    document.getElementById('email-to').value = clientEmail;
    document.getElementById('email-composer-modal').classList.add('active');
}

// Open change order modal
function openChangeOrderModal() {
    if (!hasFeature('change_orders')) {
        showUpgradePrompt('change_orders');
        return;
    }

    document.getElementById('change-order-modal').classList.add('active');
}

// Calculate line item total
function calculateLineItemTotal(lineItem) {
    const quantity = parseFloat(lineItem.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(lineItem.querySelector('.item-price').value) || 0;
    const total = quantity * price;

    lineItem.querySelector('.item-total span').textContent = `$${total.toFixed(2)}`;
}

// Calculate estimate total
function calculateEstimateTotal() {
    let subtotal = 0;

    document.querySelectorAll('.line-item').forEach(item => {
        const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        subtotal += quantity * price;
    });

    const discountPercentage = parseFloat(document.getElementById('discount-percentage').textContent) || 0;
    const discountAmount = subtotal * (discountPercentage / 100);

    const taxPercentage = parseFloat(document.getElementById('tax-percentage').textContent) || 0;
    const taxAmount = (subtotal - discountAmount) * (taxPercentage / 100);

    const total = subtotal - discountAmount + taxAmount;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('discount-amount').textContent = `-$${discountAmount.toFixed(2)}`;
    document.getElementById('tax-amount').textContent = `$${taxAmount.toFixed(2)}`;
    document.getElementById('grand-total').textContent = `$${total.toFixed(2)}`;
}

// Add new line item
function addLineItem() {
    const lineItemsBody = document.getElementById('line-items-body');
    const newItem = document.createElement('div');
    newItem.className = 'table-row line-item';
    newItem.innerHTML = `
                <div class="table-col">
                    <input type="text" placeholder="Item name" class="item-name">
                </div>
                <div class="table-col">
                    <input type="text" placeholder="Description" class="item-description">
                </div>
                <div class="table-col">
                    <input type="number" placeholder="Qty" class="item-quantity" value="1" min="1">
                </div>
                <div class="table-col">
                    <input type="number" placeholder="Unit Price" class="item-price" value="0" min="0" step="0.01">
                </div>
                <div class="table-col item-total">
                    <span>$0.00</span>
                </div>
                <div class="table-col actions">
                    <button class="btn btn-icon remove-item">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-icon request-quote" style="${hasFeature('subcontractor_quoting') ? 'display: inline-block;' : 'display: none;'}">
                        <i class="fas fa-file-alt"></i>
                    </button>
                </div>
            `;
    lineItemsBody.appendChild(newItem);

    // Add event listeners to the new inputs
    newItem.querySelector('.item-quantity').addEventListener('input', () => {
        calculateLineItemTotal(newItem);
        calculateEstimateTotal();
    });

    newItem.querySelector('.item-price').addEventListener('input', () => {
        calculateLineItemTotal(newItem);
        calculateEstimateTotal();
    });

    newItem.querySelector('.remove-item').addEventListener('click', () => {
        newItem.remove();
        calculateEstimateTotal();
    });

    if (hasFeature('subcontractor_quoting')) {
        newItem.querySelector('.request-quote').addEventListener('click', () => {
            const itemName = newItem.querySelector('.item-name').value;
            const itemDescription = newItem.querySelector('.item-description').value;
            openSubcontractorQuoteModal(itemName, itemDescription);
        });
    }
}

// Add discount
function addDiscount() {
    const discountPercentage = prompt('Enter discount percentage:', '5');
    if (discountPercentage !== null && !isNaN(discountPercentage)) {
        document.getElementById('discount-percentage').textContent = discountPercentage;
        document.querySelector('.discount-row').style.display = 'flex';
        calculateEstimateTotal();
    }
}

// Add tax
function addTax() {
    const taxPercentage = prompt('Enter tax percentage:', '7');
    if (taxPercentage !== null && !isNaN(taxPercentage)) {
        document.getElementById('tax-percentage').textContent = taxPercentage;
        document.querySelector('.tax-row').style.display = 'flex';
        calculateEstimateTotal();
    }
}

// Save estimate to Supabase
async function saveEstimate(status, callback) {
    try {
        const projectId = document.getElementById('estimate-project').value;
        const clientId = document.getElementById('estimate-client').value;
        const template = document.getElementById('estimate-template').value;
        const date = document.getElementById('estimate-date').value;
        const notes = document.getElementById('estimate-notes').value;

        if (!projectId || !clientId || !date) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Calculate totals
        let subtotal = 0;
        const lineItems = [];

        document.querySelectorAll('.line-item').forEach(item => {
            const name = item.querySelector('.item-name').value;
            const description = item.querySelector('.item-description').value;
            const quantity = parseFloat(item.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(item.querySelector('.item-price').value) || 0;
            const total = quantity * price;

            if (name && quantity > 0 && price > 0) {
                lineItems.push({
                    name,
                    description,
                    quantity,
                    unit_price: price,
                    total
                });
                subtotal += total;
            }
        });

        if (lineItems.length === 0) {
            showNotification('Please add at least one line item', 'error');
            return;
        }

        const discountPercentage = parseFloat(document.getElementById('discount-percentage').textContent) || 0;
        const discountAmount = subtotal * (discountPercentage / 100);

        const taxPercentage = parseFloat(document.getElementById('tax-percentage').textContent) || 0;
        const taxAmount = (subtotal - discountAmount) * (taxPercentage / 100);

        const totalAmount = subtotal - discountAmount + taxAmount;

        // Generate estimate number
        const estimateCount = estimates.length + 1;
        const estimateNumber = `EST-${new Date().getFullYear()}-${estimateCount.toString().padStart(4, '0')}`;

        // Save to Supabase
        const { data: estimateData, error: estimateError } = await window.supabaseClient
            .from('estimates')
            .insert({
                estimate_number: estimateNumber,
                company_id: currentCompanyId,
                project_id: projectId,
                client_id: clientId,
                estimate_date: date,
                subtotal: subtotal,
                discount_percentage: discountPercentage,
                discount_amount: discountAmount,
                tax_percentage: taxPercentage,
                tax_amount: taxAmount,
                total_amount: totalAmount,
                notes: notes,
                status: status,
                created_by: currentUser.id
            })
            .select()
            .single();

        if (estimateError) {
            console.error('Error saving estimate:', estimateError);
            showNotification('Failed to save estimate', 'error');
            return;
        }

        // Save line items
        for (const item of lineItems) {
            const { error: itemError } = await window.supabaseClient
                .from('estimate_items')
                .insert({
                    estimate_id: estimateData.id,
                    name: item.name,
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total: item.total
                });

            if (itemError) {
                console.error('Error saving line item:', itemError);
            }
        }

        showNotification('Estimate saved successfully!', 'success');

        if (callback) {
            callback(estimateData.id);
        } else {
            document.getElementById('estimate-modal').classList.remove('active');
        }

        // Reload estimates
        await loadEstimates();
    } catch (error) {
        console.error('Error saving estimate:', error);
        showNotification('Failed to save estimate', 'error');
    }
}

// Generate AI proposal
async function generateAIProposal() {
    try {
        // This would call your backend API which integrates with OpenAI
        // For now, we'll simulate a response
        showNotification('Generating proposal with AI...', 'info');

        // Simulate API call delay
        setTimeout(() => {
            const sampleProposal = `PROPOSAL

Project: ${document.getElementById('estimate-project').options[document.getElementById('estimate-project').selectedIndex].text}
Client: ${document.getElementById('estimate-client').options[document.getElementById('estimate-client').selectedIndex].text}

Dear Client,

We are pleased to present this proposal for your construction project. Our team has carefully reviewed your requirements and prepared the following plan.

SCOPE OF WORK:
- Professional execution of all items listed in the estimate
- High-quality materials and craftsmanship
- Project management and coordination
- Cleanup and disposal of debris

TIMELINE:
We anticipate completing your project within 4-6 weeks from the start date, pending weather conditions and material availability.

TERMS AND CONDITIONS:
- Payment: 50% deposit upon signing, 50% upon completion
- Warranty: 1-year warranty on all workmanship
- Change orders: Any changes to the scope will be documented and priced separately

Thank you for considering The Sierra Suites for your project. We look forward to working with you.

Sincerely,
The Sierra Suites Team`;

            document.getElementById('proposal-content').value = sampleProposal;
            showNotification('Proposal generated successfully!', 'success');
        }, 2000);
    } catch (error) {
        console.error('Error generating AI proposal:', error);
        showNotification('Failed to generate proposal', 'error');
    }
}

// Send email with estimate
async function sendEmail(estimateId, toEmail, subject, body, includePdf, requestSignature) {
    try {
        showNotification('Sending email...', 'info');

        // This would integrate with your email service (SendGrid, Supabase Email, etc.)
        // For now, we'll simulate the process

        // Log the email
        const { error: emailError } = await window.supabaseClient
            .from('email_logs')
            .insert({
                company_id: currentCompanyId,
                to_email: toEmail,
                subject: subject,
                body: body,
                status: 'sent'
            });

        if (emailError) {
            console.error('Error logging email:', emailError);
        }

        // If DocuSign is requested
        if (requestSignature && hasFeature('docusign')) {
            // This would integrate with DocuSign API
            // For now, we'll simulate the process

            const { error: docusignError } = await window.supabaseClient
                .from('document_signatures')
                .insert({
                    document_type: 'estimate',
                    document_id: estimateId,
                    status: 'pending',
                    signer_email: toEmail
                });

            if (docusignError) {
                console.error('Error creating DocuSign record:', docusignError);
            }

            showNotification('Estimate sent for electronic signature', 'success');
        } else {
            showNotification('Email sent successfully!', 'success');
        }

        // Update estimate status to "sent"
        const { error: updateError } = await window.supabaseClient
            .from('estimates')
            .update({ status: 'sent' })
            .eq('id', estimateId);

        if (updateError) {
            console.error('Error updating estimate status:', updateError);
        }

        document.getElementById('email-composer-modal').classList.remove('active');

        // Reload estimates to update status
        await loadEstimates();
    } catch (error) {
        console.error('Error sending email:', error);
        showNotification('Failed to send email', 'error');
    }
}

// Request subcontractor quote
async function requestSubcontractorQuote(subcontractorId, itemDescription, notes) {
    try {
        showNotification('Requesting quote...', 'info');

        // This would create a record in the subcontractor_quotes table
        const { error } = await window.supabaseClient
            .from('subcontractor_quotes')
            .insert({
                subcontractor_id: subcontractorId,
                description: itemDescription,
                notes: notes,
                status: 'requested'
            });

        if (error) {
            console.error('Error requesting quote:', error);
            showNotification('Failed to request quote', 'error');
            return;
        }

        showNotification('Quote request sent to subcontractor!', 'success');
        document.getElementById('subcontractor-quote-modal').classList.remove('active');
    } catch (error) {
        console.error('Error requesting subcontractor quote:', error);
        showNotification('Failed to request quote', 'error');
    }
}

// Create change order
async function createChangeOrder(estimateId, reason, items) {
    try {
        // Calculate change order total
        const total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

        // Save to Supabase
        const { error } = await window.supabaseClient
            .from('change_orders')
            .insert({
                estimate_id: estimateId,
                reason: reason,
                total_amount: total,
                status: 'pending'
            });

        if (error) {
            console.error('Error creating change order:', error);
            showNotification('Failed to create change order', 'error');
            return;
        }

        showNotification('Change order created successfully!', 'success');
        document.getElementById('change-order-modal').classList.remove('active');

        // Reload change orders
        await loadChangeOrders(estimateId);
    } catch (error) {
        console.error('Error creating change order:', error);
        showNotification('Failed to create change order', 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // New estimate button
    document.getElementById('new-estimate-btn').addEventListener('click', () => {
        document.getElementById('estimate-modal').classList.add('active');
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.modal').classList.remove('active');
        });
    });

    // Filter and search
    document.getElementById('status-filter').addEventListener('change', renderEstimates);
    document.getElementById('search-input').addEventListener('input', renderEstimates);

    // Line item calculations
    document.addEventListener('input', function (e) {
        if (e.target.classList.contains('item-quantity') || e.target.classList.contains('item-price')) {
            calculateLineItemTotal(e.target.closest('.line-item'));
            calculateEstimateTotal();
        }
    });

    // Add line item
    document.getElementById('add-line-item').addEventListener('click', addLineItem);

    // Remove line item
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-item')) {
            e.target.closest('.line-item').remove();
            calculateEstimateTotal();
        }
    });

    // Add discount
    document.getElementById('add-discount').addEventListener('click', addDiscount);

    // Add tax
    document.getElementById('add-tax').addEventListener('click', addTax);

    // Save draft
    document.getElementById('save-draft').addEventListener('click', () => saveEstimate('draft'));

    // Save and send
    document.getElementById('save-send').addEventListener('click', () => {
        saveEstimate('draft', (estimateId) => {
            // After saving, open email composer
            const clientEmail = 'client@example.com'; // This should be fetched from the client record
            openEmailComposer(clientEmail);
        });
    });

    // Create proposal
    document.getElementById('create-proposal').addEventListener('click', openProposalBuilderModal);

    // AI generate proposal
    document.getElementById('ai-generate').addEventListener('click', generateAIProposal);

    // Browse rate library
    document.getElementById('browse-rate-library').addEventListener('click', () => {
        loadRateLibrary();
        document.getElementById('rate-library-modal').classList.add('active');
    });

    // Close rate library
    document.getElementById('close-rate-library').addEventListener('click', () => {
        document.getElementById('rate-library-modal').classList.remove('active');
    });

    // Send quote request
    document.getElementById('send-quote-request').addEventListener('click', () => {
        const subcontractorId = document.getElementById('subcontractor-select').value;
        const itemDescription = document.getElementById('quote-item-description').value;
        const notes = document.getElementById('quote-notes').value;

        if (!subcontractorId) {
            showNotification('Please select a subcontractor', 'error');
            return;
        }

        requestSubcontractorQuote(subcontractorId, itemDescription, notes);
    });

    // Cancel quote request
    document.getElementById('cancel-quote-request').addEventListener('click', () => {
        document.getElementById('subcontractor-quote-modal').classList.remove('active');
    });

    // Send email
    document.getElementById('send-email').addEventListener('click', () => {
        const toEmail = document.getElementById('email-to').value;
        const subject = document.getElementById('email-subject').value;
        const body = document.getElementById('email-body').value;
        const includePdf = document.getElementById('include-pdf').checked;
        const requestSignature = document.getElementById('request-signature').checked;

        // For this demo, we'll use a placeholder estimate ID
        const estimateId = 'placeholder-estimate-id';

        sendEmail(estimateId, toEmail, subject, body, includePdf, requestSignature);
    });

    // Cancel email
    document.getElementById('cancel-email').addEventListener('click', () => {
        document.getElementById('email-composer-modal').classList.remove('active');
    });

    // Create change order
    document.getElementById('create-change-order').addEventListener('click', openChangeOrderModal);

    // Send change order
    document.getElementById('send-change-order').addEventListener('click', () => {
        const reason = document.getElementById('change-order-reason').value;

        if (!reason) {
            showNotification('Please provide a reason for the change order', 'error');
            return;
        }

        // For this demo, we'll use a placeholder estimate ID and items
        const estimateId = 'placeholder-estimate-id';
        const items = [
            { name: 'Change item', description: 'Description', quantity: 1, unit_price: 100 }
        ];

        createChangeOrder(estimateId, reason, items);
    });

    // Toggle sidebar on mobile
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });

    // Load additional data when modals are opened
    document.getElementById('rate-library-modal').addEventListener('click', loadRateLibrary);
    document.getElementById('subcontractor-quote-modal').addEventListener('click', loadSubcontractors);
    document.getElementById('proposal-builder-modal').addEventListener('click', loadProposalTemplates);
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

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

// Add notification styles if not already added
if (!document.getElementById('notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 5px;
                    color: white;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-width: 300px;
                    box-shadow: 0 4px 6px var(--black-10);
                    animation: slideIn 0.3s ease;
                }
                
                .notification-success { background-color: #10B981; }
                .notification-error { background-color: #EF4444; }
                .notification-info { background-color: #3B82F6; }
                .notification-warning { background-color: #F59E0B; }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    margin-left: 15px;
                }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
    document.head.appendChild(styles);
}

// End of main logic

// Throttled scroll-triggered dashboard animations
// Animation targets: summary cards, table rows, status badges, empty states

document.addEventListener('DOMContentLoaded', function () {
    const animatedEls = document.querySelectorAll('.summary-card, .table-row, .status-badge, .empty-state');

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