document.addEventListener('DOMContentLoaded', () => {
    // 1. Cache DOM Elements
    const elements = {
        googleLoginBtn: document.getElementById('google-login-btn'),
        authToggleBtn: document.getElementById('auth-toggle-btn'),
        reportForm: document.getElementById('report-form'),
        forceSyncBtn: document.getElementById('force-sync-btn'),
        category: document.getElementById('category'),
        notes: document.getElementById('notes'),
        latitude: document.getElementById('latitude'),
        longitude: document.getElementById('longitude'),
        canvas: document.getElementById('photo-canvas'),
        submitBtn: document.getElementById('submit-report-btn'),
        refreshLocationBtn: document.getElementById('refresh-location-btn')
    };

    // 2. Bind Global System Event Listeners FIRST
    window.addEventListener('online', () => {
        if (typeof SyncManager !== 'undefined') SyncManager.syncPendingReports();
    });

        window.addEventListener('auth-state-changed', (e) => {
            if (e.detail.isAuthenticated) {
                if (typeof SyncManager !== 'undefined') SyncManager.syncPendingReports();
                if (typeof cameraManager !== 'undefined') cameraManager.startCamera();
                updateLocationDisplayUI();
            } else {
                if (typeof cameraManager !== 'undefined') cameraManager.stopCamera();
            }
        });

        window.addEventListener('pending-reports-changed', (e) => {
            const count = e.detail.count;
            const statusDiv = document.getElementById('sync-status');
            const countSpan = document.getElementById('pending-count');

            if (statusDiv && countSpan) {
                if (count > 0) {
                    statusDiv.classList.remove('hidden');
                    countSpan.textContent = count;
                } else {
                    statusDiv.classList.add('hidden');
                }
            }
        });

        // 3. Bind UI Action Listeners
        if (elements.googleLoginBtn) elements.googleLoginBtn.addEventListener('click', AuthManager.login);
        if (elements.authToggleBtn) elements.authToggleBtn.addEventListener('click', AuthManager.logout);
        if (elements.forceSyncBtn) elements.forceSyncBtn.addEventListener('click', () => SyncManager.syncPendingReports());

        // NEW: Refresh Location Listener
        if (elements.refreshLocationBtn) {
            elements.refreshLocationBtn.addEventListener('click', async () => {
                // Disable the button to prevent spam clicking
                elements.refreshLocationBtn.disabled = true;
                await updateLocationDisplayUI();
                elements.refreshLocationBtn.disabled = false;
            });
        }

        // 4. Form Submission Orchestration
        if (elements.reportForm) {
            elements.reportForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                if (!elements.category.value) {
                    alert("Por favor, seleccione una categoría interactuando con las opciones.");
                    return;
                }

                // Read from inputs. If empty, attempt a fallback fetch just in case.
                let lat = parseFloat(elements.latitude.value);
                let lon = parseFloat(elements.longitude.value);

                if (!lat || !lon) {
                    try {
                        lat = await GeolocationService.getLatitude();
                        lon = await GeolocationService.getLongitude();
                    } catch (error) {
                        console.error("No se pudo obtener la ubicación para el envío.", error);
                    }
                }

                const reportData = {
                    category: elements.category.value,
                    notes: elements.notes.value,
                    latitude: lat || 0.0,
                    longitude: lon || 0.0,
                    imageBlob: await getCanvasBlob(elements.canvas)
                };

                if (!reportData.imageBlob) {
                    alert("Por favor, capture una foto primero.");
                    return;
                }

                // UX: Show processing state
                const originalBtnText = elements.submitBtn.textContent;
                elements.submitBtn.disabled = true;
                elements.submitBtn.textContent = "Procesando...";

                await submitReport(reportData, elements.reportForm);

                // Restore button state
                elements.submitBtn.disabled = false;
                elements.submitBtn.textContent = originalBtnText;

                // Reset the selected category UI
                const resetBtn = document.getElementById('reset-category-btn');
                if (resetBtn) resetBtn.click();
            });
        }

        // 5. Initialize Application State LAST
        AuthManager.checkAuthState();
        if (typeof StorageAdapter !== 'undefined') {
            StorageAdapter.broadcastCount();
        }
});

/**
 * Handles routing the report to either the live API or offline storage.
 */
async function submitReport(reportData, formElement) {
    const token = AuthManager.getToken();

    if (navigator.onLine && token) {
        const success = await ApiClient.attemptLiveSubmission(reportData, token);
        if (success) {
            alert("¡Reporte enviado con éxito!");
            formElement.reset();
        } else {
            await StorageAdapter.saveLocally(reportData);
            AuthManager.checkAuthState(); // Re-evaluate if the token was rejected
        }
    } else {
        await StorageAdapter.saveLocally(reportData);
        alert("Estás desconectado. El reporte se guardó localmente y se sincronizará automáticamente.");
        formElement.reset();
    }
}

/**
 * Extracts a Blob from the Canvas element.
 */
function getCanvasBlob(canvas) {
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
}

/**
 * Updates the location UI passively or when forced by the refresh button.
 */
async function updateLocationDisplayUI() {
    const locDisplay = document.getElementById('location-display');
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');

    if (!locDisplay) return;

    locDisplay.textContent = "Buscando ubicación...";
    locDisplay.style.color = "#6c757d";

    try {
        const coords = await GeolocationService.getCoordinates();
        locDisplay.textContent = `Lat: ${coords.latitude.toFixed(5)}, Lon: ${coords.longitude.toFixed(5)}`;
        locDisplay.style.color = "#28a745"; // Success green

        if (latInput && lonInput) {
            latInput.value = coords.latitude;
            lonInput.value = coords.longitude;
        }
    } catch (error) {
        locDisplay.textContent = error.message;
        locDisplay.style.color = "#dc3545"; // Error red
    }
}
