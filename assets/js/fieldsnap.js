// Security and API functions using PostgreSQL functions
const PhotoAPI = {
    // Get current user's ID
    getCurrentUser: async function () {
        // Check if Supabase is initialized
        if (!window.supabaseClient) {
            throw new Error('Supabase client not initialized. Please ensure init_supabase.js is loaded.');
        }

        const { data: { user }, error } = await window.supabaseClient.auth.getUser();
        if (error) throw new Error('Authentication error: ' + error.message);
        if (!user) throw new Error('No authenticated user');

        return {
            id: user.id,
            company_id: user.user_metadata?.company_id
        };
    },

    // Use PostgreSQL function to get user's photos
    getPhotos: async function (projectId = null, searchQuery = '', filters = {}) {
        try {
            const user = await this.getCurrentUser();

            // Call the PostgreSQL function you created
            const { data: photos, error } = await window.supabaseClient
                .rpc('get_user_photos', {
                    p_user_id: user.id
                });

            if (error) throw error;

            // Apply additional filtering if needed
            let filteredPhotos = photos;
            if (projectId && projectId !== 'all') {
                filteredPhotos = filteredPhotos.filter(photo =>
                    photo.project_id === projectId);
            }

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filteredPhotos = filteredPhotos.filter(photo =>
                    (photo.description && photo.description.toLowerCase().includes(query)) ||
                    (photo.tags && photo.tags.some(tag => tag.toLowerCase().includes(query))));
            }

            // Apply additional filters
            if (filters.date && filters.date !== 'all') {
                const now = new Date();
                let startDate;

                switch (filters.date) {
                    case 'today':
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        break;
                    case 'week':
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                        break;
                    case 'month':
                        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                        break;
                }

                if (startDate) {
                    filteredPhotos = filteredPhotos.filter(photo =>
                        new Date(photo.created_at) >= startDate);
                }
            }

            if (filters.user && filters.user !== 'all') {
                filteredPhotos = filteredPhotos.filter(photo =>
                    photo.user_id === filters.user);
            }

            if (filters.tag && filters.tag !== 'all') {
                if (filters.tag === 'issue') {
                    filteredPhotos = filteredPhotos.filter(photo =>
                        photo.has_issues);
                } else {
                    filteredPhotos = filteredPhotos.filter(photo =>
                        photo.tags && photo.tags.includes(filters.tag));
                }
            }

            if (filters.status && filters.status !== 'all') {
                filteredPhotos = filteredPhotos.filter(photo =>
                    photo.status === filters.status);
            }

            return filteredPhotos;

        } catch (error) {
            console.error('Error fetching photos:', error);
            throw new Error('Failed to load photos: ' + error.message);
        }
    },

    // Use PostgreSQL function to add a new photo
    addPhoto: async function (photoData) {
        try {
            const user = await this.getCurrentUser();

            // Call the PostgreSQL function you created
            const { data, error } = await window.supabaseClient
                .rpc('add_photo', {
                    p_url: photoData.url,
                    p_description: photoData.description,
                    p_project_id: photoData.project_id,
                    p_user_id: user.id,
                    p_tags: photoData.tags,
                    p_geolocation: photoData.geolocation
                });

            if (error) throw error;
            return data;

        } catch (error) {
            console.error('Error adding photo:', error);
            throw new Error('Failed to add photo: ' + error.message);
        }
    },

    // Delete a photo with security validation
    deletePhoto: async function (photoId) {
        try {
            const user = await this.getCurrentUser();

            // First verify the photo belongs to user's company
            const { data: photo, error: fetchError } = await window.supabaseClient
                .from('project_photos')
                .select('company_id')
                .eq('id', photoId)
                .single();

            if (fetchError) throw fetchError;

            if (user.company_id !== photo.company_id) {
                throw new Error('Access denied: Cannot delete this photo');
            }

            // Delete the photo
            const { error } = await window.supabaseClient
                .from('project_photos')
                .delete()
                .eq('id', photoId);

            if (error) throw error;
            return true;

        } catch (error) {
            console.error('Error deleting photo:', error);
            throw new Error('Failed to delete photo: ' + error.message);
        }
    },

    // Add annotation to a photo
    addAnnotation: async function (photoId, annotationData) {
        try {
            const user = await this.getCurrentUser();

            // First verify the photo belongs to user's company
            const { data: photo, error: fetchError } = await window.supabaseClient
                .from('project_photos')
                .select('company_id')
                .eq('id', photoId)
                .single();

            if (fetchError) throw fetchError;

            if (user.company_id !== photo.company_id) {
                throw new Error('Access denied: Cannot annotate this photo');
            }

            // Update the photo with annotation data
            const { data, error } = await window.supabaseClient
                .from('project_photos')
                .update({
                    annotations: annotationData.annotations,
                    issue_description: annotationData.issue_description,
                    issue_assignee: annotationData.issue_assignee,
                    issue_priority: annotationData.issue_priority,
                    has_issues: true,
                    status: 'pending'
                })
                .eq('id', photoId)
                .select();

            if (error) throw error;
            return data;

        } catch (error) {
            console.error('Error adding annotation:', error);
            throw new Error('Failed to add annotation: ' + error.message);
        }
    },

    // Get storage usage for the company
    getStorageUsage: async function () {
        try {
            const user = await this.getCurrentUser();

            const { data, error } = await window.supabaseClient
                .rpc('get_storage_usage', {
                    p_company_id: user.company_id
                });

            if (error) throw error;
            return data;

        } catch (error) {
            console.error('Error fetching storage usage:', error);
            throw new Error('Failed to load storage usage: ' + error.message);
        }
    }
};

