import './css/styles.css'
import './js/kontra'

function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

kontra.init()
let sprites = [];

let ship = kontra.sprite({
    x: 80,
    y: 80,
    width: 6,  // we'll use this later for collision detection
    rotation: 0,
    dashFrames: 0,
    render() {
        this.context.save();
        this.context.translate(this.x, this.y);
        this.context.rotate(degreesToRadians(this.rotation));

        this.context.beginPath();
        // draw a triangle
        this.context.moveTo(-3, -5);
        this.context.lineTo(12, 0);
        this.context.lineTo(-3, 5);
        
        this.context.closePath();
        this.context.stroke();
        this.context.restore();
    },
    update() {
        this.dx = this.dy = 0;
        if (kontra.keys.pressed('w')) { this.dy += -3; }
        if (kontra.keys.pressed('s')) { this.dy += 3; }
        if (kontra.keys.pressed('a')) { this.dx += -3; }
        if (kontra.keys.pressed('d')) { this.dx += 3; }
        if (this.dx && this.dy) {
            this.dx *= 0.707;
            this.dy *= 0.707;
        }
        if (this.dy || this.dx) this.rotation = Math.atan2(this.dy, this.dx) * 180 / Math.PI; // Point the ship using dx and dy
        if (this.dashFrames > 0 ) {
            this.dx *= (Math.pow(this.dashFrames,2)+120)/120;
            this.dy *= (Math.pow(this.dashFrames,2)+120)/120;
            this.dashFrames--;
        }
        if (this.iFrames > 0) {
            this.iFrames--;
        }
        this.advance()
    }
});
sprites.push(ship);
kontra.keys.bind('space', function () {
  if (this.dashFrames > 0) return;
  this.dashFrames = 30
  this.iFrames = 30
}.bind(ship))
let sprite = kontra.sprite({
  x: 100,        // starting x,y position of the sprite
  y: 80,
  color: 'red',  // fill color of the sprite rectangle
  width: 20,     // width and height of the sprite rectangle
  height: 40,
  dx: 3          // move the sprite 2px to the right every frame
});
sprites.push(sprite)

let loop = kontra.gameLoop({  // create the main game loop
  update: function() {        // update the game state
    for(let i=0; i < sprites.length; i++) {
      sprites[i].update();
  }

    // wrap the sprites position when it reaches
    // the edge of the screen
    if (sprite.x > kontra.canvas.width) {
      sprite.x = -sprite.width;
  }
},
  render: function() {        // render the game state
    for (let i=0; i<sprites.length; i++){
      sprites[i].render();
  }
}
});

loop.start();    // start the game