
// grab elements from dom
let audio = document.getElementById("main-audio");
let recordButton = document.getElementById("record");
let playPauseRecordingButton = document.getElementById("play-pause-recording");
let stopButton = document.getElementById("stop");
let addMarkerButton = document.getElementById("add-marker");
let clearMarkersButton = document.getElementById("clear-markers");
let loopButton = document.getElementById("loop");
let playPauseButton = document.getElementById("play-pause");
let speedRange = document.getElementById("speed-range");
let loopSnippetButton = document.getElementById("loop-snippet");
let playPauseSnippetButton = document.getElementById("play-pause-snippet");
let panLeftButton = document.getElementById("pan-left");
let panRightButton = document.getElementById("pan-right");
let tempMarkerListCtnr = document.getElementById("temp-marker-list");

// prepare canvas and drawing context
let canvas = document.getElementById("audio-visualization");
const canvasCtx = canvas.getContext("2d");

// initialize settings
// TODO maybe load from localStorage?
settings = {
    speed: {
        min: 0.5,
        max: 2,
        resolution: 50,
        step: _ => (settings.speed.max - settings.speed.min) / settings.speed.resolution,
    },
    visualization: {
        margin: 30,         // in pixels, on left, right, top, and bottom
        barTimeStep: 10,   // milliseconds
        barWidth: 2,        // pixels, with a single-pixel space between bars
        onscreenBars: null,
        onscreenTime: null,

        barHeightExp: 0.5,  // modifies the heights of bars
        markerPeek: 3,      // pixels that cursor + markers peek into the margin at the top and bottom of the visualization
        overscrollShadowBlur: 15,
        shadowBoxWidth: 3,
    },
    colors: {
        barRecording: "red",
        barNotRecording: "purple",
        visBG: "rgb(240, 240, 240)",    // a very light grey
        overscrollShadow: "black",
        cursor: "black", // etc.
        dummyCursor: "rgba(0, 0, 0, 0.5)", // etc.
    },
};
speedRange.min = 0;
speedRange.max = settings.speed.resolution;
function resizeUpdate() {    // TODO call on resize
    // set the HTML properties for width and height of the canvas
    // to their actual pixel values after applying CSS rules
    cs = window.getComputedStyle(canvas);
    canvas.width = parseInt(cs.getPropertyValue("width"), 10);
    canvas.height = parseInt(cs.getPropertyValue("height"), 10);
    console.log("canvas width: " + canvas.width + "\ncanvas height: " + canvas.height);

    settings.visualization.onscreenBars = Math.floor((canvas.width - (2 * settings.visualization.margin)) / (1 + settings.visualization.barWidth));
    settings.visualization.onscreenTime = settings.visualization.barTimeStep * settings.visualization.onscreenBars;
}
resizeUpdate(); // run once to set the properties initially


// initialize model for visualization data
let visData = {
    totalRecordingLength: null,
    recordStartTime: null, // time that "record" or "resume" was hit, in milliseconds since start of 1970 (this is just how Date.now() works in js)
    recordOffset: null,    // optional offset; set this when you hit "pause"

    bars: [],
    maxBar: 0,   // TODO unfinished?
    dataBuffer: null,
    analyzer: null,
    updateBars: function() {
        // push stuff into bars based on its length and time elapsed since start of recording
        let timeElapsed = Date.now() - visData.recordStartTime;
        timeElapsed += visData.recordOffset;

        let barsToAdd = Math.floor(timeElapsed / settings.visualization.barTimeStep) - visData.bars.length;

        visData.analyzer.getByteFrequencyData(visData.dataBuffer);
        let sum = 0; for (let i = 0; i < visData.dataBuffer.length; i++) { sum += visData.dataBuffer[i]; }
        if (sum > visData.maxBar) visData.maxBar = sum;
        for (let i = 0; i < barsToAdd; i++) {
            visData.bars.push(sum);
        }
    },
    updateIntervalID: null,
    drawRecordingIntervalID: null,

    markers: new Set(),    // start by using a list. Will have to iterate through the list for draws, and finding the nearest marker when the user is trying to set the interval. Could make the second operation more efficient if the list is sorted, like a heap; could use binary search to find closest marker.
    // will also have to iterate on every mouse move. Nope!! If you use a set, you can search for a range centered on the mouse. hold on though. that still requires iterating. I remember that you talked about how binary search trees make it easy to get stuff in ranges...
    // what if you did something like, keep a hotlist of close markers? Calculate the hotlist when the mouse enters, 
    // I think the simplest solution right now is to iterate. You can think of other ways to do it later
    // I think when you pan, you'll have to reset the hover and click callbacks with the markers that are onscreen, so the complexity of hovering will be based on that.
    // markers stored in milliseconds
    // you can iterate through a set so it's fine
    startMarker: null,
    endMarker: null,

    // visual stuff
    cursorLocation: null,  // stored in terms of milliseconds
    panningStart: 0,    // in milliseconds
}
