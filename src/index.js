import './css/styles.css'
import './js/kontra'
import { Note, Sequence } from 'tinymusic'

// Constants
var tempo = 120;

// Utility functions
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

// Music
var ac = new AudioContext()

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
], closeToMe = [
    '- 1.75',
    'C5 .5',
    '- .25',
    'Ab4 .5',
    'Bb4 .5',
    'Ab4 .5',
], closeToMe2 = [
    '- 1.75',
    'C5 .5',
    '- .25',
    'Eb5 .5',
    'Bb4 .5',
    'Ab4 .5'
], kick = [
    'G2 0.01',
    'C2 0.19',
    '-  0.80',
    'G2 0.01',
    'C2 0.19',
    '-  0.80',
    'G2 0.01',
    'C2 0.19',
    '-  0.80',
    'G2 0.01',
    'C2 0.19',
    '-  0.80',
    'G2 0.01',
    'C2 0.19',
    '-  0.80',
    'G2 0.01',
    'C2 0.19',
    '-  0.80',
    'G2 0.01',
    'C2 0.19',
    '-  0.80',

    'G2 0.01',
    'C2 0.19',
    '-  0.40',
    'G2 0.01',
    'C2 0.19',
    '-  0.20'
], snare = [
    
]

for (var i = 0; i < 440; i++) {
    let dur = Math.log10((i+1+7.291)/7.291)*360; // 
    let note = runNotes[i%runNotes.length] + (tempo/dur)
    run.push(note)
}

// create a new droneSeq
var droneSeq = new Sequence( ac, tempo, drone ),
    runSeq = new Sequence( ac, tempo, run),
    bassSeq = new Sequence( ac, tempo, bass),
    closeSeq = new Sequence( ac, tempo, closeToMe),
    closeSeq2 = new Sequence( ac, tempo, closeToMe2),
    kickSeq = new Sequence( ac, tempo, kick)
runSeq.staccato = 0.55;
closeSeq.staccato = 0.5;
closeSeq2.staccato = 0.5;

kickSeq.waveType = 'sine';
kickSeq.smoothing = 0.8;
kickSeq.bass.frequency.value = 60;
kickSeq.bass.gain.value = 5;
kickSeq.mid.frequency.value = 100;
kickSeq.mid.gain.value = 5;


droneSeq.gain.gain.value = 0.05;
runSeq.gain.gain.value = 0.1;
closeSeq.gain.gain.value = 0.05;
closeSeq2.gain.gain.value = 0.1;
bassSeq.gain.gain.value = 0.05;
kickSeq.gain.gain.value = 0.5;

droneSeq.createCustomWave([1.0, 0.11, 0.88, 0.55, 0.77, 0.33, 0.33, 0.33, 0.44, 0.11, 0.22]);
runSeq.waveType = 'triangle'

// disable looping
bassSeq.loop = false;
droneSeq.loop = false;
runSeq.loop = false;
closeSeq.loop = false;
closeSeq2.loop = false;

// Sprites
kontra.init()
let factories = [];
let sprites = [];

// Prototype sprites
var spinnyLine = {
    type: 'enemy',
    width: 20,
    height: 90,
    color: '#909',
    ttl: Infinity,
    x: 1280/2,
    y: 720/2,
    rotation: -90,
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
        this.context.fillStyle = this.color;
        this.context.fillRect(-1*this.width/2, -this.height/2, this.width, this.height);
        this.context.restore();
    }
}

