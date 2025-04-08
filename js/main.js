// Main JavaScript file for MediConnect

document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile navigation
    initMobileNav();
    
    // Check if user is logged in
    checkAuthStatus();
});

// Mobile Navigation
function initMobileNav() {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');
    
    if (burger) {
        burger.addEventListener('click', () => {
            // Toggle Nav
            nav.classList.toggle('nav-active');
            
            // Animate Links
            navLinks.forEach((link, index) => {
                if (link.style.animation) {
                    link.style.animation = '';
                } else {
                    link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
                }
            });
            
            // Burger Animation
            burger.classList.toggle('toggle');
        });
    }
}

// Check Authentication Status
function checkAuthStatus() {
    const user = localStorage.getItem('mediconnect_user');
    
    if (user) {
        // User is logged in
        const userData = JSON.parse(user);
        
        // Check if on login/register page and redirect if needed
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('register.html')) {
            
            if (userData.userType === 'patient') {
                window.location.href = 'patient-dashboard.html';
            } else if (userData.userType === 'doctor') {
                window.location.href = 'doctor-dashboard.html';
            }
        }
    } else {
        // User is not logged in
        // If on a protected page, redirect to login
        if (window.location.pathname.includes('patient-') || 
            window.location.pathname.includes('doctor-')) {
            window.location.href = 'login.html';
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('mediconnect_user');
    window.location.href = 'index.html';
}

// Add logout event listener if logout button exists
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <p>${message}</p>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Add event listener to close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Format date for display
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Format time for display
function formatTime(timeString) {
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString(undefined, options);
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Convert miles to kilometers
function milesToKm(miles) {
    return miles * 1.60934;
}

// Convert kilometers to miles
function kmToMiles(km) {
    return km / 1.60934;
}

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Schedule a browser notification
function scheduleNotification(title, options, delay) {
    setTimeout(() => {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification(title, options);
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification(title, options);
                    }
                });
            }
        } else {
            // Fallback to alert if notifications are not supported
            alert(`${title}: ${options.body}`);
        }
    }, delay);
}

// Initialize sample data if not exists
function initializeSampleData() {
    // Check if sample data already exists
    if (!localStorage.getItem('mediconnect_doctors') && 
        !localStorage.getItem('mediconnect_patients') && 
        !localStorage.getItem('mediconnect_appointments')) {
        
        // Sample doctors data
        const doctors = [
            {
                id: 'doc1',
                name: 'Dr. Sarah Smith',
                email: 'sarah.smith@example.com',
                password: 'password123', // In a real app, this would be hashed
                phone: '(123) 456-7890',
                address: '123 Medical Center, Suite 456, New York, NY',
                specialization: 'cardiology',
                license: 'MC12345',
                experience: 10,
                location: {
                    lat: 40.7128,
                    lng: -74.0060
                },
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
                rating: 4.5,
                reviews: 28
            },
            {
                id: 'doc2',
                name: 'Dr. Michael Johnson',
                email: 'michael.johnson@example.com',
                password: 'password123',
                phone: '(234) 567-8901',
                address: '456 Health Plaza, Room 789, New York, NY',
                specialization: 'dermatology',
                license: 'MC67890',
                experience: 15,
                location: {
                    lat: 40.7282,
                    lng: -73.9942
                },
                availability: [
                    {
                        day: 'Monday',
                        slots: ['10:00', '11:00', '13:00', '14:00', '15:00']
                    },
                    {
                        day: 'Wednesday',
                        slots: ['10:00', '11:00', '13:00', '14:00', '15:00']
                    },
                    {
                        day: 'Friday',
                        slots: ['10:00', '11:00', '13:00', '14:00', '15:00']
                    }
                ],
                rating: 4.2,
                reviews: 42
            },
            {
                id: 'doc3',
                name: 'Dr. Emily Williams',
                email: 'emily.williams@example.com',
                password: 'password123',
                phone: '(345) 678-9012',
                address: '789 Neurology Center, New York, NY',
                specialization: 'neurology',
                license: 'MC54321',
                experience: 8,
                location: {
                    lat: 40.7382,
                    lng: -73.9852
                },
                availability: [
                    {
                        day: 'Tuesday',
                        slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
                    },
                    {
                        day: 'Thursday',
                        slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
                    }
                ],
                rating: 4.5,
                reviews: 28
            },
            {
                id: 'doc4',
                name: 'Dr. Robert Chen',
                email: 'robert.chen@example.com',
                password: 'password123',
                phone: '(456) 789-0123',
                address: '321 Orthopedic Specialists, New York, NY',
                specialization: 'orthopedics',
                license: 'MC98765',
                experience: 12,
                location: {
                    lat: 40.7489,
                    lng: -73.9680
                },
                availability: [
                    {
                        day: 'Monday',
                        slots: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00']
                    },
                    {
                        day: 'Wednesday',
                        slots: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00']
                    },
                    {
                        day: 'Friday',
                        slots: ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00']
                    }
                ],
                rating: 4.0,
                reviews: 42
            }
        ];
        
        // Sample patients data
        const patients = [
            {
                id: 'pat1',
                name: 'John Doe',
                email: 'john.doe@example.com',
                password: 'password123',
                phone: '(567) 890-1234',
                address: '123 Main St, New York, NY',
                dob: '1985-05-15',
                transportation: 'own',
                location: {
                    lat: 40.7500,
                    lng: -73.9800
                },
                medicalHistory: [
                    {
                        condition: 'Hypertension',
                        diagnosedDate: '2018-03-10',
                        medications: ['Lisinopril 10mg']
                    }
                ],
                appointmentHistory: [],
                noShowCount: 0
            },
            {
                id: 'pat2',
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                password: 'password123',
                phone: '(678) 901-2345',
                address: '456 Oak St, New York, NY',
                dob: '1990-08-22',
                transportation: 'public',
                location: {
                    lat: 40.7400,
                    lng: -73.9900
                },
                medicalHistory: [
                    {
                        condition: 'Asthma',
                        diagnosedDate: '2015-06-20',
                        medications: ['Albuterol Inhaler']
                    }
                ],
                appointmentHistory: [],
                noShowCount: 0
            }
        ];
        
        // Sample appointments data
        const appointments = [
            {
                id: 'app1',
                patientId: 'pat1',
                doctorId: 'doc1',
                date: '2025-04-10',
                time: '10:00',
                duration: 30, // minutes
                status: 'confirmed',
                reason: 'Annual checkup',
                notes: ''
            },
            {
                id: 'app2',
                patientId: 'pat1',
                doctorId: 'doc2',
                date: '2025-04-15',
                time: '14:00',
                duration: 30,
                status: 'confirmed',
                reason: 'Skin examination',
                notes: ''
            },
            {
                id: 'app3',
                patientId: 'pat2',
                doctorId: 'doc3',
                date: '2025-04-12',
                time: '11:00',
                duration: 30,
                status: 'confirmed',
                reason: 'Headache consultation',
                notes: ''
            }
        ];
        
        // Save sample data to localStorage
        localStorage.setItem('mediconnect_doctors', JSON.stringify(doctors));
        localStorage.setItem('mediconnect_patients', JSON.stringify(patients));
        localStorage.setItem('mediconnect_appointments', JSON.stringify(appointments));
    }
}

// Initialize sample data
initializeSampleData();
