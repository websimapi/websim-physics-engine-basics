import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PhysicsWorld, PhysicsBody, RagdollCharacter } from './physics3d.js';

class Scene3D {
  constructor() {
    this.meshes = [];
    this.bodies = [];
    this.physics = new PhysicsWorld();
    this.keys = {};
    this.ragdollMeshes = [];
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
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

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.setupLights();
    this.createGround();
    this.setupEventListeners();

    this.character = new RagdollCharacter(this.physics.world, { x: 0, y: 2, z: 0 });
    this.createRagdollMeshes();

    window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

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

  createRagdollMeshes() {
    const materials = {
      torso: new THREE.MeshStandardMaterial({ color: 0xff6b6b }),
      head: new THREE.MeshStandardMaterial({ color: 0xffd93d }),
      limb: new THREE.MeshStandardMaterial({ color: 0x4d96ff })
    };

    const torsoGeom = new THREE.BoxGeometry(0.6, 1, 0.4);
    const torsoMesh = new THREE.Mesh(torsoGeom, materials.torso);
    
    const headGeom = new THREE.SphereGeometry(0.25, 16, 16);
    const headMesh = new THREE.Mesh(headGeom, materials.head);
    
    const limbGeom = new THREE.BoxGeometry(0.3, 0.8, 0.3);
    const limbs = Array(4).fill(null).map(() => 
      new THREE.Mesh(limbGeom, materials.limb)
    );

    this.ragdollMeshes = [torsoMesh, headMesh, ...limbs];
    this.ragdollMeshes.forEach(mesh => {
      mesh.castShadow = true;
      this.scene.add(mesh);
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
      default:
        size = { x: 1, y: 1, z: 1 };
        geometry = new THREE.BoxGeometry(1, 1, 1);
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

  handleInput(deltaTime) {
    const moveDirection = new THREE.Vector3();
    
    if (this.keys['w']) moveDirection.z -= 1;
    if (this.keys['s']) moveDirection.z += 1;
    if (this.keys['a']) moveDirection.x -= 1;
    if (this.keys['d']) moveDirection.x += 1;
    if (this.keys[' ']) this.character.jump();

    if (moveDirection.length() > 0) {
      moveDirection.normalize();
      this.character.move(moveDirection);
    }
  }

  animate(time = 0) {
    requestAnimationFrame((t) => this.animate(t));

    const deltaTime = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.handleInput(deltaTime);
    this.physics.update(deltaTime);

    for (let i = 0; i < this.bodies.length; i++) {
      const position = this.bodies[i].body.position;
      const quaternion = this.bodies[i].body.quaternion;
      
      this.meshes[i].position.copy(position);
      this.meshes[i].quaternion.copy(quaternion);
    }

    const bodyPositions = this.character.getPositions();
    bodyPositions.forEach((data, index) => {
      this.ragdollMeshes[index].position.copy(data.position);
      this.ragdollMeshes[index].quaternion.copy(data.quaternion);
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

!function() {
  new Scene3D();
}();