var floatyBall = {
    type: 'enemy',
    radius: 35,
    color: '#909',
    ttl: Infinity,
    x: 0,
    y: 0,
    dy: -4,
    rotation: 0,
    collidesWith: circleCollidesWith,
    update: function (dt) {
        this.rotation += 1
        this.advance()
    },
    render: function () {
        this.context.save();
        this.context.translate(this.x, this.y);
        this.context.rotate(degreesToRadians(this.rotation));
        // this.context.fillRect(-1*this.width/2, -this.height/2, this.width, this.height);
        this.context.beginPath();
        this.context.arc(0, 0, this.radius, 0, 2 * Math.PI, false);
        this.context.fillStyle = this.color;
        this.context.fill();
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

let ship = kontra.sprite({
    type: 'player',
    x: 80,
    y: 80,
    width: 40,
    height: 30,
    radius: 10, // we'll use this later for collision detection
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
            if (kontra.keys.pressed('w')) { this.dy += -4; }
            if (kontra.keys.pressed('s')) { this.dy += 4; }
            if (kontra.keys.pressed('a')) { this.dx += -4; }
            if (kontra.keys.pressed('d')) { this.dx += 4; }
            if (this.dx && this.dy) {
                this.dx *= 0.707;
                this.dy *= 0.707;
            }
            if (this.dy || this.dx) {
                this.rotation = Math.atan2(this.dy, this.dx) * 180 / Math.PI;
                // Shoot particles out the back
                for (let i = 0; i < (this.dashFrames/10)+1; i++) {
                    if (Math.random()*2 > 1) continue; // Half the particles, easy way
                    let particle = kontra.sprite({
                        type:'particle',
                        x: this.x-4 + Math.random()*this.width - this.width/2,
                        y: this.y-4 + Math.random()*this.height - this.height/2,
                        dx: this.dx * -2 * (Math.random()+0.5),
                        dy: this.dy * -2 * (Math.random()+0.5), 
                        ttl: 16,
                        width:8,
                        height:8,
                        color:'yellow',
                        update: function (dt) {
                            this.color = '#' + (this.ttl*15).toString(16) + (this.ttl*15).toString(16) + '00'
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
        // Start and stop moving effects
        this.width = damp(this.width, 20, 10, dt)
        this.height = damp(this.height, 20, 10, dt)
        if (!this.moving && (this.dx || this.dy)) { // Started moving
            this.width += 10;
            this.height -= 10;
            this.moving = true;
        } else if (this.moving && this.dx == 0 && this.dy == 0) {
            this.width -= 12;
            this.height += 12;
            this.moving = false;
        }
        this.advance()
        // Clamp player to the window
        this.x = Math.max(0, Math.min(this.x, kontra.canvas.width))
        this.y = Math.max(0, Math.min(this.y, kontra.canvas.height))
    },
    render: function() {
        let c = this.canvas || document.createElement('canvas');
        c.width = this.width;
        c.height = this.height;
        let x = c.getContext('2d')
        // draw a triangle
        x.strokeStyle = 'yellow';
        x.fillStyle = 'yellow';
        x.globalCompositeOperation = 'source-over'
        x.beginPath();
        // x.moveTo(-this.width/2, -this.height/2);
        x.moveTo(0, 0);
        x.lineTo(this.width, this.height/2); // nose
        x.lineTo(0, this.height);
        x.closePath();
        x.stroke();
        x.fill();
        // Block out the missing health
        x.globalCompositeOperation = 'source-atop'
        x.strokeStyle = '#111';
        x.beginPath();
        let sAngle = 0 - 0.5 * Math.PI;
        let eAngle = 2 * Math.PI * (7 - this.health) / 7 - 0.5 * Math.PI;
        x.lineWidth = 2 * this.width;
        x.arc(this.width/2, this.height/2, this.width, sAngle, eAngle)
        x.stroke();

        // Outline
        x.globalCompositeOperation = 'source-over'
        x.lineWidth = 2;
        x.strokeStyle = 'yellow';
        x.beginPath();
        // x.moveTo(-this.width/2, -this.height/2);
        x.moveTo(0, 0);
        x.lineTo(this.width, this.height/2); // nose
        x.lineTo(0, this.height);
        x.closePath();
        x.stroke();
        

        
        this.context.save();
        this.context.translate(this.x, this.y);
        this.context.rotate(degreesToRadians(this.rotation));

        this.context.drawImage(c, -this.width/2, -this.height/2)

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
        this.color = (this.width > 128) ? '#909' : 'cyan'
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
        // Music
        if (this.beat === 0) {
            tearFactory.start();
            droneSeq.play();
            runSeq.play();
            bassSeq.play();
        }
        if (this.beat < 32 * 4) { // Intro stuff
            if (this.beat % 8 === 0) { // Beat 0 of every other measure
                closeSeq.play();
            }
        } else if (this.beat < 64 * 4) { // After the intro
            if (this.beat % 4 === 0) { // Beat 0 of every measure
                (Math.floor(this.beat / 4) % 4 === 3) ? closeSeq2.play() : closeSeq.play();
            }
        }
        if (this.beat === 32*4) { // The Drop
            bassSeq.stop();
            droneSeq.stop();
            closeSeq.gain.gain.value = 0.1 // Double the volume
            kickSeq.play();
        }

        // Shapes
        if (this.beat == 28 || this.beat === 36 || this.beat === 44 || this.beat === 52) {
            sprites.unshift(kontra.sprite(spinnyLine))
        }
        if ( this.beat > 24 * 4 && this.beat < 32 * 4) {
            var s = kontra.sprite(floatyBall)
            s.x = Math.random()*kontra.canvas.width;
            s.y = kontra.canvas.height + s.radius;
            s.ttl = (kontra.canvas.height + 2 * s.radius) / Math.abs(s.dy)
            sprites.unshift(s)
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
            if (!ship.iFrames && sprite.type === 'enemy' && sprite.collidesWith(ship)) {
                ship.stunFrames = 45;
                ship.health--;
                ship.iFrames = 60;
                let angle = Math.random()*2*Math.PI;
                ship.dx = Math.cos(angle)*8;
                ship.dy = Math.sin(angle)*8;
            }
        })
        sprites = sprites.filter(sprite => sprite.isAlive());
    },
    render: function() {
        sprites.map(sprite => sprite.render())
    }   
});

kontra.keys.bind('space', function () {
    if (loop.isStopped) {
        startGame()
    }
    if (this.dashFrames > 0) return;
    if (this.stunFrames > 0) return;
    if (!(this.dx || this.dy)) return;
    this.dashFrames = 30
    this.iFrames = 30
}.bind(ship))

let startGame = function() {
    // Game
    loop.start();
    conductor.beat = -1;
    conductor.start();
    // Music
}
