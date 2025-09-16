class AprilTagWebApp {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.stream = null;
        this.detectionActive = false;
        this.animationFrame = null;
        
        // Camera parameters (will be estimated/calibrated)
        this.cameraMatrix = {
            fx: 800, // focal length x
            fy: 800, // focal length y
            cx: 320, // principal point x
            cy: 240  // principal point y
        };
        
        this.detectedTags = new Map();
        this.detector = new AprilTagDetector();
        
        this.initializeEventListeners();
        this.initializeDetector();
    }

    async initializeDetector() {
        try {
            await this.detector.initialize();
            this.updateStatus('Detector initialized - ready to start camera');
        } catch (error) {
            this.updateStatus(`Failed to initialize detector: ${error.message}`, 'error');
        }
    }

    initializeEventListeners() {
        document.getElementById('startCamera').addEventListener('click', () => this.startCamera());
        document.getElementById('stopCamera').addEventListener('click', () => this.stopCamera());
        
        // Update detector parameters when settings change
        document.getElementById('tagFamily').addEventListener('change', () => this.updateDetectorParameters());
        document.getElementById('tagSize').addEventListener('change', () => this.updateDetectorParameters());
        document.getElementById('decimate').addEventListener('change', () => this.updateDetectorParameters());
        document.getElementById('blur').addEventListener('change', () => this.updateDetectorParameters());
        document.getElementById('refineEdges').addEventListener('change', () => this.updateDetectorParameters());
        
        // Update camera parameters when video dimensions change
        this.video.addEventListener('loadedmetadata', () => {
            this.updateCameraParameters();
        });
    }

    updateDetectorParameters() {
        const params = {
            tagFamily: document.getElementById('tagFamily').value,
            tagSize: parseFloat(document.getElementById('tagSize').value),
            decimate: parseInt(document.getElementById('decimate').value),
            blur: parseFloat(document.getElementById('blur').value),
            refineEdges: document.getElementById('refineEdges').checked
        };
        
        this.detector.setParameters(params);
    }

    updateCameraParameters() {
        const width = this.video.videoWidth;
        const height = this.video.videoHeight;
        
        // Update canvas size
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = this.video.offsetWidth + 'px';
        this.canvas.style.height = this.video.offsetHeight + 'px';
        
        // Estimate camera parameters based on video dimensions
        this.cameraMatrix.fx = width * 0.8; // rough estimate
        this.cameraMatrix.fy = width * 0.8;
        this.cameraMatrix.cx = width / 2;
        this.cameraMatrix.cy = height / 2;
    }

    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            
            this.video.srcObject = this.stream;
            this.video.play();
            
            document.getElementById('startCamera').disabled = true;
            document.getElementById('stopCamera').disabled = false;
            
            this.updateStatus('Camera started - waiting for AprilTag detection...');
            
            // Start detection loop
            this.detectionActive = true;
            this.detectTags();
            
        } catch (error) {
            this.updateStatus(`Error accessing camera: ${error.message}`, 'error');
        }
    }

    stopCamera() {
        this.detectionActive = false;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.video.srcObject = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        document.getElementById('startCamera').disabled = false;
        document.getElementById('stopCamera').disabled = true;
        
        this.updateStatus('Camera stopped');
        this.clearResults();
    }

    detectTags() {
        if (!this.detectionActive) return;

        try {
            // Create a temporary canvas for detection
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            tempCanvas.width = this.video.videoWidth;
            tempCanvas.height = this.video.videoHeight;
            
            // Draw current video frame
            tempCtx.drawImage(this.video, 0, 0, tempCanvas.width, tempCanvas.height);
            
            // Get image data for AprilTag detection
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Perform AprilTag detection (placeholder - will be replaced with actual library)
            const detections = this.performAprilTagDetection(imageData);
            
            // Clear overlay canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Process detections
            this.processDetections(detections);
            
            // Continue detection loop
            this.animationFrame = requestAnimationFrame(() => this.detectTags());
            
        } catch (error) {
            this.updateStatus(`Detection error: ${error.message}`, 'error');
        }
    }

    performAprilTagDetection(imageData) {
        try {
            // Update detector parameters
            this.updateDetectorParameters();
            
            // Perform actual detection
            return this.detector.detect(imageData);
        } catch (error) {
            console.error('Detection error:', error);
            return [];
        }
    }

    processDetections(detections) {
        // Update detected tags map
        this.detectedTags.clear();
        
        detections.forEach(detection => {
            this.detectedTags.set(detection.id, detection);
            this.drawTagOverlay(detection);
        });
        
        // Update UI with detection info
        this.updateDetectionInfo(detections);
        
        // Calculate relative pose if both target tags are detected
        this.calculateRelativePose();
    }

    drawTagOverlay(detection) {
        const scaleX = this.canvas.offsetWidth / this.canvas.width;
        const scaleY = this.canvas.offsetHeight / this.canvas.height;
        
        this.ctx.save();
        
        // Draw tag outline
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        const corners = detection.corners;
        this.ctx.moveTo(corners[0][0] * scaleX, corners[0][1] * scaleY);
        for (let i = 1; i < corners.length; i++) {
            this.ctx.lineTo(corners[i][0] * scaleX, corners[i][1] * scaleY);
        }
        this.ctx.closePath();
        this.ctx.stroke();
        
        // Draw tag ID
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(
            `ID: ${detection.id}`, 
            detection.center[0] * scaleX, 
            detection.center[1] * scaleY - 10
        );
        
        // Draw coordinate system (simplified)
        const centerX = detection.center[0] * scaleX;
        const centerY = detection.center[1] * scaleY;
        
        // X axis (red)
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(centerX + 30, centerY);
        this.ctx.stroke();
        
        // Y axis (green)
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(centerX, centerY - 30);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    updateDetectionInfo(detections) {
        const detectionInfo = document.getElementById('detectionInfo');
        
        if (detections.length === 0) {
            detectionInfo.innerHTML = '<div class="error">No AprilTags detected</div>';
            document.getElementById('poseData').style.display = 'none';
            document.getElementById('relativePose').style.display = 'none';
            return;
        }
        
        let infoHtml = `<div class="success">Detected ${detections.length} tag(s)</div>`;
        detectionInfo.innerHTML = infoHtml;
        
        // Show pose data section
        document.getElementById('poseData').style.display = 'grid';
        
        // Update individual tag information
        this.updateTagInfo('tag1', parseInt(document.getElementById('tag1Id').value));
        this.updateTagInfo('tag2', parseInt(document.getElementById('tag2Id').value));
    }

    updateTagInfo(tagPrefix, targetId) {
        const detection = this.detectedTags.get(targetId);
        const idDisplay = document.getElementById(`${tagPrefix}IdDisplay`);
        const position = document.getElementById(`${tagPrefix}Position`);
        const rotation = document.getElementById(`${tagPrefix}Rotation`);
        
        idDisplay.textContent = targetId;
        
        if (detection) {
            const pos = detection.pose.translation;
            const rot = detection.pose.rotation;
            
            position.textContent = `x: ${pos[0].toFixed(3)}, y: ${pos[1].toFixed(3)}, z: ${pos[2].toFixed(3)}`;
            rotation.textContent = `rx: ${(rot[0] * 180 / Math.PI).toFixed(1)}°, ry: ${(rot[1] * 180 / Math.PI).toFixed(1)}°, rz: ${(rot[2] * 180 / Math.PI).toFixed(1)}°`;
        } else {
            position.textContent = 'Not detected';
            rotation.textContent = 'Not detected';
        }
    }

    calculateRelativePose() {
        const tag1Id = parseInt(document.getElementById('tag1Id').value);
        const tag2Id = parseInt(document.getElementById('tag2Id').value);
        
        const tag1 = this.detectedTags.get(tag1Id);
        const tag2 = this.detectedTags.get(tag2Id);
        
        const relativePoseDiv = document.getElementById('relativePose');
        
        if (!tag1 || !tag2) {
            relativePoseDiv.style.display = 'none';
            return;
        }
        
        // Calculate relative transformation from tag1 to tag2
        const relativeTranslation = this.subtractVectors(tag2.pose.translation, tag1.pose.translation);
        const relativeRotation = this.subtractVectors(tag2.pose.rotation, tag1.pose.rotation);
        
        // Calculate distance
        const distance = Math.sqrt(
            relativeTranslation[0] ** 2 + 
            relativeTranslation[1] ** 2 + 
            relativeTranslation[2] ** 2
        );
        
        // Update UI
        document.getElementById('relativeDistance').textContent = `${distance.toFixed(3)} m`;
        document.getElementById('relativeTranslation').textContent = 
            `x: ${relativeTranslation[0].toFixed(3)}, y: ${relativeTranslation[1].toFixed(3)}, z: ${relativeTranslation[2].toFixed(3)}`;
        document.getElementById('relativeRotation').textContent = 
            `rx: ${(relativeRotation[0] * 180 / Math.PI).toFixed(1)}°, ry: ${(relativeRotation[1] * 180 / Math.PI).toFixed(1)}°, rz: ${(relativeRotation[2] * 180 / Math.PI).toFixed(1)}°`;
        
        relativePoseDiv.style.display = 'block';
    }

    subtractVectors(v1, v2) {
        return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
    }

    updateStatus(message, type = 'info') {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = message;
        statusDiv.className = type;
    }

    clearResults() {
        document.getElementById('detectionInfo').innerHTML = '';
        document.getElementById('poseData').style.display = 'none';
        document.getElementById('relativePose').style.display = 'none';
        this.detectedTags.clear();
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AprilTagWebApp();
});