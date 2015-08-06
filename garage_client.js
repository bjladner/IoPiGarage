var sock = require('socket.io-client');
var cfg = require('./config.default');
var garageDoor = require('./garageDoor');
var garageData = require('./garageData');
var garageCamera = require('./garageCamera');
var logger = require("./logger");

var io = sock.connect(cfg.server.address + ":" + cfg.server.port);

var clientInfo = new garageData(cfg.client.name);
function clientUpdate() {
	clientInfo.updateData(function() {
        //logger.debug(clientInfo.name + " Data updated " + clientInfo.lastUpdate.toLocaleTimeString());
        //logger.debug("Wifi: "+ clientInfo.wifi + ", Uptime: " + clientInfo.uptime + ", CPU Temp: " + clientInfo.cpuTemp);
        //logger.debug("Amb Temp: " + clientInfo.temperature + ", Amb Humidity: " + clientInfo.humidity);
	    for (var data in clientInfo) {
			if (data != "updateData")
		        logger.info("clientInfo: " + data + " - " + clientInfo[data]);
	    }
        //io.emit('INIT_CLIENT', clientInfo);
    });
	clientInfo.timer = setTimeout(function() {
		clientUpdate();
	}, cfg.client.interval);
}
var garageDoors = {};

io.on('connect', function(socket){
    logger.info("Connected to RPi2: " + cfg.server.address + ":" + cfg.server.port);
	clientUpdate();
  
    for (var door in cfg.garage_doors){
        newDeviceID = cfg.garage_doors[door].deviceID;
        garageDoors[newDeviceID] = new garageDoor(cfg.garage_doors[door]);
        garageDoors[newDeviceID].getStatus(function () {
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
