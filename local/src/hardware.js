obtain(['./src/serialParser.js', 'events'], ({ serialParser }, EventEmitter)=> {
  const TEACH_BUTTON =  64;
  const SENSOR_DATA = 32;
  const REQUEST_DATA = 48;
  const CALIBRATION_WEIGHT = 16;
  const READY = 127;

  if (!window.swingHardware) {
    class Hardware extends EventEmitter {
      constructor() {
        super();
        var _this = this;
        var parser = new serialParser();

        var pressTime;

        parser.on(TEACH_BUTTON, (data)=> {
          if (data[0]) pressTime = Date.now();
          else {
            if (Date.now() - pressTime > 2000) _this.emit('LongPress');
            else _this.emit('ShortPress');
          }

          _this.buttonState = data[0];
        });

        parser.on(READY, ()=> {
          _this.emit('ready');
        });

        parser.on(SENSOR_DATA, (data)=> {
          var tot = (data[1] << 28) + (data[2] << 21) + (data[3] << 14) + (data[4] << 7) + (data[5]);
          _this.onSensorData(data[0], tot);
        });

        parser.setup({ name: 'ttyS0', baud: 115200 });

        _this.requestSensorData = ()=> {
          parser.sendPacket([1, REQUEST_DATA]);
        };

        _this.onSensorData = (which, value)=> {
          console.log(value);
        };
      }

    };

    window.swingHardware = new Hardware();
  }

  exports.hardware = window.swingHardware;
});
