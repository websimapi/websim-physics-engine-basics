import * as CANNON from 'cannon-es';

export class PhysicsBody {
  constructor(position, type = 'box', size = { x: 1, y: 1, z: 1 }) {
    this.position = position;
    this.type = type;
    this.size = size;
    this.body = this.createBody();
  }

  createBody() {
    let shape;
    const material = new CANNON.Material({
      friction: 0.3,
      restitution: 0.7
    });

    switch (this.type) {
      case 'box':
        shape = new CANNON.Box(new CANNON.Vec3(
          this.size.x / 2,
          this.size.y / 2,
          this.size.z / 2
        ));
        break;
      case 'sphere':
        shape = new CANNON.Sphere(this.size.radius);
        break;
      case 'cylinder':
        shape = new CANNON.Cylinder(
          this.size.radius,
          this.size.radius,
          this.size.height,
          16
        );
        break;
      default:
        shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    }

    const body = new CANNON.Body({
      mass: 5,
      position: new CANNON.Vec3(
        this.position.x,
        this.position.y,
        this.position.z
      ),
      shape: shape,
      material: material
    });

    body.angularVelocity.set(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    );

    return body;
  }

  applyForce(force, worldPoint) {
    this.body.applyForce(
      new CANNON.Vec3(force.x, force.y, force.z),
      worldPoint ? new CANNON.Vec3(worldPoint.x, worldPoint.y, worldPoint.z) : this.body.position
    );
  }

  applyRagdollForces() {
    const magnitude = 100;
    this.applyForce({
      x: (Math.random() - 0.5) * magnitude,
      y: (Math.random() - 0.5) * magnitude,
      z: (Math.random() - 0.5) * magnitude
    });
    
    this.body.angularVelocity.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );
  }
}

export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    
    this.world.defaultContactMaterial.friction = 0.3;
    this.world.defaultContactMaterial.restitution = 0.7;
    
    this.createGround();
  }

  createGround() {
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: groundShape,
      material: new CANNON.Material()
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);
  }

  update(deltaTime) {
    this.world.step(1 / 60, deltaTime, 3);
  }

  setGravity(enabled) {
    this.world.gravity.set(
      0,
      enabled ? -9.82 : 0,
      0
    );
  }

  addBody(body) {
    this.world.addBody(body);
  }
}