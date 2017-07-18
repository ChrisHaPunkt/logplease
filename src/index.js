'use strict';

const fs = require('fs');
const format = require('util').format;
const EventEmitter = require('events').EventEmitter;
const fetch = require('node-fetch');
const Headers = require('node-fetch').Headers;
let isNodejs = !!process.version;

const LogLevels = {
    'DEBUG': 'DEBUG',
    'INFO': 'INFO',
    'WARN': 'WARN',
    'ERROR': 'ERROR',
    'NONE': 'NONE'
};

// Global log level
let GlobalLogLevel = LogLevels.DEBUG;

// Global log file name
let GlobalLogfile = null;

const GlobalEvents = new EventEmitter();

// ANSI colors
let Colors = {
    'Black': 0,
    'Red': 1,
    'Green': 2,
    'Yellow': 3,
    'Blue': 4,
    'Magenta': 5,
    'Cyan': 6,
    'Grey': 7,
    'White': 9,
    'Default': 9
};

// CSS colors
if (!isNodejs) {
    Colors = {
        'Black': 'Black',
        'Red': 'IndianRed',
        'Green': 'LimeGreen',
        'Yellow': 'Orange',
        'Blue': 'RoyalBlue',
        'Magenta': 'Orchid',
        'Cyan': 'SkyBlue',
        'Grey': 'DimGrey',
        'White': 'White',
        'Default': 'Black'
    };
}

const loglevelColors = [Colors.Cyan, Colors.Green, Colors.Yellow, Colors.Red, Colors.Default];

const defaultOptions = {
    useColors: true,
    color: Colors.Default,
    showTimestamp: true,
    showLevel: true,
    filename: GlobalLogfile,
    appendFile: true,
    useGraylog: false,
    graylogUrl: null
};

class Logger {
    constructor(category, options) {
        this.category = category;
        const opts = {};
        Object.assign(opts, defaultOptions);
        Object.assign(opts, options);
        this.options = opts;
    }

    debug() {
        if (this._shouldLog(LogLevels.DEBUG)) { this._write(LogLevels.DEBUG, format(...arguments)); }
    }

    log() {
        if (this._shouldLog(LogLevels.DEBUG)) { this.debug.apply(this, arguments); }
    }

    info() {
        if (this._shouldLog(LogLevels.INFO)) { this._write(LogLevels.INFO, format(...arguments)); }
    }

    warn() {
        if (this._shouldLog(LogLevels.WARN)) { this._write(LogLevels.WARN, format(...arguments)); }
    }

    error() {
        if (this._shouldLog(LogLevels.ERROR)) { this._write(LogLevels.ERROR, format(...arguments)); }
    }

    _write(level, text) {
        if ((this.options.filename || GlobalLogfile) && !this.fileWriter && isNodejs) { this.fileWriter = fs.openSync(this.options.filename || GlobalLogfile, this.options.appendFile ? 'a+' : 'w+'); }

        const format = this._format(level, text);
        const unformattedText = this._createLogMessage(level, text);
        const formattedText = this._createLogMessage(level, text, format.timestamp, format.level, format.category, format.text);
        if (this.options.useGraylog) {
            this._sendToGraylog({
                timestamp: Date.now() / 1000,
                short_message: text,
                long_message: text,
                'hLevel': level
            });
        }
        if (this.fileWriter && isNodejs) { fs.writeSync(this.fileWriter, `${unformattedText}\n`, null, 'utf-8'); }

        if (isNodejs || !this.options.useColors) {
            console.log(formattedText);
            GlobalEvents.emit('data', this.category, level, text);
        } else {
            // TODO: clean this up
            if (level === LogLevels.ERROR) {
                if (this.options.showTimestamp && this.options.showLevel) {
                    console.error(formattedText, format.timestamp, format.level, format.category, format.text);
                } else if (this.options.showTimestamp && !this.options.showLevel) {
                    console.error(formattedText, format.timestamp, format.category, format.text);
                } else if (!this.options.showTimestamp && this.options.showLevel) {
                    console.error(formattedText, format.level, format.category, format.text);
                } else {
                    console.error(formattedText, format.category, format.text);
                }
            } else {
                if (this.options.showTimestamp && this.options.showLevel) {
                    console.log(formattedText, format.timestamp, format.level, format.category, format.text);
                } else if (this.options.showTimestamp && !this.options.showLevel) {
                    console.log(formattedText, format.timestamp, format.category, format.text);
                } else if (!this.options.showTimestamp && this.options.showLevel) {
                    console.log(formattedText, format.level, format.category, format.text);
                } else {
                    console.log(formattedText, format.category, format.text);
                }
            }
        }
    }

