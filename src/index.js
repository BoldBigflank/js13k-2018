import './css/styles.css'
import './js/kontra'
import { Note, Sequence, Sample } from './js/TinyMusic'

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

function circleRender(sprite) {
    kontra.context.strokeStyle = this.color;
    kontra.context.beginPath()
    kontra.context.lineWidth = this.width
    kontra.context.arc(this.x, this.y, this.radius - this.width/2, 0, Math.PI*2)
    kontra.context.stroke()
}

function circleCollidesWith(object) {
    // radius: 17,
    // width: 34,
    // assumes object is a circle
    let outerRadius = this.radius || this.height/2;
    let innerRadius = this.radius - this.width || 0;
    let dx = this.x - object.x;
    let dy = this.y - object.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    return distance < outerRadius + object.radius &&
           distance > innerRadius - object.radius
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
var buffer = ac.createBuffer( 1, ac.sampleRate * 10, ac.sampleRate );
var data   = buffer.getChannelData( 0 );

// fill the snare/hi-hat sample with white noise
for ( var i = 0; i < data.length; ++i ) {
  data[ i ] = Math.random() * 2 - 1;
}

var drone = ['F4 ' + 16*8],
    run = [
    '- 4' // Start with 4 beats of silence
],
    bass = [
    'F2 7.9',
    '- .1',
    'Eb2 7.9',
    '- .1',
    'Bb1 7.9',
    '- .1',
    'Db2 7.9',
    '- .1'
],
runNotes = [
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
    '- q',
    new Sample( buffer, 'e' ),
    '- qe',
    new Sample( buffer, 'e' ),
    '- e'
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
    kickSeq = new Sequence( ac, tempo, kick),
    snareSeq = new Sequence( ac, tempo, snare)
runSeq.staccato = 0.55;
closeSeq.staccato = 0.5;
closeSeq2.staccato = 0.5;

kickSeq.waveType = 'sine';
kickSeq.smoothing = 0.8;
kickSeq.bass.frequency.value = 60;
kickSeq.bass.gain.value = 5;
kickSeq.mid.frequency.value = 100;
kickSeq.mid.gain.value = 5;

snareSeq.gain.gain.value = 0.1;
snareSeq.bass.frequency.value = 150;
snareSeq.bass.gain.value = 4;
snareSeq.mid.frequency.value = 800;
snareSeq.mid.gain.value = 3;
snareSeq.treble.frequency.value = 5000;
snareSeq.treble.gain.value = -10;

droneSeq.gain.gain.value = 0.05;
runSeq.gain.gain.value = 0.1;
closeSeq.gain.gain.value = 0.05;
closeSeq2.gain.gain.value = 0.1;
bassSeq.gain.gain.value = 0.05;
kickSeq.gain.gain.value = 0.5;

droneSeq.createCustomWave([1.0, 0.11, 0.88, 0.55, 0.77, 0.33, 0.33, 0.33, 0.44, 0.11, 0.22]);
runSeq.waveType = 'triangle'

// disable looping
droneSeq.loop = false;
runSeq.loop = false;
closeSeq.loop = false;
closeSeq2.loop = false;

// Sprites
kontra.init('game')
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
        kontra.context.save();
        kontra.context.translate(this.x, this.y);
        kontra.context.rotate(degreesToRadians(this.rotation));
        kontra.context.fillStyle = this.color;
        kontra.context.fillRect(-1*this.width/2, -this.height/2, this.width, this.height);
        kontra.context.restore();
    }
}

var floatyBall = {
    type: 'enemy',
    radius: 34,
    width: 34,
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
    render: circleRender
}

