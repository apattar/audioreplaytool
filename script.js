/* This file contains all scripting for the Audio Replay Tool.
 * Author: Antara Pattar (apattar on github)
 */

// grab elements from dom
let audio = document.getElementById("main-audio");
let recordButton = document.getElementById("record");
let playPauseRecordingButton = document.getElementById("play-pause-recording");
let stopButton = document.getElementById("stop");
let addMarkerButton = document.getElementById("add-marker");
let loopButton = document.getElementById("loop");
let playPauseButton = document.getElementById("play-pause");
let speedRange = document.getElementById("speed-range");
let loopSnippetButton = document.getElementById("loop-snippet");
let playPauseSnippetButton = document.getElementById("play-pause-snippet");

let tempMarkerListPara = document.getElementById("temp-marker-list");


// initialize settings
// TODO maybe load from localStorage?
settings = {
    minSpeed: 0.5,
    maxSpeed: 2,
    speedResolution: 50,
    speedStep: _ => (settings.maxSpeed - settings.minSpeed) / settings.speedResolution,
};
speedRange.min = 0;
speedRange.max = settings.speedResolution;


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
        }
        playPauseRecordingButton.onclick = function() {
            if (mediaRecorder.state === "paused") {
                mediaRecorder.resume();
                console.log("resumed recording");
            } else {
                mediaRecorder.pause();
                console.log("paused recording");
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
    // TODO make this a log scale
    audio.playbackRate = settings.minSpeed + Number(speedRange.value) * settings.speedStep();
    console.log(audio.playbackRate);
});