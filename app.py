"""
3D Model Viewer - Local server
Run: python app.py
Then open: http://localhost:5000
"""

import os
import threading
import webbrowser
from flask import Flask, send_from_directory, jsonify

app = Flask(__name__, static_folder="static")

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
ALLOWED_EXTENSIONS = {".glb", ".gltf", ".obj", ".stl", ".ply"}
TEXTURES_DIR = os.path.join(os.path.dirname(__file__), "textures")
TEXTURE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tga"}


@app.route("/api/textures")
def list_textures():
    os.makedirs(TEXTURES_DIR, exist_ok=True)
    files = [
        f
        for f in os.listdir(TEXTURES_DIR)
        if os.path.splitext(f.lower())[1] in TEXTURE_EXTENSIONS
    ]
    return jsonify(sorted(files))


@app.route("/textures/<path:filename>")
def serve_texture(filename):
    return send_from_directory(TEXTURES_DIR, filename)


def allowed(filename):
    return os.path.splitext(filename.lower())[1] in ALLOWED_EXTENSIONS


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/api/models")
def list_models():
    """Return list of model files in the models/ directory."""
    if not os.path.isdir(MODELS_DIR):
        os.makedirs(MODELS_DIR)
    files = [f for f in os.listdir(MODELS_DIR) if allowed(f)]
    return jsonify(sorted(files))


@app.route("/models/<path:filename>")
def serve_model(filename):
    """Serve a model file from the models/ directory."""
    return send_from_directory(MODELS_DIR, filename)


@app.route("/api/models-dir")
def models_dir():
    """Return the absolute path to the models directory."""
    return jsonify({"path": os.path.abspath(MODELS_DIR)})


if __name__ == "__main__":
    os.makedirs(MODELS_DIR, exist_ok=True)

    print(f"3D Viewer running at http://localhost:5000")
    print(f"Drop model files into: {os.path.abspath(MODELS_DIR)}")

    app.run(port=5000, debug=True, use_reloader=False)