var explodeyBall = {
    type: 'enemy',
    radius: 0,
    maxRadius: 360,
    color: '#909',
    ttl: Infinity,
    x: 0,
    y: 0,
    dy: 0,
    direction: 1,
    rotation: 0,
    collidesWith: circleCollidesWith,
    update: function (dt) {
        this.radius += this.direction * this.maxRadius / beatsToFrames(0.5)
        if (this.radius > this.maxRadius) this.direction = -1
        if (this.radius < 0) this.ttl = 0
        this.advance()
    },
    render: function () {
        kontra.context.save();
        kontra.context.translate(this.x, this.y);
        kontra.context.rotate(degreesToRadians(this.rotation));
        // this.context.fillRect(-1*this.width/2, -this.height/2, this.width, this.height);
        kontra.context.beginPath();
        kontra.context.arc(0, 0, this.radius, 0, 2 * Math.PI, false);
        kontra.context.fillStyle = this.color;
        kontra.context.fill();
        kontra.context.restore();
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
    stop: function () {
        this.tears = []
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
                            // this.color = '#' + (this.ttl*15).toString(16) + (this.ttl*15).toString(16) + '00'
                            this.advance()
                        }, render: function () {
                            kontra.context.save()
                            kontra.context.globalAlpha = this.ttl / 16
                            kontra.context.fillStyle = '#ff0'
                            kontra.context.fillRect(this.x, this.y, this.width, this.height)
                            kontra.context.restore()
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
        this.width = damp(this.width, 40, 10, dt)
        this.height = damp(this.height, 30, 10, dt)
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
        
        kontra.context.save();
        kontra.context.translate(this.x, this.y);
        kontra.context.rotate(degreesToRadians(this.rotation));

        kontra.context.drawImage(c, -this.width/2, -this.height/2)

        kontra.context.restore();
    }
});
sprites.push(ship);

let kitty = kontra.sprite({
    x:kontra.canvas.width/2,
    y:kontra.canvas.height/2,
    type: 'enemy',
    width:120,
    height:120,
    ttl: Infinity,
    color: '#909',
    face: '',
    update: function (dt) {
        if (!this.face) {
            this.width = damp(this.width, 120, 12, dt)
            this.height = damp(this.height, 120, 12, dt)
        } else {
            this.width = this.height = 200
        }
        // this.x = (kontra.canvas.width - this.width)/2
        // this.y = (kontra.canvas.height - this.height)/2
        this.advance()
        this.color = (this.width > 128) ? '#909' : 'cyan'
    },
    render: function (dt) {
        kontra.context.fillStyle = this.color
        kontra.context.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height)
        if (this.face == 'grab') {
            let x = kontra.context
            x.fillStyle = '#000'
            // kontra.context.fillText("GRAB", this.x, this.y)
            x.save()
            x.translate(this.x - this.width/2, this.y - this.height/2)
            x.strokeStyle = "#000000"
            x.fillStyle = '#000000'
            x.lineWidth = this.height*.10
            x.beginPath()
            x.moveTo(this.width*.20,this.height*.30)
            x.lineTo(this.width*.40,this.height*.40)
            x.moveTo(this.width*.60,this.height*.40)
            x.lineTo(this.width*.80,this.height*.30)
            x.moveTo(this.width*.28,this.height*.33)
            x.lineTo(this.width*.28,this.height*.50)
            x.stroke()
            x.beginPath()
            x.arc(this.width*.50, this.height*.90, this.height*.20, Math.PI * 1.25, -Math.PI * 0.25)
            x.stroke()
            x.restore()
        } else if (this.face == 'cog') {
            let x = kontra.context
            x.fillStyle = '#000'
            // kontra.context.fillText("GRAB", this.x, this.y)
            x.save()
            x.translate(this.x - this.width/2, this.y - this.height/2)
            x.strokeStyle = "#000000"
            x.fillStyle = '#000000'
            x.lineWidth = this.height*.10
            x.beginPath()
            x.arc(this.width*.30, this.height*.40, this.height*.20, 0, 2 * Math.PI)
            x.stroke()
            x.beginPath()
            x.arc(this.width*.70, this.height*.50, this.height*.20, 0, 2 * Math.PI)
            x.stroke()
            x.fill()
            x.beginPath()
            x.arc(this.width*.50, this.height*1.0, this.height*.20, Math.PI * 1.25, -Math.PI * 0.25)
            x.stroke()
            x.restore()
        } else if (this.face == 'buzzsaw') {
            let x = kontra.context
            x.fillStyle = '#000'
            // kontra.context.fillText("GRAB", this.x, this.y)
            x.save()
            x.translate(this.x - this.width/2, this.y - this.height/2)
            x.strokeStyle = "#000000"
            x.fillStyle = '#000000'
            x.lineWidth = this.height*.10
            x.beginPath()
            x.moveTo(this.width*.28,this.height*.4)
            x.lineTo(this.width*.28,this.height*.54)
            x.stroke()
            x.beginPath()
            x.arc(this.width*.3, this.height*.4, this.height*.1, 0, 2 * Math.PI)
            x.fill()
            x.beginPath()
            x.arc(this.width*.7, this.height*.33, this.height*.2, 0, 2 * Math.PI)
            x.fill()
            x.restore()
        } else { // DEBUG show the face
            kontra.context.fillStyle = '#000'
            // kontra.context.fillText(this.face, this.x , this.y)
        }
    },
    reset: function () {
        this.x = kontra.canvas.width/2
        this.y = kontra.canvas.height/2
        this.dx = this.dy = 0
        this.face = ''

    }
})
sprites.push(kitty)

