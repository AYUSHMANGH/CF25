// Patient Dashboard JavaScript for MediConnect

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is a patient
    checkPatientAuth();
    
    // Load user data
    loadUserData();
    
    // Load upcoming appointments
    loadUpcomingAppointments();
    
    // Load recommended doctors
    loadRecommendedDoctors();
    
    // Initialize Google Map
    initMap();
    
    // Initialize date display
    updateDateDisplay();
    
    // Add event listeners
    addEventListeners();
    
    // Schedule appointment reminders
    scheduleAppointmentReminders();
});

// Check if user is logged in and is a patient
function checkPatientAuth() {
    const user = JSON.parse(localStorage.getItem('mediconnect_user') || '{}');
    
    if (!user.id || user.userType !== 'patient') {
        window.location.href = 'login.html';
    }
}

// Load user data
function loadUserData() {
    const user = JSON.parse(localStorage.getItem('mediconnect_user') || '{}');
    const patients = JSON.parse(localStorage.getItem('mediconnect_patients') || '[]');
    const patient = patients.find(p => p.id === user.id);
    
    if (patient) {
        // Update welcome message
        document.getElementById('welcome-name').textContent = patient.name.split(' ')[0];
        document.getElementById('user-name').textContent = patient.name;
        
        // Update dashboard stats
        updateDashboardStats(patient);
    }
}

// Update dashboard stats
function updateDashboardStats(patient) {
    const appointments = JSON.parse(localStorage.getItem('mediconnect_appointments') || '[]');
    const patientAppointments = appointments.filter(a => a.patientId === patient.id);
    
    // Count upcoming appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingAppointments = patientAppointments.filter(a => {
        const appointmentDate = new Date(a.date);
        return appointmentDate >= today && a.status !== 'cancelled';
    });
    
    // Count past appointments
    const pastAppointments = patientAppointments.filter(a => {
        const appointmentDate = new Date(a.date);
        return appointmentDate < today || a.status === 'completed';
    });
    
    // Count unique doctors visited
    const doctorsVisited = [...new Set(pastAppointments.map(a => a.doctorId))];
    
    // Update stats display
    document.getElementById('upcoming-appointments-count').textContent = upcomingAppointments.length;
    document.getElementById('past-appointments-count').textContent = pastAppointments.length;
    document.getElementById('doctors-visited-count').textContent = doctorsVisited.length;
}

// Load upcoming appointments
function loadUpcomingAppointments() {
    const user = JSON.parse(localStorage.getItem('mediconnect_user') || '{}');
    const appointments = JSON.parse(localStorage.getItem('mediconnect_appointments') || '[]');
    const doctors = JSON.parse(localStorage.getItem('mediconnect_doctors') || '[]');
    
    // Get upcoming appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingAppointments = appointments.filter(a => {
        const appointmentDate = new Date(a.date);
        return a.patientId === user.id && appointmentDate >= today && a.status !== 'cancelled';
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get container element
    const container = document.getElementById('upcoming-appointments-container');
    
    // Clear container
    container.innerHTML = '';
    
    // Check if there are upcoming appointments
    if (upcomingAppointments.length === 0) {
        container.innerHTML = '<p class="no-data">No upcoming appointments</p>';
        return;
    }
    
    // Display upcoming appointments (limit to 3)
    const appointmentsToShow = upcomingAppointments.slice(0, 3);
    
    appointmentsToShow.forEach(appointment => {
        const doctor = doctors.find(d => d.id === appointment.doctorId);
        
        if (doctor) {
            const appointmentDate = new Date(appointment.date);
            const month = appointmentDate.toLocaleString('default', { month: 'short' }).toUpperCase();
            const day = appointmentDate.getDate();
            const year = appointmentDate.getFullYear();
            
            const appointmentTime = formatTime(appointment.time);
            const endTime = calculateEndTime(appointment.time, appointment.duration);
            
            const appointmentCard = document.createElement('div');
            appointmentCard.className = 'appointment-card';
            appointmentCard.innerHTML = `
                <div class="appointment-date">
                    <div class="month">${month}</div>
                    <div class="day">${day}</div>
                    <div class="year">${year}</div>
                </div>
                <div class="appointment-details">
                    <h4>${doctor.name}</h4>
                    <p class="specialization">${capitalizeFirstLetter(doctor.specialization)}</p>
                    <p class="time"><i class="far fa-clock"></i> ${appointmentTime} - ${endTime}</p>
                    <p class="location"><i class="fas fa-map-marker-alt"></i> ${doctor.address}</p>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-reschedule" data-id="${appointment.id}"><i class="fas fa-calendar-alt"></i> Reschedule</button>
                    <button class="btn btn-cancel" data-id="${appointment.id}"><i class="fas fa-times"></i> Cancel</button>
                </div>
            `;
            
            container.appendChild(appointmentCard);
        }
    });
    
    // Add event listeners to buttons
    addAppointmentButtonListeners();
}

