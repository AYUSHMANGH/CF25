/**
 * MediConnect Google Maps API Integration
 * This file handles the integration with Google Maps API for location-based services
 */

// Google Maps API key - Replace with your actual API key
const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY';

// Default coordinates (will be replaced with user's actual location)
let userLocation = {
    lat: 37.7749,
    lng: -122.4194
};

// Map instance
let map;

// Markers array
let markers = [];

// Info windows
let infoWindow;

/**
 * Initialize the Google Maps
 */
function initMap() {
    // Create the map centered at the user's location
    map = new google.maps.Map(document.getElementById('map'), {
        center: userLocation,
        zoom: 12,
        styles: [
            {
                "featureType": "poi.business",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "elementType": "labels.text",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            }
        ]
    });

    // Create an info window to share between markers
    infoWindow = new google.maps.InfoWindow();

    // Try to get the user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Center the map on the user's location
                map.setCenter(userLocation);
                
                // Add a marker for the user's location
                addMarker(userLocation, 'Your Location', 'user');
                
                // Load nearby healthcare providers
                loadNearbyHealthcareProviders();
            },
            () => {
                // Handle geolocation error
                handleLocationError(true, infoWindow, map.getCenter());
            }
        );
    } else {
        // Browser doesn't support geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

/**
 * Handle errors related to getting the user's location
 */
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(
        browserHasGeolocation
            ? "Error: The Geolocation service failed."
            : "Error: Your browser doesn't support geolocation."
    );
    infoWindow.open(map);
}

/**
 * Add a marker to the map
 */
function addMarker(position, title, type = 'healthcare') {
    // Define different marker icons based on type
    const icons = {
        user: {
            url: 'img/placeholders/user-marker.png',
            scaledSize: new google.maps.Size(40, 40)
        },
        healthcare: {
            url: 'img/placeholders/healthcare-marker.png',
            scaledSize: new google.maps.Size(40, 40)
        }
    };

    // Create the marker
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: title,
        icon: icons[type] || null,
        animation: google.maps.Animation.DROP
    });

    // Add to markers array
    markers.push(marker);

    // Add click event to show info window
    marker.addListener('click', () => {
        infoWindow.setContent(`<div class="info-window"><h3>${title}</h3></div>`);
        infoWindow.open(map, marker);
    });

    return marker;
}

/**
 * Clear all markers from the map
 */
function clearMarkers() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

/**
 * Load nearby healthcare providers
 * In a real application, this would fetch data from an API
 */
function loadNearbyHealthcareProviders() {
    // In a real application, this would be an API call
    // For now, we'll use mock data
    const mockProviders = [
        {
            id: 1,
            name: "City General Hospital",
            position: { lat: userLocation.lat + 0.02, lng: userLocation.lng - 0.01 },
            type: "Hospital",
            specialties: ["General Medicine", "Emergency Care", "Surgery"]
        },
        {
            id: 2,
            name: "Dr. Smith's Clinic",
            position: { lat: userLocation.lat - 0.01, lng: userLocation.lng + 0.02 },
            type: "Clinic",
            specialties: ["Family Medicine", "Pediatrics"]
        },
        {
            id: 3,
            name: "Wellness Medical Center",
            position: { lat: userLocation.lat + 0.01, lng: userLocation.lng + 0.01 },
            type: "Medical Center",
            specialties: ["Cardiology", "Neurology", "Orthopedics"]
        },
        {
            id: 4,
            name: "Community Health Clinic",
            position: { lat: userLocation.lat - 0.02, lng: userLocation.lng - 0.02 },
            type: "Clinic",
            specialties: ["Family Medicine", "Mental Health"]
        }
    ];

    // Add markers for each provider
    mockProviders.forEach(provider => {
        const marker = addMarker(provider.position, provider.name);
        
        // Enhanced info window content
        const infoContent = `
            <div class="info-window">
                <h3>${provider.name}</h3>
                <p><strong>Type:</strong> ${provider.type}</p>
                <p><strong>Specialties:</strong> ${provider.specialties.join(', ')}</p>
                <button class="btn-get-directions" data-id="${provider.id}" 
                        data-lat="${provider.position.lat}" data-lng="${provider.position.lng}">
                    Get Directions
                </button>
                <button class="btn-book-appointment" data-id="${provider.id}">
                    Book Appointment
                </button>
            </div>
        `;
        
        // Add click event with enhanced info window
        marker.addListener('click', () => {
            infoWindow.setContent(infoContent);
            infoWindow.open(map, marker);
            
            // Add event listeners to buttons after info window is opened
            setTimeout(() => {
                // Get directions button
                const directionsBtn = document.querySelector(`.btn-get-directions[data-id="${provider.id}"]`);
                if (directionsBtn) {
                    directionsBtn.addEventListener('click', () => {
                        const providerLat = directionsBtn.getAttribute('data-lat');
                        const providerLng = directionsBtn.getAttribute('data-lng');
                        calculateRoute(userLocation, { lat: parseFloat(providerLat), lng: parseFloat(providerLng) });
                    });
                }
                
                // Book appointment button
                const bookBtn = document.querySelector(`.btn-book-appointment[data-id="${provider.id}"]`);
                if (bookBtn) {
                    bookBtn.addEventListener('click', () => {
                        // In a real application, this would open a booking modal or redirect to booking page
                        alert(`Redirecting to booking page for ${provider.name}`);
                        window.location.href = `login.html?redirect=booking&provider=${provider.id}`;
                    });
                }
            }, 300);
        });
    });
}