let hand = {
    type: 'enemy',
    color: '#909',
    x: kontra.canvas.width/2,
    y: kontra.canvas.height/2,
    collidesWith: circleCollidesWith,
    radius: 92,
    ttl: beatsToFrames(10),
    ticks: 0,
    direction: 1,
    width: 92,
    update: function (dt) {
        this.ticks++;
        this.dx = 0;
        this.dy = 0;
        this.ddy = 0;
        if (this.ticks < beatsToFrames(2)) { // Move sideways
            this.dx = kontra.canvas.width * 0.20 * this.direction / beatsToFrames(2);
        } else if (this.ticks < beatsToFrames(4)) { // Hold/open
            // this.radius = 128
            // this.width = 128
        } else if (this.ticks < beatsToFrames(5)) { // Drop down
            this.dy = (kontra.canvas.height * 0.5 - 64) / beatsToFrames(1)
        } else if (this.ticks < beatsToFrames(10)) { // Rise up
            this.dy = -(kontra.canvas.height - 2 * this.radius) / beatsToFrames(5)
        }
        this.advance()
    },
    render: circleRender
}

let gear = {
    type: 'enemy',
    color: '#909',
    x: 46,
    y: -46,
    collidesWith: circleCollidesWith,
    radius: 64,
    width:64,
    ttl: beatsToFrames(10),
    ticks: 0,
    direction: 1,
    update: function (dt) {
        this.ticks++;
        this.ddy = 0;
        if (this.ticks < beatsToFrames(2)) { // Move down
            this.dy = this.radius / beatsToFrames(2)
        } else if (this.ticks < beatsToFrames(6)) { // Hold
            this.dy = 0
        } else { // Drop down
            this.ddy = 1
        }
        this.advance()
    },
    render: circleRender
}

