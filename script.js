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
let tempMarkerListCtnr = document.getElementById("temp-marker-list");

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
        barTimeStep: 100,   // milliseconds
        barWidth: 4,       // pixels
    },
};
speedRange.min = 0;
speedRange.max = settings.speed.resolution;


// get canvas drawing context
const canvas = document.querySelector("#learning");
const canvasCtx = canvas.getContext("2d");


// next order of business:
// so get the bars thing working (only have to worry about record, pause, resume, stop), then update markers, then write the "draw" function
// update markers, write "draw". Now markers should probably be stored in milliseconds

// initialize model for visualization data
let visData = {
    recordingLength: null, // in milliseconds
    
    recordStartTime: null, // time that "record" or "resume" was hit, in milliseconds since start of 1970 (this is just how Date.now() works in js)
    recordOffset: null,    // optional offset; set this when you hit "pause"
    bars: [],
    dataBuffer: null,
    analyzer: null,
    updateBars: function() {
        // push stuff into bars based on its length and time elapsed since start of recording
        let timeElapsed = Date.now() - visData.recordStartTime;
        timeElapsed += visData.recordOffset;

        let barsToAdd = Math.floor(timeElapsed / settings.visualization.barTimeStep) - visData.bars.length;

        visData.analyzer.getByteFrequencyData(visData.dataBuffer);
        let sum = 0; for (let i = 0; i < visData.dataBuffer.length; i++) { sum += visData.dataBuffer[i]; }
        for (let i = 0; i < barsToAdd; i++) visData.bars.push(sum);

        console.log(visData.bars);
    },
    updateIntervalID: null,


    cursorLocation: 0,  // stored in terms of seconds
    panningStart: 0,    // in seconds
    // markers should be a part of this, TODO update markers

    // next order of business: write the "draw" function
    // using settings etc.
    // you know what actually, should get "bars" to work correctly first in terms of timing
    draw: function() {

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

            // initialize appropriate stuff in visData
            visData.bars = [];
            visData.recordStartTime = Date.now();
            visData.recordOffset = 0;
            visData.updateIntervalID = window.setInterval(visData.updateBars, settings.visualization.barTimeStep);
        }
        playPauseRecordingButton.onclick = function() {
            if (mediaRecorder.state === "paused") {
                mediaRecorder.resume();
                console.log("resumed recording");

                visData.recordStartTime = Date.now();
                visData.updateIntervalID = window.setInterval(visData.updateBars, settings.visualization.barTimeStep);
            } else {
                mediaRecorder.pause();
                console.log("paused recording");

                visData.recordOffset += Date.now() - visData.recordStartTime;
                window.clearInterval(visData.updateIntervalID);
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

            visData.recordingLength = Date.now() - visData.recordStartTime;
            visData.recordingLength += visData.recordOffset;
            window.clearInterval(visData.updateIntervalID);

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
markers = new Map();    // maps times to associated DOM elements
startMarker = null;
endMarker = null;
addMarkerButton.onclick = function() {
    let time = audio.currentTime;
    if (markers.has(time)) {
        console.log("marker already exists");
        return;
    }

    // TODO change when creating visualization
    newMarkerButton = document.createElement("button");
    newMarkerButton.innerHTML = time;
    newMarkerButton.setAttribute("data-time", time); // necessary?
    tempMarkerListCtnr.appendChild(newMarkerButton);

    markers.set(time, newMarkerButton);
    newMarkerButton.onclick = function() {
        tempMarkerListCtnr.removeChild(newMarkerButton);
        if (!markers.delete(time)) console.log("error deleting");

        // check if need to remove active snippet
        if (markers.size === 1) {
            startMarker = null;
            endMarker = null;
        }
    }

    // if just reached enough for a snippet, set first active snippet
    if (markers.size === 2) {
        startMarker = Math.min(markers.keys());
        endMarker = Math.max(markers.keys());
    }   // otherwise, keep start and end markers the same
}
clearMarkersButton.onclick = function() {
    markers.forEach(function(marker) {
        tempMarkerListCtnr.removeChild(marker);
    });
    markers.clear();
    startMarker = null;
    endMarker = null;
}

// TODO eventually have way to call these, but for now just from console
function setStartMarker(time) {
    if (time === endMarker) console.log("start & end times must be different");
    else startMarker = time;
}
function setEndMarker(time) {
    if (time === startMarker) console.log("start & end times must be different");
    else endMarker = time;
}