/**
 * Calculate and display the route between two points
 */
function calculateRoute(origin, destination) {
    // Create a directions service object
    const directionsService = new google.maps.DirectionsService();
    
    // Create a directions renderer object
    const directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true
    });
    
    // Get the user's transportation preferences
    const user = JSON.parse(localStorage.getItem('mediconnect_user') || '{}');
    let travelMode = google.maps.TravelMode.DRIVING; // Default
    
    if (user.id) {
        const transportPrefs = JSON.parse(localStorage.getItem(`mediconnect_transportation_${user.id}`) || '{}');
        
        // Set travel mode based on user preferences
        switch (transportPrefs.primaryTransportation) {
            case 'walking':
                travelMode = google.maps.TravelMode.WALKING;
                break;
            case 'bicycle':
                travelMode = google.maps.TravelMode.BICYCLING;
                break;
            case 'public':
                travelMode = google.maps.TravelMode.TRANSIT;
                break;
            default:
                travelMode = google.maps.TravelMode.DRIVING;
        }
    }
    
    // Create request
    const request = {
        origin: origin,
        destination: destination,
        travelMode: travelMode,
        provideRouteAlternatives: true
    };
    
    // Make the directions request
    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            // Display the route on the map
            directionsRenderer.setDirections(result);
            
            // Display route information
            const route = result.routes[0];
            const leg = route.legs[0];
            
            // Create route info panel
            displayRouteInfo(leg);
        } else {
            // Handle errors
            alert("Directions request failed due to " + status);
        }
    });
}

/**
 * Display route information in a panel
 */
function displayRouteInfo(routeLeg) {
    // Create or get route info panel
    let routeInfoPanel = document.getElementById('route-info-panel');
    
    if (!routeInfoPanel) {
        routeInfoPanel = document.createElement('div');
        routeInfoPanel.id = 'route-info-panel';
        routeInfoPanel.className = 'route-info-panel';
        document.querySelector('.map-container').appendChild(routeInfoPanel);
    }
    
    // Format the content
    const content = `
        <div class="route-info-header">
            <h3>Travel Information</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="route-info-content">
            <p><strong>From:</strong> ${routeLeg.start_address}</p>
            <p><strong>To:</strong> ${routeLeg.end_address}</p>
            <p><strong>Distance:</strong> ${routeLeg.distance.text}</p>
            <p><strong>Duration:</strong> ${routeLeg.duration.text}</p>
            <div class="route-steps">
                <h4>Directions:</h4>
                <ol>
                    ${routeLeg.steps.map(step => `
                        <li>${step.instructions} (${step.distance.text})</li>
                    `).join('')}
                </ol>
            </div>
        </div>
    `;
    
    // Set the content
    routeInfoPanel.innerHTML = content;
    routeInfoPanel.style.display = 'block';
    
    // Add close button functionality
    const closeBtn = routeInfoPanel.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        routeInfoPanel.style.display = 'none';
    });
}

/**
 * Calculate travel times for different transportation methods
 */
