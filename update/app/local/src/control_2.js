obtain(['µ/utilities.js'], ({ averager, map, distance, clamp })=> {

  var lightBrt = 0;

  exports.tracks = [
    `./audio/chime1.mp3`,
    `./audio/chime2.mp3`,
    `./audio/chime3.mp3`,
    `./audio/chime4.mp3`,
  ];

  var hue = 0;
  var sat = 0;

  exports.func = (swing, audio)=> {
    var dist = clamp(distance({ x: 0, y: 0 }, swing.point) * 8, 0, 1);
    var deg = Math.atan2(swing.point.y, swing.point.x) * (180 / Math.PI); // In radians
    if (deg <= 0) deg += 360;

    if (swing.totalWeight() > 20 && !swing.active) {
      for (var i = 0; i < audio.length; i++) {
        var area = (i + .5) * 2 * Math.PI / audio.length;
        var dist = clamp(distance({ x: Math.cos(area) / 5, y: Math.sin(area) / 5 }, swing.point), 0, 1);
        //console.log(dist);
        if (dist < .15 && !audio[i].struck) {
          audio[i].struck = true;
          audio[i].currentTime = 0;
          audio[i].play();
          lightBrt = 127;
          hue = Math.floor((i + .5) * 127 / audio.length);
          sat = 127;
        } else if (dist > .25 && audio[i].struck) audio[i].struck = false;
      }
    }

    // swing.weights().forEach((val, i)=> {
    //   console.log(`${i}: ${val}`);
    // });
    // console.log(`Total: ${swing.totalWeight()}`);

    //console.log(Math.floor(map(deg, 0, 359, 0, 127)));
    //console.log(swing.totalWeight());
    //var deg = rad * (180 / Math.PI)
    if (lightBrt > 0) lightBrt--;
    swing.setLights(hue, sat, Math.floor(lightBrt));

  };

  exports.setup = (track, num)=> {
    track.maxVolume = 1;
    track.volume = 1;
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

    track.addEventListener('loadeddata', ()=> {
      console.log('loaded');
    });
    track.src = exports.tracks[num];
    track.onended = ()=> {
    };
  };

});
