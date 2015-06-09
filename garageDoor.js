var GPIO = require('onoff').Gpio;
var logger = require("./logger");

const openState = 1;
const closedState = 0;

var tempState = closedState;

module.exports = garageDoor;

function garageDoor(data) {
    this.deviceID = data.deviceID;
    this.name = data.name;
    this.type = data.type;
    this.statePin = data.statePin;
    this.relayPin = data.relayPin;
    this.sensor = new GPIO(this.statePin, 'in', 'both');
    this.relay = new GPIO(this.relayPin, 'out');
    this.signalStrength = 85; // TODO: find function to read wifi signal strength
    this.Status = "Open"; // 'Open' or 'Closed'
    this.lastStateChange = new Date().getTime();
}

garageDoor.prototype.changeStatus = function(callback) {
    var self = this;
    logger.info("Changing state of " + this.name + " using pin " + this.relayPin);
    //tempState = !tempState;
    this.relay.writeSync(1);
    setTimeout(function () {
        self.relay.writeSync(0);
    }, 750);
    callback();
}

garageDoor.prototype.getStatus = function(callback) {
    var self = this;
    logger.debug("Getting state of door " + this.name + " using pin " + this.statePin);
    //var value = tempState;
    var value = this.sensor.readSync();
    if (value == closedState) self.Status = "Closed";
    else if (value == openState) self.Status = "Open";
    else self.Status = "Unknown";
    logger.debug("State of " + self.name + " is " + self.Status);
    callback();
}

garageDoor.prototype.watchSensor = function(callback) {  
    var self = this;
    var currentStatus = this.Status;
    this.sensor.watch(function (err, state) {
        if (state == closedState) self.Status = "Closed";
        else if (state == openState) self.Status = "Open";
        else self.Status = "Unknown";
        self.lastStateChange = new Date().getTime();
        logger.info(self.name + " changed state to " + self.Status + " from " + currentStatus);
        callback(null, self);
    });
}
