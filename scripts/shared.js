// How much honey does the user have
var honey = 0;

// How long does the user have left in their clicking time
var click_time_remaining = 10;

// The remaining lives
var lives = 50;

// Is the user holding ctrl
var isHoldingCtrl = false;

// The current wave
var wave = 0;

// Debugging mode enables debug waves & debug text
var isDebugging = false;

// If it is in demo mode, the starting honey is increased and the time between waves is decreased
var isDemo = false;

var mousePos = {
    x: 0,
    y: 0
}

$(document).mousemove(function(event) {
    mousePos.x = event.pageX;
    mousePos.y = event.pageY;
});

function putHoney(bHoney) {
    honey += bHoney;
    $("#honey-text").text(`${Math.floor(honey)} drops of honey`);
    $("#honey-amount").text(`Honey: ${Math.floor(honey)}`);
}

function putLives(bLives) {
    lives += bLives;
    $("#lives-text").text(`Lives: ${lives}`);
}

// https://stackoverflow.com/questions/10214873/make-canvas-as-wide-and-as-high-as-parent
function fitToContainer(canvas) {
    // Make it visually fill the positioned parent
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    // ...then set the internal size to match
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

const canvas = document.getElementById("towerCanvas");
fitToContainer(canvas);