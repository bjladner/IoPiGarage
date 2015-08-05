var sock = require('socket.io-client');
var cfg = require('./config.default');
var garageDoor = require('./garageDoor');
var garageData = require('./garageData');
var garageCamera = require('./garageCamera');
var logger = require("./logger");

var io = sock.connect(cfg.server.address + ":" + cfg.server.port);

var clientInfo = {
	name: cfg.client.name,
	wifi: 100,
	uptime: 100,
	cpuTemp: 100,
	temperature: 100,
	humidity: 100
};
var garageDoors = {};

io.on('connect', function(socket){
    logger.info("Connected to RPi2: " + cfg.server.address + ":" + cfg.server.port);
    //io.emit('INIT_CLIENT', clientInfo);
  
    for (var door in cfg.garage_doors){
        newDeviceID = cfg.garage_doors[door].deviceID;
        garageDoors[newDeviceID] = new garageDoor(cfg.garage_doors[door]);
        garageDoors[newDeviceID].getStatus(function (err, result) {
            logger.info("Sending data for: " + garageDoors[newDeviceID].name);
            io.emit('SEND_DATA', garageDoors[newDeviceID]);
        });
    }

    for (var door in garageDoors){
        garageDoors[door].watchSensor(function (err, updateDoor) {
            if (err) { 
                logger.ERROR("Error in intervalUpdate " + err);
                throw err;
            }
            logger.debug("Sending updated data for " + updateDoor.name);
            io.emit('SEND_DATA', updateDoor);
        });
    }
});

io.on('ACTION', function(data){
    logger.debug("Data received: " + JSON.stringify(data));
    if (data.action == "CHANGE") {
        garageDoors[data.nodeId].changeStatus();
    } else if (data.action == "STATUS") {
        garageDoors[data.nodeId].getStatus(function () {
            io.emit('SEND_DATA', garageDoors[data.nodeId]);
        });  
    } else {
        logger.warn("Unknown command: " + data.action);
    }
});
