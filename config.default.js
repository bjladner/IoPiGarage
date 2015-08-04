var cfg = {};

// Server Information
cfg.server = {};
cfg.server.address = 'http://192.168.1.76';
cfg.server.port = 8080;

// Client Information
cfg.client = {};
cfg.client.address = 'http://192.168.1.241';

// Garage Door settings
cfg.garage_doors = {};

cfg.garage_doors.door1 ={};
cfg.garage_doors.door1.deviceID = 10;
cfg.garage_doors.door1.name = "Large Garage Door";
cfg.garage_doors.door1.type = "garage";
cfg.garage_doors.door1.statePin = 17; //GPIO17
cfg.garage_doors.door1.relayPin = 23; //GPIO23

cfg.garage_doors.door2 = {};
cfg.garage_doors.door2.deviceID = 11;
cfg.garage_doors.door2.name = "Small Garage Door";
cfg.garage_doors.door2.type = "garage";
cfg.garage_doors.door2.statePin = 27; //GPIO27
cfg.garage_doors.door2.relayPin = 24; //GPIO24

module.exports = cfg;
