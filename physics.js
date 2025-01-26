// Physics constants
const GRAVITY = 0.5;
const FRICTION = 0.98;
const BOUNCE = 0.7;
const MIN_VELOCITY = 0.01;

export class RigidBody {
  constructor(x, y, type = 'box', size = 40) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = size;
    this.velocity = { x: 0, y: 0 };
    this.rotation = 0;
    this.angularVelocity = 0;
    this.mass = size;
    this.element = null;
    this.isStatic = false;
  }

  applyForce(fx, fy) {
    this.velocity.x += fx / this.mass;
    this.velocity.y += fy / this.mass;
  }

  applyGravity(gravityEnabled) {
    if (!this.isStatic && gravityEnabled) {
      this.velocity.y += GRAVITY;
    }
  }

  update(gravityEnabled) {
    if (this.isStatic) return;

    this.applyGravity(gravityEnabled);
    
    // Apply velocity
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    
    // Apply rotation
    this.rotation += this.angularVelocity;
    
    // Apply friction
    this.velocity.x *= FRICTION;
    this.velocity.y *= FRICTION;
    this.angularVelocity *= FRICTION;

    // Floor collision
    if (this.y + this.size > 550) {
      this.y = 550 - this.size;
      this.velocity.y = -this.velocity.y * BOUNCE;
      
      // Apply horizontal friction when on ground
      this.velocity.x *= 0.95;
    }

    // Wall collisions
    if (this.x < 0) {
      this.x = 0;
      this.velocity.x = -this.velocity.x * BOUNCE;
    }
    if (this.x + this.size > 800) {
      this.x = 800 - this.size;
      this.velocity.x = -this.velocity.x * BOUNCE;
    }

    // Stop if moving very slowly
    if (Math.abs(this.velocity.x) < MIN_VELOCITY) this.velocity.x = 0;
    if (Math.abs(this.velocity.y) < MIN_VELOCITY) this.velocity.y = 0;
    if (Math.abs(this.angularVelocity) < MIN_VELOCITY) this.angularVelocity = 0;
  }

  createSVGElement() {
    const ns = "http://www.w3.org/2000/svg";
    let element;
    
    if (this.type === 'box') {
      element = document.createElementNS(ns, "rect");
      element.setAttribute("width", this.size);
      element.setAttribute("height", this.size);
    } else {
      element = document.createElementNS(ns, "circle");
      element.setAttribute("r", this.size / 2);
      element.setAttribute("cx", this.size / 2);
      element.setAttribute("cy", this.size / 2);
    }
    
    element.setAttribute("fill", `hsl(${Math.random() * 360}, 70%, 50%)`);
    return element;
  }

  updateElement() {
    if (!this.element) return;
    
    const transform = `translate(${this.x}px, ${this.y}px) rotate(${this.rotation}deg)`;
    this.element.style.transform = transform;
  }
}