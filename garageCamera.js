var RaspiCam = require("raspicam");
var logger = require("./logger");

module.exports = camera;

// Code for RaspiCam
var camera = new RaspiCam({
    mode: 'photo', 
    output: '/home/bladner/Dropbox/photos/image.jpg',
    encoding: "jpg",
    //timeout: 0,
    hf: true,
    vf: true
});

// http://thejackalofjavascript.com/rpi-live-streaming/
// https://github.com/troyth/node-raspicam

//camera.start();

camera.on("start", function( err, timestamp ){
  console.log("photo started at " + timestamp );
});

camera.on("read", function( err, timestamp, filename ){
  console.log("photo image captured with filename: " + filename );
});

camera.on("stop", function( timestamp ){
  console.log("photo child process has stopped at " + timestamp );
});

camera.on("exit", function( timestamp ){
  console.log("photo child process has exited at " + timestamp );
});
