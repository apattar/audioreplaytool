/* This file contains all scripting for the Audio Replay Tool.
 * Author: Antara Pattar (apattar on github)
 */

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
        margin: 10,         // in pixels, on left, right, top, and bottom
        barTimeStep: 10,   // milliseconds
        barWidth: 2,        // pixels, with a single-pixel space between bars
        markerPeek: 3,      // pixels that cursor + markers peek into the margin at the top and bottom of the visualization
        barHeightExp: 0.5,  // modifies the heights of bars
        onscreenBars: null,
        onscreenTime: null,
    },
    colors: {
        barRecording: "red",
        barNotRecording: "purple",
        visBG: "rgb(240, 240, 240)",    // a very light grey
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

let draw = {
    recording: function() {
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        // draw background etc.

        // calculate the current recording time, if larger than canvas width can support then calculate and save panningStart, then draw appropriate subset of bars based on that
        let currTime = (Date.now() - visData.recordStartTime) + visData.recordOffset;
        if (currTime < settings.visualization.onscreenTime) {
            canvasCtx.fillStyle = settings.colors.visBG;
            canvasCtx.fillRect(
                settings.visualization.margin,
                settings.visualization.margin,
                Math.round((currTime / settings.visualization.onscreenTime) * (canvas.width - 2 * settings.visualization.margin)),
                canvas.height - 2 * settings.visualization.margin
            );
            canvasCtx.fillStyle = settings.colors.barRecording;
            draw.renderBars(visData.bars);
            canvasCtx.fillStyle = settings.colors.cursor;
            canvasCtx.fillRect(   // draw the cursor
                Math.round(settings.visualization.margin + (currTime / settings.visualization.onscreenTime) * (canvas.width - 2 * settings.visualization.margin)),
                settings.visualization.margin - settings.visualization.markerPeek,
                settings.visualization.barWidth,
                canvas.height - 2 * settings.visualization.margin + 2 * settings.visualization.markerPeek
            );
        } else {
            visData.panningStart = currTime - settings.visualization.onscreenTime;

            // render only the final settings.visualization.onscreenBars bars
            canvasCtx.fillStyle = settings.colors.visBG;
            canvasCtx.fillRect(
                settings.visualization.margin,
                settings.visualization.margin,
                canvas.width - 2 * settings.visualization.margin,
                canvas.height - 2 * settings.visualization.margin
            );
            canvasCtx.fillStyle = settings.colors.barRecording;
            draw.renderBars(visData.bars.slice(-settings.visualization.onscreenBars));
            canvasCtx.fillStyle = settings.colors.cursor;
            canvasCtx.fillRect(     // draw the cursor
                canvas.width - settings.visualization.margin,
                settings.visualization.margin - settings.visualization.markerPeek,
                settings.visualization.barWidth,
                canvas.height - 2 * settings.visualization.margin + 2 * settings.visualization.markerPeek
            );
        }
    },
    notRecording: function() {
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        // scrollbar/dragging panning features kick in here


        // draw background
        canvasCtx.fillStyle = settings.colors.visBG;
        if (visData.totalRecordingLength >= settings.visualization.onscreenTime) {
            canvasCtx.fillRect(
                settings.visualization.margin,
                settings.visualization.margin,
                canvas.width - 2 * settings.visualization.margin,
                canvas.height - 2 * settings.visualization.margin
            );
        } else {
            canvasCtx.fillRect(
                settings.visualization.margin,
                settings.visualization.margin,
                visData.bars.length * (1 + settings.visualization.barWidth),
                canvas.height - 2 * settings.visualization.margin
            )
        }


        // pick which bars to render based on the visData.panningStart property


        // draw bars based on visData.panningStart
        let barIdx = Math.floor(visData.bars.length * (visData.panningStart / visData.totalRecordingLength));
        canvasCtx.fillStyle = settings.colors.barNotRecording;
        draw.renderBars(visData.bars.slice(barIdx, barIdx + settings.visualization.onscreenBars));

        // add cursor based on visData.cursor, but only if it's onscreen
        if (visData.panningStart <= visData.cursorLocation && visData.cursorLocation <= visData.panningStart + settings.visualization.onscreenTime) {
            // draw the cursor
            canvasCtx.fillStyle = settings.colors.cursor;
            canvasCtx.fillRect(
                settings.visualization.margin + ((visData.cursorLocation - visData.panningStart) / settings.visualization.onscreenTime) * (canvas.width - 2 * settings.visualization.margin),
                settings.visualization.margin - settings.visualization.markerPeek,
                settings.visualization.barWidth,
                canvas.height - 2 * settings.visualization.margin + 2 * settings.visualization.markerPeek
            );
        }
    },
    renderBars: function(bars) {    // input is array of bars
        for (let i = 0; i < bars.length; i++) {
            let barHeight = Math.pow(bars[i] / visData.maxBar, settings.visualization.barHeightExp) * (canvas.height - (2 * settings.visualization.margin));
            let barX = i * (settings.visualization.barWidth + 1) + settings.visualization.margin;
            canvasCtx.fillRect(barX, (canvas.height / 2) - (barHeight / 2), settings.visualization.barWidth, barHeight);
        }
    }
}






// check to see if recording is supported
if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
    console.log("getUserMedia not supported on your browser!");
    // TODO display some sort of user-visible error message
} else console.log("getUserMedia is supported");

