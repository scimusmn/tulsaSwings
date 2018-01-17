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
  var control = new MuseControl('sensor-server.net');

  exports.app = {};

  var track = null;

  exports.app.start = ()=> {
    var syncInt = null;
    var startTime = 0;

    var ctrlFunc = (swing, audio)=> {
      /*var swingDist = Math.sqrt(Math.pow(swing.point.x, 2) + Math.pow(swing.point.y, 2));
      if (swingDist > .10 && !swing.high && Date.now() - swing.lastHigh > 100) {
        swing.lastHigh = Date.now();
        if (!swing.active) {
          swing.active = true;
          audio.rampUp();
          console.log('start');
        }

        swing.high = true;
      } else if (swingDist < .1) {
        swing.high = false;
      }

      if (Date.now() - swing.lastHigh > 5000 && swing.active) {
        swing.active = false;
        audio.rampDown();
        console.log('stop');
      }

      if (!swing.lastHigh) swing.lastHigh = Date.now();*/
    };

    control.onConnect = ()=> {
      control.send({ _id: config._id });
      syncInt = setInterval(control.synchronize, 60000);
    };

    var syncPlayback = ()=> {
      var timeOffset = (control.getServerTime() - startTime) / 1000;
      console.log(track.duration);
      console.log(timeOffset);
      track.currentTime = timeOffset % track.duration;
      console.log(timeOffset % track.duration);
      track.play();
    };

    control.addListener('audioFile', (data)=> {
      //console.log(data);
      if (track) track.pause();
      track = new Audio(data);
      //track.loop = true;
      track.rampTime = 2;
      track.rampUp = ()=> {
        track.volume = Math.min(1, Math.max(0, track.volume + .01));
        clearTimeout(track.ramperTO);
        if (track.volume < 1) track.ramperTO = setTimeout(track.rampUp, track.rampTime * 10);
      };

      track.rampDown = ()=> {
        track.volume = Math.min(1, Math.max(0, track.volume - .01));
        clearTimeout(track.ramperTO);
        if (track.volume > 0) track.ramperTO = setTimeout(track.rampDown, track.rampTime * 10);
      };

      track.onended = syncPlayback;
      track.volume = 1;
    });

    control.addListener('startPlayTime', (time)=> {
      if (track) {
        startTime = time;
        setTimeout(syncPlayback, 500);
      }
    });

    control.addListener('controlFunc', (func)=> {
      ctrlFunc = eval('//# sourceURL=remoteInstructions\n ()=>{ \nreturn ' + func + '}')();
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
      ctrlFunc(swing, track);
    }, 100);

    console.log('started');

    document.onkeypress = (e)=> {
      if (e.key == ' ') console.log('Space pressed');
    };

    document.onkeyup = (e)=> {
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
