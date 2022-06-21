// linking the visualization with the audio element.

audio.ontimeupdate = function() {
    console.log("called");
    visData.cursorLocation = audio.currentTime * 1000;
    draw.notRecording();
}