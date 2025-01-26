import { RigidBody } from './physics.js';

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

// Start simulation
new PhysicsWorld();