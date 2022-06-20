
// this object is used to store data for drag panning
let clickData = {
    dragging: false,    // helps differentiate btw. drag & click
    clickedX: null,     // this is only non-null during a drag
    oldPanningStart: null,
};


// set mouse events for visualization
canvas.onpointerdown = function(e) {
    if (visData.totalRecordingLength === null) return;

    if (settings.visualization.margin < e.offsetX && e.offsetX < Math.min(settings.visualization.margin + visData.bars.length * (settings.visualization.barWidth + 1), canvas.width - settings.visualization.margin)) {
        // inside the roll; set clickData information
        clickData.clickedX = e.offsetX;
        clickData.oldPanningStart = visData.panningStart;
        clickData.dragging = false;
    }
}
canvas.onpointermove = function(e) {
    if (visData.totalRecordingLength === null) return;

    if (e.buttons % 2 === 1 && clickData.clickedX !== null) { 
        // user clicked + is dragging within the window
        clickData.dragging = true;

        // pan based on relationship to position on pointerdown
        let draggedPanningStart = clickData.oldPanningStart + (clickData.clickedX - e.offsetX) * (settings.visualization.barTimeStep / (1 + settings.visualization.barWidth));
        if (draggedPanningStart < 0) visData.panningStart = 0;
        else if (draggedPanningStart > visData.totalRecordingLength - settings.visualization.onscreenTime) visData.panningStart = visData.totalRecordingLength - settings.visualization.onscreenTime;
        else visData.panningStart = draggedPanningStart;

        // redraw and add dummy cursor
        draw.notRecording();
        canvasCtx.fillStyle = settings.colors.dummyCursor;
        canvasCtx.fillRect(     // draw the cursor
            e.offsetX,
            settings.visualization.margin - settings.visualization.markerPeek,
            settings.visualization.barWidth,
            canvas.height - 2 * settings.visualization.margin + 2 * settings.visualization.markerPeek
        );
    } else if (settings.visualization.margin < e.offsetX && e.offsetX < Math.min(settings.visualization.margin + visData.bars.length * (settings.visualization.barWidth + 1), canvas.width - settings.visualization.margin)) {
        // redraw and add dummy cursor
        draw.notRecording();
        canvasCtx.fillStyle = settings.colors.dummyCursor;
        canvasCtx.fillRect(     // draw the cursor
            e.offsetX,
            settings.visualization.margin - settings.visualization.markerPeek,
            settings.visualization.barWidth,
            canvas.height - 2 * settings.visualization.margin + 2 * settings.visualization.markerPeek
        );
    } else {
        // just redraw
        draw.notRecording();
    }
}
canvas.onpointerleave = function() {
    if (visData.totalRecordingLength === null) return;
    
    // redraw to get rid of dummy cursor
    draw.notRecording();

    // reset pointerdown information
    clickData.clickedX = null;
    clickData.oldPanningStart = null;
}

canvas.onpointerup = function(e) {
    // reset pointerdown information
    clickData.clickedX = null;
    clickData.oldPanningStart = null;

    // if in bounds and not a drag, set cursor to current location
    if ((settings.visualization.margin < e.offsetX && e.offsetX < Math.min(settings.visualization.margin + visData.bars.length * (settings.visualization.barWidth + 1), canvas.width - settings.visualization.margin)) && !clickData.dragging) {
        visData.cursorLocation = getClickedTime(e)
        draw.notRecording();
    }
}

function getClickedTime(e) {
    let frac = (e.offsetX - settings.visualization.margin) / (canvas.width - 2 * settings.visualization.margin);
    return visData.panningStart + (frac * settings.visualization.onscreenTime);
}


// first do visualization, then integrate mediaElement



panLeftButton.onclick = function() {
    visData.panningStart = Math.max(0, visData.panningStart - 3000)
    draw.notRecording();
}
panRightButton.onclick = function() {
    visData.panningStart = Math.min(visData.totalRecordingLength - settings.visualization.onscreenTime, visData.panningStart + 3000)
    draw.notRecording();
}