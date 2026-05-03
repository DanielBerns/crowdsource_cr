// js/db.js

// Initialize Dexie database
const db = new Dexie("MostremosOfflineDB");

// Define schema: ++id (auto-incrementing primary key)
db.version(1).stores({
    submissions: '++id, timestamp'
});

/**
 * StorageAdapter
 * The pure database interface. Knows nothing about the network or the UI.
 */
const StorageAdapter = {
    async saveLocally(reportData) {
        try {
            await db.submissions.add({
                ...reportData,
                timestamp: new Date().toISOString()
            });
            console.log("Reporte guardado de forma segura en IndexedDB local.");
            await this.broadcastCount();
        } catch (error) {
            console.error("Fallo al guardar el reporte localmente:", error);
        }
    },

    async getPendingReports() {
        return await db.submissions.toArray();
    },

    async removeReport(id) {
        await db.submissions.delete(id);
        await this.broadcastCount();
    },

    async getPendingCount() {
        return await db.submissions.count();
    },

    /**
     * Emits an event whenever the database changes so the UI can update itself.
     */
    async broadcastCount() {
        const count = await this.getPendingCount();
        window.dispatchEvent(new CustomEvent('pending-reports-changed', {
            detail: { count }
        }));
    }
};

/**
 * SyncManager
 * The business logic that bridges the StorageAdapter and the ApiClient.
 */
const SyncManager = {
    async syncPendingReports() {
        // Relies on our refactored AuthManager from js/auth.js
        const token = typeof AuthManager !== 'undefined' ? AuthManager.getToken() : null;
        
        if (!token || !navigator.onLine) {
            return; // Exit silently if offline or unauthenticated
        }

        const pendingReports = await StorageAdapter.getPendingReports();
        if (pendingReports.length === 0) return;

        console.log(`Intentando sincronizar ${pendingReports.length} reportes pendientes...`);

        for (const report of pendingReports) {
            try {
                // Relies on our refactored ApiClient from js/api.js
                const success = await ApiClient.attemptLiveSubmission(report, token);

                if (success) {
                    await StorageAdapter.removeReport(report.id);
                    console.log(`Reporte ID ${report.id} sincronizado exitosamente.`);
                } else {
                    // If it failed but didn't throw an error, it was likely a network drop or a 401.
                    // If auth token was cleared by the ApiClient (401), stop syncing.
                    if (!AuthManager.isAuthenticated()) {
                        console.warn("Sincronización detenida: sesión expirada.");
                        break; 
                    }
                    // Otherwise, just a network drop, halt sync until next online event.
                    break;
                }
            } catch (error) {
                // If ApiClient threw an error, it caught a hard rejection (e.g., 403 Out of Bounds)
                if (error.message.includes("Forbidden")) {
                    console.error(`Reporte ID ${report.id} rechazado por reglas de negocio (Fuera de límites). Eliminando para prevenir bucle infinito.`);
                    await StorageAdapter.removeReport(report.id);
                } else {
                    console.error(`Error de red al sincronizar reporte ID ${report.id}:`, error);
                    break; 
                }
            }
        }
    }
};