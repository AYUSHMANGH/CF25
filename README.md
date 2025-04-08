# MediConnect - Healthcare Appointment Optimization

MediConnect is a frontend-only web application designed to optimize healthcare appointments by matching patients with doctors based on location, transportation preferences, and medical specialization. This application is built using pure HTML, CSS, and JavaScript with browser storage (localStorage) to simulate a database.

## Features

### For Patients
- User registration and authentication
- View doctors based on specialization and proximity
- Book, reschedule, and cancel appointments
- Set transportation preferences (walking, public transport, own vehicle)
- Receive appointment reminders through browser notifications
- View medical history and past appointments

### For Doctors
- Manage availability and schedule
- View and respond to appointment requests
- View patient details
- Track appointment statistics
- Manage patient records

### General Features
- Responsive design for mobile and desktop
- Smart doctor suggestions based on location and transportation
- Form validation
- Dynamic filtering and sorting
- Persistent data storage using LocalStorage
- No-show risk flagging
- Appointment reminders

## Technology Stack

- HTML5 for structure
- CSS3 for styling
- Vanilla JavaScript for interactivity and logic
- LocalStorage/SessionStorage for data persistence
- Google Maps API integration (placeholder)
- Font Awesome for icons

## Getting Started

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Register as a patient or doctor
4. Explore the features of the application

## Pages

- **Landing Page**: Introduction to the platform
- **Login/Register**: Separate forms for patients and doctors
- **Patient Dashboard**: Overview of appointments, recommended doctors, and healthcare map
- **Doctor Dashboard**: Overview of appointments, patient requests, and availability management
- **About Page**: Information about the platform

## Data Structure

The application uses LocalStorage to simulate a database with the following structure:

- `mediconnect_users`: User authentication data
- `mediconnect_patients`: Patient profiles and preferences
- `mediconnect_doctors`: Doctor profiles, specializations, and availability
- `mediconnect_appointments`: Appointment details and status

## Browser Compatibility

The application is designed to work on modern browsers including:
- Chrome
- Firefox
- Safari
- Edge

## Notes

- This is a frontend-only demonstration with no actual backend integration
- The Google Maps integration requires an API key for full functionality
- Sample data is pre-populated for demonstration purposes

## Future Enhancements

- Backend integration with a real database
- Real-time notifications
- Advanced analytics for healthcare providers
- Mobile app version
- Integration with existing healthcare systems
- Telehealth appointment options
