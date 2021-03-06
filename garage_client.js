var sock = require('socket.io-client');
var cfg = require('./config.default');
var garageDoor = require('./garageDoor');
var clientData = require('./clientData');
var RaspiCam = require("raspicam");
var logger = require("./logger");

var io = sock.connect(cfg.server.address + ":" + cfg.server.port);

var clientInfo = new clientData();
clientInfo.photo = '/home/bladner/Dropbox/photos/image.jpg';
clientInfo.photoUpdate = "Never";

var garageDoors = {};
for (var door in cfg.garage_doors){
    garageDoors[cfg.garage_doors[door].deviceID] = new garageDoor(cfg.garage_doors[door]);
}

var camera = new RaspiCam({
    mode: 'photo', 
    output: clientInfo.photo,
    encoding: "jpg",
    //timeout: 0,
    hf: true,
    vf: true
});

io.on('connect', function(socket){
    logger.info("Connected to RPi2: " + cfg.server.address + ":" + cfg.server.port);
  
    for (var door in garageDoors){
        garageDoors[door].getStatus(function () {
            logger.info("Sending data for: " + garageDoors[door].name);
            io.emit('SEND_DATA', garageDoors[door]);
        });
        garageDoors[door].watchSensor(function (err, updateDoor) {
            if (err) { 
                logger.ERROR("Error in intervalUpdate " + err);
                throw err;
            }
            logger.debug("Sending updated data for " + updateDoor.name);
            io.emit('SEND_DATA', updateDoor);
        });
    }
	
    clientInfo.timer = setTimeout(function() {
        clientUpdate();
    }, 1000);
});

io.on('ACTION', function(data){
    if (data.nodeId in garageDoors) {
        logger.debug("Garage data received: " + JSON.stringify(data));
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
    }
});

camera.on("read", function( err, timestamp, filename ){
    for (var door in garageDoors){
        logger.debug("Updating photo for " + garageDoors[door].name);
	clientInfo.photoUpdate = timestamp;
    }
});

function clientUpdate() {
    clientInfo.updateData(function() {
        for (var data in clientInfo) {
	    if (data != "updateData" && data != "nodeID" && data != "timer")
	        logger.debug("clientInfo: " + data + " - " + clientInfo[data]);
	}
        for (var door in garageDoors){
	    clientInfo.nodeID = garageDoors[door].deviceID;
            logger.debug("Sending client info for " + garageDoors[door].name);
            io.emit('CLIENT_INFO', clientInfo);
        }
    });
    clientInfo.timer = setTimeout(function() {
	clientUpdate();
    }, cfg.client.updateInterval);
}