// try to get stream of user's microphone
navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
        // initialize recorder
        let mediaRecorder = new MediaRecorder(stream);
        console.log("recorder initialized successfully");

        // create audio context & audio graph for the visualization
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        let analyzer = audioCtx.createAnalyser();
        let source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyzer);
        
        // initialize visData
        visData.dataBuffer = new Uint8Array(analyzer.frequencyBinCount);
        visData.analyzer = analyzer;

        // set recording-related button callbacks
        // TODO some sort of visual and textual indicator of the state of the recording would be nice, maybe instead of logging to console
        recordButton.onclick = function() {
            mediaRecorder.start();
            console.log("started recording");

            recordButton.disabled = true;
            playPauseRecordingButton.disabled = false;
            stopButton.disabled = false;
            loopButton.disabled = true;
            playPauseButton.disabled = true;
            speedRange.disabled = true;
            addMarkerButton.disabled = true;
            loopSnippetButton.disabled = true;
            playPauseSnippetButton.disabled = true;
            stopButton.focus();

            // initialize/reset stuff in visData
            visData.bars = [];
            visData.maxBar = null;
            visData.cursorLocation = null;
            visData.panningStart = null;
            visData.recordingLength = null;
            visData.recordStartTime = Date.now();
            visData.recordOffset = 0;
            visData.updateIntervalID = window.setInterval(visData.updateBars, settings.visualization.barTimeStep);
            visData.drawRecordingIntervalID = window.setInterval(draw.recording, settings.visualization.barTimeStep);   // TODO if you want to use requestAnimationFrame, here's where to use it
            clearMarkersButton.click(); // clear markers and start and end markers
        }
        playPauseRecordingButton.onclick = function() {
            if (mediaRecorder.state === "paused") {
                mediaRecorder.resume();
                console.log("resumed recording");

                visData.recordStartTime = Date.now();
                visData.updateIntervalID = window.setInterval(visData.updateBars, settings.visualization.barTimeStep);
                visData.drawRecordingIntervalID = window.setInterval(draw.recording, settings.visualization.barTimeStep);
            } else {
                mediaRecorder.pause();
                console.log("paused recording");

                visData.recordOffset += Date.now() - visData.recordStartTime;
                window.clearInterval(visData.updateIntervalID);
                window.clearInterval(visData.drawRecordingIntervalID);
            }
        }
        stopButton.onclick = function() {
            mediaRecorder.stop();
            recordButton.disabled = false;
            playPauseRecordingButton.disabled = true;
            stopButton.disabled = true;
            recordButton.innerHTML = "Re-record";
            loopButton.disabled = false;
            playPauseButton.disabled = false;
            speedRange.disabled = false;
            addMarkerButton.disabled = false;
            loopButton.focus(); // TODO change to pause/play

            visData.totalRecordingLength = Date.now() - visData.recordStartTime + visData.recordOffset;
            visData.cursorLocation = 0; // TODO ?
            window.clearInterval(visData.updateIntervalID);
            window.clearInterval(visData.drawRecordingIntervalID);
            draw.notRecording();
        }

        // set recorder callbacks
        let chunks = [];
        mediaRecorder.ondataavailable = function(e) { chunks.push(e.data); }
        mediaRecorder.onstop = function() {
            console.log("recording stopped");
            const blob = new Blob(chunks, { "type": "audio/ogg; codecs=opus" });
            chunks = [];
            const audioURL = window.URL.createObjectURL(blob);
            audio.src = audioURL;
        }
    }).catch(function(err) {
        console.log("The following getUserMedia error occurred: " + err);
    });


