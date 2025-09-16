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
        document.getElementById('demoMode').addEventListener('click', () => this.startDemoMode());
        
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

    startDemoMode() {
        // Create a demo video feed with simulated AprilTags
        this.createDemoCanvas();
        
        document.getElementById('startCamera').disabled = true;
        document.getElementById('stopCamera').disabled = false;
        
        this.updateStatus('Demo mode started - simulated detection active');
        
        // Start detection loop with demo data
        this.detectionActive = true;
        this.detectTags();
    }

    createDemoCanvas() {
        // Create a demo video element with simulated content
        const demoCanvas = document.createElement('canvas');
        demoCanvas.width = 640;
        demoCanvas.height = 480;
        
        // Replace video with demo canvas
        this.video.style.display = 'none';
        this.video.parentNode.insertBefore(demoCanvas, this.video);
        
        this.demoCanvas = demoCanvas;
        this.demoCtx = demoCanvas.getContext('2d');
        
        // Set up demo canvas to look like video
        demoCanvas.style.border = this.video.style.border;
        demoCanvas.style.borderRadius = this.video.style.borderRadius;
        demoCanvas.style.maxWidth = this.video.style.maxWidth;
        
        // Update canvas overlay size
        this.canvas.width = 640;
        this.canvas.height = 480;
        this.canvas.style.width = demoCanvas.offsetWidth + 'px';
        this.canvas.style.height = demoCanvas.offsetHeight + 'px';
        
        // Update camera parameters for demo
        this.cameraMatrix.fx = 640 * 0.8;
        this.cameraMatrix.fy = 640 * 0.8;
        this.cameraMatrix.cx = 320;
        this.cameraMatrix.cy = 240;
        
        // Start demo animation
        this.animateDemoScene();
    }

    animateDemoScene() {
        if (!this.detectionActive) return;
        
        const ctx = this.demoCtx;
        const time = Date.now() / 1000;
        
        // Clear canvas with gray background
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(0, 0, 640, 480);
        
        // Draw simulated AprilTags
        const tag1X = 200 + Math.sin(time * 0.5) * 50;
        const tag1Y = 200 + Math.cos(time * 0.3) * 30;
        const tag1Rotation = time * 0.2;
        
        const tag2X = 450 + Math.sin(time * 0.7) * 40;
        const tag2Y = 280 + Math.cos(time * 0.4) * 40;
        const tag2Rotation = -time * 0.15;
        
        this.drawDemoTag(ctx, tag1X, tag1Y, 80, tag1Rotation, 0);
        this.drawDemoTag(ctx, tag2X, tag2Y, 70, tag2Rotation, 1);
        
        // Continue animation
        requestAnimationFrame(() => this.animateDemoScene());
    }

    drawDemoTag(ctx, centerX, centerY, size, rotation, id) {
        ctx.save();
        
        // Translate and rotate
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        
        const halfSize = size / 2;
        
        // Draw white background
        ctx.fillStyle = 'white';
        ctx.fillRect(-halfSize, -halfSize, size, size);
        
        // Draw black border
        ctx.fillStyle = 'black';
        ctx.lineWidth = 4;
        ctx.strokeRect(-halfSize, -halfSize, size, size);
        
        // Draw inner white area
        const innerSize = size * 0.7;
        const innerHalf = innerSize / 2;
        ctx.fillStyle = 'white';
        ctx.fillRect(-innerHalf, -innerHalf, innerSize, innerSize);
        
        // Draw simple pattern based on ID
        ctx.fillStyle = 'black';
        const cellSize = innerSize / 6;
        
        if (id === 0) {
            // Pattern for ID 0
            ctx.fillRect(-innerHalf + cellSize, -innerHalf + cellSize, cellSize, cellSize);
            ctx.fillRect(-innerHalf + 3*cellSize, -innerHalf + cellSize, cellSize, cellSize);
            ctx.fillRect(-innerHalf + cellSize, -innerHalf + 3*cellSize, cellSize, cellSize);
            ctx.fillRect(-innerHalf + 4*cellSize, -innerHalf + 3*cellSize, cellSize, cellSize);
        } else if (id === 1) {
            // Pattern for ID 1
            ctx.fillRect(-innerHalf + 2*cellSize, -innerHalf + cellSize, cellSize, cellSize);
            ctx.fillRect(-innerHalf + 4*cellSize, -innerHalf + cellSize, cellSize, cellSize);
            ctx.fillRect(-innerHalf + cellSize, -innerHalf + 2*cellSize, cellSize, cellSize);
            ctx.fillRect(-innerHalf + 4*cellSize, -innerHalf + 3*cellSize, cellSize, cellSize);
        }
        
        ctx.restore();
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
        
        // Clean up demo mode if active
        if (this.demoCanvas) {
            this.demoCanvas.remove();
            this.demoCanvas = null;
            this.demoCtx = null;
            this.video.style.display = 'block';
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
            
            if (this.demoCanvas) {
                // Use demo canvas data
                tempCanvas.width = this.demoCanvas.width;
                tempCanvas.height = this.demoCanvas.height;
                tempCtx.drawImage(this.demoCanvas, 0, 0);
            } else {
                // Use video data
                tempCanvas.width = this.video.videoWidth;
                tempCanvas.height = this.video.videoHeight;
                tempCtx.drawImage(this.video, 0, 0, tempCanvas.width, tempCanvas.height);
            }
            
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
            
            // Use demo detection if in demo mode
            if (this.demoCanvas) {
                return this.detector.detectDemo(imageData);
            }
            
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
        const relativePose = this.computeRelativeTransformation(tag1.pose, tag2.pose);
        
        // Calculate distance
        const translation = relativePose.translation;
        const distance = Math.sqrt(translation[0] ** 2 + translation[1] ** 2 + translation[2] ** 2);
        
        // Convert rotation from matrix to Euler angles for display
        const eulerAngles = this.rotationMatrixToEuler(relativePose.rotationMatrix);
        
        // Update UI
        document.getElementById('relativeDistance').textContent = `${distance.toFixed(3)} m`;
        document.getElementById('relativeTranslation').textContent = 
            `x: ${translation[0].toFixed(3)}, y: ${translation[1].toFixed(3)}, z: ${translation[2].toFixed(3)}`;
        document.getElementById('relativeRotation').textContent = 
            `rx: ${(eulerAngles[0] * 180 / Math.PI).toFixed(1)}°, ry: ${(eulerAngles[1] * 180 / Math.PI).toFixed(1)}°, rz: ${(eulerAngles[2] * 180 / Math.PI).toFixed(1)}°`;
        
        relativePoseDiv.style.display = 'block';
    }

    computeRelativeTransformation(pose1, pose2) {
        // Convert Euler angles to rotation matrices
        const R1 = this.eulerToRotationMatrix(pose1.rotation);
        const R2 = this.eulerToRotationMatrix(pose2.rotation);
        
        // Extract translation vectors
        const t1 = pose1.translation;
        const t2 = pose2.translation;
        
        // Compute relative rotation: R_rel = R2 * R1^T
        const R1_transpose = this.transposeMatrix(R1);
        const R_relative = this.multiplyMatrices(R2, R1_transpose);
        
        // Compute relative translation: t_rel = R1^T * (t2 - t1)
        const t_diff = this.subtractVectors(t2, t1);
        const t_relative = this.multiplyMatrixVector(R1_transpose, t_diff);
        
        return {
            translation: t_relative,
            rotationMatrix: R_relative
        };
    }

    eulerToRotationMatrix(euler) {
        // Convert Euler angles (rx, ry, rz) to rotation matrix
        const [rx, ry, rz] = euler;
        
        const cos_x = Math.cos(rx), sin_x = Math.sin(rx);
        const cos_y = Math.cos(ry), sin_y = Math.sin(ry);
        const cos_z = Math.cos(rz), sin_z = Math.sin(rz);
        
        // ZYX rotation order
        return [
            [cos_y * cos_z, -cos_y * sin_z, sin_y],
            [cos_x * sin_z + sin_x * sin_y * cos_z, cos_x * cos_z - sin_x * sin_y * sin_z, -sin_x * cos_y],
            [sin_x * sin_z - cos_x * sin_y * cos_z, sin_x * cos_z + cos_x * sin_y * sin_z, cos_x * cos_y]
        ];
    }

    rotationMatrixToEuler(R) {
        // Convert rotation matrix to Euler angles (ZYX order)
        const sy = Math.sqrt(R[0][0] * R[0][0] + R[1][0] * R[1][0]);
        
        const singular = sy < 1e-6;
        
        let x, y, z;
        if (!singular) {
            x = Math.atan2(R[2][1], R[2][2]);
            y = Math.atan2(-R[2][0], sy);
            z = Math.atan2(R[1][0], R[0][0]);
        } else {
            x = Math.atan2(-R[1][2], R[1][1]);
            y = Math.atan2(-R[2][0], sy);
            z = 0;
        }
        
        return [x, y, z];
    }

    transposeMatrix(matrix) {
        return [
            [matrix[0][0], matrix[1][0], matrix[2][0]],
            [matrix[0][1], matrix[1][1], matrix[2][1]],
            [matrix[0][2], matrix[1][2], matrix[2][2]]
        ];
    }

    multiplyMatrices(A, B) {
        const result = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                for (let k = 0; k < 3; k++) {
                    result[i][j] += A[i][k] * B[k][j];
                }
            }
        }
        
        return result;
    }

    multiplyMatrixVector(matrix, vector) {
        return [
            matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
            matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
            matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2]
        ];
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