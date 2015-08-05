var GPIO = require('onoff').Gpio;
var logger = require("./logger");

const openState = 0;
const closedState = 1;

module.exports = garageDoor;

function garageDoor(data) {
    this.deviceID = data.deviceID;
    this.name = data.name;
    this.type = data.type;
    this.sensor = new GPIO(data.statePin, 'in', 'both');
    this.relay = new GPIO(data.relayPin, 'out');
    this.Status = "Open"; // 'Open' or 'Closed'
    this.lastStateChange = new Date().getTime();
}

garageDoor.prototype.changeStatus = function() {
    var self = this;
    logger.info("Changing state of " + this.name + " using pin " + this.relay.gpio);
    this.relay.writeSync(1);
    setTimeout(function () {
        self.relay.writeSync(0);
    }, 750);
}

garageDoor.prototype.getStatus = function(callback) {
    var self = this;
    logger.debug("Getting state of door " + this.name + " using pin " + this.sensor.gpio);
    var value = this.sensor.readSync();
    if (value == closedState) self.Status = "Closed";
    else if (value == openState) self.Status = "Open";
    else self.Status = "Unknown";
    logger.debug("State of " + self.name + " is " + self.Status);
    callback();
}

garageDoor.prototype.watchSensor = function(callback) {  
    var self = this;
    this.sensor.watch(function (err, state) {
        if (state == closedState) self.Status = "Closed";
        else if (state == openState) self.Status = "Open";
        else self.Status = "Unknown";
		var currentTime = new Date().getTime();
		if (currentTime > self.lastStateChange + 1000) {
            self.lastStateChange = currentTime;
            logger.info(self.name + " changed state to " + self.Status);
            callback(null, self);
		}
    });
}
