
// dragging controls should not apply when the roll is not big enough

// next order of business:
// link to audio element, and you want it to scroll while playing, with cursor like 3/4 of the way through unless not possible or something.
// be mindful of speed setting

// maybe you should migrate all the visualization code to its own
// files and repo. That will make it reusable and configurable

// different shapes for the bars? Cool
// TODO visual indications of start and end. Just, in draw.notRecording, detect if at start and draw something if so, and ditto for end.


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
        let panningOffset = (clickData.clickedX - e.offsetX) * (settings.visualization.barTimeStep / (1 + settings.visualization.barWidth))
        let draggedPanningStart = clickData.oldPanningStart + panningOffset;
        let overscrollShadowX = null;
        if (visData.totalRecordingLength < settings.visualization.onscreenTime) {
            // can't pan, so draw overscroll shadow in appropriate direction
            overscrollShadowX = (panningOffset < 0) ? settings.visualization.margin : settings.visualization.margin + visData.bars.length * (1 + settings.visualization.barWidth);
        } else if (draggedPanningStart < 0) {
            visData.panningStart = 0;
            overscrollShadowX = settings.visualization.margin;
        } else if (draggedPanningStart > visData.totalRecordingLength - settings.visualization.onscreenTime) {
            visData.panningStart = visData.totalRecordingLength - settings.visualization.onscreenTime;
            overscrollShadowX = canvas.width - settings.visualization.margin - settings.visualization.shadowBoxWidth;
        } else visData.panningStart = draggedPanningStart;

        // redraw and add dummy cursor after panningStart was updated
        draw.notRecording(overscrollShadowX);

        // add dummy cursor if still applicable
        if (settings.visualization.margin < e.offsetX && e.offsetX < Math.min(settings.visualization.margin + visData.bars.length * (settings.visualization.barWidth + 1), canvas.width - settings.visualization.margin)) {
            canvasCtx.fillStyle = settings.colors.dummyCursor;
            canvasCtx.fillRect(     // draw the cursor
                e.offsetX,
                settings.visualization.margin - settings.visualization.markerPeek,
                settings.visualization.barWidth,
                canvas.height - 2 * settings.visualization.margin + 2 * settings.visualization.markerPeek
            );
        }
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
    }

    draw.notRecording();
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