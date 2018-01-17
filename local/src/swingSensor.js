obtain(['./src/hardware.js', 'µ/utilities.js', 'fs'], ({ hardware }, { averager }, fs)=> {
  if (!window.swing) {
    var Swing = function () {
      var _this = this;

      var raw = [];
      var tares = [];
      var init = [];
      var scale = [];

      var readInterval = null;

      var confDir = './sensorCalibrations.json';

      for (let i = 0; i < 3; i++) {
        raw[i] = new averager(3);
        tares[i] = 0;
        init[i] = 0;
        scale[i] = 8000;
      };

      if (fs.existsSync(confDir)) {
        let data = fs.readFileSync(confDir); //file exists, get the contents
        var calib = JSON.parse(data);
        scale = calib.scale.slice(0);
        tares = calib.tares.slice(0);
      }

      _this.calibrate = ()=> {
        console.log('Calibrating...');
        raw.forEach((val, i)=> {
          tares[i] = init[i];
          scale[i] = 3 * (raw[i].ave - tares[i]) / 25;
        });

        var calib = {};
        calib.scale = scale;
        calib.tares = tares;
        fs.writeFileSync(confDir, JSON.stringify(calib));
        //save calibration here
      };

      hardware.on('ShortPress', _this.calibrate);

      hardware.on('ready', ()=> {
        console.log('Got the ready signal');
        readInterval = setInterval(hardware.requestSensorData, 100);
        setTimeout(_this.recordInitial, 2000);
      });

      _this.recordInitial = ()=> {
        init.forEach((val, i)=>init[i] = raw[i].ave);
      };

      _this.weights = ()=> raw.map((cell, i)=>(cell.ave - tares[i]) / scale[i]);

      _this.totalWeight = ()=>_this.weights().reduce((acc, cur)=>acc + cur, 0);

      _this.point = {
        get x() {
          var w = _this.weights();

          return ((-.866 * w[0]) + (0.866 * w[1])) / (_this.totalWeight());
        },

        get y() {
          var w = _this.weights();
          return ((.5 * w[0]) + (.5 * w[1]) + (-1 * w[2])) / (_this.totalWeight());
        },
      };

      hardware.onSensorData = (which, value)=> {
        raw[which - 1].addSample(value);
      };
    };

    window.swing = new Swing();
  }

  exports.swing = window.swing;

});