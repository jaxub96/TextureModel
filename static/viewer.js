import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader }     from 'three/addons/loaders/OBJLoader.js';
import { STLLoader }     from 'three/addons/loaders/STLLoader.js';
import { TGALoader }     from 'three/addons/loaders/TGALoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
// ─── Loaders ──────────────────────────────────────────────────────────
const tgaLoader     = new TGALoader();
const textureLoader = new THREE.TextureLoader();
const textureCache  = {};

function loadTexture(path) {
    if (textureCache[path]) return Promise.resolve(textureCache[path]);
    const ext = path.split('.').pop().toLowerCase();
    return new Promise((resolve, reject) => {
        const onLoad = tex => {
            tex.flipY = false;
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.needsUpdate = true;
            textureCache[path] = tex;
            resolve(tex);
        };
        if (ext === 'tga') tgaLoader.load(path, onLoad, undefined, reject);
        else               textureLoader.load(path, onLoad, undefined, reject);
    });
}
const modelCache = {};
const gltfLoader = new GLTFLoader();


function loadModel(url) {
    if (modelCache[url]) {
        return modelCache[url].then(model => model.clone(true));
    }

    modelCache[url] = new Promise((resolve, reject) => {
        const ext = url.split('.').pop().toLowerCase();

        if (ext === 'glb' || ext === 'gltf') {
            gltfLoader.load(
                url,
                gltf => resolve(gltf.scene),
                undefined,
                reject
            );
        }
        // else if (ext === 'obj') {
        //     objLoader.load(
        //         url,
        //         obj => {
        //             obj.traverse(child => {
        //                 if (child.isMesh) {
        //                     child.material = new THREE.MeshStandardMaterial({
        //                         color: 0x8899bb,
        //                         roughness: 0.6,
        //                         metalness: 0.1
        //                     });
        //                 }
        //             });

        //             resolve(obj);
        //         },
        //         undefined,
        //         reject
        //     );
        // }
        // else if (ext === 'stl') {
        //     stlLoader.load(
        //         url,
        //         geometry => {
        //             geometry.computeVertexNormals();

        //             resolve(
        //                 new THREE.Mesh(
        //                     geometry,
        //                     new THREE.MeshStandardMaterial({
        //                         color: 0x8899bb,
        //                         roughness: 0.5,
        //                         metalness: 0.2
        //                     })
        //                 )
        //             );
        //         },
        //         undefined,
        //         reject
        //     );
        // }
        else {
            reject(new Error(`Unsupported format: ${ext}`));
        }
    });

    return modelCache[url].then(model => SkeletonUtils.clone(model));  
}

// ─── Scene ────────────────────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const renderer  = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.outputColorSpace  = THREE.SRGBColorSpace;
renderer.setClearColor(0x0f1117, 1);
container.appendChild(renderer.domElement);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 2000);
camera.position.set(-5, 0, 5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping  = true;
controls.dampingFactor  = 0.06;
controls.enablePan      = true;
controls.minDistance    = 0.1;
controls.maxDistance    = 500;

// ─── Lighting ─────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(5, 10, 5);
sun.castShadow = true;
scene.add(sun);
const fill = new THREE.DirectionalLight(0x8090ff, 0.4);
fill.position.set(-5, 2, -5);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffd580, 0.3);
rim.position.set(0, -3, -8);
scene.add(rim);

// ─── Grid ─────────────────────────────────────────────────────────────
const grid = new THREE.GridHelper(20, 40, 0x2a2f3d, 0x1e222b);
scene.add(grid);

// ─── State ────────────────────────────────────────────────────────────
let modelHead    = null;
let modelBody    = null;
let activeTexture = null;
let wireframeOn  = false;
let gridOn       = true;

// ─── Resize ───────────────────────────────────────────────────────────
function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(container);
resize();

// ─── Render loop ──────────────────────────────────────────────────────
renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
});

// ─── UI helpers ───────────────────────────────────────────────────────
function toast(msg, type = '') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'show ' + type;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.className = '', 3000);
}

function setLoading(on) {
    document.getElementById('loading-overlay').classList.toggle('visible', on);
}