function calculateTravelTimes(origin, destination, callback) {
    const travelModes = [
        { mode: google.maps.TravelMode.WALKING, name: 'Walking' },
        { mode: google.maps.TravelMode.BICYCLING, name: 'Bicycling' },
        { mode: google.maps.TravelMode.TRANSIT, name: 'Public Transit' },
        { mode: google.maps.TravelMode.DRIVING, name: 'Driving' }
    ];
    
    const directionsService = new google.maps.DirectionsService();
    const results = [];
    let completed = 0;
    
    travelModes.forEach(travelMode => {
        const request = {
            origin: origin,
            destination: destination,
            travelMode: travelMode.mode
        };
        
        directionsService.route(request, (result, status) => {
            completed++;
            
            if (status === google.maps.DirectionsStatus.OK) {
                const route = result.routes[0];
                const leg = route.legs[0];
                
                results.push({
                    mode: travelMode.name,
                    duration: leg.duration.text,
                    durationValue: leg.duration.value, // in seconds
                    distance: leg.distance.text
                });
            }
            
            // If all requests are completed, call the callback
            if (completed === travelModes.length) {
                callback(results);
            }
        });
    });
}

/**
 * Handle the Location-Based Matching feature click
 */
function handleLocationMatching() {
    // Get the map container
    const mapContainer = document.getElementById('map-container');
    
    if (!mapContainer) {
        // Create map container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'map-container';
        container.className = 'map-modal';
        
        container.innerHTML = `
            <div class="map-modal-content">
                <div class="map-modal-header">
                    <h2>Find Healthcare Providers Near You</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="map-modal-body">
                    <div id="map" style="height: 400px; width: 100%;"></div>
                    <div class="travel-times-container" id="travel-times-container"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // Add close button functionality
        const closeBtn = container.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            container.style.display = 'none';
        });
        
        // Load Google Maps API and initialize the map
        loadGoogleMapsAPI();
    } else {
        // Show the existing map container
        mapContainer.style.display = 'block';
    }
}

/**
 * Load the Google Maps API dynamically
 */
function loadGoogleMapsAPI() {
    // Check if API is already loaded
    if (window.google && window.google.maps) {
        initMap();
        return;
    }
    
    // Create the script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    // Append the script to the document
    document.head.appendChild(script);
}

// Add event listener for the Location-Based Matching feature
document.addEventListener('DOMContentLoaded', function() {
    // Find all elements that should trigger the location matching feature
    const locationMatchingElements = document.querySelectorAll('.location-matching-trigger');
    
    locationMatchingElements.forEach(element => {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            handleLocationMatching();
        });
    });
    
    // Add CSS for the map modal
    const style = document.createElement('style');
    style.textContent = `
        .map-modal {
            display: block;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            overflow: auto;
        }
        
        .map-modal-content {
            background-color: white;
            margin: 5% auto;
            padding: 20px;
            border-radius: 10px;
            width: 80%;
            max-width: 900px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .map-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .close-btn {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
        }
        
        .close-btn:hover {
            color: #333;
        }
        
        .route-info-panel {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 300px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 100;
            display: none;
            max-height: 80%;
            overflow-y: auto;
        }
        
        .route-info-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            border-bottom: 1px solid #eee;
        }
        
        .route-info-content {
            padding: 15px;
        }
        
        .route-steps {
            margin-top: 15px;
        }
        
        .route-steps ol {
            padding-left: 20px;
        }
        
        .route-steps li {
            margin-bottom: 8px;
            font-size: 0.9rem;
        }
        
        .info-window {
            padding: 5px;
            max-width: 250px;
        }
        
        .info-window h3 {
            margin: 0 0 5px 0;
            font-size: 1.1rem;
        }
        
        .info-window p {
            margin: 5px 0;
            font-size: 0.9rem;
        }
        
        .info-window button {
            margin-top: 10px;
            padding: 5px 10px;
            background-color: #4a90e2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            display: block;
            width: 100%;
        }
        
        .info-window button:hover {
            background-color: #3a7bc8;
        }
        
        .travel-times-container {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }
        
        .travel-time-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        
        .travel-time-item:last-child {
            border-bottom: none;
        }
        
        .travel-mode-icon {
            margin-right: 10px;
            font-size: 1.2rem;
            color: #4a90e2;
        }
    `;
    
    document.head.appendChild(style);
});
