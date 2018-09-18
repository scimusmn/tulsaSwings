obtain(['µ/utilities.js'], ({ averager, map, distance, clamp })=> {

  var lightBrt = 0;

  exports.func = (swing, audio)=> {
    var dist = clamp(distance({ x: 0, y: 0 }, swing.point) * 8, 0, 1);
    var deg = Math.atan2(swing.point.y, swing.point.x) * (180 / Math.PI); // In radians
    if (deg <= 0) deg += 360;

    if (swing.totalWeight() > 15 && !swing.active) {
      swing.active = true;
      audio[0].rampUp();
      swing.lastHigh = Date.now();
    } else if (swing.lastHigh && Date.now() - swing.lastHigh > 1000) {
      swing.active = false;
      audio[0].rampDown();
      //swing.setLights(map(deg, 0, 360, 0, 127), 0, audio[0].volume * 127);
    }

    if (swing.totalWeight() > 15 && lightBrt < 127) lightBrt++;
    if (swing.totalWeight() < 15 && lightBrt > 0) lightBrt--;
    swing.setLights(Math.floor(map(deg, 0, 359, 0, 127)), Math.floor(clamp(dist * 2, 0, 1) * 127), Math.floor(lightBrt));

  };

  exports.setup = (track, num)=> {
    track.maxVolume = 1;
    track.volume = 0;
    track.rampTime = 2;
    track.rampUp = ()=> {
      track.volume = Math.min(track.maxVolume, Math.max(0, track.volume + .01));
      clearTimeout(track.ramperTO);
      if (track.volume < track.maxVolume) track.ramperTO = setTimeout(track.rampUp, track.rampTime * 10);
    };

    track.rampDown = ()=> {
      track.volume = Math.min(track.maxVolume, Math.max(0, track.volume - .01));
      clearTimeout(track.ramperTO);
      if (track.volume > 0) track.ramperTO = setTimeout(track.rampDown, track.rampTime * 10);
    };

    if (!track.syncSet) {
      //µ('body')[0].appendChild(track);
      track.addEventListener('loadeddata', ()=> {

        track.play();
      });
      track.src = exports.tracks[num];
      track.onended = ()=> {
        track.src = exports.tracks[num];
        if (num == exports.tracks.length - 1) playAll();
      };
    }
  };

  exports.tracks = [
    `./audio/track-00.mp3`,
  ];

});
