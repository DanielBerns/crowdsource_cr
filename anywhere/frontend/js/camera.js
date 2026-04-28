// camera.js

class CameraModule {
    constructor() {
        this.videoElement = document.getElementById('camera-feed');
        this.canvasElement = document.getElementById('photo-canvas');
        this.captureBtn = document.getElementById('capture-btn');
        this.stream = null;

        this.init();
    }

    init() {
        if (!this.videoElement || !this.captureBtn) return;

        this.captureBtn.addEventListener('click', () => this.takePhoto());
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
            this.videoElement.classList.remove('hidden');
        } catch (error) {
            console.error('Error accessing the camera:', error);
            alert('Unable to access the camera. Please check your device permissions.');
        }
    }

    stopCamera() {
        this.shouldBeOn = false;
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.videoElement.classList.add('hidden');
            this.stream = null;
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

        // Visual feedback
        this.captureBtn.textContent = "Photo Captured ✓";
        this.captureBtn.style.backgroundColor = "#28a745";

        setTimeout(() => {
            this.captureBtn.textContent = "Retake Photo";
            this.captureBtn.style.backgroundColor = "";
        }, 2000);
    }
}

// Initialize the camera module
const cameraManager = new CameraModule();
