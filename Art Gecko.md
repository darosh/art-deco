# Art Gecko [EXPERIMENTAL]

> Articulation gain compensation for BBCSO

## Usage

1. Place `Art Gecko RMS.amxd` or `Art Gecko Peak.amxd` on main track
2. Place `Art Gecko.amxd` on midi track with BBCSO VST
3. Set BBCSO VST mixer to `Global: Off`
4. Round 1 - find quitest articulation
   - Set articulation (using Art Deco or keyswitch)
   - Play note on Art Gecko keyboard (or press Play button once you have selected note on the keyboard)
     You can play just the quietest articulation if you already know which one it is
   - Or play every articulation to let the tool figure out the quietest one
   - The quietest articulation gets 0 dB compensation, louder ones get negative dB to match it
5. Round 2 - play note in each articulation (the device will automatically calculate and apply compensation)
6. Play step description
   - sets velocity and mod wheel to 100,
   - sets global gain to 0 dB,
   - sets Mix 1 to 127,
   - plays the note
   - sets Mix 1 to compensated value
7. Press Reset or Done. Done will set global gain to 12 db.
8. Move the Art Gecko device to another track and repeat the procedure from step 3.
9. There should be only one pair of Art Gecko devices in the Live set.
