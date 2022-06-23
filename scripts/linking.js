// linking the visualization with the audio element


// maybe instead, start animation where draw.cursorAnimation is called regularly, and stop it when ends or is paused



// let's think for a minute about how I want the autopanning to work.
// I want it to be able to work with the user's panning.
// have a default fraction on the screen. start with it being 1/2.
// if before the default fraction, just don't pan until it gets there.
// if after the default fraction, then just pan faster than the speed of the cursor until it's at the default fraction. Then pan at the same speed as the cursor. In other words, very slowly reduce the distance between the cursor and panningStart

// if it's after the screen or before the screen, don't follow the cursor.

// maybe you could do some sort of velocity thing where it always accelerates and tries to right itself to the default position, and once it reaches there, it stays at constant speed