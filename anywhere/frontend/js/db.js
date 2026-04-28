// db.js

// Initialize Dexie database
const db = new Dexie("MostremosOfflineDB");

// Define schema: ++id (auto-incrementing primary key)
db.version(1).stores({
    submissions: '++id, timestamp'
});

/**
 * Saves a report locally when offline or unauthorized.
 */
async function saveReportLocally(reportData) {
    try {
        await db.submissions.add({
            ...reportData,
            timestamp: new Date().toISOString()
        });
        console.log("Report saved securely to local IndexedDB.");
        updatePendingCountUI();
    } catch (error) {
        console.error("Failed to save report locally:", error);
    }
}

/**
 * Background Synchronization Function
 * Iterates through pending reports and uploads them if a valid token exists.
 */
async function syncPendingReports() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        console.warn("Cannot sync: No authentication token available.");
        return;
    }

    if (!navigator.onLine) {
        console.warn("Cannot sync: Device is currently offline.");
        return;
    }

    const pendingReports = await db.submissions.toArray();
    if (pendingReports.length === 0) return;

    console.log(`Attempting to sync ${pendingReports.length} pending reports...`);

    for (const report of pendingReports) {
        try {
            // Reconstruct FormData for the backend API
            const submissionData = {
                latitude: report.latitude || 0.0,
                longitude: report.longitude || 0.0,
                device_timestamp: report.timestamp,
                items: [
                    {
                        tag_id: report.category,
                        item_type: "text",
                        content_payload: { notes: report.notes }
                    },
                    {
                        tag_id: report.category,
                        item_type: "image",
                        content_payload: {}
                    }
                ]
            };

            const formData = new FormData();
            formData.append('data', JSON.stringify(submissionData));
            formData.append('file', report.imageBlob, `report_${report.timestamp}.jpg`);

            const response = await fetch('/api/v1/submissions/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Do NOT set Content-Type here; let the browser set the multipart boundary
                },
                body: formData
            });

            if (response.status === 201) {
                // Success: scrub the local row
                await db.submissions.delete(report.id);
                console.log(`Successfully synced report ID: ${report.id}`);
            } else if (response.status === 401) {
                // Token expired during sync. Stop processing and require re-auth.
                console.error("JWT expired or invalid during sync. Halting.");
                localStorage.removeItem('auth_token');
                checkAuthState(); // Triggers UI to show login
                break;
            } else if (response.status === 403) {
                // Out of bounds or forbidden. Delete to prevent sync loop.
                console.error(`Report rejected (403 Forbidden). It might be out of bounds. Deleting to prevent sync loop.`);
                await db.submissions.delete(report.id);
            } else {
                console.error(`Failed to sync report ID ${report.id}. Status: ${response.status}`);
            }
        } catch (error) {
            console.error(`Network error syncing report ID ${report.id}:`, error);
            break; // Stop syncing on network failure to avoid spamming
        }
    }

    updatePendingCountUI();
}

/**
 * Updates the UI badge showing how many reports are trapped locally.
 */
async function updatePendingCountUI() {
    const count = await db.submissions.count();
    const statusDiv = document.getElementById('sync-status');
    const countSpan = document.getElementById('pending-count');

    if (count > 0) {
        statusDiv.classList.remove('hidden');
        countSpan.textContent = count;
    } else {
        statusDiv.classList.add('hidden');
    }
}