document.addEventListener('DOMContentLoaded', function () {
    // Initialize Cloudinary upload widget
    const cloudinaryWidget = cloudinary.createUploadWidget({
        cloudName: 'dlenvfyx5',
        uploadPreset: 'sierra_suites_upload',
        sources: ['local', 'camera'],
        multiple: true,
        clientAllowedFormats: ['image'],
        maxImageFileSize: 5000000, // 5MB
        showAdvancedOptions: true,
        styles: {
            palette: {
                window: "#1E3A8A",
                windowBorder: "#90A0B3",
                tabIcon: "#F97316",
                menuIcons: "#5A616A",
                textDark: "#000000",
                textLight: "#FFFFFF",
                link: "#F97316",
                action: "#FF620C",
                inactiveTabIcon: "#0E2F5A",
                error: "#F44235",
                inProgress: "#0078FF",
                complete: "#20B832",
                sourceBg: "#E4EBF1"
            },
            fonts: {
                default: null,
                "'Inter', sans-serif": {
                    url: "https://fonts.googleapis.com/css?family=Inter",
                    active: true
                }
            }
        }
    }, (error, result) => {
        if (error) {
            console.error("Upload Error:", error);
            alert("Sorry, the upload failed. Please check your connection and try again. Error: " + error.statusText);
            return;
        }

        if (result && result.event === "success") {
            console.log("Upload successful: ", result.info);
            // Save the photo info to your database
            savePhotoToDatabase(result.info);
        } else if (result && result.event === "close") {
            console.log("Upload widget was closed");
        }
    });

    // Modal functionality
    const uploadModal = document.getElementById('upload-modal');
    const annotationModal = document.getElementById('annotation-modal');
    const uploadBtn = document.getElementById('upload-photos-btn');
    const closeModalBtns = document.querySelectorAll('.modal-close');
    const cancelUploadBtn = document.getElementById('cancel-upload');
    const browseBtn = document.getElementById('browse-btn');
    const fileInput = document.getElementById('file-input');
    const dropArea = document.getElementById('drop-area');
    const startUploadBtn = document.getElementById('start-upload-btn');
    const voiceBtn = document.getElementById('voice-btn');
    const voiceInputContainer = document.getElementById('voice-input-container');
    const descriptionTextarea = document.getElementById('photo-description');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const userName = document.getElementById('userName');
    const userCompany = document.getElementById('userCompany');
    const userAvatar = document.getElementById('userAvatar');
    const filterBtn = document.getElementById('filter-btn');
    const filterPanel = document.getElementById('filter-panel');
    const closeFilterPanel = document.getElementById('close-filter-panel');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    const mapViewBtn = document.getElementById('map-view-btn');
    const mapView = document.getElementById('map-view');
    const bulkActionsBtn = document.getElementById('bulk-actions-btn');
    const cancelAnnotationBtn = document.getElementById('cancel-annotation');
    const saveAnnotationBtn = document.getElementById('save-annotation');
    const clearAnnotationsBtn = document.getElementById('clear-annotations');
    const annotationCanvas = document.getElementById('annotation-canvas');
    const ctx = annotationCanvas.getContext('2d');

    let currentFilters = {};
    let map = null;
    let mapMarkers = [];
    let currentAnnotatedPhotoId = null;

    // Initialize user data
    async function initUserData() {
        try {
            // Check if Supabase is initialized
            if (!window.supabaseClient) {
                console.error('Supabase client not initialized. Please ensure init_supabase.js is loaded.');
                return;
            }

            const { data: { user }, error } = await window.supabaseClient.auth.getUser();

            if (error || !user) {
                console.error('Error getting user:', error);
                return;
            }

            // Get user profile
            const { data: profile, error: profileError } = await window.supabaseClient
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                // Create default profile if doesn't exist
                const { data: newProfile, error: insertError } = await window.supabaseClient
                    .from('user_profiles')
                    .insert([{
                        id: user.id,
                        first_name: user.user_metadata.first_name || 'User',
                        last_name: user.user_metadata.last_name || 'Name',
                        company_name: user.user_metadata.company_name || 'Company'
                    }])
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating profile:', insertError);
                } else {
                    updateUserUI(newProfile);
                }
            } else {
                updateUserUI(profile);
            }

            // Load storage usage
            loadStorageUsage();

        } catch (error) {
            console.error('Error initializing user data:', error);
        }
    }

    // Update UI with user data
    function updateUserUI(profile) {
        const firstName = profile?.first_name || 'User';
        const lastName = profile?.last_name || 'Name';
        const companyName = profile?.company_name || 'Company';

        userName.textContent = `${firstName} ${lastName}`;
        userCompany.textContent = companyName;
        userAvatar.src = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=2563eb&color=fff`;
    }

    // Load storage usage
    async function loadStorageUsage() {
        try {
            const usage = await PhotoAPI.getStorageUsage();
            const usedGB = (usage.total_bytes / (1024 * 1024 * 1024)).toFixed(1);
            const totalGB = (usage.storage_limit / (1024 * 1024 * 1024)).toFixed(0);
            const percentage = (usage.total_bytes / usage.storage_limit) * 100;

            document.getElementById('storage-bar').style.width = `${percentage}%`;
            document.getElementById('storage-used').textContent = `${usedGB} GB`;
            document.getElementById('storage-total').textContent = `${totalGB} GB`;

        } catch (error) {
            console.error('Error loading storage usage:', error);
        }
    }

    // Show voice input for Pro/Enterprise tiers (simulated here)
    const userTier = 'starter'; // Change to 'pro' or 'enterprise' to test
    if (userTier !== 'starter') {
        voiceInputContainer.style.display = 'block';
    }

    // Toggle sidebar on mobile
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Open modal when upload button is clicked
    uploadBtn.addEventListener('click', () => {
        uploadModal.classList.add('active');
        loadProjectsForDropdown();
    });

    // Close modals when close button is clicked
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            uploadModal.classList.remove('active');
            annotationModal.classList.remove('active');
        });
    });

    cancelUploadBtn.addEventListener('click', () => {
        uploadModal.classList.remove('active');
    });

    cancelAnnotationBtn.addEventListener('click', () => {
        annotationModal.classList.remove('active');
    });

    // Close modal when clicking outside of it
    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            uploadModal.classList.remove('active');
        }
    });

    annotationModal.addEventListener('click', (e) => {
        if (e.target === annotationModal) {
            annotationModal.classList.remove('active');
        }
    });

    // Open file browser when browse button is clicked
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('dragover');
    }

    function unhighlight() {
        dropArea.classList.remove('dragover');
    }

    dropArea.addEventListener('drop', handleDrop, false);

    // Voice-to-text functionality
    if (voiceBtn) {
        voiceBtn.addEventListener('click', startVoiceInput);
    }

    // Filter functionality
    filterBtn.addEventListener('click', () => {
        filterPanel.classList.toggle('active');
    });

    closeFilterPanel.addEventListener('click', () => {
        filterPanel.classList.remove('active');
    });

    applyFiltersBtn.addEventListener('click', () => {
        currentFilters = {
            date: document.getElementById('date-filter').value,
            user: document.getElementById('user-filter').value,
            tag: document.getElementById('tag-filter').value,
            status: document.getElementById('status-filter').value
        };

        filterPanel.classList.remove('active');
        loadPhotos();
    });

    resetFiltersBtn.addEventListener('click', () => {
        document.getElementById('date-filter').value = 'all';
        document.getElementById('user-filter').value = 'all';
        document.getElementById('tag-filter').value = 'all';
        document.getElementById('status-filter').value = 'all';

        currentFilters = {};
        loadPhotos();
    });

    // View toggling
    gridViewBtn.addEventListener('click', () => {
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        mapViewBtn.classList.remove('active');
        mapView.classList.remove('active');
        document.getElementById('photos-container').style.display = 'grid';
    });

    listViewBtn.addEventListener('click', () => {
        gridViewBtn.classList.remove('active');
        listViewBtn.classList.add('active');
        mapViewBtn.classList.remove('active');
        mapView.classList.remove('active');
        document.getElementById('photos-container').style.display = 'block';

        // Convert to list view
        const photosContainer = document.getElementById('photos-container');
        const photoCards = photosContainer.querySelectorAll('.photo-card');

        photoCards.forEach(card => {
            card.style.display = 'flex';
            card.style.flexDirection = 'row';
            card.querySelector('.photo-container').style.width = '200px';
            card.querySelector('.photo-container').style.height = '150px';
        });
    });

    mapViewBtn.addEventListener('click', () => {
        gridViewBtn.classList.remove('active');
        listViewBtn.classList.remove('active');
        mapViewBtn.classList.add('active');
        document.getElementById('photos-container').style.display = 'none';
        mapView.classList.add('active');

        // Initialize map if not already done
        if (!map) {
            initMap();
        }

        loadMapPhotos();
    });

    // Annotation functionality
    clearAnnotationsBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
    });

    saveAnnotationBtn.addEventListener('click', () => {
        const annotationData = {
            annotations: annotationCanvas.toDataURL(),
            issue_description: document.getElementById('issue-description').value,
            issue_assignee: document.getElementById('issue-assignee').value,
            issue_priority: document.getElementById('issue-priority').value
        };

        saveAnnotation(currentAnnotatedPhotoId, annotationData);
    });

    // Tool selection for annotation
    document.querySelectorAll('[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Implement tool functionality here
        });
    });

    function closeModal() {
        uploadModal.classList.remove('active');
        // Clear any selected files
        fileInput.value = '';
        clearPreview();
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length > 0) {
            startUploadBtn.disabled = false;
            previewFiles(files);
        }
    }

    function previewFiles(files) {
        const previewContainer = document.getElementById('upload-preview');
        previewContainer.innerHTML = '';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.match('image.*')) continue;

            const reader = new FileReader();
            reader.onload = function (e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';

                const img = document.createElement('img');
                img.src = e.target.result;

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.addEventListener('click', () => {
                    previewItem.remove();
                    if (document.querySelectorAll('.preview-item').length === 0) {
                        startUploadBtn.disabled = true;
                    }
                });

                previewItem.appendChild(img);
                previewItem.appendChild(removeBtn);
                previewContainer.appendChild(previewItem);
            }
            reader.readAsDataURL(file);
        }
    }

    function clearPreview() {
        const previewContainer = document.getElementById('upload-preview');
        previewContainer.innerHTML = '';
        startUploadBtn.disabled = true;
    }

    function startVoiceInput() {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Your browser doesn't support voice input. Please use Chrome or Edge.");
            return;
        }

        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Listening...';
        voiceBtn.classList.add('recording');

        recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            descriptionTextarea.value = transcript;
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Description';
            voiceBtn.classList.remove('recording');
        };

        recognition.onerror = function (event) {
            console.error('Speech recognition error', event.error);
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Description';
            voiceBtn.classList.remove('recording');
        };

        recognition.onend = function () {
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Description';
            voiceBtn.classList.remove('recording');
        };

        recognition.start();
    }

    // Start upload process
    startUploadBtn.addEventListener('click', () => {
        // Use the Cloudinary widget for uploads
        cloudinaryWidget.open();
    });

    // Initialize map
    function initMap() {
        map = L.map('map-view').setView([39.8283, -98.5795], 4); // Center of US

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }

    // Load photos on map
    function loadMapPhotos() {
        if (!map) return;

        // Clear existing markers
        mapMarkers.forEach(marker => map.removeLayer(marker));
        mapMarkers = [];

        // Add new markers (this would use real data in production)
        const samplePhotos = [
            { lat: 40.7128, lng: -74.0060, title: 'New York Construction', url: 'https://example.com/photo1.jpg' },
            { lat: 34.0522, lng: -118.2437, title: 'LA Office Building', url: 'https://example.com/photo2.jpg' },
            { lat: 41.8781, lng: -87.6298, title: 'Chicago Renovation', url: 'https://example.com/photo3.jpg' }
        ];

        samplePhotos.forEach(photo => {
            const marker = L.marker([photo.lat, photo.lng]).addTo(map);
            marker.bindPopup(`
                        <div style="text-align: center;">
                            <img src="${photo.url}" style="width: 100px; height: 75px; object-fit: cover; border-radius: 8px;">
                            <p><strong>${photo.title}</strong></p>
                            <button class="btn btn-primary btn-small" onclick="viewPhoto('${photo.url}')">View Photo</button>
                        </div>
                    `);
            mapMarkers.push(marker);
        });

        // Fit map to show all markers
        if (samplePhotos.length > 0) {
            const group = new L.featureGroup(mapMarkers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    // Real function to save photo data to Supabase using PostgreSQL function
    async function savePhotoToDatabase(photoInfo) {
        try {
            const projectId = document.getElementById('upload-project').value;
            const description = document.getElementById('photo-description').value;
            const tags = document.getElementById('photo-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
            const captureLocation = document.getElementById('capture-location').checked;

            let geolocation = null;
            if (captureLocation && navigator.geolocation) {
                geolocation = await new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        position => resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        }),
                        error => resolve(null)
                    );
                });
            }

            // Use our secure API function
            await PhotoAPI.addPhoto({
                url: photoInfo.secure_url,
                public_id: photoInfo.public_id,
                description: description,
                project_id: projectId || null,
                format: photoInfo.format,
                bytes: photoInfo.bytes,
                width: photoInfo.width,
                height: photoInfo.height,
                tags: tags,
                geolocation: geolocation
            });

            alert('Photo uploaded and saved successfully!');
            uploadModal.classList.remove('active');
            loadPhotos();
            loadStorageUsage();

        } catch (error) {
            console.error('Error in savePhotoToDatabase:', error);
            alert('Error: ' + error.message);
        }
    }

    // Real function to load photos from Supabase using PostgreSQL function
    async function loadPhotos() {
        try {
            document.getElementById('loading-spinner').style.display = 'block';

            const projectFilter = document.getElementById('project-filter').value;
            const searchQuery = document.getElementById('photo-search').value;

            // Use our secure API function
            const photos = await PhotoAPI.getPhotos(
                projectFilter !== 'all' ? projectFilter : null,
                searchQuery,
                currentFilters
            );

            // Display the photos in the gallery
            const photosGrid = document.getElementById('photos-container');
            photosGrid.innerHTML = '';

            if (photos.length === 0) {
                photosGrid.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-camera"></i>
                                <h3>No photos yet</h3>
                                <p>Upload your first photo to get started</p>
                            </div>
                        `;
                return;
            }

            photos.forEach(photo => {
                const photoCard = document.createElement('div');
                photoCard.className = 'photo-card';

                let issueBadge = '';
                if (photo.has_issues) {
                    issueBadge = `<div class="issue-badge">Issue: ${photo.issue_priority}</div>`;
                }

                photoCard.innerHTML = `
                            <div class="photo-container">
                                <img src="${photo.url}" alt="${photo.description || 'Construction photo'}">
                                ${issueBadge}
                                <div class="photo-overlay">
                                    <button class="btn btn-icon" onclick="viewPhoto('${photo.url}')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-icon" onclick="downloadPhoto('${photo.url}', '${photo.description || 'photo'}')">
                                        <i class="fas fa-download"></i>
                                    </button>
                                    <button class="btn btn-icon" onclick="annotatePhoto('${photo.id}', '${photo.url}')">
                                        <i class="fas fa-draw-polygon"></i>
                                    </button>
                                    <button class="btn btn-icon" onclick="deletePhoto('${photo.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="photo-details">
                                <h4>${photo.description || 'Untitled photo'}</h4>
                                <p>${photo.project_name || 'No project'}</p>
                                <div class="photo-meta">
                                    <span><i class="fas fa-calendar-alt"></i> ${new Date(photo.created_at).toLocaleDateString()}</span>
                                    <span><i class="fas fa-user"></i> ${photo.username || 'Unknown'}</span>
                                </div>
                                ${photo.tags && photo.tags.length > 0 ? `
                                <div class="photo-tags">
                                    ${photo.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                                </div>
                                ` : ''}
                            </div>
                        `;
                photosGrid.appendChild(photoCard);
            });

            document.getElementById('loading-spinner').style.display = 'none';

        } catch (error) {
            console.error('Error in loadPhotos:', error);
            document.getElementById('loading-spinner').style.display = 'none';
            alert(error.message);
        }
    }

    // Load projects for dropdowns
    async function loadProjectsForDropdown() {
        try {
            // Check if Supabase is initialized
            if (!window.supabaseClient) {
                console.error('Supabase client not initialized. Please ensure init_supabase.js is loaded.');
                return;
            }

            const { data: { user } } = await window.supabaseClient.auth.getUser();

            if (!user) return;

            const { data: projects, error } = await window.supabaseClient
                .from('projects')
                .select('id, name')
                .eq('company_id', user.user_metadata?.company_id)
                .order('name');

            if (error) {
                console.error('Error loading projects:', error);
                return;
            }

            // Populate upload project dropdown
            const uploadDropdown = document.getElementById('upload-project');
            uploadDropdown.innerHTML = '<option value="">Select Project</option>';

            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                uploadDropdown.appendChild(option);
            });

            // Populate filter dropdown
            const filterDropdown = document.getElementById('project-filter');
            const currentFilter = filterDropdown.value;
            filterDropdown.innerHTML = '<option value="all">All Projects</option>';

            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                if (project.id === currentFilter) {
                    option.selected = true;
                }
                filterDropdown.appendChild(option);
            });

        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    // View photo in full screen
    window.viewPhoto = function (url) {
        window.open(url, '_blank');
    };

    // Download photo
    window.downloadPhoto = function (url, name) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}-${new Date().toISOString().slice(0, 10)}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Annotate photo
    window.annotatePhoto = function (photoId, photoUrl) {
        currentAnnotatedPhotoId = photoId;

        // Load the photo into the canvas
        const img = new Image();
        img.onload = function () {
            // Clear canvas
            ctx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);

            // Draw image on canvas
            const ratio = Math.min(
                annotationCanvas.width / img.width,
                annotationCanvas.height / img.height
            );
            const width = img.width * ratio;
            const height = img.height * ratio;
            const x = (annotationCanvas.width - width) / 2;
            const y = (annotationCanvas.height - height) / 2;

            ctx.drawImage(img, x, y, width, height);
        };
        img.src = photoUrl;

        // Show the annotation modal
        annotationModal.classList.add('active');
    };

    // Save annotation
    async function saveAnnotation(photoId, annotationData) {
        try {
            await PhotoAPI.addAnnotation(photoId, annotationData);
            alert('Annotation saved successfully!');
            annotationModal.classList.remove('active');
            loadPhotos();

        } catch (error) {
            console.error('Error saving annotation:', error);
            alert('Error: ' + error.message);
        }
    }

    // Delete photo using our secure API function
    window.deletePhoto = async function (photoId) {
        if (!confirm('Are you sure you want to delete this photo?')) return;

        try {
            await PhotoAPI.deletePhoto(photoId);
            alert('Photo deleted successfully!');
            loadPhotos();
            loadStorageUsage();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    // Set up event listeners for filters
    document.getElementById('project-filter').addEventListener('change', loadPhotos);
    document.getElementById('photo-search').addEventListener('input', debounce(loadPhotos, 300));
    document.getElementById('sort-select').addEventListener('change', loadPhotos);

    // Debounce function for search
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

    // Load photos and projects when page loads
    initUserData();
    loadPhotos();
    loadProjectsForDropdown();

    // End of main logic

    // Throttled scroll-triggered dashboard animations
    // Animation targets: dashboard cards, stats, tables, photo cards

    document.addEventListener('DOMContentLoaded', function () {
        const animatedEls = document.querySelectorAll('.dashboard-card, .dashboard-stat, .dashboard-table, .photo-card');

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
});