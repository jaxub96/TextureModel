# 3D Viewer

A local Python + Three.js app for loading and combining 3D models.

## Setup

1. Install dependencies:

   ```
   pip install flask
   ```

2. Drop model files into the `models/` folder.
   Supported formats: `.glb`, `.gltf`, `.obj`, `.stl`

3. Run the server:

   ```
   python app.py
   ```

   The browser opens automatically at http://localhost:5000

## Usage

- **Model A / B**: Select a model from each dropdown to load it into the scene
- **Model B offset**: Adjust X/Y/Z position of model B relative to the origin
- **Combine models**: Merges both models into a single scene object
- **Wireframe**: Toggle wireframe rendering
- **Grid**: Toggle the ground grid
- **Reset view**: Re-centers the camera on the loaded model(s)

## Controls

| Input      | Action         |
| ---------- | -------------- |
| Left drag  | Orbit / rotate |
| Right drag | Pan            |
| Scroll     | Zoom           |
