// Doctor Dashboard JavaScript for MediConnect

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is a doctor
    checkDoctorAuth();
    
    // Load user data
    loadUserData();
    
    // Load appointment requests
    loadAppointmentRequests();
    
    // Load today's schedule
    loadTodaySchedule();
    
    // Initialize availability calendar
    initAvailabilityCalendar();
    
    // Initialize date display
    updateDateDisplay();
    
    // Add event listeners
    addEventListeners();
});

// Check if user is logged in and is a doctor
function checkDoctorAuth() {
    const user = JSON.parse(localStorage.getItem('mediconnect_user') || '{}');
    
    if (!user.id || user.userType !== 'doctor') {
        window.location.href = 'login.html';
    }
}

// Load user data
function loadUserData() {
    const user = JSON.parse(localStorage.getItem('mediconnect_user') || '{}');
    const doctors = JSON.parse(localStorage.getItem('mediconnect_doctors') || '[]');
    const doctor = doctors.find(d => d.id === user.id);
    
    if (doctor) {
        // Update welcome message
        document.getElementById('welcome-name').textContent = `Dr. ${doctor.name.split(' ')[1]}`; // Last name
        document.getElementById('user-name').textContent = doctor.name;
        
        // Update dashboard stats
        updateDashboardStats(doctor);
    }
}

// Update dashboard stats
function updateDashboardStats(doctor) {
    const appointments = JSON.parse(localStorage.getItem('mediconnect_appointments') || '[]');
    const doctorAppointments = appointments.filter(a => a.doctorId === doctor.id);
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Format today's date as string for comparison
    const todayString = today.toISOString().split('T')[0];
    
    // Count today's appointments
    const todayAppointments = doctorAppointments.filter(a => 
        a.date === todayString && a.status !== 'cancelled'
    );
    
    // Count new patients (patients with their first appointment in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Get all patients who have appointments with this doctor
    const patientIds = [...new Set(doctorAppointments.map(a => a.patientId))];
    
    // For each patient, find their first appointment with this doctor
    const newPatients = patientIds.filter(patientId => {
        const patientAppointments = doctorAppointments.filter(a => a.patientId === patientId);
        const firstAppointment = patientAppointments.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
        
        if (firstAppointment) {
            const appointmentDate = new Date(firstAppointment.date);
            return appointmentDate >= sevenDaysAgo && appointmentDate <= today;
        }
        
        return false;
    });
    
    // Count cancellations in the last 7 days
    const recentCancellations = doctorAppointments.filter(a => {
        const appointmentDate = new Date(a.date);
        return appointmentDate >= sevenDaysAgo && 
               appointmentDate <= today && 
               a.status === 'cancelled';
    });
    
    // Update stats display
    document.getElementById('today-appointments-count').textContent = todayAppointments.length;
    document.getElementById('new-patients-count').textContent = newPatients.length;
    document.getElementById('cancellations-count').textContent = recentCancellations.length;
    document.getElementById('total-patients-count').textContent = patientIds.length;
}