function updateEmptyState() {
    document.getElementById('empty-state').style.display =
        (modelHead || modelBody) ? 'none' : 'flex';
}

function updateSceneInfo() {
    let objects = 0, tris = 0, verts = 0;
    [modelHead, modelBody].forEach(m => {
        if (!m) return;
        objects++;
        m.traverse(child => {
            if (!child.isMesh || !child.geometry) return;
            const g = child.geometry;
            tris  += g.index ? g.index.count / 3 : (g.attributes.position?.count || 0) / 3;
            verts += g.attributes.position?.count || 0;
        });
    });
    document.getElementById('info-objects').textContent = objects;
    document.getElementById('info-tris').textContent    = tris  ? Math.round(tris).toLocaleString()  : '—';
    document.getElementById('info-verts').textContent   = verts ? Math.round(verts).toLocaleString() : '—';
}

// ─── Camera ───────────────────────────────────────────────────────────
function fitCamera(target) {
    const box    = new THREE.Box3().setFromObject(target);
    const center = new THREE.Vector3();
    const sphere = new THREE.Sphere();
    box.getCenter(center);
    box.getBoundingSphere(sphere);
    const dist = sphere.radius * 6;
    camera.position.set(center.x, center.y, center.z + dist);
    controls.target.copy(center);
    controls.update();
}

// ─── Wireframe ────────────────────────────────────────────────────────
function applyWireframe(obj, on) {
    obj.traverse(child => {
        if (!child.isMesh) return;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => m.wireframe = on);
    });
}

// ─── Texture ──────────────────────────────────────────────────────────
function applyTextureToModel(model, tex) {
    if (!model || !tex) return;
    model.traverse(child => {
        if (!child.isMesh) return;
        child.material = new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
        child.material.needsUpdate = true;
    });
}

async function applyTexture(filename) {
    if (!filename) return;
    try {
        const tex = await loadTexture('/textures/' + filename);
        activeTexture = tex;
        if (modelHead) applyTextureToModel(modelHead, tex);
    } catch (e) {
        toast('Failed to load texture', 'error');
    }
}

// ─── Clear slot ───────────────────────────────────────────────────────
function clearSlot(slot) {
    if (slot === 'head') {
        if (modelHead) { scene.remove(modelHead); modelHead = null; }
        document.getElementById('slot-head-card').classList.remove('has-model', 'active');
        headSpin.reset();
    } else if (slot === 'body') {
        if (modelBody) { scene.remove(modelBody); modelBody = null; }
        document.getElementById('slot-body-card').classList.remove('has-model', 'active');
        bodySpin.reset();
    } else if (slot === 'texture') {
        activeTexture = null;
        if (modelHead) applyTextureToModel(modelHead, null);
        document.getElementById('slot-texture-card').classList.remove('has-model', 'active');
        textureSpin.reset();
    }
    updateEmptyState();
    updateSceneInfo();
}

// ─── Load slot ────────────────────────────────────────────────────────
async function loadSlot(slot, filename) {
    if (!filename) return;
    setLoading(true);
    try {
        const path =
        slot === 'body'
        ? '/body-models/' + filename
        : '/models/' + filename;

        const obj = await loadModel(path);
        if (wireframeOn) applyWireframe(obj, true);

        if (slot === 'head') {
            if (modelHead) scene.remove(modelHead);
            modelHead = obj;
            if (activeTexture) applyTextureToModel(modelHead, activeTexture);
            document.getElementById('slot-head-card').classList.add('has-model', 'active');
        } else if (slot === 'body') {
            if (modelBody) scene.remove(modelBody);
            modelBody = obj;
            // body uses embedded materials — no texture applied
            document.getElementById('slot-body-card').classList.add('has-model', 'active');
        }

        scene.add(obj);
        fitCamera(obj);
        updateEmptyState();
        updateSceneInfo();
        toast(`Loaded ${filename}`, 'success');
    } catch (e) {
        toast('Failed to load model: ' + e.message, 'error');
    } finally {
        setLoading(false);
    }
}