let buzzsaw = {
    type: 'enemy',
    color: '#909',
    x: kontra.canvas.width/2,
    y: kontra.canvas.height/2,
    collidesWith: circleCollidesWith,
    radius: 64,
    width:32,
    ttl: beatsToFrames(16),
    ticks: 0,
    direction: 'up',
    update: function (dt) {
        this.ticks++;
        this.ddy = 0;
        this.dx = 0;
        this.dy = 0;
        if (this.ticks < beatsToFrames(1)) { // Move up one beat
            if (this.direction == 'up') this.dy = -1 * this.radius / beatsToFrames(1)
            if (this.direction == 'down') this.dy = this.radius / beatsToFrames(1)
            if (this.direction == 'left') this.dx = -1 * this.radius / beatsToFrames(1)
            if (this.direction == 'right') this.dx = this.radius / beatsToFrames(1)
        } else if (this.ticks < beatsToFrames(2)) { // Hold one beat
            // Nothing
        } else if (this.ticks < beatsToFrames(3)) { // Move all the way up one beat
            if (this.direction == 'up') this.y = damp(this.y, this.radius, 8, dt)
            if (this.direction == 'down') this.y = damp(this.y, kontra.canvas.height - this.radius, 8, dt)
            if (this.direction == 'left') this.x = damp(this.x, this.radius, 8, dt)
            if (this.direction == 'right') this.x = damp(this.x, kontra.canvas.width - this.radius, 8, dt)
        } else if (this.ticks < beatsToFrames(4)) { // Hold one beat
            // Nothing
        } else if (this.ticks < beatsToFrames(9)) { // Buzz to the side
            // Shoot particles backward, upward
            if (this.ticks % 4 == 0) {
                let s = kontra.sprite(floatyBall)
                s.x = this.x
                s.y = this.y
                s.radius = s.width = 16
                s.ttl = beatsToFrames(8);
                let r1 = Math.random() * 5 - 2.5
                let r2 = Math.random() * 5 - 2.5
                s.dx = {'up':-10+r1, 'down':10+r1, 'left':10+r1, 'right':-10+r1}[this.direction]
                s.dy = {'up':10+r2, 'down':-10+r2, 'left':10+r2, 'right':-10+r2}[this.direction]
                s.ddx = {'up':0, 'down':0, 'left':-1, 'right':1}[this.direction]
                s.ddy = {'up':-1, 'down':1, 'left':0, 'right':0}[this.direction]
                sprites.push(s)
            }
            if (Math.floor(Math.random()*16) == 0) { // One in 16 chance
                let b = kontra.sprite(floatyBall)
                b.x = this.x
                b.y = this.y
                b.radius = b.width = 8
                b.ttl = beatsToFrames(8)
                b.dx = {'up':0, 'down':0, 'left':5, 'right':-5}[this.direction]
                b.dy = {'up':5, 'down':-5, 'left':0, 'right':0}[this.direction]
                sprites.push(b)
            }
            if (this.direction == 'up') this.dx = (kontra.canvas.width/2 + this.radius) / beatsToFrames(5)
            if (this.direction == 'down') this.dx = -1 * (kontra.canvas.width/2 + this.radius) / beatsToFrames(5)
            if (this.direction == 'left') this.dy = -1 * (kontra.canvas.height/2 + this.radius) / beatsToFrames(5)
            if (this.direction == 'right') this.dy = (kontra.canvas.height/2 + this.radius) / beatsToFrames(5)
        }

        this.advance()
    },
    render: circleRender
}

let bottom = {
    type: 'enemy',
    color: '#909',
    width: kontra.canvas.width,
    height: kontra.canvas.height,
    x:0,
    y:kontra.canvas.height,
    ticks: 0,
    ttl: beatsToFrames(12),
    update: function (dt) {
        this.ticks++
        // this.dy = 0
        if (this.ticks < beatsToFrames(5)) {
            this.dy = -1 * (kontra.canvas.height - 92*2) / beatsToFrames(5)
        } else {
            this.ddy = 2
        }
        this.advance()
    }
}

// Beat == 
var grabBeat = 31 * 4; // and 39, 55, 63
var cogBeat = 35 * 4; // and 47, 59
var buzzsawBeat = 43 * 4; // and 51, 67

