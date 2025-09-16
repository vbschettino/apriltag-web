# AprilTag Web - Relative Pose Detection

A web application for detecting AprilTags and calculating the relative pose between two tags using computer vision techniques.

![Web App Interface](https://github.com/user-attachments/assets/37081aa5-0173-4e19-8816-5d85e2ceff9d)

## Features

- **Real-time AprilTag Detection**: Detects AprilTags from camera feed using computer vision
- **Multiple Tag Family Support**: Supports 8 different AprilTag families (36h11, 25h9, 16h5, etc.)
- **Relative Pose Calculation**: Calculates position and orientation between two detected tags
- **Professional UI**: Clean, responsive interface with real-time controls
- **Camera Integration**: WebRTC camera access for live detection
- **Visual Overlays**: Real-time visualization of detected tags with coordinate frames

## Supported AprilTag Families

- 36h11 (Standard) - Most commonly used
- 25h9
- 16h5
- Circle 21h7
- Circle 49h12
- Custom 48h12
- Standard 41h12
- Standard 52h13

## Getting Started

### Prerequisites

- Modern web browser with camera support
- Local web server (for camera access)

### Running the Application

1. **Clone the repository**:
   ```bash
   git clone https://github.com/vbschettino/apriltag-web.git
   cd apriltag-web
   ```

2. **Start a local web server**:
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Node.js (if you have it installed)
   npx http-server -p 8000
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open your browser** and navigate to `http://localhost:8000`

4. **Allow camera access** when prompted by your browser

### Using the Application

1. **Configure Tag Settings**:
   - Select the appropriate tag family
   - Set the physical tag size in meters
   - Specify the IDs of the two tags you want to track

2. **Start Detection**:
   - Click "Start Camera" to begin live detection
   - Point camera at AprilTags
   - The app will display detected tags with visual overlays

3. **View Results**:
   - Individual tag poses are shown for each detected tag
   - Relative pose is calculated when both target tags are visible
   - Results include distance, translation, and rotation between tags

## Configuration Options

### Tag Configuration
- **Tag Family**: Choose the AprilTag family that matches your printed tags
- **Tag Size**: Physical size of your tags in meters (important for accurate pose estimation)

### Target Tags
- **Tag 1 ID**: ID of the first reference tag
- **Tag 2 ID**: ID of the second tag for relative pose calculation

### Detection Settings
- **Decimate**: Image downsampling factor (higher = faster but less accurate)
- **Blur**: Gaussian blur sigma for noise reduction
- **Refine Edges**: Enable edge refinement for better accuracy

## Understanding the Results

### Individual Tag Pose
- **Position**: 3D coordinates (x, y, z) relative to camera in meters
- **Rotation**: Euler angles (rx, ry, rz) in degrees

### Relative Pose
- **Distance**: Euclidean distance between the two tags
- **Translation**: Position of Tag 2 relative to Tag 1's coordinate frame
- **Rotation**: Orientation of Tag 2 relative to Tag 1's coordinate frame

## Technical Implementation

### Architecture
- **Frontend**: Pure HTML5/JavaScript with no external dependencies
- **Computer Vision**: Custom AprilTag detection using Canvas API and image processing
- **Pose Estimation**: Perspective-n-Point (PnP) algorithm for 3D pose calculation
- **Transformation Math**: Proper rotation matrix and homogeneous transformation calculations

### Key Components
- `index.html`: Main application interface
- `app.js`: Core application logic and UI handling
- `apriltag.js`: AprilTag detection and pose estimation algorithms
- `test-generator.html`: Utility for generating test AprilTag images

## Testing

Use the included test generator to create AprilTag images for testing:

1. Open `test-generator.html` in your browser
2. Generate test tags or test patterns
3. Display them on another screen or print them
4. Point your camera at the test images

## Browser Compatibility

- Chrome 60+ (recommended)
- Firefox 55+
- Safari 11+
- Edge 79+

Camera access requires HTTPS in production or localhost for development.

## Limitations

- Detection accuracy depends on lighting conditions and camera quality
- Currently uses simulated detection (placeholder for real AprilTag library integration)
- Pose estimation accuracy improves with larger tag sizes and better camera calibration

## Future Improvements

- Integration with WebAssembly AprilTag detection library
- Camera calibration interface
- Support for more tag families
- Improved pose estimation algorithms
- Export/logging of detection results

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- AprilTag system by the April Lab at University of Michigan
- OpenCV community for computer vision algorithms
- WebRTC standards for camera access
