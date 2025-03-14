document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded and parsed');

    const loginModal = document.getElementById('loginModal');
    const loginForm = loginModal.querySelector('form');
    const loginButton = document.querySelector('#login');
    const actionsMenu = document.querySelector('#actions-menu');

    // Add an alert container for error messages
    const alertContainer = document.createElement('div');
    alertContainer.id = 'login-alert-container';
    alertContainer.className = 'alert-container mt-3';
    loginModal.querySelector('.modal-body').appendChild(alertContainer);

    // Create Toast Container (Top-Right)
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(toastContainer);

    // Toast Function
    function showToast(message) {
        const toastElement = document.createElement('div');
        toastElement.className = 'toast align-items-center text-white bg-success border-0';
        toastElement.setAttribute('role', 'alert');
        toastElement.setAttribute('aria-live', 'assertive');
        toastElement.setAttribute('aria-atomic', 'true');

        toastElement.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;

        toastContainer.appendChild(toastElement);

        const toast = new bootstrap.Toast(toastElement);
        toast.show();

        // Auto-remove the toast after fade-out
        toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
    }

    // Create avatar dropdown
    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'avatar-container';
    avatarContainer.style.display = 'none';

    avatarContainer.innerHTML = `
        <div class="avatar-dropdown">
            <img id="avatar-image" class="avatar-image" alt="User Avatar">
            <span id="avatar-name" class="avatar-name"></span>
            <div class="dropdown-menu">
                <a href="#" id="profile-page" class="dropdown-item">Profile</a>
                <button id="logout" class="dropdown-item">Logout</button>
            </div>
        </div>
    `;

    actionsMenu.appendChild(avatarContainer);

    let profiles = [];
    let segments = {};

    // Fetch profiles and segments path from business-config.json
    fetch('../business-data/business-config.json')
        .then(response => response.json())
        .then(configData => {
            const profilesPath = configData[0].profiles;
            const segmentsPath = configData[0].segments;

            return Promise.all([
                fetch(profilesPath).then(res => res.json()),
                fetch(segmentsPath).then(res => res.json())
            ]);
        })
        .then(([profilesData, segmentsData]) => {
            profiles = profilesData.customer_profiles;
            segments = segmentsData.customer_segments; // Correctly access the nested structure
            console.log('✅ Loaded profiles:', profiles);
            console.log('✅ Loaded segments:', segments);

            // Auto-login if "Remember Me" or Persistent Login
            const savedUser = JSON.parse(localStorage.getItem('loggedInUser'));
            if (savedUser) {
                displayUserUI(savedUser);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('Error loading profile data. Please try again later.');
        });

    // Login functionality
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
    
        const email = document.querySelector('#loginEmail').value.trim();
        const password = document.querySelector('#loginPassword').value.trim();
        const rememberMe = document.querySelector('#rememberMe').checked;
    
        console.log(`Login attempt with email: ${email}`);
    
        const user = profiles.find(profile =>
            profile.user.email === email && profile.user.password === password
        );
    
        if (user) {
            console.log('Login successful:', user);
    
            // Clean localStorage before saving
            localStorage.clear();
    
            // Correctly retrieve `customer_segments` value from nested structure
            const userSegmentKey = user.user.customer_segments 
                ? user.user.customer_segments.trim() 
                : null;
    
            if (!userSegmentKey) {
                console.warn('⚠️ No customer_segments found for this user.');
            }
    
            console.log('✅ Segment keys:', Object.keys(segments));
    
            // Correctly access segment data within `segments.customer_segments`
            const userSegment = segments[userSegmentKey] || { profile: 'Unknown Segment', key_attributes: {} };
    
            console.log('✅ Found segment:', userSegment);
    
            // Store full profile and segment data in localStorage
            const userData = {
                ...user.user, // Spread full user data
                segmentData: userSegment
            };
    
            localStorage.setItem('loggedInUser', JSON.stringify(userData));
    
            displayUserUI(userData);
    
            // Show success toast
            showToast('Logged in successfully');
    
            // Close modal
            document.querySelector('#loginModal .btn-close').click();
        } else {
            console.log('Invalid email or password');
            showLoginError('Invalid email or password. Please try again.');
        }
    });

    // Display avatar and logout UI
    function displayUserUI(user) {
        console.log('🔎 User object in displayUserUI:', user);
    
        const avatarImage = document.getElementById('avatar-image');
        const avatarName = document.getElementById('avatar-name');
        const profilePage = document.getElementById('profile-page');
    
        if (!avatarImage) {
            console.error('❌ Avatar image element not found in DOM.');
            return;
        }
    
        console.log('✅ Avatar image element found.');
    
        const profileImageUrl = user.profileImage || '../assets/default-avatar.png';
        avatarImage.src = profileImageUrl;
    
        avatarImage.onerror = function () {
            console.warn(`⚠️ Failed to load profile image for ${user.name}. Falling back to default.`);
            avatarImage.src = '../assets/img/default-avatar.png';
        };
    
        avatarName.textContent = user.name || 'User';
        profilePage.href = `../profile.html?user=${encodeURIComponent(user.email)}`;
    
        loginButton.style.display = 'none';
        avatarContainer.style.display = 'block';
    }

    // Logout functionality
    document.getElementById('logout').addEventListener('click', function () {
        console.log('User logged out');

        // Clean localStorage before logout
        localStorage.clear();

        // Show logout toast
        showToast('Logged out');

        loginButton.style.display = 'block';
        avatarContainer.style.display = 'none';
    });

    // Show contextual Bootstrap alert for login errors
    function showLoginError(message) {
        alertContainer.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="ri-error-warning-line"></i> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }
});