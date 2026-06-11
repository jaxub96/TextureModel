"""
3D Model Viewer - Local server
Run: python app.py
Then open: http://localhost:5000
"""

import os
import threading
import webbrowser
from flask import Flask, send_from_directory, jsonify, render_template



app = Flask(
    __name__,
    static_folder="static",
    template_folder="templates"
)
BODY_MODELS_DIR = "C:\\Games\\SteamLibrary\\steamapps\\common\\Gothic II\\_work\\data\\Anims\\asc_hum_head_ALL\\converted"

HEAD_MODELS_DIR = "C:\\Games\\SteamLibrary\\steamapps\\common\\Gothic II\\_work\\data\\Anims\\asc_hum_head_ALL\\converted"
ALLOWED_EXTENSIONS = {".glb", ".gltf", ".obj", ".stl", ".ply"}
TEXTURES_DIR = "C:\\Games\\SteamLibrary\\steamapps\\common\\Gothic II\\_work\\data\\Textures\\NPCs\\Head"
TEXTURE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tga"}

"C:\\Games\\SteamLibrary\\steamapps\\common\\Gothic II\\_work\\data\\Textures\\NPCs\\Head"
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

@app.route('/api/body-models')
def list_body_models():
    if not os.path.isdir(BODY_MODELS_DIR):
        os.makedirs(BODY_MODELS_DIR)

    files = [
        f for f in os.listdir(BODY_MODELS_DIR)
        if allowed(f)
    ]

    return jsonify(sorted(files))

@app.route("/api/models")
def list_models():
    """Return list of model files in the models/ directory."""
    if not os.path.isdir(HEAD_MODELS_DIR):
        os.makedirs(HEAD_MODELS_DIR)
    files = [f for f in os.listdir(HEAD_MODELS_DIR) if allowed(f)]
    return jsonify(sorted(files))


@app.route("/models/<path:filename>")
def serve_model(filename):
    """Serve a model file from the models/ directory."""
    return send_from_directory(HEAD_MODELS_DIR, filename)
@app.route("/body-models/<path:filename>")
def serve_body_model(filename):
    return send_from_directory(BODY_MODELS_DIR, filename)

@app.route("/api/models-dir")
def models_dir():
    """Return the absolute path to the models directory."""
    return jsonify({"path": os.path.abspath(HEAD_MODELS_DIR)})




@app.route("/")
def index():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(port=5000, debug=True)