// Load appointment requests
function loadAppointmentRequests() {
    const user = JSON.parse(localStorage.getItem('mediconnect_user') || '{}');
    const appointments = JSON.parse(localStorage.getItem('mediconnect_appointments') || '[]');
    const patients = JSON.parse(localStorage.getItem('mediconnect_patients') || '[]');
    
    // Get pending appointment requests
    const pendingRequests = appointments.filter(a => 
        a.doctorId === user.id && a.status === 'pending'
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get container element
    const container = document.getElementById('appointment-requests-container');
    
    // Clear container
    container.innerHTML = '';
    
    // Check if there are pending requests
    if (pendingRequests.length === 0) {
        container.innerHTML = '<p class="no-data">No pending appointment requests</p>';
        return;
    }
    
    // Display pending requests (limit to 3)
    const requestsToShow = pendingRequests.slice(0, 3);
    
    requestsToShow.forEach(request => {
        const patient = patients.find(p => p.id === request.patientId);
        
        if (patient) {
            // Check if this is a new patient or returning patient
            const patientAppointments = appointments.filter(a => 
                a.patientId === patient.id && a.doctorId === user.id && a.status === 'completed'
            );
            
            const isNewPatient = patientAppointments.length === 0;
            
            const requestCard = document.createElement('div');
            requestCard.className = 'request-card';
            requestCard.innerHTML = `
                <div class="patient-info">
                    <div class="patient-avatar">
                        <img src="img/patient-avatar-${Math.floor(Math.random() * 6) + 1}.jpg" alt="Patient Avatar">
                    </div>
                    <div class="patient-details">
                        <h4>${patient.name}</h4>
                        <p class="request-type">${isNewPatient ? 'New Patient' : 'Returning Patient'}</p>
                        <p class="request-reason">Reason: ${request.reason}</p>
                    </div>
                </div>
                <div class="request-time">
                    <p class="date">${formatDateForDisplay(request.date)}</p>
                    <p class="time">${formatTime(request.time)} - ${calculateEndTime(request.time, request.duration)}</p>
                </div>
                <div class="request-actions">
                    <button class="btn btn-accept" data-id="${request.id}"><i class="fas fa-check"></i> Accept</button>
                    <button class="btn btn-reschedule" data-id="${request.id}"><i class="fas fa-calendar-alt"></i> Reschedule</button>
                    <button class="btn btn-decline" data-id="${request.id}"><i class="fas fa-times"></i> Decline</button>
                </div>
            `;
            
            container.appendChild(requestCard);
        }
    });
    
    // Add event listeners to buttons
    addRequestButtonListeners();
}

// Load today's schedule
function loadTodaySchedule() {
    const user = JSON.parse(localStorage.getItem('mediconnect_user') || '{}');
    const appointments = JSON.parse(localStorage.getItem('mediconnect_appointments') || '[]');
    const patients = JSON.parse(localStorage.getItem('mediconnect_patients') || '[]');
    
    // Get today's date
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Get today's appointments
    const todayAppointments = appointments.filter(a => 
        a.doctorId === user.id && a.date === todayString && a.status !== 'cancelled'
    ).sort((a, b) => a.time.localeCompare(b.time));
    
    // Get container element
    const container = document.getElementById('today-schedule-container');
    
    // Keep the header
    const header = container.querySelector('.timeline-header');
    
    // Clear container except header
    container.innerHTML = '';
    
    // Add header back
    if (header) {
        container.appendChild(header);
    } else {
        // Create header if it doesn't exist
        const newHeader = document.createElement('div');
        newHeader.className = 'timeline-header';
        newHeader.innerHTML = `
            <div class="time-slot">Time</div>
            <div class="patient-slot">Patient</div>
            <div class="reason-slot">Reason</div>
            <div class="status-slot">Status</div>
            <div class="actions-slot">Actions</div>
        `;
        container.appendChild(newHeader);
    }
    
    // Check if there are appointments today
    if (todayAppointments.length === 0) {
        const noData = document.createElement('div');
        noData.className = 'no-data';
        noData.textContent = 'No appointments scheduled for today';
        container.appendChild(noData);
        return;
    }
    
    // Display today's appointments
    todayAppointments.forEach(appointment => {
        const patient = patients.find(p => p.id === appointment.patientId);
        
        if (patient) {
            const currentTime = new Date();
            const appointmentTime = new Date(today);
            const [hours, minutes] = appointment.time.split(':').map(Number);
            appointmentTime.setHours(hours, minutes, 0, 0);
            
            // Determine appointment status
            let status = 'upcoming';
            if (appointment.status === 'completed') {
                status = 'completed';
            } else if (currentTime >= appointmentTime && currentTime < new Date(appointmentTime.getTime() + appointment.duration * 60000)) {
                status = 'in-progress';
            }
            
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.innerHTML = `
                <div class="time-slot">${formatTime(appointment.time)} - ${calculateEndTime(appointment.time, appointment.duration)}</div>
                <div class="patient-slot">
                    <div class="patient-avatar-small">
                        <img src="img/patient-avatar-${Math.floor(Math.random() * 6) + 1}.jpg" alt="Patient Avatar">
                    </div>
                    <div class="patient-name">${patient.name}</div>
                </div>
                <div class="reason-slot">${appointment.reason}</div>
                <div class="status-slot"><span class="status-${status}">${capitalizeFirstLetter(status)}</span></div>
                <div class="actions-slot">
                    ${status === 'completed' ? 
                        `<button class="btn btn-sm btn-view-notes" data-id="${appointment.id}"><i class="fas fa-clipboard"></i> View Notes</button>` :
                     status === 'in-progress' ?
                        `<button class="btn btn-sm btn-complete" data-id="${appointment.id}"><i class="fas fa-check"></i> Complete</button>` :
                        `<button class="btn btn-sm btn-start" data-id="${appointment.id}"><i class="fas fa-play"></i> Start</button>
                         <button class="btn btn-sm btn-reschedule" data-id="${appointment.id}"><i class="fas fa-calendar-alt"></i></button>`
                    }
                </div>
            `;
            
            container.appendChild(timelineItem);
        }
    });
    
    // Add event listeners to buttons
    addScheduleButtonListeners();
}

// Initialize availability calendar
function initAvailabilityCalendar() {
    const calendarDays = document.querySelector('.calendar-days');
    
    if (calendarDays) {
        // Get current date
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Update current month display
        const currentMonthElement = document.querySelector('.current-month');
        if (currentMonthElement) {
            currentMonthElement.textContent = `${today.toLocaleString('default', { month: 'long' })} ${currentYear}`;
        }
        
        // Get first day of month
        const firstDay = new Date(currentYear, currentMonth, 1);
        const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Get number of days in month
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const totalDays = lastDay.getDate();
        
        // Get number of days in previous month
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0);
        const prevMonthTotalDays = prevMonthLastDay.getDate();
        
        // Clear calendar
        calendarDays.innerHTML = '';
        
        // Add days from previous month
        for (let i = startingDay - 1; i >= 0; i--) {
            const day = document.createElement('div');
            day.className = 'calendar-day prev-month';
            day.textContent = prevMonthTotalDays - i;
            calendarDays.appendChild(day);
        }
        
        // Add days for current month
        for (let i = 1; i <= totalDays; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day';
            
            // Mark current day
            if (i === today.getDate()) {
                day.classList.add('current-day');
            }
            
            // Mark busy days (for demo purposes, we'll mark some random days as busy)
            if (i % 3 === 0) {
                day.classList.add('busy-day');
            }
            
            day.textContent = i;
            calendarDays.appendChild(day);
            
            // Add click event listener
            day.addEventListener('click', function() {
                // Remove selected class from all days
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                
                // Add selected class to clicked day
                this.classList.add('selected');
                
                // Show day details (in a real app, this would show appointments for that day)
                alert(`You clicked on ${this.textContent} ${today.toLocaleString('default', { month: 'long' })} ${currentYear}`);
            });
        }
        
        // Add days from next month to fill remaining grid
        const totalCells = 35; // 5 rows x 7 days
        const remainingCells = totalCells - (startingDay + totalDays);
        
        for (let i = 1; i <= remainingCells; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day next-month';
            day.textContent = i;
            calendarDays.appendChild(day);
        }
    }
    
    // Add event listeners to calendar controls
    const prevBtn = document.querySelector('.btn-prev');
    const nextBtn = document.querySelector('.btn-next');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            // In a real app, this would navigate to the previous month
            alert('Navigate to previous month');
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            // In a real app, this would navigate to the next month
            alert('Navigate to next month');
        });
    }
    
    // Add event listeners to availability action buttons
    const blockDayBtn = document.querySelector('.btn-block-day');
    const setHoursBtn = document.querySelector('.btn-set-hours');
    const vacationBtn = document.querySelector('.btn-vacation');
    
    if (blockDayBtn) {
        blockDayBtn.addEventListener('click', function() {
            // In a real app, this would block the selected day
            alert('Block day functionality would be implemented here');
        });
    }
    
    if (setHoursBtn) {
        setHoursBtn.addEventListener('click', function() {
            // In a real app, this would open a modal to set hours for the selected day
            alert('Set hours functionality would be implemented here');
        });
    }
    
    if (vacationBtn) {
        vacationBtn.addEventListener('click', function() {
            // In a real app, this would open a modal to set vacation days
            alert('Set vacation functionality would be implemented here');
        });
    }
}

