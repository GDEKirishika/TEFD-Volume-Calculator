// Global variables for Three.js
let scene, camera, renderer, shapeGroup;

// Initialize 3D scene
function setupScene() {
    const canvas = document.getElementById('canvas3d');
    const container = canvas.parentElement;
    
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a2a3e);

    // Setup camera
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(15, 12, 15);

    // Create renderer with canvas
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        canvas: canvas,
        alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);

    // Add lights to scene
    addLights();

    // Setup mouse and keyboard controls
    setupControls();

    // Handle window resize
    window.addEventListener('resize', handleResize);

    // Start animation loop
    animate();
}

// Add lighting to the scene
function addLights() {
    // General light (ambient)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Directional light (like sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 15, 10);
    scene.add(directionalLight);

    // Purple accent light
    const pointLight = new THREE.PointLight(0xff00ff, 0.5);
    pointLight.position.set(-10, 5, 10);
    scene.add(pointLight);
}

// Handle mouse interactions for rotating and zooming
function setupControls() {
    let isRotating = false;
    let lastMouse = { x: 0, y: 0 };

    // Mouse down - start rotating
    renderer.domElement.addEventListener('mousedown', (e) => {
        isRotating = true;
        lastMouse = { x: e.clientX, y: e.clientY };
    });

    // Mouse move - rotate object
    renderer.domElement.addEventListener('mousemove', (e) => {
        if (isRotating && shapeGroup) {
            const deltaX = e.clientX - lastMouse.x;
            const deltaY = e.clientY - lastMouse.y;
            
            shapeGroup.rotation.y += deltaX * 0.01;
            shapeGroup.rotation.x += deltaY * 0.01;
            
            lastMouse = { x: e.clientX, y: e.clientY };
        }
    });

    // Mouse up - stop rotating
    renderer.domElement.addEventListener('mouseup', () => {
        isRotating = false;
    });

    // Mouse wheel - zoom in/out
    renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        camera.position.multiplyScalar(1 + e.deltaY * 0.001);
    });
}

// Handle window resize
function handleResize() {
    const container = document.getElementById('canvas3d').parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// Create the frustum (cone-like shape) geometry
function createFrustumMesh(h, a1, b1, a2, b2, twist) {
    const geometry = new THREE.LatheGeometry(
        createEllipticCurve(a1, b1, a2, b2, h), 
        64
    );
    
    // Apply twist
    const twistRad = (twist * Math.PI) / 180;
    const positions = geometry.attributes.position;
    const array = positions.array;
    
    for (let i = 0; i < array.length; i += 3) {
        const x = array[i];
        const y = array[i + 1];
        const z = array[i + 2];
        const angle = Math.atan2(z, x);
        const dist = Math.sqrt(x * x + z * z);
        const yNorm = (y + h / 2) / h; // 0 to 1
        const twist = yNorm * twistRad;
        
        array[i] = dist * Math.cos(angle + twist);
        array[i + 2] = dist * Math.sin(angle + twist);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({
        color: 0x4facfe,
        metalness: 0.3,
        roughness: 0.7,
        side: THREE.DoubleSide
    });
    
    return new THREE.Mesh(geometry, material);
}

// Helper function to create elliptic profile curve for lathe
function createEllipticCurve(a1, b1, a2, b2, h) {
    const curve = [];
    const segments = 32;
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments; // 0 to 1
        // Interpolate between bottom and top ellipse
        const a = a1 + (a2 - a1) * t;
        const b = b1 + (b2 - b1) * t;
        const y = -h / 2 + h * t; // Bottom to top
        
        curve.push(new THREE.Vector2(a, y));
    }
    
    return curve;
}

// Create the dome (hemisphere) geometry
function createDomeMesh(radius, a2, b2) {
    const vertices = [];
    const indices = [];
    const segments = 32;

    // Top point of dome
    vertices.push(0, radius / 2, 0);

    // Bottom ring points
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = a2 * Math.cos(angle);
        const z = b2 * Math.sin(angle);
        vertices.push(x, 0, z);
    }

    // Connect top point to bottom ring
    for (let i = 0; i < segments; i++) {
        indices.push(0, i + 2, i + 1);
    }

    // Create geometry and material
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
        color: 0x00f2fe,
        metalness: 0.5,
        roughness: 0.6,
    });

    return new THREE.Mesh(geometry, material);
}

// Create and display the 3D shape
function drawShape(h, a1, b1, a2, b2, r, twist) {
    // Remove old shape if it exists
    if (shapeGroup) {
        scene.remove(shapeGroup);
    }

    // Create container for all parts
    shapeGroup = new THREE.Group();

    // Add frustum to the group
    const frustum = createFrustumMesh(h, a1, b1, a2, b2, twist);
    shapeGroup.add(frustum);

    // Add dome on top
    const dome = createDomeMesh(r, a2, b2);
    dome.position.y = h / 2;
    shapeGroup.add(dome);

    // Add the group to the scene
    scene.add(shapeGroup);

    // Auto-fit camera to see the shape
    const box = new THREE.Box3().setFromObject(shapeGroup);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180); // Convert to radians
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5; // Add some padding

    camera.position.set(center.x + cameraZ * 0.6, center.y + cameraZ * 0.4, center.z + cameraZ);
    camera.lookAt(center.x, center.y, center.z);
}

// Calculate volume using the formula
function calculateVolume(h, a1, b1, a2, b2, r, twist) {
    // Volume of elliptical frustum
    const areaBottom = Math.PI * a1 * b1;
    const areaTop = Math.PI * a2 * b2;
    const volumeFrustum = (h / 3.0) * (areaBottom + Math.sqrt(areaBottom * areaTop) + areaTop);

    // Volume of dome (spherical cap)
    const domHeight = r / 2.0;
    const volumeDome = (Math.PI * domHeight * domHeight * (3 * r - domHeight)) / 3.0;

    // Total volume
    return volumeFrustum + volumeDome;
}

// Main calculate function - called when button is clicked
function calculate() {
    // Get input values from form
    const h = parseFloat(document.getElementById('h').value);
    const a1 = parseFloat(document.getElementById('a1').value);
    const b1 = parseFloat(document.getElementById('b1').value);
    const a2 = parseFloat(document.getElementById('a2').value);
    const b2 = parseFloat(document.getElementById('b2').value);
    const r = parseFloat(document.getElementById('r').value);
    const twist = parseFloat(document.getElementById('twist').value);

    // Check if all inputs are valid numbers
    if (isNaN(h) || isNaN(a1) || isNaN(b1) || isNaN(a2) || isNaN(b2) || isNaN(r)) {
        document.getElementById('result').innerText = '❌ Please enter valid numbers.';
        return;
    }

    // Check if all values are positive
    if (h <= 0 || a1 <= 0 || b1 <= 0 || a2 <= 0 || b2 <= 0 || r <= 0) {
        document.getElementById('result').innerText = '❌ All measurements must be positive.';
        return;
    }

    // Calculate volume
    const volume = calculateVolume(h, a1, b1, a2, b2, r, twist);

    // Display result
    document.getElementById('result').innerHTML = `<strong>Volume: ${volume.toFixed(2)} cubic units</strong>`;

    // Update 3D visualization
    drawShape(h, a1, b1, a2, b2, r, twist);
}

// Animation loop - runs continuously to render the scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Start the application when page loads
window.addEventListener('load', () => {
    setupScene();
    // Calculate with default values to show shape on startup
    setTimeout(calculate, 100);
});