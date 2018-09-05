import './css/styles.css'
import './js/kontra'
import { Note, Sequence } from 'tinymusic'

// set the playback tempo (120 beats per minute)
var tempo = 120;

function beatsToFrames(beats) {
    // beats / bpm * seconds * frames
    return beats / tempo * 60 * 60;
}

function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

function lerp (min, max, t) {
    return min * (1-t) + max * t
}

function damp (a, b, lambda, dt) {
    return lerp(a, b, 1 - Math.exp(-lambda * dt))
}

function circleCollidesWith(object) {
    // assumes object is a circle
    let r = this.radius || this.height/2;
    let dx = this.x - object.x;
    let dy = this.y - object.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    return distance < r + object.radius;
}

function lineCollidesWith(object) {
    // assume object is a circle
    // first do a circle collision to check height
    if (!circleCollidesWith.call(this, object)) return false

    // find the shortest distance to a line
    // slope a/b is also rotation 
    let a = Math.cos(degreesToRadians(this.rotation)) / Math.sin(degreesToRadians(this.rotation))
    let b = 1
    // line ax + by + c = 0
    let c = -1 * (a * this.x + this.y)

    let x0 = object.x
    let y0 = object.y

    let d = Math.abs(a*x0 + b*y0 + c) / Math.sqrt(a*a+b*b)
    return d < this.width/2 + object.radius
}

// create a new Web Audio API context
var ac = new AudioContext(),
    when = ac.currentTime;


// create some notes ('<Note Name> <Beat Length>')
// q = quarter note, h = half note (more on that later)
var drone = ['F4 ' + 16*8],
    run = [
    '- 4' // Start with 4 beats of silence
],
    bass = [
    '- 32',
    'F2 8',
    'Eb2 8',
    'Bb1 8',
    'Db2 8',
    'F2 8', // Repeated twice
    'Eb2 8',
    'Bb1 8',
    'Db2 8',
    'F2 8',
    'Eb2 8',
    'Bb1 8',
    'Db2 8'
], runNotes = [
    'F3 ',
    'Ab3 ',
    'F4 ',
    'Ab4 ',
    'F5 ',
    'Ab5 ',
    'F5 ',
    'Ab4 ',
    'F4 ',
    'Ab3 '
]

let factories = [];
let sprites = [];

var spinnyLine = {
    type: 'enemy',
    width: 35,
    height: 90,
    color: '#909',
    ttl: Infinity,
    x: 1280/2,
    y: 720/2,
    rotation: 0,
    ticks: 0,
    collidesWith: lineCollidesWith,
    update: function (dt) {
        this.ticks++;
        // This needs to go 135 degrees 8 beats
        // 16.875 degrees/beat * beats/frame
        this.rotation += ( this.ticks > beatsToFrames(36) ) ? 16.875/beatsToFrames(1) : 8.4375/beatsToFrames(1);

        this.height += 2.1;
        if (this.ticks > beatsToFrames(4)) this.height = 1800;
        this.advance()
    },
    render: function () {
        this.context.save();
        this.context.translate(this.x, this.y);
        this.context.rotate(degreesToRadians(this.rotation));
        this.context.fillRect(-1*this.width/2, -this.height/2, this.width, this.height);
        this.context.restore();
    }
}

// Speed up the run over time
var tearFactory = kontra.sprite({
    tears: [],
    type: 'factory',
    ttl: Infinity,
    start: function () {
        this.tears = runSeq.notes.map(note => note.duration*60/tempo)
        factories.push(this)
    },
    update: function (dt) {
        this.tears[0] -= dt
        while (this.tears.length && this.tears[0] <= 0) {
            for (let i = -1; i < 2; i=i+2) {
                let tear = kontra.sprite({
                    type: 'enemy',
                    width:12,
                    height:12,
                    color: '#909',
                    dx: i * (Math.random()*6+3),
                    ddy:.3,
                    x: (i*30) + kontra.canvas.width/2-6,
                    y:kontra.canvas.height/2-6,
                    ttl: 49,
                    update: function (dt) {
                        this.advance()
                    }
                })
                sprites.push(tear)
            }
            let timeRemaining = this.tears.shift()
            this.tears[0] -= timeRemaining
            kitty.width += Math.random()*20 + 20;
            kitty.height += Math.random()*20 + 20;
        }
    }
})
for (var i = 0; i < 440; i++) {
    let dur = Math.log10((i+1+7.291)/7.291)*360; // 
    let note = runNotes[i%runNotes.length] + (tempo/dur)
    run.push(note)
}
// create a new droneSeq
var droneSeq = new Sequence( ac, tempo, drone ),
    runSeq = new Sequence( ac, tempo, run),
    bassSeq = new Sequence( ac, tempo, bass)
runSeq.staccato = 0.55;

droneSeq.gain.gain.value = 0.05;
runSeq.gain.gain.value = 0.1;
bassSeq.gain.gain.value = 0.05;

droneSeq.createCustomWave([1.0, 0.11, 0.88, 0.55, 0.77, 0.33, 0.33, 0.33, 0.44, 0.11, 0.22]);
runSeq.waveType = 'triangle'

