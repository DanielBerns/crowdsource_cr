// js/geolocation.js

const GeolocationService = {
    /**
     * Requests the device's current GPS coordinates.
     * 
     * @returns {Promise<GeolocationCoordinates>} - Resolves with the coords object.
     * @throws {Error} - If geolocation is unsupported or permission is denied/times out.
     */
    getCoordinates() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("La geolocalización no es soportada por este navegador."));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve(position.coords);
                },
                (error) => {
                    // Translate native GeolocationPositionError into user-friendly domain errors
                    let errorMessage = "Error desconocido al obtener la ubicación.";
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "Permiso de ubicación denegado por el usuario.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "La información de ubicación no está disponible en el dispositivo.";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "La solicitud para obtener la ubicación caducó.";
                            break;
                    }
                    reject(new Error(errorMessage));
                },
                {
                    // Configuration rules specific to this hardware interaction
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    },

    /**
     * Convenience method to just get the latitude.
     */
    async getLatitude() {
        const coords = await this.getCoordinates();
        return coords.latitude;
    },

    /**
     * Convenience method to just get the longitude.
     */
    async getLongitude() {
        const coords = await this.getCoordinates();
        return coords.longitude;
    }
};