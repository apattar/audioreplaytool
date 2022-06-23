
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
            visData.totalRecordingLength = null;
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
                console.log(visData.recordOffset);
                window.clearInterval(visData.updateIntervalID);
                window.clearInterval(visData.drawRecordingIntervalID);
            }
        }
        stopButton.onclick = function() {
            visData.totalRecordingLength = (mediaRecorder.state === "paused") ? visData.recordOffset : Date.now() - visData.recordStartTime + visData.recordOffset;
            
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
        draw.startPlayingAnimation();
    } else {
        audio.pause();
    }
}
speedRange.addEventListener("input", function() {
    // TODO make this a quadratic scale? also need visual indications
    audio.playbackRate = settings.speed.min + Number(speedRange.value) * settings.speed.step();
    console.log(audio.playbackRate);
});

