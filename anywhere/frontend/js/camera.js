// camera.js

class CameraModule {
    constructor() {
        this.videoElement = document.getElementById('camera-feed');
        this.canvasElement = document.getElementById('photo-canvas');
        this.captureBtn = document.getElementById('capture-btn');
        this.stream = null;
        this.shouldBeOn = false;

        this.init();
    }

    init() {
        if (!this.videoElement || !this.captureBtn) return;

        this.captureBtn.addEventListener('click', () => {
            // If the video is hidden, we are viewing a captured photo and want to retake it
            if (this.videoElement.classList.contains('hidden')) {
                this.startCamera();
            } else {
                this.takePhoto();
            }
        });
    }

    async startCamera() {
        this.shouldBeOn = true;
        try {
            // Request the rear camera (environment facing) if available
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });

            if (!this.shouldBeOn) {
                // stopCamera was called while waiting for user permission
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            this.stream = stream;
            this.videoElement.srcObject = this.stream;

            // UI Management: Show video, hide canvas, reset button state
            this.videoElement.classList.remove('hidden');
            if (this.canvasElement) this.canvasElement.classList.add('hidden');
            if (this.captureBtn) {
                this.captureBtn.textContent = "Capturar Foto";
                this.captureBtn.classList.remove('btn-success');
                this.captureBtn.classList.add('btn-secondary');
            }
        } catch (error) {
            console.error('Error al acceder a la cámara:', error);
            alert('No se pudo acceder a la cámara. Por favor, verifica los permisos de tu dispositivo.');
        }
    }

    stopCamera() {
        this.shouldBeOn = false;
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.videoElement) {
            this.videoElement.classList.add('hidden');
        }
    }

    takePhoto() {
        if (!this.stream) return;

        const context = this.canvasElement.getContext('2d');

        // Set canvas dimensions to match the video stream
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;

        // Draw the current video frame onto the canvas
        context.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);

        // UI Feedback: Show the static photo, hide the live video feed
        this.canvasElement.classList.remove('hidden');
        this.videoElement.classList.add('hidden');

        // Update button to indicate retake action
        this.captureBtn.textContent = "Volver a Tomar";
        this.captureBtn.classList.remove('btn-secondary');
        this.captureBtn.classList.add('btn-success');

        // Stop the camera hardware to save battery while viewing the photo
        this.stopCamera();
    }
}

// Initialize the camera module
const cameraManager = new CameraModule();
