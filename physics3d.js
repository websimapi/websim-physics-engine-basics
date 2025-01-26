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
export class RagdollCharacter {
  constructor(world, position) {
    this.world = world;
    this.bodies = [];
    this.constraints = [];
    this.moveForce = 50;
    this.jumpForce = 250;
    this.isGrounded = false;
    this.createRagdoll(position);
  }

  createRagdoll(position) {
    // Create torso
    const torsoShape = new CANNON.Box(new CANNON.Vec3(0.3, 0.5, 0.2));
    this.torso = new CANNON.Body({
      mass: 5,
      position: new CANNON.Vec3(position.x, position.y + 2, position.z),
      shape: torsoShape,
    });
    
    // Create head (sphere)
    const headShape = new CANNON.Sphere(0.25);
    this.head = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(position.x, position.y + 3, position.z),
      shape: headShape,
    });

    // Create legs
    this.leftLeg = this.createLimb(position, -0.2, 0.3, 0.15, 0.5);
    this.rightLeg = this.createLimb(position, 0.2, 0.3, 0.15, 0.5);

    // Create arms
    this.leftArm = this.createLimb(position, -0.4, 0.15, 0.15, 0.4);
    this.rightArm = this.createLimb(position, 0.4, 0.15, 0.15, 0.4);

    // Add all bodies to the world
    this.bodies = [this.torso, this.head, this.leftLeg, this.rightLeg, this.leftArm, this.rightArm];
    this.bodies.forEach(body => this.world.addBody(body));

    // Connect head to torso
    this.createConstraint(this.torso, this.head, {
      pivotA: new CANNON.Vec3(0, 0.5, 0),
      pivotB: new CANNON.Vec3(0, -0.25, 0),
      maxForce: 50
    });

    // Connect limbs to torso
    this.createConstraint(this.torso, this.leftLeg, {
      pivotA: new CANNON.Vec3(-0.2, -0.5, 0),
      pivotB: new CANNON.Vec3(0, 0.25, 0),
      maxForce: 100
    });
    this.createConstraint(this.torso, this.rightLeg, {
      pivotA: new CANNON.Vec3(0.2, -0.5, 0),
      pivotB: new CANNON.Vec3(0, 0.25, 0),
      maxForce: 100
    });
    this.createConstraint(this.torso, this.leftArm, {
      pivotA: new CANNON.Vec3(-0.3, 0.3, 0),
      pivotB: new CANNON.Vec3(0, 0.2, 0),
      maxForce: 50
    });
    this.createConstraint(this.torso, this.rightArm, {
      pivotA: new CANNON.Vec3(0.3, 0.3, 0),
      pivotB: new CANNON.Vec3(0, 0.2, 0),
      maxForce: 50
    });

    // Add contact detection
    this.bodies.forEach(body => {
      body.addEventListener('collide', () => {
        this.isGrounded = true;
      });
    });
  }

  createLimb(position, offsetX, width, depth, height) {
    const shape = new CANNON.Box(new CANNON.Vec3(width, height, depth));
    return new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(
        position.x + offsetX,
        position.y + height,
        position.z
      ),
      shape: shape
    });
  }

  createConstraint(bodyA, bodyB, options) {
    const constraint = new CANNON.PointToPointConstraint(
      bodyA, options.pivotA,
      bodyB, options.pivotB,
      options.maxForce
    );
    this.world.addConstraint(constraint);
    this.constraints.push(constraint);
  }

  move(direction) {
    const force = new CANNON.Vec3(
      direction.x * this.moveForce,
      0,
      direction.z * this.moveForce
    );
    this.torso.applyForce(force, this.torso.position);
  }

  jump() {
    if (this.isGrounded) {
      const force = new CANNON.Vec3(0, this.jumpForce, 0);
      this.torso.applyForce(force, this.torso.position);
      this.isGrounded = false;
    }
  }

  getPositions() {
    return this.bodies.map(body => ({
      position: body.position,
      quaternion: body.quaternion
    }));
  }
}