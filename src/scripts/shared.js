// How much honey does the user have
var honey = 0;

// How long does the user have left in their clicking time
var click_time_remaining = 10;

function putHoney(bHoney) {
    honey += bHoney;
    $("#honey-text").text(`${Math.floor(honey)} drops of honey`);
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