import './css/styles.css'
import './js/kontra'
import { Note, Sequence } from 'tinymusic'

function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
}

// create a new Web Audio API context
var ac = new AudioContext(),
    when = ac.currentTime;

// set the playback tempo (120 beats per minute)
var tempo = 64;

// create some notes ('<Note Name> <Beat Length>')
// q = quarter note, h = half note (more on that later)
var drone = ['F4 76'],
    run = [
    '- w' // Start with 4 beats of silence
],
    bass = [
    'F2 5',
    'Eb2 5',
    'Bb1 5',
    'Db2 6',
    'F2 5', // Repeated twice
    'Eb2 5',
    'Bb1 5',
    'Db2 6',
    'F2 5',
    'Eb2 5',
    'Bb1 5',
    'Db2 6'
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
// Speed up the run over time
var tearFactory = kontra.sprite({
    tears: [],
    type: 'factory',
    ttl: Infinity,
    start: function () {
        this.tears = runSeq.notes.map(note => note.duration*60/64)
        console.log("tearfactory start", this.tears)
        factories.push(this)
    },
    update: function (dt) {
        this.tears[0] -= dt
        while (this.tears.length && this.tears[0] <= 0) {
            let tear = kontra.sprite({
                type: 'enemy',
                width:6,
                height:6,
                color: '#909',
                dx: Math.random()*12-6,
                ddy:.2,
                x:kontra.canvas.width/2,
                y:kontra.canvas.height/2,
                ttl: 49
            })
            sprites.push(tear)
            let timeRemaining = this.tears.shift()
            this.tears[0] -= timeRemaining
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
// tearFactory.tears = runSeq.notes.map(note => note.duration*60/64)
console.log(tearFactory.tears)

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
// factories.push(tearFactory)

let ship = kontra.sprite({
    x: 80,
    y: 80,
    width: 12,  // we'll use this later for collision detection
    height: 12,
    rotation: 0,
    ttl: Infinity,
    dashFrames: 0,
    iFrames: 0,
    stunFrames: 0,
    color: 'yellow',
    update() {
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
                        color:'white'
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
    x:kontra.canvas.width/2 - 30,
    y:kontra.canvas.height/2 - 30,
    type: 'enemy',
    width:60,
    height:60,
    ttl: Infinity,
    color: '#909'
})
sprites.push(kitty)

let conductor = kontra.gameLoop({
    // bpm -> fps
    fps: tempo/60,
    render: function() {},
    clearCanvas: false,
    update: function() {
        if (this.beat === undefined) { this.beat = -1 }
        this.beat++;
        console.log("beat", this.beat);
        if (this.beat == 0) {
            tearFactory.start();
            droneSeq.play();
            runSeq.play();
        }
        if (this.beat == 14) {
            bassSeq.play();
        }
        // console.log("beat", this.beat)
        // at 0 beats, start the music

        // at 55, start the melody
        // at 76 beats, start the drop
    },
})

let loop = kontra.gameLoop({  // create the main game loop
    update: function(dt) {        // update the game state
        factories.map(factory => {
            factory.update(dt)
        })
        factories = factories.filter(factory => factory.isAlive());
        sprites.map(sprite => {
            sprite.update();
            // Wrap the stage bc why not
            sprite.x = (sprite.x + kontra.canvas.width) % kontra.canvas.width
            sprite.y = (sprite.y + kontra.canvas.height) % kontra.canvas.height
            if (!ship.iFrames && sprite.type === 'enemy' && ship.collidesWith(sprite)) {
                ship.stunFrames = 45;
                ship.iFrames = 60;
                let angle = Math.random()*2*Math.PI;
                ship.dx = Math.cos(angle)*4;
                ship.dy = Math.sin(angle)*4;
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
    conductor.start();
    // Music
}
