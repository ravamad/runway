document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');

    const loginModal = document.getElementById('loginModal');
    const loginForm = loginModal.querySelector('form');
    const loginButton = document.querySelector('#login');
    const actionsMenu = document.querySelector('#actions-menu');

    // Create avatar dropdown
    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'avatar-container';
    avatarContainer.style.display = 'none'; // Hidden by default

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

    // Fetch profiles path from business-config.json
    fetch('../business-data/business-config.json')
        .then(response => response.json())
        .then(configData => {
            const profilesPath = configData[0].profiles;
            return fetch(profilesPath);
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            profiles = data.customer_profiles;
            console.log('Loaded profiles:', profiles);

            // Auto-login if "Remember Me" was checked
            const savedUser = JSON.parse(localStorage.getItem('loggedInUser'));
            if (savedUser) {
                displayUserUI(savedUser);
            }
        })
        .catch(error => {
            console.error('Error fetching profiles:', error);
            alert('Error loading profile data. Please try again later.');
        });

    // Login functionality
    loginForm.addEventListener('submit', function(event) {
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
            alert(`Welcome back, ${user.user.name || 'Guest'}!`);

            // Remember Me functionality
            if (rememberMe) {
                localStorage.setItem('loggedInUser', JSON.stringify(user));
            }

            displayUserUI(user);

            // Close modal
            document.querySelector('#loginModal .btn-close').click();
        } else {
            console.log('Invalid email or password');
            alert('Invalid email or password. Please try again.');
        }
    });

    // Display avatar and logout UI
    function displayUserUI({ user }) {
        console.log('🔎 User object in displayUserUI:', user);
    
        const avatarImage = document.getElementById('avatar-image');
        const avatarName = document.getElementById('avatar-name');
        const profilePage = document.getElementById('profile-page');
    
        if (!avatarImage) {
            console.error('❌ Avatar image element not found in DOM.');
            return;
        }
    
        console.log('✅ Avatar image element found.');
    
        // Confirm the profileImage URL
        console.log(`🔎 Profile Image URL: ${user.profileImage}`);
    
        // Correctly assign the profile image
        const profileImageUrl = user.profileImage || '../assets/default-avatar.png';
        avatarImage.src = profileImageUrl;
    
        avatarImage.onerror = function () {
            console.warn(`⚠️ Failed to load profile image for ${user.name}. Falling back to default.`);
            avatarImage.src = '../assets/img/default-avatar.png';
        };
    
        // Display the user's name
        avatarName.textContent = user.name || 'User';
        profilePage.href = `../profile.html?user=${encodeURIComponent(user.email)}`;
    
        // Show/hide UI elements
        loginButton.style.display = 'none';
        avatarContainer.style.display = 'block';
    }

    // Logout functionality
    document.getElementById('logout').addEventListener('click', function() {
        console.log('User logged out');
        alert('You have been logged out.');

        localStorage.removeItem('loggedInUser');

        // Show/hide UI elements
        loginButton.style.display = 'block';
        avatarContainer.style.display = 'none';
    });
});