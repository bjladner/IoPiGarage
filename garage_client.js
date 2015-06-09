var sock = require('socket.io-client');
var RaspiCam = require("raspicam");
var cfg = require('./config.default');
var garageDoor = require('./garageDoor');
var logger = require("./logger");

var io = sock.connect(cfg.server.address + ":" + cfg.server.port);
var camera = new RaspiCam({
    mode: 'photo', 
    output: './photos/image.jpg',
    encoding: "jpg",
    timeout: 0,
    hf: true,
    vf: true
});

camera.start();

camera.on("started", function( err, timestamp ){
	console.log("photo started at " + timestamp );
});

camera.on("read", function( err, timestamp, filename ){
	console.log("photo image captured with filename: " + filename );
});

camera.on("exit", function( timestamp ){
	console.log("photo child process has exited at " + timestamp );
});


//var sys = require('sys');
//var exec = require('child_process').exec;
//awk 'NR==3 {print $3}''' 
// /proc/net/wireless (3rd line, 3rd item = wireless level in %)
// /proc/uptime (1st line, 1st item = uptime in seconds)
// /sys/class/thermal/thermal_zone0/temp (only item in milidegrees C (x/1000))
// to run external commands in node.js, check out:
// http://stackoverflow.com/questions/20643470/execute-a-command-line-binary-in-node-js
// http://www.dzone.com/snippets/execute-unix-command-nodejs


var garageDoors = {};
var signalStrength = 85;

io.on('connect', function(socket){
  logger.info("Connected to RPi2: " + cfg.server.address + ":" + cfg.server.port);
  
  for (var door in cfg.garage_doors){
    newDeviceID = cfg.garage_doors[door].deviceID;
    garageDoors[newDeviceID] = new garageDoor(cfg.garage_doors[door]);
    garageDoors[newDeviceID].getStatus(function (err, result) {
      logger.info("Sending data for: " + garageDoors[newDeviceID].name);
      io.emit('INIT_DEVICE', garageDoors[newDeviceID]);
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
    garageDoors[data.nodeId].changeStatus(function () {
      io.emit('SEND_DATA', garageDoors[data.nodeId]);
    });  
  } else if (data.action == "STATUS") {
    garageDoors[data.nodeId].getStatus(function () {
      io.emit('SEND_DATA', garageDoors[data.nodeId]);
    });  
  } else {
    logger.warn("Unknown command: " + data.action);
  }
});
