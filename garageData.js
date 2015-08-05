var sensorLib = require('node-dht-sensor');
var logger = require("./logger");
var cfg = require('./config.default');

module.exports = sensor;

// Code for Wireless signal, Uptime, and CPU temperature
//var sys = require('sys');
//var exec = require('child_process').exec;
//awk 'NR==3 {print $3}''' 
// /proc/net/wireless (3rd line, 3rd item = wireless level in %)
// /proc/uptime (1st line, 1st item = uptime in seconds)
// /sys/class/thermal/thermal_zone0/temp (only item in milidegrees C (x/1000))
// to run external commands in node.js, check out:
// http://stackoverflow.com/questions/20643470/execute-a-command-line-binary-in-node-js
// http://www.dzone.com/snippets/execute-unix-command-nodejs


var sensor = {
    initialize: function () {
        return sensorLib.initialize(cfg.sensor.type, cfg.sensor.gpio);
    },
    read: function () {
        var readout = sensorLib.read();
        logger.info('Temperature: ' + readout.temperature.toFixed(2) + 'C, ' +
            'humidity: ' + readout.humidity.toFixed(2) + '%');
        setTimeout(function () {
            sensor.read();
        }, 2000);
    }
};

if (sensor.initialize()) {
    sensor.read();
} else {
    logger.warn('Failed to initialize sensor');
}