// Update date display
function updateDateDisplay() {
    const dateElement = document.getElementById('current-date');
    const today = new Date();
    dateElement.textContent = formatDateForDisplay(today.toISOString().split('T')[0]);
}

// Add event listeners
function addEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// Add request button listeners
function addRequestButtonListeners() {
    // Accept buttons
    const acceptButtons = document.querySelectorAll('.request-card .btn-accept');
    acceptButtons.forEach(button => {
        button.addEventListener('click', function() {
            const appointmentId = this.dataset.id;
            acceptAppointment(appointmentId);
        });
    });
    
    // Reschedule buttons
    const rescheduleButtons = document.querySelectorAll('.request-card .btn-reschedule');
    rescheduleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const appointmentId = this.dataset.id;
            rescheduleAppointment(appointmentId);
        });
    });
    
    // Decline buttons
    const declineButtons = document.querySelectorAll('.request-card .btn-decline');
    declineButtons.forEach(button => {
        button.addEventListener('click', function() {
            const appointmentId = this.dataset.id;
            declineAppointment(appointmentId);
        });
    });
}

// Add schedule button listeners
function addScheduleButtonListeners() {
    // View notes buttons
    const viewNotesButtons = document.querySelectorAll('.timeline-item .btn-view-notes');
    viewNotesButtons.forEach(button => {
        button.addEventListener('click', function() {
            const appointmentId = this.dataset.id;
            viewAppointmentNotes(appointmentId);
        });
    });
    
    // Complete buttons
    const completeButtons = document.querySelectorAll('.timeline-item .btn-complete');
    completeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const appointmentId = this.dataset.id;
            completeAppointment(appointmentId);
        });
    });
    
    // Start buttons
    const startButtons = document.querySelectorAll('.timeline-item .btn-start');
    startButtons.forEach(button => {
        button.addEventListener('click', function() {
            const appointmentId = this.dataset.id;
            startAppointment(appointmentId);
        });
    });
    
    // Reschedule buttons
    const rescheduleButtons = document.querySelectorAll('.timeline-item .btn-reschedule');
    rescheduleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const appointmentId = this.dataset.id;
            rescheduleAppointment(appointmentId);
        });
    });
}