// Load recommended doctors
function loadRecommendedDoctors() {
    const user = JSON.parse(localStorage.getItem('mediconnect_user') || '{}');
    const patients = JSON.parse(localStorage.getItem('mediconnect_patients') || '[]');
    const doctors = JSON.parse(localStorage.getItem('mediconnect_doctors') || '[]');
    
    const patient = patients.find(p => p.id === user.id);
    
    if (patient && patient.location) {
        // Sort doctors by distance from patient
        const sortedDoctors = [...doctors].sort((a, b) => {
            if (a.location && b.location) {
                const distanceA = calculateDistance(
                    patient.location.lat, patient.location.lng,
                    a.location.lat, a.location.lng
                );
                const distanceB = calculateDistance(
                    patient.location.lat, patient.location.lng,
                    b.location.lat, b.location.lng
                );
                return distanceA - distanceB;
            }
            return 0;
        });
        
        // Get container element
        const container = document.getElementById('recommended-doctors-container');
        
        // Clear container
        container.innerHTML = '';
        
        // Display recommended doctors (limit to 3)
        const doctorsToShow = sortedDoctors.slice(0, 3);
        
        doctorsToShow.forEach(doctor => {
            const distance = calculateDistance(
                patient.location.lat, patient.location.lng,
                doctor.location.lat, doctor.location.lng
            );
            
            const distanceInMiles = kmToMiles(distance).toFixed(1);
            
            // Check if doctor is available today
            const today = new Date().toLocaleString('en-us', { weekday: 'long' });
            const availableToday = doctor.availability.some(a => a.day === today && a.slots.length > 0);
            
            const doctorCard = document.createElement('div');
            doctorCard.className = 'doctor-card';
            doctorCard.innerHTML = `
                <div class="doctor-avatar">
                    <img src="img/doctor-avatar-${Math.floor(Math.random() * 3) + 1}.jpg" alt="Doctor Avatar">
                </div>
                <div class="doctor-info">
                    <h4>${doctor.name}</h4>
                    <p class="specialization">${capitalizeFirstLetter(doctor.specialization)}</p>
                    <div class="rating">
                        ${generateStarRating(doctor.rating)}
                        <span>${doctor.rating.toFixed(1)} (${doctor.reviews} reviews)</span>
                    </div>
                    <p class="distance"><i class="fas fa-map-marker-alt"></i> ${distanceInMiles} miles away</p>
                    <p class="availability"><i class="far fa-calendar-check"></i> ${availableToday ? 'Available Today' : 'Next Available: Tomorrow'}</p>
                </div>
                <div class="doctor-actions">
                    <button class="btn btn-primary book-appointment-btn" data-id="${doctor.id}"><i class="fas fa-calendar-plus"></i> Book Appointment</button>
                    <button class="btn btn-secondary view-doctor-btn" data-id="${doctor.id}"><i class="fas fa-user-md"></i> View Profile</button>
                </div>
            `;
            
            container.appendChild(doctorCard);
        });
        
        // Add event listeners to buttons
        addDoctorButtonListeners();
    }
}