// set <audio>-related button callbacks
loopButton.onclick = function() {
    if (audio.loop) {
        audio.loop = false;
        console.log("not looping");
    } else {
        audio.loop = true;
        console.log("looping");
    }
}
playPauseButton.onclick = function() {
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
}
speedRange.addEventListener("input", function() {
    // TODO make this a quadratic scale? also need visual indications
    audio.playbackRate = settings.speed.min + Number(speedRange.value) * settings.speed.step();
    console.log(audio.playbackRate);
});


// set snippet-related button callbacks
// markers = new Map();    // maps times to associated DOM elements
// startMarker = null;
// endMarker = null;
addMarkerButton.onclick = function() {
    let time = audio.currentTime;

    // if (markers.has(time)) {
    //     console.log("marker already exists");
    //     return;
    // }
    // // TODO change when creating visualization
    // newMarkerButton = document.createElement("button");
    // newMarkerButton.innerHTML = time;
    // newMarkerButton.setAttribute("data-time", time); // necessary?
    // tempMarkerListCtnr.appendChild(newMarkerButton);

    // markers.set(time, newMarkerButton);
    // newMarkerButton.onclick = function() {
    //     tempMarkerListCtnr.removeChild(newMarkerButton);
    //     if (!markers.delete(time)) console.log("error deleting");

    //     // check if need to remove active snippet
    //     if (markers.size === 1) {
    //         startMarker = null;
    //         endMarker = null;
    //     }
    // }

    visData.markers.add(time);

    // if just reached enough for a snippet, set first active snippet
    if (visData.markers.size === 2) {
        console.log(visData.markers.values());
        visData.startMarker = Math.min(...visData.markers.values());
        visData.endMarker = Math.max(...visData.markers.values());
    }   // otherwise, keep start and end markers the same

    console.log(visData.markers);
    console.log(visData.startMarker);
    console.log(visData.endMarker);
}
clearMarkersButton.onclick = function() {
    // markers.forEach(function(marker) {
    //     tempMarkerListCtnr.removeChild(marker);
    // });
    visData.markers.clear();
    visData.startMarker = null;
    visData.endMarker = null;

    console.log(visData.markers);
    console.log(visData.startMarker);
    console.log(visData.endMarker);
}

// TODO eventually have way to call these, but for now just from console
function setStartMarker(time) {
    if (time === visData.endMarker) console.log("start & end times must be different");
    else visData.startMarker = time;

    console.log(visData.markers);
    console.log(visData.startMarker);
    console.log(visData.endMarker);
}
function setEndMarker(time) {
    if (time === visData.startMarker) console.log("start & end times must be different");
    else visData.endMarker = time;

    console.log(visData.markers);
    console.log(visData.startMarker);
    console.log(visData.endMarker);
}