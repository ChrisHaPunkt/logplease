'use strict';

/* Usage */
const Logger = require('../src/index');

const logger1  = Logger.create('daemon',  { filename: 'debug.log', useColors: false, appendFile: true });
const logger2  = Logger.create('utils');
const logger3  = Logger.create('logger3', { color: Logger.Colors.Magenta, showTimestamp: false, showLevel: false });

const red     = Logger.create('red', { color: Logger.Colors.Red, showTimestamp: false, showLevel: false });
const green   = Logger.create('green', { color: Logger.Colors.Green, showTimestamp: false, showLevel: false });
const yellow  = Logger.create('yellow', { color: Logger.Colors.Yellow, showTimestamp: false, showLevel: false });
const blue    = Logger.create('blue', { color: Logger.Colors.Blue, showTimestamp: false, showLevel: false });
const magenta = Logger.create('magenta', { color: Logger.Colors.Magenta, showTimestamp: false, showLevel: false });
const cyan    = Logger.create('cyan', { color: Logger.Colors.Cyan, showTimestamp: false, showLevel: false });

Logger.setLogLevel(Logger.LogLevels.DEBUG)

// CAVEAT: log functions can't take any parameters, if you need params, use interpolated strings
const number = 5;
logger1.debug(`This is a debug message #${number}`);
logger1.info(`This is an info message #${number}`);
logger1.warn(`This is a warning message #${number}`);
logger1.error(`This is an error message #${number}`);

logger2.debug(`This is a debug message #${number}`);
logger2.info(`This is an info message #${number}`);
logger2.warn(`This is a warning message #${number}`);
logger2.error(`This is an error message #${number}`);

logger3.debug(`This is a debug message #${number}`);
logger3.info(`This is an info message #${number}`);
logger3.warn(`This is a warning message #${number}`);
logger3.error(`This is an error message #${number}`);

red.log(`Red log message`); // log() is an alias for debug()
green.log(`Green log message`);
yellow.log(`Yellow log message`);
blue.log(`Blue log message`);
magenta.log(`Magenta log message`);
cyan.log(`Cyan log message`);