// ─── Spinbox factory ──────────────────────────────────────────────────
function initSpinbox(containerId, onChange) {
    let items = [];
    let index = -1;

    const el    = document.getElementById(containerId);
    const label = el.querySelector('.spin-label');
    const prev  = el.querySelector('.spin-prev');
    const next  = el.querySelector('.spin-next');

    function update() {
        if (items.length === 0) {
            label.textContent = '— none —';
            onChange(null);
            return;
        }
        label.textContent = items[index];
        onChange(items[index]);
    }

    prev.addEventListener('click', () => {
        if (!items.length) return;
        index = (index - 1 + items.length) % items.length;
        update();
    });

    next.addEventListener('click', () => {
        if (!items.length) return;
        index = (index + 1) % items.length;
        update();
    });

    return {
        setItems(list) {
            items = list;
            index = list.length ? 0 : -1;
            label.textContent = list.length ? list[0] : '— none —';
            // don't auto-fire onChange on populate — wait for user interaction
        },
        reset() {
            index = items.length ? 0 : -1;
            label.textContent = items.length ? items[0] : '— none —';
        },
        getValue() { return index >= 0 ? items[index] : null; }
    };
}

// ─── Spinbox instances ────────────────────────────────────────────────
const headSpin    = initSpinbox('spin-head',    f => f && loadSlot('head', f));
const textureSpin = initSpinbox('spin-texture', f => applyTexture(f));
const bodySpin    = initSpinbox('spin-body',    f => f && loadSlot('body', f));
let headModelFiles = [];
let bodyModelFiles = [];
let textureFiles = [];
// ─── List refresh ─────────────────────────────────────────────────────
async function refreshHeadModelList() {
    try {
        const res   = await fetch('/api/models');
        const files = await res.json();
        headModelFiles = files;
        headSpin.setItems(files);
        bodySpin.setItems(files);
        if (files.length === 0) toast('No models found in /models folder', 'error');
    } catch {
        toast('Could not reach server', 'error');
    }
}
async function refreshBodyModelList() {
    try {
        const res = await fetch('/api/body-models');
        const files = await res.json();

        bodyModelFiles = files;
        bodySpin.setItems(files);

    } catch {
        toast('Could not load body models', 'error');
    }
}
async function refreshTextureList() {
    try {
        const res   = await fetch('/api/textures');
        const files = await res.json();
        textureFiles = files;
        textureSpin.setItems(files);
        // Preload all textures in the background
        files.forEach(f => loadTexture('/textures/' + f).catch(() => {}));
    } catch {
        toast('Could not load textures', 'error');
    }
}

// ─── Button events ────────────────────────────────────────────────────
document.getElementById('clear-head').addEventListener('click',    () => clearSlot('head'));
document.getElementById('clear-texture').addEventListener('click', () => clearSlot('texture'));
document.getElementById('clear-body').addEventListener('click',    () => clearSlot('body'));

document.getElementById('btn-reset-view').addEventListener('click', () => {
    const target = modelHead || modelBody;
    if (target) fitCamera(target);
    else { camera.position.set(0, 0, 5); controls.target.set(0, 0, 0); controls.update(); }
});

document.getElementById('btn-refresh').addEventListener('click', () => {
    refreshHeadModelList();
    refreshTextureList();
});

document.getElementById('btn-wireframe').addEventListener('click', function () {
    wireframeOn = !wireframeOn;
    this.classList.toggle('active', wireframeOn);
    [modelHead, modelBody].forEach(m => m && applyWireframe(m, wireframeOn));
});
document.getElementById('btn-random').addEventListener('click', async () => {

    if (!bodyModelFiles.length || !headModelFiles.length || !textureFiles.length) return;
    const randomHead = headModelFiles[Math.floor(Math.random() * headModelFiles.length)];
    //const randomBody = bodyModelFiles[Math.floor(Math.random() * bodyModelFiles.length)];
    const randomTexture = textureFiles[Math.floor(Math.random() * textureFiles.length)];

    await loadSlot('head', randomHead);
    //await loadSlot('body', randomBody);
    await applyTexture(randomTexture);

});
document.getElementById('btn-grid').addEventListener('click', function () {
    gridOn = !gridOn;
    grid.visible = gridOn;
    this.classList.toggle('active', gridOn);
});

// ─── Init ─────────────────────────────────────────────────────────────
refreshHeadModelList();
refreshBodyModelList();
refreshTextureList();