let conductor = kontra.gameLoop({
    // bpm -> fps
    fps: tempo/60,
    render: function() {},
    clearCanvas: false,
    update: function(dt) {
        if (this.beat === undefined) { this.beat = -1 }
        this.beat++;
        if (this.beat === 73*4) {
            winGame()
            return
        }
        console.log("beat " + Math.floor(1 + this.beat / 4) + '-' + Math.floor(1 + this.beat % 4)  + " (" + this.beat + ")");
        // Music
        if (this.beat === 0) {
            tearFactory.start();
            droneSeq.play();
            runSeq.play();
        }
        if (this.beat === 8 * 4) {
            console.log("kick the bass")
            bassSeq.staccato = 0;
            bassSeq.smoothing = 0;
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
            snareSeq.play();
            bassSeq.staccato = 0.4;
            bassSeq.smoothing = 0.9;
            bassSeq.play();
        }

        // Shapes
        if (this.beat == 28 || this.beat === 36 || this.beat === 44 || this.beat === 52) {
            let s = kontra.sprite(spinnyLine)
            s.ttl = beatsToFrames (31 * 4 - this.beat)
            sprites.unshift(s)
        }
        if ( this.beat > 24 * 4 && this.beat < 32 * 4) {
            var s = kontra.sprite(floatyBall)
            s.x = Math.random()*kontra.canvas.width;
            s.y = kontra.canvas.height + s.radius;
            s.ttl = (kontra.canvas.height + 2 * s.radius) / Math.abs(s.dy)
            sprites.unshift(s)
        }

        // Grab
        if (this.beat == grabBeat - 4 || this.beat == cogBeat - 4 || this.beat == buzzsawBeat - 4) {
            // 4 spinnylines warning 2 beats, ttl 4 beats
            for (let i = 0; i < 4; i++) {
                let s = kontra.sprite(spinnyLine)
                s.rotation = 45 * i
                s.ttl = beatsToFrames (8)
                sprites.unshift(s)
                
            }
        }
        if (this.beat == grabBeat + 1) { // beat 2
            // Show face
            kitty.face = 'grab'
        }
        if (this.beat == grabBeat + 2) { // beat 3
            // Left and right hands
            let l = kontra.sprite(hand)
            l.direction = -1
            let r = kontra.sprite(hand)
            sprites.unshift(l, r)
        }
        if (this.beat == grabBeat + 6) {
            // Drop kitty from half
            kitty.dy = (kontra.canvas.height * 0.5 - kitty.height/2) / beatsToFrames(1)
        }
        if (this.beat == grabBeat + 7) {
            // gears
            let gear1 = kontra.sprite(gear)
            gear1.x = gear.radius
            let gear2 = kontra.sprite(gear)
            gear2.x = 3 * gear2.radius
            let gear3 = kontra.sprite(gear)
            gear3.x = kontra.canvas.width - gear3.radius
            let gear4 = kontra.sprite(gear)
            gear4.x = kontra.canvas.width - 3 * gear4.radius
            sprites.push(gear1, gear2, gear3, gear4)
            // kitty climb to top
            kitty.dy = -1 * (kontra.canvas.height - kitty.height) / beatsToFrames(4)
            let b = kontra.sprite(bottom)
            sprites.unshift(b)
        }
        if (this.beat == grabBeat + 11) {
            // kitty hold at top
            kitty.dy = 0
        }
        if (this.beat == grabBeat + 12) {
            // kitty fall to bottom
            kitty.dy = ((kontra.canvas.height - kitty.height) / beatsToFrames(2))
        }
        if (this.beat == grabBeat + 14) {
            // kitty go back to center
            kitty.dy = -1 * (kontra.canvas.height/2 - kitty.height/2) / beatsToFrames(2)
        }
        if (this.beat == grabBeat + 16) {
            // kitty reset
            kitty.dy = 0
            kitty.reset()
            kitty.face = 'spaz';
            if (grabBeat == 55 * 4) grabBeat = 63*4; // Prepare for the next one
            if (grabBeat == 39 * 4) grabBeat = 55*4; // Prepare for the next one
            if (grabBeat == 31 * 4) grabBeat = 39*4; // Prepare for the next one
        }

        // Cog
        if (this.beat == cogBeat + 2) { // beat 3
            // Show face
            kitty.face = 'cog'
        }
        if (this.beat == cogBeat + 4) { // beat 3
            // move to the right
            kitty.dx = kontra.canvas.width*0.5/beatsToFrames(2)
        }
        if (this.beat == cogBeat + 6) {
            kitty.dx = 0
            // explosion, cog
            let s = kontra.sprite(explodeyBall)
            s.x = kontra.canvas.width
            s.y = kontra.canvas.height/2
            sprites.push(s)
            kitty.x = -1 * kitty.width
        }
        if (this.beat == cogBeat + 7) {
            kitty.dx = 0
            // cog
            let s = kontra.sprite(floatyBall)
            s.dy = 0;
            s.dx = -1 * kontra.canvas.width / beatsToFrames(6)
            s.radius = kontra.canvas.height/2
            s.width = 128
            s.x = kontra.canvas.width
            s.y = kontra.canvas.height/2
            s.ttl = beatsToFrames(6)
            sprites.push(s)
        }
        if (this.beat == cogBeat + 13) {
            kitty.dx = (kontra.canvas.width/2 + kitty.width) / beatsToFrames(2)
            // explosion, cog
            let s = kontra.sprite(explodeyBall)
            s.x = 0
            s.y = kontra.canvas.height/2
            sprites.push(s)
        }
        if (this.beat == cogBeat + 15) {
            kitty.dx = 0
            kitty.reset()
            kitty.face = 'spaz'
            if (cogBeat == 47 * 4) cogBeat = 59*4; // Prepare for the next one
            if (cogBeat == 35 * 4) cogBeat = 47*4; // Prepare for the next one
        }

        // Buzzsaws
        if (this.beat == buzzsawBeat + 2) { // beat 3
            // Show face
            kitty.face = 'buzzsaw'
        }
        if (this.beat == buzzsawBeat + 4) { // beat 3
            // pop four out
            let b1 = kontra.sprite(buzzsaw)
            let b2 = kontra.sprite(buzzsaw)
            b2.direction = 'right'
            let b3 = kontra.sprite(buzzsaw)
            b3.direction = 'down'
            let b4 = kontra.sprite(buzzsaw)
            b4.direction = 'left'
            sprites.unshift(b1, b2, b3, b4)
            // kitty.dx = kontra.canvas.width*0.5/beatsToFrames(2)
        }
        if (this.beat == buzzsawBeat + 6) {
            // slowly rotate kitty
        }
        if (this.beat == buzzsawBeat + 13) {
            // un-rotate kitty
        }
        if (this.beat == buzzsawBeat + 15) {
            kitty.dx = 0
            kitty.reset()
            kitty.face = 'spaz'
            if (buzzsawBeat == 51 * 4) buzzsawBeat = 67*4; // Prepare for the next one
            if (buzzsawBeat == 43 * 4) buzzsawBeat = 51*4; // Prepare for the next one

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
                ship.health--;
                if (ship.health > 0) {
                    ship.stunFrames = 45;
                    ship.iFrames = 60;
                    let angle = Math.random()*2*Math.PI;
                    ship.dx = Math.cos(angle)*8;
                    ship.dy = Math.sin(angle)*8;
                } else {
                    gameOver()
                }
            }
        })
        sprites = sprites.filter(sprite => sprite.isAlive());
    },
    render: function() {
        sprites.map(sprite => sprite.render())
    }   
});

