var exec = require('child_process').exec;
var sensorLib = require('node-dht-sensor');
var logger = require("./logger");
var cfg = require('./config.default');

module.exports = garageData;

function garageData(clientName) {
    // Code for Wireless signal, Uptime, and CPU temperature
    //awk 'NR==3 {print $3 "0 %"}''' /proc/net/wireless 
    var wifiCmd = 'awk \'NR==3 {print \$3}\'\'\' /proc/net/wireless' // (3rd line, 3rd item = wireless level in %)
    //var wifiCmd = 'cat /proc/net/wireless' // (3rd line, 3rd item = wireless level in %)
    var uptimeCmd = 'cat /proc/uptime' // (1st line, 1st item = uptime in seconds)
    var cpuTempCmd = 'cat /sys/class/thermal/thermal_zone0/temp' // (only item in milidegrees C (x/1000))
    // to run external commands in node.js, check out:
    // http://stackoverflow.com/questions/20643470/execute-a-command-line-binary-in-node-js

	this.name = clientName;
	this.wifi = '';
	this.uptime = '';
	this.cpuTemp = '';
	this.temperature = '';
	this.humidity = '';
    this.lastUpdate = new Date();

    this.sensorAvailable = sensorLib.initialize(cfg.sensor.type, cfg.sensor.gpio);
    if (!this.sensorAvailable) {
        logger.warn('Failed to initialize sensor');
    }
    
    this.updateData();

}

garageData.prototype.updateData = function() {
    exec(this.wifiCmd, function(error, stdout, stderr) {
        this.wifi = stdout + "0%";
    });
    exec(this.uptimeCmd, function(error, stdout, stderr) {
        // split stdout between 2 numbers (use 1st number)
        var uptimeString = stdout.split(" ");
        // change from seconds to days, hours, minutes, seconds
        this.uptime = readify(parseFloat(uptimeString[0]));
    });
    exec(this.cpuTempCmd, function(error, stdout, stderr) {
        var currentCpuTemp = parseFloat(stdout)/1000;
        this.cpuTemp = currentCpuTemp.toFixed(1) + "C";
    });
    if (this.sensorAvailable) {
        var readout = sensorLib.read();
        this.temperature = readout.temperature.toFixed(1) + "C";
        this.humidity = readout.humidity.toFixed(1) + "%";
    }
    logger.debug(this.name + " Data updated " + this.lastUpdate.toLocaleTimeString());
    logger.debug("Wifi: "+ this.wifi + ", Uptime: " + this.uptime + ", CPU Temp: " + this.cpuTemp + ", Amb Temp: " + this.temperature + ", Amb Humidity: " + this.humidity);
}

// Takes an amount of seconds and turns it into a human-readable amount of time.
function readify(seconds) {
    var value = 0;
    var time = [];
     
    // the pieces of time to iterate over (days, hours, minutes, etc)
    // - the first piece in each tuple is the suffix (d, h, w)
    // - the second piece is the length in seconds (a day is 60s * 60m * 24h)
    var parts = [
        {suffix: 'd', len: 60 * 60 * 24},
        {suffix: 'h', len: 60 * 60},
        {suffix: 'm', len: 60},
        {suffix: 's', len: 1}];
     
    // for each time piece, grab the value and remaining seconds, and add it to the time string
    for (var part in parts) {
        value = seconds / part.len;
        if (value > 0) {
            seconds = seconds % part.len;
            time.append(value + part.suffix)
        }
    }
    return time.join(' ')
}
