# TODO


// only your own play and pause buttons are valid

// there's a bug with pausing multiple times while recording... i think recordingLength might be set wrong or something




// different shapes for the bars? Cool
// TODO visual indications of start and end. Just, in draw.notRecording, detect if at start and draw something if so, and ditto for end.




// next: implement panning

maybe double tap to add marker?

maxBar stuff - is 0 when no bars, updates when bars added, reset to 0 when re-record
then renderBars function
then while recording functions

How to allow user to implement start and end markers?
- buttons on each marker that say "start" and "end"
- drag & drop ends of snippet bracket. This could work pretty well actually, have obviously movable item at ends. cool animations when snapping back oooh
up until you decide, you can just directly call the functions from the console

start with just an add marker button that adds a marker wherever the track cursor is. Later you can think about things like shift+click to add a marker, etc.


Visual elements to add (draw it out, then implement):
- visualization and relative position of buttons (decide on button groupings)
- recording visual indicator
- looping visual indicator
- choosable brackets indicating snippets - maybe better way to do it is to indicate start & end markers, so make those clickable, and the bracket shows up based on those markers
- when there's an active snippet, on the bottom half of the screen there's a visualization specific to that snippet of higher resolution! Below that can be snippet-related controls, like naming, saving, etc.



place to enter names for snippets? Then have more features like







## Stuff in settings
- speed min/maxes
- set looping as default behavior?