'use strict';

var remote = require('electron').remote;
var fs = require('fs');

var process = remote.process;

//remote.getCurrentWindow().closeDevTools();

var appData = '../ForBoot/appData';

if (fs.existsSync('/boot/appData/config.js')) {
  console.log('on pi');
  appData = '/boot/appData';
}

var obtains = [
  './src/swingSensor.js',
  'µ/commandClient.js',
  `${appData}/config.js`,
  'µ/components',
];

obtain(obtains, ({ swing }, { MuseControl }, { config })=> {
  var control = new MuseControl(config.server);

  exports.app = {};

  var tracks = [];

  exports.app.start = ()=> {
    var syncInt = null;
    var startTime = 0;

    var ctrlFunc = (swing, audio)=> {

    };

    var setupFunc = (track, num)=> {
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
    };

    control.onConnect = ()=> {
      control.send({ _id: config._id });

      syncInt = setInterval(control.synchronize, 60000);
    };

    var syncPlayback = function () {
      if (startTime) {
        console.log('Syncing playback');
        var timeOffset = (control.getServerTime() - startTime) / 1000;
        console.log(this.duration);
        console.log(timeOffset);
        this.currentTime = timeOffset % this.duration;
        console.log(timeOffset % this.duration);
        this.play();
      } else this.play();

    };

    control.addListener('audioConfig', (data)=> {
      console.log('Configuring audio');
      //console.log(data);
      if (data.setupFunc) {
        setupFunc = eval('//# sourceURL=remoteSetup\n ()=>{ \nreturn ' + data.setupFunc + '}')();
      }

      if (data.ctrlFunc) {
        ctrlFunc = eval('//# sourceURL=remoteInstructions\n ()=>{ \nreturn ' + data.ctrlFunc + '}')();
      }

      if (data.startPlayTime) startTime = data.startPlayTime;

      while (tracks.length < data.tracks.length) {
        tracks.push(new Audio());
      }

      tracks.forEach(setupFunc);
      if (data.syncTracks) {
        tracks.forEach((track, i)=> {
          if (!track.syncSet) {
            //µ('body')[0].appendChild(track);
            if (data.startPlayTime) track.addEventListener('loadeddata', syncPlayback.bind(track));
            track.onended = syncPlayback.bind(track);
          }
        });
      }

      data.tracks.forEach((name, i)=>tracks[i].src = name);

      //track.loop = true;
    });

    control.addListener('startPlayTime', (time)=> {
      if (tracks.length) {
        startTime = time;
        tracks.forEach(track=> {
          if (track.sync) track.addEventListener('loadeddata', syncPlayback.bind(track));
        });

      }
    });

    control.addListener('volumeUp', (time)=> {
      if (tracks.length) {
        tracks.forEach(track=> {
          if (track.maxVolume) track.maxVolume += .1;
          else track.maxVolume = .1;
          if (track.maxVolume > 1) track.maxVolume = 1;

          if (track.volume > track.maxVolume) track.volume = track.maxVolume;
        });

      }

    });

    control.addListener('volumeDown', (time)=> {
      if (tracks.length) {
        tracks.forEach(track=> {
          if (track.maxVolume) track.maxVolume -= .1;
          else track.maxVolume = .1;
          if (track.maxVolume < .1) track.maxVolume = .1;
          if (track.volume > track.maxVolume) track.volume = track.maxVolume;
        });

      }

    });

    control.connect();

    var pollInt = setInterval(()=> {
      µ('#track').style.left = (µ('#outer').offsetWidth / 2 + µ('#outer').offsetWidth * swing.point.x + 5) + 'px';
      µ('#track').style.top = (µ('#outer').offsetHeight / 2 - µ('#outer').offsetHeight * swing.point.y + 5) + 'px';
      µ('#weight').textContent = swing.totalWeight();
    }, 100);

    var high = false;
    var active = true;
    var lastHigh = 0;

    var posCheckInt = setInterval(()=> {
      ctrlFunc(swing, tracks);
    }, 100);

    console.log('started');

    document.onkeydown = (e)=> {
      console.log('down');
    };

    document.onkeyup = (e)=> {
      console.log('up');
      if (e.which == 27) {
        var electron = require('electron');
        process.kill(process.pid, 'SIGINT');
      } else if (e.which == 73 && e.getModifierState('Control') &&  e.getModifierState('Shift')) {
        remote.getCurrentWindow().toggleDevTools();
      }
    };

    process.on('SIGINT', ()=> {
      process.nextTick(function () { process.exit(0); });
    });
  };

  provide(exports);
});
