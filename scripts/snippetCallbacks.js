// should be able to remove this code for
// the full functionality, but just
// without all the snippet stuff


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