// Accept appointment
function acceptAppointment(appointmentId) {
    const appointments = JSON.parse(localStorage.getItem('mediconnect_appointments') || '[]');
    const appointmentIndex = appointments.findIndex(a => a.id === appointmentId);
    
    if (appointmentIndex !== -1) {
        // Update appointment status
        appointments[appointmentIndex].status = 'confirmed';
        
        // Save to localStorage
        localStorage.setItem('mediconnect_appointments', JSON.stringify(appointments));
        
        // Reload appointment requests
        loadAppointmentRequests();
        
        // Show notification
        showNotification('Appointment accepted successfully', 'success');
    }
}

// Reschedule appointment
function rescheduleAppointment(appointmentId) {
    // In a real app, this would open a modal with available time slots
    alert('Reschedule functionality would open a modal with available time slots');
    
    // For demo purposes, we'll just show a notification
    showNotification('Appointment rescheduling feature would be implemented here', 'info');
}

// Decline appointment
function declineAppointment(appointmentId) {
    if (confirm('Are you sure you want to decline this appointment?')) {
        const appointments = JSON.parse(localStorage.getItem('mediconnect_appointments') || '[]');
        const appointmentIndex = appointments.findIndex(a => a.id === appointmentId);
        
        if (appointmentIndex !== -1) {
            // Update appointment status
            appointments[appointmentIndex].status = 'declined';
            
            // Save to localStorage
            localStorage.setItem('mediconnect_appointments', JSON.stringify(appointments));
            
            // Reload appointment requests
            loadAppointmentRequests();
            
            // Show notification
            showNotification('Appointment declined successfully', 'info');
        }
    }
}

// View appointment notes
function viewAppointmentNotes(appointmentId) {
    const appointments = JSON.parse(localStorage.getItem('mediconnect_appointments') || '[]');
    const appointment = appointments.find(a => a.id === appointmentId);
    
    if (appointment) {
        // In a real app, this would open a modal with appointment notes
        alert(`Notes for appointment: ${appointment.notes || 'No notes available'}`);
    }
}

// Complete appointment
function completeAppointment(appointmentId) {
    const appointments = JSON.parse(localStorage.getItem('mediconnect_appointments') || '[]');
    const appointmentIndex = appointments.findIndex(a => a.id === appointmentId);
    
    if (appointmentIndex !== -1) {
        // Update appointment status
        appointments[appointmentIndex].status = 'completed';
        
        // In a real app, this would prompt for notes
        const notes = prompt('Enter appointment notes:');
        if (notes) {
            appointments[appointmentIndex].notes = notes;
        }
        
        // Save to localStorage
        localStorage.setItem('mediconnect_appointments', JSON.stringify(appointments));
        
        // Reload today's schedule
        loadTodaySchedule();
        
        // Show notification
        showNotification('Appointment completed successfully', 'success');
    }
}

// Start appointment
function startAppointment(appointmentId) {
    const appointments = JSON.parse(localStorage.getItem('mediconnect_appointments') || '[]');
    const appointmentIndex = appointments.findIndex(a => a.id === appointmentId);
    
    if (appointmentIndex !== -1) {
        // Update appointment status
        appointments[appointmentIndex].status = 'in-progress';
        
        // Save to localStorage
        localStorage.setItem('mediconnect_appointments', JSON.stringify(appointments));
        
        // Reload today's schedule
        loadTodaySchedule();
        
        // Show notification
        showNotification('Appointment started', 'info');
    }
}

// Logout
function logout() {
    localStorage.removeItem('mediconnect_user');
    window.location.href = 'index.html';
}

// Helper Functions

// Format date for display
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

// Format time for display
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

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

// Capitalize first letter of string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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
