exports.config = {
  piFig: {
    /*wifiHotspot: {
      ssid: 'SensorServer',
      password: 'defaultPass',
      domainName: 'sensor-server.net',
    },*/
    autostart: true,
    gitWatch: true,
    /*softShutdown: {
      monitorPin: 24,
      controlPin: 25,
      delayTime: 1000,
    },*/
    wifi: {
      ssid: 'SensorServer',
      password: 'defaultPass',
    },
  },
};
