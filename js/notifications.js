/**
 * MediConnect Notification System
 * This file handles all notification functionality across the application
 */

// Notification types
const NOTIFICATION_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    REMINDER: 'reminder'
};

// Notification duration in milliseconds
const NOTIFICATION_DURATION = 5000;

// Maximum number of notifications to show at once
const MAX_NOTIFICATIONS = 3;

// Array to store active notifications
let activeNotifications = [];

/**
 * Create and show a notification
 * @param {string} message - The notification message
 * @param {string} type - The notification type (info, success, warning, error, reminder)
 * @param {number} duration - How long to show the notification (in ms)
 */
function showNotification(message, type = NOTIFICATION_TYPES.INFO, duration = NOTIFICATION_DURATION) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Create notification content
    const content = document.createElement('div');
    content.className = 'notification-content';
    
    // Add message
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    content.appendChild(messageElement);
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    // Assemble notification
    notification.appendChild(content);
    notification.appendChild(closeButton);
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Add to active notifications array
    activeNotifications.push(notification);
    
    // Limit number of notifications
    if (activeNotifications.length > MAX_NOTIFICATIONS) {
        removeNotification(activeNotifications[0]);
    }
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-remove after duration
    setTimeout(() => {
        removeNotification(notification);
    }, duration);
    
    return notification;
}

/**
 * Remove a notification
 * @param {HTMLElement} notification - The notification element to remove
 */
function removeNotification(notification) {
    // Remove from active notifications array
    const index = activeNotifications.indexOf(notification);
    if (index > -1) {
        activeNotifications.splice(index, 1);
    }
    
    // Hide notification with animation
    notification.classList.remove('show');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

/**
 * Show a form notification (for login/register forms)
 * @param {string} message - The notification message
 * @param {string} type - The notification type
 * @param {string} formId - The ID of the form to show the notification in
 */
function showFormNotification(message, type = NOTIFICATION_TYPES.INFO, formId) {
    // Find or create notification element
    let notification = document.querySelector(`#${formId} .auth-notification`);
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'auth-notification';
        const form = document.getElementById(formId);
        form.insertBefore(notification, form.firstChild);
    }
    
    // Update notification
    notification.className = `auth-notification notification-${type}`;
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Auto-hide after duration
    setTimeout(() => {
        notification.style.display = 'none';
    }, NOTIFICATION_DURATION);
}

/**
 * Show an appointment reminder notification
 * @param {Object} appointment - The appointment object
 */
function showAppointmentReminder(appointment) {
    const message = `Reminder: You have an appointment with ${appointment.doctorName} on ${formatDate(appointment.date)} at ${appointment.time}.`;
    return showNotification(message, NOTIFICATION_TYPES.REMINDER, NOTIFICATION_DURATION * 2);
}

/**
 * Format a date string for display
 * @param {string} dateString - The date string to format
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

/**
 * Check for upcoming appointments and show reminders
 * This function should be called when the dashboard loads
 */
function checkUpcomingAppointments() {
    const user = JSON.parse(localStorage.getItem('mediconnect_user') || '{}');
    if (!user.id) return;
    
    const appointments = JSON.parse(localStorage.getItem('mediconnect_appointments') || '[]');
    const today = new Date();
    
    // Get appointments in the next 24 hours
    const upcomingAppointments = appointments.filter(appointment => {
        if (appointment.status !== 'confirmed') return false;
        
        // Check if this is for the current user
        const isForUser = user.type === 'patient' 
            ? appointment.patientId === user.id
            : appointment.doctorId === user.id;
            
        if (!isForUser) return false;
        
        // Check if appointment is within next 24 hours
        const appointmentDate = new Date(appointment.date + ' ' + appointment.time);
        const timeDiff = appointmentDate.getTime() - today.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        return hoursDiff > 0 && hoursDiff < 24;
    });
    
    // Show reminders for upcoming appointments
    upcomingAppointments.forEach(appointment => {
        showAppointmentReminder(appointment);
    });
}

/**
 * Initialize browser notifications
 * This requests permission for browser notifications
 */
function initBrowserNotifications() {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notifications');
        return;
    }
    
    // Check if we already have permission
    if (Notification.permission === 'granted') {
        return;
    } 
    
    // Request permission
    if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showNotification('Notifications enabled!', NOTIFICATION_TYPES.SUCCESS);
            }
        });
    }
}

/**
 * Show a browser notification
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 */
function showBrowserNotification(title, message) {
    // Check if browser supports notifications and permission is granted
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }
    
    // Create and show notification
    const notification = new Notification(title, {
        body: message,
        icon: '/img/logo.png'
    });
    
    // Close after 5 seconds
    setTimeout(() => {
        notification.close();
    }, NOTIFICATION_DURATION);
    
    // Handle click
    notification.onclick = function() {
        window.focus();
        this.close();
    };
}

// Initialize notifications when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize browser notifications
    initBrowserNotifications();
    
    // Check for upcoming appointments if on dashboard
    if (window.location.pathname.includes('dashboard')) {
        checkUpcomingAppointments();
    }
    
    // Add notification CSS if not already added
    if (!document.querySelector('link[href="css/notifications.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/notifications.css';
        document.head.appendChild(link);
    }
});
