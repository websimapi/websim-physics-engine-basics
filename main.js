import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PhysicsWorld, PhysicsBody } from './physics3d.js';

class Scene3D {
  constructor() {
    // Initialize properties
    this.meshes = [];
    this.bodies = [];
    this.physics = new PhysicsWorld();
    
    // Ensure DOM is loaded before initialization
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
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
    
    const container = document.getElementById('container');
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

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

    const buttons = {
      'spawnBox': () => this.spawn('box'),
      'spawnSphere': () => this.spawn('sphere'),
      'spawnCylinder': () => this.spawn('cylinder'),
      'toggleGravity': () => {
        const enabled = this.physics.world.gravity.y === 0;
        this.physics.setGravity(enabled);
      },
      'ragdoll': () => {
        this.bodies.forEach(body => body.applyRagdollForces());
      }
    };

    Object.entries(buttons).forEach(([id, callback]) => {
      const button = document.getElementById(id);
      if (button) {
        button.addEventListener('click', callback);
      }
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
    this.physics.addBody(body.body);
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
      const position = this.bodies[i].body.position;
      const quaternion = this.bodies[i].body.quaternion;
      
      this.meshes[i].position.copy(position);
      this.meshes[i].quaternion.copy(quaternion);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// Start the scene
new Scene3D();