// Initialize Google Map
function initMap() {
    // This function would normally initialize the Google Map
    // For this demo, we'll just show a placeholder
    const mapContainer = document.getElementById('google-map');
    
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100%; background-color: #e9ecef;">
                <p>Google Map would be displayed here with nearby doctors</p>
                <p>(API key required for actual implementation)</p>
            </div>
        `;
    }
}

// Update date display
function updateDateDisplay() {
    const dateElement = document.getElementById('current-date');
    const today = new Date();
    dateElement.textContent = formatDate(today);
}

// Add event listeners
function addEventListeners() {
    // Filter buttons
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
}

// Add appointment button listeners
function addAppointmentButtonListeners() {
    // Reschedule buttons
    const rescheduleButtons = document.querySelectorAll('.btn-reschedule');
    rescheduleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const appointmentId = this.dataset.id;
            rescheduleAppointment(appointmentId);
        });
    });
    
    // Cancel buttons
    const cancelButtons = document.querySelectorAll('.btn-cancel');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function() {
            const appointmentId = this.dataset.id;
            cancelAppointment(appointmentId);
        });
    });
}

// Add doctor button listeners
function addDoctorButtonListeners() {
    // Book appointment buttons
    const bookButtons = document.querySelectorAll('.book-appointment-btn');
    bookButtons.forEach(button => {
        button.addEventListener('click', function() {
            const doctorId = this.dataset.id;
            bookAppointment(doctorId);
        });
    });
    
    // View doctor buttons
    const viewButtons = document.querySelectorAll('.view-doctor-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const doctorId = this.dataset.id;
            viewDoctorProfile(doctorId);
        });
    });
}

// Reschedule appointment
function rescheduleAppointment(appointmentId) {
    // In a real app, this would open a modal with available time slots
    alert('Reschedule functionality would open a modal with available time slots');
    
    // For demo purposes, we'll just show a notification
    showNotification('Appointment rescheduling feature would be implemented here', 'info');
}

// Cancel appointment
function cancelAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        const appointments = JSON.parse(localStorage.getItem('mediconnect_appointments') || '[]');
        const appointmentIndex = appointments.findIndex(a => a.id === appointmentId);
        
        if (appointmentIndex !== -1) {
            // Update appointment status
            appointments[appointmentIndex].status = 'cancelled';
            
            // Save to localStorage
            localStorage.setItem('mediconnect_appointments', JSON.stringify(appointments));
            
            // Reload appointments
            loadUpcomingAppointments();
            
            // Update dashboard stats
            loadUserData();
            
            // Show notification
            showNotification('Appointment cancelled successfully', 'success');
        }
    }
}

// Book appointment
function bookAppointment(doctorId) {
    // In a real app, this would open a modal with available time slots
    alert('Book appointment functionality would open a modal with available time slots');
    
    // For demo purposes, we'll just show a notification
    showNotification('Appointment booking feature would be implemented here', 'info');
}

// View doctor profile
function viewDoctorProfile(doctorId) {
    // In a real app, this would navigate to the doctor's profile page
    alert('View doctor profile functionality would navigate to the doctor\'s profile page');
    
    // For demo purposes, we'll just show a notification
    showNotification('Doctor profile view feature would be implemented here', 'info');
}

// Apply filters
function applyFilters() {
    const specialization = document.getElementById('specialization-filter').value;
    const distance = document.getElementById('distance-filter').value;
    const availability = document.getElementById('availability-filter').value;
    
    // In a real app, this would filter the map and doctor list
    alert(`Filters applied: Specialization=${specialization}, Distance=${distance}, Availability=${availability}`);
    
    // For demo purposes, we'll just show a notification
    showNotification('Filter functionality would update the map and doctor list', 'info');
}

// Schedule appointment reminders
function scheduleAppointmentReminders() {
    const user = JSON.parse(localStorage.getItem('mediconnect_user') || '{}');
    const appointments = JSON.parse(localStorage.getItem('mediconnect_appointments') || '[]');
    const doctors = JSON.parse(localStorage.getItem('mediconnect_doctors') || '[]');
    
    // Get upcoming appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingAppointments = appointments.filter(a => {
        const appointmentDate = new Date(a.date);
        return a.patientId === user.id && appointmentDate >= today && a.status !== 'cancelled';
    });
    
    // Schedule reminders for each appointment
    upcomingAppointments.forEach(appointment => {
        const doctor = doctors.find(d => d.id === appointment.doctorId);
        
        if (doctor) {
            const appointmentDate = new Date(appointment.date);
            const appointmentTime = appointment.time;
            
            // Calculate time until appointment (in milliseconds)
            const appointmentDateTime = new Date(
                appointmentDate.getFullYear(),
                appointmentDate.getMonth(),
                appointmentDate.getDate(),
                parseInt(appointmentTime.split(':')[0]),
                parseInt(appointmentTime.split(':')[1])
            );
            
            const timeUntilAppointment = appointmentDateTime.getTime() - Date.now();
            
            // Schedule reminder for 24 hours before appointment
            const oneDayBefore = timeUntilAppointment - (24 * 60 * 60 * 1000);
            if (oneDayBefore > 0) {
                setTimeout(() => {
                    showNotification(`Reminder: You have an appointment with ${doctor.name} tomorrow at ${formatTime(appointmentTime)}`, 'info');
                }, oneDayBefore);
            }
            
            // Schedule reminder for 1 hour before appointment
            const oneHourBefore = timeUntilAppointment - (1 * 60 * 60 * 1000);
            if (oneHourBefore > 0) {
                setTimeout(() => {
                    showNotification(`Reminder: You have an appointment with ${doctor.name} in 1 hour`, 'info');
                }, oneHourBefore);
            }
        }
    });
}

// Helper Functions

// Calculate end time based on start time and duration
function calculateEndTime(startTime, durationMinutes) {
    const [hours, minutes] = startTime.split(':').map(Number);
    
    let endHours = hours;
    let endMinutes = minutes + durationMinutes;
    
    if (endMinutes >= 60) {
        endHours += Math.floor(endMinutes / 60);
        endMinutes %= 60;
    }
    
    endHours %= 24;
    
    return formatTime(`${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`);
}

// Generate star rating HTML
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (halfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    return starsHTML;
}

// Capitalize first letter of string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Format date for display
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

// Format time for display
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
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

// Convert kilometers to miles
function kmToMiles(km) {
    return km / 1.60934;
}

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
