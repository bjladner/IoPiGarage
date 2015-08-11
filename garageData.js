var exec = require('child_process').exec;
var sensorLib = require('node-dht-sensor');
var logger = require("./logger");
var cfg = require('./config.default');

module.exports = garageData;

function garageData() {
    this.wifi = 'not measured';
    this.uptime = 'not measured';
    this.cpuTemp = 'not measured';
    this.temperature = 'not measured';
    this.humidity = 'not measured';
    this.lastUpdate = 'not measured';

    this.sensorAvailable = sensorLib.initialize(cfg.sensor.type, cfg.sensor.gpio);
    if (!this.sensorAvailable) {
        logger.warn('Failed to initialize sensor');
    }
}

garageData.prototype.updateData = function(callback) {
//garageData.prototype.updateData = function() {
    var self = this;
	
    // Code for Wireless signal, Uptime, and CPU temperature
    //awk 'NR==3 {print $3 "0 %"}''' /proc/net/wireless 
    var wifiCmd = 'awk \'NR==3 {print \$3}\'\'\' /proc/net/wireless'; // (3rd line, 3rd item = wireless level in %)
    var uptimeCmd = 'awk \'{print \$1}\'\'\' /proc/uptime'; // (1st line, 1st item = uptime in seconds)
    var cpuTempCmd = 'cat /sys/class/thermal/thermal_zone0/temp'; // (only item in milidegrees C (x/1000))
    // to run external commands in node.js, check out:
    // http://stackoverflow.com/questions/20643470/execute-a-command-line-binary-in-node-js

    this.lastUpdate = new Date();
    exec(wifiCmd, function(error, stdout, stderr) {
	if (error)
	    logger.error("error in wifiCmd:" + error);
        self.wifi = parseFloat(stdout).toFixed(1); // + "%";
    });
    exec(uptimeCmd, function(error, stdout, stderr) {
	if (error)
	    logger.error("error in uptimeCmd:" + error);
        // change from seconds to days, hours, minutes, seconds
        self.uptime = readify(parseFloat(stdout));
    });
    exec(cpuTempCmd, function(error, stdout, stderr) {
	if (error)
	    logger.error("error in cpuTempCmd:" + error);
        self.cpuTemp = (parseFloat(stdout)/1000).toFixed(1) + "C";
    });
    if (this.sensorAvailable) {
        var readout = sensorLib.read();
        self.temperature = readout.temperature.toFixed(1) + "C";
        self.humidity = readout.humidity.toFixed(1) + "%";
    } else {
        self.temperature = "Sensor Failed";
        self.humidity = "Sensor Failed";
    }		
    callback();
}

// Takes an amount of seconds and turns it into a human-readable amount of time.
function readify(seconds) {
	var dayLength = 60 * 60 * 24;
	var hourLength = 60 * 60;
	var minuteLength = 60;
	var days = Math.floor(seconds / dayLength);
	seconds = seconds % dayLength;
	var hours = Math.floor(seconds / hourLength);
	seconds = seconds % hourLength;
	var minutes = Math.floor(seconds / minuteLength);
	seconds = seconds % minuteLength;
	
	return (days + "d " + hours + "h " + minutes + "m " + seconds.toFixed()  + "s");
}