// disable looping
bassSeq.loop = false;
droneSeq.loop = false;
runSeq.loop = false;


kontra.init()

let ship = kontra.sprite({
    x: 80,
    y: 80,
    width: 12,
    height: 12,
    radius: 6, // we'll use this later for collision detection
    rotation: 0,
    ttl: Infinity,
    dashFrames: 0,
    iFrames: 0,
    stunFrames: 0,
    health: 7,
    color: 'yellow',
    update: function(dt) {
        if (this.stunFrames > 0) {
            this.stunFrames--;
            this.rotation += 4;
        } else {
            this.dx = this.dy = 0;
            if (kontra.keys.pressed('w')) { this.dy += -3; }
            if (kontra.keys.pressed('s')) { this.dy += 3; }
            if (kontra.keys.pressed('a')) { this.dx += -3; }
            if (kontra.keys.pressed('d')) { this.dx += 3; }
            if (this.dx && this.dy) {
                this.dx *= 0.707;
                this.dy *= 0.707;
            }
            if (this.dy || this.dx) {
                this.rotation = Math.atan2(this.dy, this.dx) * 180 / Math.PI;
                // Shoot particles out the back
                for (let i = 0; i < (this.dashFrames/10)+1; i++) {
                    let particle = kontra.sprite({
                        type:'particle',
                        x: this.x,
                        y: this.y,
                        dx: this.dx * -1 + Math.random()*4-2,
                        dy: this.dy * -1 + Math.random()*4-2,
                        ttl: 8,
                        width:2,
                        height:2,
                        color:'white',
                        update: function (dt) {
                            this.advance()
                        }
                    })
                    sprites.push(particle)
                }
            }
        }
        if (this.dashFrames > 0 ) {
            this.dx *= (Math.pow(this.dashFrames,2)+120)/120;
            this.dy *= (Math.pow(this.dashFrames,2)+120)/120;
            this.dashFrames--;
        }
        if (this.iFrames > 0) {
            this.iFrames--;
        }
        this.advance()
    },
    render() {
        this.context.save();
        this.context.strokeStyle = 'yellow';
        this.context.fillStyle = 'yellow';
        this.context.translate(this.x, this.y);
        this.context.rotate(degreesToRadians(this.rotation));

        this.context.beginPath();
        // draw a triangle
        this.context.moveTo(-6, -6);
        this.context.lineTo(12, 0);
        this.context.lineTo(-6, 6);
        
        this.context.closePath();
        this.context.stroke();
        this.context.fill();
        this.context.restore();
    }
});
sprites.push(ship);

let kitty = kontra.sprite({

    x:kontra.canvas.width/2 - 60,
    y:kontra.canvas.height/2 - 60,
    type: 'enemy',
    width:120,
    height:120,
    ttl: Infinity,
    color: '#909',
    update: function (dt) {
        this.width = damp(this.width, 120, 12, dt)
        this.height = damp(this.height, 120, 12, dt)
        this.x = (kontra.canvas.width - this.width)/2
        this.y = (kontra.canvas.height - this.height)/2
        this.advance()
    }
})
sprites.push(kitty)

let conductor = kontra.gameLoop({
    // bpm -> fps
    fps: tempo/60,
    render: function() {},
    clearCanvas: false,
    update: function(dt) {
        if (this.beat === undefined) { this.beat = -1 }
        this.beat++;
        console.log("beat " + Math.floor(1 + this.beat / 4) + '-' + Math.floor(1 + this.beat % 4)  + " (" + this.beat + ")");
        if (this.beat === 0) {
            tearFactory.start();
            droneSeq.play();
            runSeq.play();
            bassSeq.play();
        }
        if (this.beat == 28 || this.beat === 36 || this.beat === 44 || this.beat === 52) {
            sprites.push(kontra.sprite(spinnyLine))
        }
    },
})

let loop = kontra.gameLoop({  // create the main game loop
    update: function(dt) {        // update the game state
        factories.map(factory => {
            factory.update(dt)
        })
        factories = factories.filter(factory => factory.isAlive());
        sprites.map(sprite => {
            sprite.update(dt);
            // Wrap the stage bc why not
            sprite.x = (sprite.x + kontra.canvas.width) % kontra.canvas.width
            sprite.y = (sprite.y + kontra.canvas.height) % kontra.canvas.height
            if (!ship.iFrames && sprite.type === 'enemy' && sprite.collidesWith(ship)) {
                ship.stunFrames = 45;
                ship.iFrames = 60;
                let angle = Math.random()*2*Math.PI;
                ship.dx = Math.cos(angle)*8;
                ship.dy = Math.sin(angle)*8;
            }
        })
        sprites = sprites.filter(sprite => sprite.isAlive());
    },
    render: function() {        // render the game state
        sprites.map(sprite => sprite.render())
        
    }   
});

kontra.keys.bind('space', function () {
    if (this.dashFrames > 0) return;
    if (this.stunFrames > 0) return;
    this.dashFrames = 30
    this.iFrames = 30
    if (loop.isStopped) {
        startGame()
    }
}.bind(ship))

let startGame = function() {
    // Game
    loop.start();
    conductor.beat = -1;
    conductor.start();
    // Music
}