let titleText = kontra.sprite({
    render: function () {
        kontra.context.strokeStyle = "#fff"
        kontra.context.fillStyle = "#fff"
        kontra.context.font = "bold 48px Verdana"
        kontra.context.textAlign = 'right'
        kontra.context.fillText("CLOSE TO ME", kontra.canvas.width-20, kontra.canvas.height * 0.75)
        kontra.context.fillStyle = "#0aa"
        kontra.context.font = "24px Verdana"
        kontra.context.fillText("by", kontra.canvas.width-20, kontra.canvas.height*0.75+30)
        kontra.context.fillText("Sabrepulse", kontra.canvas.width-20, kontra.canvas.height*0.75+60)

        kontra.context.strokeStyle = "#fff"
        kontra.context.fillStyle = "#fff"
        kontra.context.font = "bold 48px Verdana"
        kontra.context.textAlign = 'left'
        kontra.context.fillText("CONTROLS", 20, kontra.canvas.height * 0.75)
        kontra.context.fillStyle = "#0aa"
        kontra.context.font = "24px Verdana"
        kontra.context.fillText("WASD to move", 20, kontra.canvas.height*0.75+30)
        kontra.context.fillText("Space to dash", 20, kontra.canvas.height*0.75+60)
        kontra.context.fillText("Space to dash", 20, kontra.canvas.height*0.75+60)
        kontra.context.textAlign = 'center'
        kontra.context.fillText("Space to start", kontra.canvas.width/2, kontra.canvas.height - 24)
        
    }
})
let menuLoop = kontra.gameLoop({
    update: function(dt) {
        // ship.update(dt)
        // sprites.map(sprite => sprite.update())
    },
    render: function() {
        // sprites.map(sprite => sprite.render())
        titleText.render()
        // ship.render()
    }
})
menuLoop.start()

