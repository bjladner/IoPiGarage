var sock = require('socket.io-client');
var cfg = require('./config.default');
var garageDoor = require('./garageDoor');
var garageData = require('./garageData');
var RaspiCam = require("raspicam");
var logger = require("./logger");

var io = sock.connect(cfg.server.address + ":" + cfg.server.port);

clientInfo.photo = '/home/bladner/Dropbox/photos/image.jpg';
var clientInfo = new garageData(cfg.client.name);
var garageDoors = {};
var camera = new RaspiCam({
    mode: 'photo', 
    output: clientInfo.photo,
    encoding: "jpg",
    //timeout: 0,
    hf: true,
    vf: true
});

function clientUpdate() {
	clientInfo.updateData(function() {
	    for (var data in clientInfo) {
			if (data != "updateData")
		        logger.debug("clientInfo: " + data + " - " + clientInfo[data]);
	    }
        //io.emit('CLIENT_INFO', clientInfo);
    });
	clientInfo.timer = setTimeout(function() {
		clientUpdate();
	}, cfg.client.interval);
}

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
    } else if (data.action == "PHOTO") {
        logger.info("Taking photo in garage.");
        camera.start();
    } else {
        logger.warn("Unknown command: " + data.action);
    }
});

camera.on("read", function( err, timestamp, filename ){
    logger.info("photo image captured with filename: " + filename );
    //io.emit('CLIENT_INFO', garageDoors[data.nodeId]);
});