    _format(level, text) {
        let timestampFormat = '';
        let levelFormat = '';
        let categoryFormat = '';
        let textFormat = ': ';

        if (this.options.useColors) {
            const levelColor = Object.keys(LogLevels).map(f => LogLevels[f]).indexOf(level);
            const categoryColor = this.options.color;

            if (isNodejs) {
                if (this.options.showTimestamp) { timestampFormat = `\u001b[3${Colors.Grey}m`; }

                if (this.options.showLevel) { levelFormat = `\u001b[3${loglevelColors[levelColor]};22m`; }

                categoryFormat = `\u001b[3${categoryColor};1m`;
                textFormat = '\u001b[0m: ';
            } else {
                if (this.options.showTimestamp) { timestampFormat = `color:${Colors.Grey}`; }

                if (this.options.showLevel) { levelFormat = `color:${loglevelColors[levelColor]}`; }

                categoryFormat = `color:${categoryColor}; font-weight: bold`;
            }
        }

        return {
            timestamp: timestampFormat,
            level: levelFormat,
            category: categoryFormat,
            text: textFormat
        };
    }

    _createLogMessage(level, text, timestampFormat, levelFormat, categoryFormat, textFormat) {
        timestampFormat = timestampFormat || '';
        levelFormat = levelFormat || '';
        categoryFormat = categoryFormat || '';
        textFormat = textFormat || ': ';

        if (!isNodejs && this.options.useColors) {
            if (this.options.showTimestamp) { timestampFormat = '%c'; }

            if (this.options.showLevel) { levelFormat = '%c'; }

            categoryFormat = '%c';
            textFormat = ': %c';
        }

        let result = '';

        if (this.options.showTimestamp) { result += `${String(new Date().toISOString())} `; }

        result = timestampFormat + result;

        if (this.options.showLevel) { result += `${levelFormat}[${level}]${level === LogLevels.INFO || level === LogLevels.WARN ? ' ' : ''} `; }

        result += categoryFormat + this.category;
        result += textFormat + text;
        return result;
    }

    _shouldLog(level) {
        let envLogLevel = typeof process !== 'undefined' && process.env !== undefined && process.env.LOG !== undefined ? process.env.LOG.toUpperCase() : null;
        envLogLevel = typeof window !== 'undefined' && window.LOG ? window.LOG.toUpperCase() : envLogLevel;

        const logLevel = envLogLevel || GlobalLogLevel;
        const levels = Object.keys(LogLevels).map(f => LogLevels[f]);
        const index = levels.indexOf(level);
        const levelIdx = levels.indexOf(logLevel);
        return index >= levelIdx;
    }

    _sendToGraylog(data) {


        const myHeaders = new Headers({ 'Content-Type': 'application/json' });

        const myInit = {
            method: 'POST',
            headers: myHeaders,
            mode: 'cors',
            cache: 'default',
            body: JSON.stringify(data)
        };

        fetch(this.options.graylogUrl, myInit).then(response => {
            if (!response.ok) {
                console.error('Graylog communication', response);
            }
        });
    }
}
/* Public API */
module.exports = {
    Colors,
    LogLevels,
    setLogLevel: level => {
        GlobalLogLevel = level;
    },
    setLogfile: filename => {
        GlobalLogfile = filename;
    },
    create: (category, options) => {
        const logger = new Logger(category, options);
        return logger;
    },
    forceBrowserMode: force => isNodejs = !force, // for testing,
    events: GlobalEvents
};