let winSprite = {
    width:10,
    height:10,
    color:'white',

    update: function(dt) {
        this.width = damp(this.width, 42, this.damping, dt)
        this.height = damp(this.height, 42, this.damping, dt)
        this.advance()
    },
    render: function () {
        kontra.context.save()
        kontra.context.fillStyle = "#fff"
        kontra.context.translate(this.x+21, this.y+21)
        kontra.context.fillRect(-this.width/2, -this.height/2, this.width, this.height)
        kontra.context.restore()
    }
}

let winText = kontra.sprite({
    rank: 'E',
    render: function () {
        kontra.context.fillStyle = "#888"
        kontra.context.font = "bold 48px Verdana"
        kontra.context.textAlign = 'center'
        kontra.context.fillText("Rank: " + this.rank, kontra.canvas.width/2, kontra.canvas.height/2)
        kontra.context.font = "24px Verdana"
        kontra.context.fillText("R to restart", kontra.canvas.width/2, kontra.canvas.height/2+48)
        
    }
})

let winSprites = []
const MAXMAG = Math.sqrt(Math.pow(kontra.canvas.width,2)+Math.pow(kontra.canvas.height,2))/2
let winLoop = kontra.gameLoop({
    update: function (dt) {
        if (!this.winSprites){
            this.winSprites = []
            for (let y = 0; y < kontra.canvas.height; y+=40) {
                for (let x = 0; x < kontra.canvas.width; x+=40) {
                    console.log("sprite")
                    let s = kontra.sprite(winSprite)
                    s.x = x;
                    s.y = y;
                    s.damping = 0.7 + Math.sqrt(Math.pow(x - kontra.canvas.width/2,2)+Math.pow(y - kontra.canvas.height/2,2)) / MAXMAG
                    this.winSprites.push(s)
                }
            }
            
        }
        this.winSprites.map(s => s.update(dt))
    },
    render: function (dt) {
        if (this.winSprites) this.winSprites.map(s => s.render())
        winText.render()
    }
})
// winLoop.start()

kontra.keys.bind('space', function () {
    if (!menuLoop.isStopped) {
        startGame()
        return
    }
    if (this.dashFrames > 0) return;
    if (this.stunFrames > 0) return;
    if (!(this.dx || this.dy)) return;
    this.dashFrames = 30
    this.iFrames = 30
}.bind(ship))

kontra.keys.bind('r', function () {
    console.log("restarting")
    startGame()
})

let startGame = function() {
    // Kill sprites
    sprites.forEach(sprite => {if (!sprite.type === 'player') sprite.ttl = 0})
    ship.health = 7;
    ship.x = 100;
    ship.y = kontra.canvas.height/2;
    factories.forEach(factory => factory.stop())
    factories = []

    // Stop music
    droneSeq.stop()
    runSeq.stop()
    bassSeq.stop()
    closeSeq.stop()
    closeSeq2.stop()
    kickSeq.stop()
    snareSeq.stop()
    
    // Game

    menuLoop.stop()
    if (loop.isStopped) loop.start();
    conductor.beat = -1;
    if (conductor.isStopped) conductor.start();
    // Music
    kitty.reset()
    grabBeat = 31 * 4;
    cogBeat = 35 * 4;
    buzzsawBeat = 43 * 4;

}

let stopAll = function() {
    // Stop music
    droneSeq.stop()
    runSeq.stop()
    bassSeq.stop()
    closeSeq.stop()
    closeSeq2.stop()
    kickSeq.stop()
    snareSeq.stop()
    
    loop.stop()
    conductor.stop()
    winLoop.stop()
    menuLoop.stop()
}

let winGame = function () {
    stopAll()
    winText.rank = ['S','A','B','C','D','D','E'][(7 - ship.health)]
    if (winLoop.isStopped) winLoop.start()
}

let gameOver = function() {
    stopAll()
    if (menuLoop.isStopped) menuLoop.start()
}