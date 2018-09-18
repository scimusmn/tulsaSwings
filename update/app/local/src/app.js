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

var cfg = remote.getGlobal('config');

var obtains = [
  './src/swingSensor.js',
  'µ/commandClient.js',
  // `${appData}/config.js`,
  './src/control_2.js',
  // 'electron',
  'µ/utilities.js',
  'µ/components',
];

obtain(obtains, ({ swing }, { MuseControl }, ctrl, { map, distance, clamp })=> {

  var control = new MuseControl(cfg.server);

  exports.app = {};

  var tracks = [];

  //remote.getCurrentWindow().hide();

  exports.app.start = ()=> {
    var syncInt = null;
    var startTime = 0;

    var ctrlFunc = ctrl.func;

    var setupFunc = ctrl.setup;

    control.onConnect = ()=> {
      control.send({ _id: cfg._id });

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

      tracks.length = 0;

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

    /*control.addListener('volumeUp', (time)=> {
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

    });*/

    //////////////////////////////////////////////////
    //local track handling

    for (var i = 0; i < ctrl.tracks.length; i++) {
      tracks.push(new Audio());
    }

    tracks.forEach(setupFunc);

    //control.connect();

    var pollInt = setInterval(()=> {
      µ('#track').style.left = (µ('#outer').offsetWidth / 2 + µ('#outer').offsetWidth * swing.point.x * 3 + 5) + 'px';
      µ('#track').style.top = (µ('#outer').offsetHeight / 2 - µ('#outer').offsetHeight * swing.point.y * 3 + 5) + 'px';
      //µ('#weight').textContent = swing.totalWeight();
    }, 100);

    var high = false;
    var active = true;
    var lastHigh = 0;

    var posCheckInt = setInterval(()=> {
      ctrl.func(swing, tracks);
    }, 50);

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
