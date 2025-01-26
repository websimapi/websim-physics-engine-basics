import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class PhysicsWorld {
  constructor() {
    this.objects = [];
    this.gravityEnabled = true;
    this.lastTime = 0;
    this.init();
  }

  init() {
    // Setup event listeners
    document.getElementById('spawnBox').addEventListener('click', () => this.spawn('box'));
    document.getElementById('spawnCircle').addEventListener('click', () => this.spawn('circle'));
    document.getElementById('toggleGravity').addEventListener('click', () => this.gravityEnabled = !this.gravityEnabled);
    document.getElementById('applyForce').addEventListener('click', () => this.applyRandomForces());
    
    // Start animation loop
    requestAnimationFrame(this.update.bind(this));
  }

  spawn(type) {
    const body = new RigidBody(
      Math.random() * 700 + 50,  // x
      50,                        // y
      type,                      // type
      Math.random() * 30 + 20    // size
    );
    
    body.element = body.createSVGElement();
    document.getElementById('world').appendChild(body.element);
    this.objects.push(body);
  }

  applyRandomForces() {
    this.objects.forEach(obj => {
      obj.applyForce(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
      obj.angularVelocity += (Math.random() - 0.5) * 2;
    });
  }

  update(time) {
    if (!this.lastTime) this.lastTime = time;
    const deltaTime = (time - this.lastTime) / 16; // Normalize to ~60fps
    
    // Update physics
    this.objects.forEach(obj => {
      obj.update(this.gravityEnabled);
      obj.updateElement();
    });
    
    this.lastTime = time;
    requestAnimationFrame(this.update.bind(this));
  }
}

class PhysicsBody {
  constructor(position, type, size) {
    this.position = position;
    this.type = type;
    this.size = size;
  }

  applyRagdollForces() {
    // Apply ragdoll forces to the body
  }
}

class RigidBody {
  constructor(x, y, type, size) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = size;
    this.element = null;
    this.angularVelocity = 0;
  }

  createSVGElement() {
    // Create an SVG element for the rigid body
  }

  update(gravityEnabled) {
    // Update the rigid body's position and velocity
  }

  updateElement() {
    // Update the rigid body's SVG element
  }

  applyForce(x, y) {
    // Apply a force to the rigid body
  }
}

class Scene3D {
  constructor() {
    this.meshes = [];
    this.bodies = [];
    this.init();
  }

  init() {
    // Three.js setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.getElementById('container').appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Physics
    this.physics = new PhysicsWorld();

    // Lighting
    this.setupLights();

    // Ground
    this.createGround();

    // Event listeners
    this.setupEventListeners();

    // Animation loop
    this.lastTime = 0;
    this.animate();
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  createGround() {
    const geometry = new THREE.PlaneGeometry(20, 20);
    const material = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.7,
      metalness: 0.3
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize());

    document.getElementById('spawnBox').addEventListener('click', () => this.spawn('box'));
    document.getElementById('spawnSphere').addEventListener('click', () => this.spawn('sphere'));
    document.getElementById('spawnCylinder').addEventListener('click', () => this.spawn('cylinder'));
    document.getElementById('toggleGravity').addEventListener('click', () => {
      const enabled = this.physics.world.gravity.y === 0;
      this.physics.setGravity(enabled);
    });
    document.getElementById('ragdoll').addEventListener('click', () => {
      this.bodies.forEach(body => body.applyRagdollForces());
    });
  }

  spawn(type) {
    const position = {
      x: (Math.random() - 0.5) * 5,
      y: 5 + Math.random() * 5,
      z: (Math.random() - 0.5) * 5
    };

    let geometry, size;
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.3
    });

    switch (type) {
      case 'box':
        size = { x: 1, y: 1, z: 1 };
        geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        break;
      case 'sphere':
        const radius = 0.5;
        size = { radius };
        geometry = new THREE.SphereGeometry(radius, 32, 32);
        break;
      case 'cylinder':
        const cylRadius = 0.5;
        const height = 1;
        size = { radius: cylRadius, height };
        geometry = new THREE.CylinderGeometry(cylRadius, cylRadius, height, 32);
        break;
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.meshes.push(mesh);

    const body = new PhysicsBody(position, type, size);
    this.physics.addBody(body);
    this.bodies.push(body);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate(time = 0) {
    requestAnimationFrame((t) => this.animate(t));

    const deltaTime = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // Update physics
    this.physics.update(deltaTime);

    // Update mesh positions
    for (let i = 0; i < this.bodies.length; i++) {
      const position = this.bodies[i].position;
      const quaternion = this.bodies[i].quaternion;
      
      this.meshes[i].position.copy(position);
      this.meshes[i].quaternion.copy(quaternion);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// Start the scene
new Scene3D();