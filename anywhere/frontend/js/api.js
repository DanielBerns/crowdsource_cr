// js/api.js

const ApiClient = {
    /**
     * Attempts to send report data directly to the Flask backend.
     * 
     * @param {Object} reportData - The sanitized data gathered from the form and device.
     * @param {string} token - The JWT authentication token.
     * @returns {Promise<boolean>} - True if successful, false if the caller should fallback to local storage.
     */
    async attemptLiveSubmission(reportData, token) {
        // Translate the application data into the specific external DTO expected by Flask
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
                return true;
            } 
            
            if (response.status === 401) {
                console.warn("Session expired. Backend rejected token.");
                // Return false so the orchestrator knows to save locally and manage the auth state
                return false; 
            } 
            
            if (response.status === 403) {
                // Throwing an error here because a 403 (out of bounds) shouldn't be saved 
                // locally for a retry; it's a hard rejection by the business rules.
                console.error("Report rejected: Location out of bounds or forbidden.");
                throw new Error("Forbidden: Location out of bounds"); 
            }

            console.error(`Server returned an unexpected status: ${response.status}`);
            return false;

        } catch (error) {
            // This catches actual network drops or the thrown 403 error above
            console.error("Network drop or error detected during live submission.", error);
            
            if (error.message.includes("Forbidden")) {
                throw error; // Bubble up hard business rule rejections
            }
            
            return false; // Standard network failures trigger the offline fallback
        }
    }
};