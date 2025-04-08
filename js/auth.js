// Authentication JavaScript for MediConnect

document.addEventListener('DOMContentLoaded', function() {
    // Initialize user type toggle
    initUserTypeToggle();
    
    // Initialize login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Initialize register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
    
    // Initialize password toggle
    initPasswordToggle();
});

// Toggle between patient and doctor user types
function initUserTypeToggle() {
    const userTypeBtns = document.querySelectorAll('.user-type-btn');
    const patientFields = document.querySelector('.patient-fields');
    const doctorFields = document.querySelector('.doctor-fields');
    
    userTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            userTypeBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Toggle fields based on user type
            if (this.dataset.type === 'patient') {
                if (patientFields) patientFields.style.display = 'block';
                if (doctorFields) doctorFields.style.display = 'none';
            } else if (this.dataset.type === 'doctor') {
                if (patientFields) patientFields.style.display = 'none';
                if (doctorFields) doctorFields.style.display = 'block';
            }
        });
    });
}

// Toggle password visibility
function initPasswordToggle() {
    const toggles = document.querySelectorAll('.password-toggle');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordField = this.previousElementSibling;
            
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                this.innerHTML = '<i class="far fa-eye-slash"></i>';
            } else {
                passwordField.type = 'password';
                this.innerHTML = '<i class="far fa-eye"></i>';
            }
        });
    });
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    
    // Get form data
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const userType = document.querySelector('.user-type-btn.active').dataset.type;
    
    // Validate form data
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Get users from localStorage
    let users = [];
    if (userType === 'patient') {
        users = JSON.parse(localStorage.getItem('mediconnect_patients') || '[]');
    } else if (userType === 'doctor') {
        users = JSON.parse(localStorage.getItem('mediconnect_doctors') || '[]');
    }
    
    // Find user with matching email and password
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Store user data in localStorage (excluding password)
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            userType: userType
        };
        
        localStorage.setItem('mediconnect_user', JSON.stringify(userData));
        
        // Redirect to appropriate dashboard
        if (userType === 'patient') {
            window.location.href = 'patient-dashboard.html';
        } else if (userType === 'doctor') {
            window.location.href = 'doctor-dashboard.html';
        }
    } else {
        showNotification('Invalid email or password', 'error');
    }
}

// Handle registration form submission
function handleRegistration(e) {
    e.preventDefault();
    
    // Get form data
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const userType = document.querySelector('.user-type-btn.active').dataset.type;
    
    // Validate form data
    if (!fullname || !email || !password || !confirmPassword || !phone || !address) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    // Get additional fields based on user type
    let additionalData = {};
    
    if (userType === 'patient') {
        const dob = document.getElementById('dob').value;
        const transportation = document.getElementById('transportation').value;
        
        if (!dob || !transportation) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        additionalData = {
            dob,
            transportation,
            medicalHistory: [],
            appointmentHistory: [],
            noShowCount: 0
        };
    } else if (userType === 'doctor') {
        const specialization = document.getElementById('specialization').value;
        const license = document.getElementById('license').value;
        const experience = document.getElementById('experience').value;
        
        if (!specialization || !license || !experience) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        additionalData = {
            specialization,
            license,
            experience: parseInt(experience),
            availability: [
                {
                    day: 'Monday',
                    slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
                },
                {
                    day: 'Tuesday',
                    slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
                },
                {
                    day: 'Wednesday',
                    slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
                },
                {
                    day: 'Thursday',
                    slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
                },
                {
                    day: 'Friday',
                    slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
                }
            ],
            rating: 0,
            reviews: 0
        };
    }
    
    // Get users from localStorage
    let users = [];
    if (userType === 'patient') {
        users = JSON.parse(localStorage.getItem('mediconnect_patients') || '[]');
    } else if (userType === 'doctor') {
        users = JSON.parse(localStorage.getItem('mediconnect_doctors') || '[]');
    }
    
    // Check if email already exists
    if (users.some(u => u.email === email)) {
        showNotification('Email already exists', 'error');
        return;
    }
    
    // Create new user
    const newUser = {
        id: generateId(),
        name: fullname,
        email,
        password,
        phone,
        address,
        location: {
            lat: 40.7128, // Default to New York coordinates
            lng: -74.0060
        },
        ...additionalData
    };
    
    // Add new user to users array
    users.push(newUser);
    
    // Save users to localStorage
    if (userType === 'patient') {
        localStorage.setItem('mediconnect_patients', JSON.stringify(users));
    } else if (userType === 'doctor') {
        localStorage.setItem('mediconnect_doctors', JSON.stringify(users));
    }
    
    // Store user data in localStorage (excluding password)
    const userData = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        userType: userType
    };
    
    localStorage.setItem('mediconnect_user', JSON.stringify(userData));
    
    // Show success notification
    showNotification('Registration successful!', 'success');
    
    // Redirect to appropriate dashboard
    setTimeout(() => {
        if (userType === 'patient') {
            window.location.href = 'patient-dashboard.html';
        } else if (userType === 'doctor') {
            window.location.href = 'doctor-dashboard.html';
        }
    }, 1500);
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.auth-notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = `auth-notification notification-${type}`;
        document.querySelector('.auth-card').prepend(notification);
    } else {
        // Update notification type
        notification.className = `auth-notification notification-${type}`;
    }
    
    // Set notification message
    notification.textContent = message;
    
    // Show notification
    notification.style.display = 'block';
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
