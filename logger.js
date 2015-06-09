var winston = require('winston');
winston.emitErrs = true;

var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
	    name: 'file#info',
            level: 'info',
            filename: './logs/all-logs.log',
            handleExceptions: true,
            json: false, //true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),

        new winston.transports.File({
	    name: 'file#debug',
	    level: 'debug',
            filename: './logs/debug.log',
            handleExceptions: true,
            maxsize: 5242880,
            maxFiles: 5,
            json: false,
            colorize: false
        }),

        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};
