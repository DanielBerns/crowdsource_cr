// js/auth.js

const AuthManager = {
    /**
     * Retrieves the current authentication token from local storage.
     * 
     * @returns {string|null} The JWT token or null if not logged in.
     */
    getToken() {
        return localStorage.getItem('auth_token');
    },

    /**
     * Checks if the user is currently authenticated.
     * 
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!this.getToken();
    },

    /**
     * Initiates the login flow by redirecting to the backend OAuth route.
     */
    login() {
        window.location.href = '/api/v1/auth/google/login';
    },

    /**
     * Logs the user out by clearing the token and updating the UI state.
     */
    logout() {
        localStorage.removeItem('auth_token');
        AuthManager.checkAuthState();
    },

    /**
     * Evaluates current auth state and toggles the relevant UI sections.
     * Emits a custom event so other modules (Camera, Storage, Geolocation) 
     * can react to login/logout events without tight coupling.
     */
    checkAuthState() {
        const token = this.getToken();
        const authSection = document.getElementById('landing-section');
        const reportSection = document.getElementById('report-section');
        const authToggleBtn = document.getElementById('auth-toggle-btn');

        if (token) {
            // User is authenticated: Show the app, hide the landing page
            if (authSection) authSection.classList.add('hidden');
            if (reportSection) reportSection.classList.remove('hidden');
            if (authToggleBtn) authToggleBtn.classList.remove('hidden');

            // Broadcast that the user is logged in
            window.dispatchEvent(new CustomEvent('auth-state-changed', { 
                detail: { isAuthenticated: true } 
            }));
        } else {
            // User is logged out: Show the landing page, hide the app
            if (authSection) authSection.classList.remove('hidden');
            if (reportSection) reportSection.classList.add('hidden');
            if (authToggleBtn) authToggleBtn.classList.add('hidden');

            // Broadcast that the user is logged out
            window.dispatchEvent(new CustomEvent('auth-state-changed', { 
                detail: { isAuthenticated: false } 
            }));
        }
    }
};