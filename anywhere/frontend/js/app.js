document.addEventListener('DOMContentLoaded', () => {
    // Initialization
    checkAuthState();
    updatePendingCountUI();

    // DOM Elements
    const googleLoginBtn = document.getElementById('google-login-btn');
    const authToggleBtn = document.getElementById('auth-toggle-btn');
    const reportForm = document.getElementById('report-form');
    const forceSyncBtn = document.getElementById('force-sync-btn');

    // Authentication Listeners
    googleLoginBtn.addEventListener('click', () => {
        // Redirect to the Flask Google OAuth initiation route
        window.location.href = '/api/v1/auth/google/login';
    });

    authToggleBtn.addEventListener('click', () => {
        localStorage.removeItem('auth_token');
        checkAuthState();
    });

    forceSyncBtn.addEventListener('click', syncPendingReports);

    // Form Submission Interception
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Gather text data
        const category = document.getElementById('category').value;
        const notes = document.getElementById('notes').value;

        // 2. Gather GPS Data (using high accuracy)
        let latitude = parseFloat(document.getElementById('latitude').value) || null;
        let longitude = parseFloat(document.getElementById('longitude').value) || null;
        
        // Fallback if the early fetch didn't finish or failed
        if (!latitude || !longitude) {
            try {
                const position = await getGPSCoordinates();
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
            } catch (error) {
                console.error("GPS retrieval failed. Report will proceed without coordinates.", error);
            }
        }

        // 3. Gather Image Blob (Mocking the WebRTC Canvas to Blob conversion)
        const canvas = document.getElementById('photo-canvas');
        const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));

        if (!imageBlob) {
            alert("Please capture a photo first.");
            return;
        }

        const reportData = { category, notes, latitude, longitude, imageBlob };
        const token = localStorage.getItem('auth_token');

        // 4. Determine Routing Strategy (Direct POST vs Local Queue)
        if (navigator.onLine && token) {
            await attemptLiveSubmission(reportData, token);
        } else {
            // Offline Trap Mitigation activated
            await saveReportLocally(reportData);
            alert("You are offline. Report saved locally and will sync automatically when connection returns.");
            reportForm.reset();
        }
    });

    // Listen for network reconnection to trigger background sync
    window.addEventListener('online', syncPendingReports);
});

/**
 * Attempts to send data directly to the Flask backend.
 * Falls back to local storage if it encounters a 401/Network error.
 */
async function attemptLiveSubmission(reportData, token) {
    const submissionData = {
        latitude: reportData.latitude || 0.0,
        longitude: reportData.longitude || 0.0,
        device_timestamp: new Date().toISOString(),
        items: [
            {
                tag_id: reportData.category,
                item_type: "text",
                content_payload: { notes: reportData.notes }
            },
            {
                tag_id: reportData.category,
                item_type: "image",
                content_payload: {}
            }
        ]
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(submissionData));
    formData.append('file', reportData.imageBlob, 'live_capture.jpg');

    try {
        const response = await fetch('/api/v1/submissions/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.status === 201) {
            alert("Report submitted successfully!");
            document.getElementById('report-form').reset();
        } else if (response.status === 401) {
            // JWT expired in the field. Save locally and clear token.
            console.warn("Session expired. Falling back to offline storage.");
            localStorage.removeItem('auth_token');
            await saveReportLocally(reportData);
            checkAuthState();
        } else if (response.status === 403) {
            alert("Report rejected: Location out of bounds or forbidden.");
        } else {
            throw new Error(`Server returned ${response.status}`);
        }
    } catch (error) {
        // Network drop during fetch. Save locally.
        console.error("Network drop detected during live submission.", error);
        await saveReportLocally(reportData);
    }
}

// Helper: Wrap navigator.geolocation in a Promise
function getGPSCoordinates() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by your browser"));
        } else {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        }
    });
}

// Helper: Fetch location early and update UI
async function updateLocationDisplay() {
    const locDisplay = document.getElementById('location-display');
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    
    if (locDisplay) {
        locDisplay.textContent = "Buscando ubicación...";
        locDisplay.style.color = "#6c757d";
        try {
            const position = await getGPSCoordinates();
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            locDisplay.textContent = `Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`;
            locDisplay.style.color = "#28a745"; // Success green
            
            if (latInput && lonInput) {
                latInput.value = lat;
                lonInput.value = lon;
            }
        } catch (error) {
            console.error("Early GPS retrieval failed.", error);
            locDisplay.textContent = "No se pudo obtener la ubicación (Revisa los permisos)";
            locDisplay.style.color = "#dc3545"; // Error red
        }
    }
}

// Helper: Toggles UI between Auth and Report states
function checkAuthState() {
    const token = localStorage.getItem('auth_token');
    const authSection = document.getElementById('landing-section') || document.getElementById('auth-section');
    const reportSection = document.getElementById('report-section');
    const authToggleBtn = document.getElementById('auth-toggle-btn');

    if (token) {
        authSection.classList.add('hidden');
        reportSection.classList.remove('hidden');
        authToggleBtn.classList.remove('hidden');
        // Check if there's anything to sync now that we are logged in
        syncPendingReports();
        // Start the camera for the report form
        if (typeof cameraManager !== 'undefined') {
            cameraManager.startCamera();
        }
        // Display location explicitly
        updateLocationDisplay();
    } else {
        authSection.classList.remove('hidden');
        reportSection.classList.add('hidden');
        authToggleBtn.classList.add('hidden');
        // Stop the camera if we are logged out
        if (typeof cameraManager !== 'undefined') {
            cameraManager.stopCamera();
        }
    }
}
