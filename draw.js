
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
    notRecording: function(overscrollShadowX) {
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        // scrollbar/dragging panning features kick in here

        // draw overscroll shadow if applicable
        if (overscrollShadowX) {
            canvasCtx.shadowColor = settings.colors.overscrollShadow;
            canvasCtx.shadowBlur = settings.visualization.overscrollShadowBlur;
            canvasCtx.fillStyle = settings.colors.visBG;
            canvasCtx.fillRect(
                overscrollShadowX,
                settings.visualization.margin,
                settings.visualization.shadowBoxWidth,
                canvas.height - 2 * settings.visualization.margin
            );
            canvasCtx.shadowColor = null;
            canvasCtx.shadowBlur = null;
        }

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
    },

    overscrollShadow: function(offset) {
        if (offset < 0) {
                
        } else if (offset > 0) {

        }
    },
}
