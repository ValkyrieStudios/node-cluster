'use strict';

Object.defineProperty(exports, "__esModule", {
    value: !0
});
exports.WorkerDaemon = exports.WORKER_DAEMON_EVENTS = exports.WORKER_DAEMON_STATES = undefined;

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _instance = null;

function send(type, msg) {
    //  Check if daemon is not in an offline mode
    if (_instance.state === WORKER_DAEMON_STATES.OFFLINE) return;

    process.send({
        type: 'shutdown',
        data: msg.toString()
    });
}

var WORKER_DAEMON_STATES = exports.WORKER_DAEMON_STATES = {
    OFFLINE: -1,
    INITIALIZED: 0
};

var WORKER_DAEMON_EVENTS = exports.WORKER_DAEMON_EVENTS = {
    SHUTDOWN: 'worker:daemon:shutdown',
    LOG: 'worker:daemon:log'
};

//
//  EXPORTS
//

var WorkerDaemon = exports.WorkerDaemon = function () {
    function WorkerDaemon() {
        (0, _classCallCheck3.default)(this, WorkerDaemon);

        if (_instance) return _instance;

        this.$$state = WORKER_DAEMON_STATES.INITIALIZED;
        this.$$id = process.pid;

        //  Create a dummy process.send if it doesn't exist (no ipc-channel availability)
        process.send = process.send || function () {};

        _instance = this;
    }

    (0, _createClass3.default)(WorkerDaemon, [{
        key: 'shutdown',


        //  Send shutdown trigger
        value: function shutdown(msg) {
            send(WORKER_DAEMON_EVENTS.SHUTDOWN, msg);
            this.$$state = WORKER_DAEMON_STATES.OFFLINE;
        }

        //  Log a message to the master process

    }, {
        key: 'log',
        value: function log(msg) {
            send(WORKER_DAEMON_EVENTS.LOG, msg);
        }
    }, {
        key: 'state',
        get: function get() {
            return this.$$state;
        },
        set: function set() {
            var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

            var is_predefined = !!((0, _keys2.default)(WORKER_DAEMON_STATES).map(function (state) {
                return WORKER_DAEMON_STATES[state];
            }).indexOf(state) > -1);

            //  Set state if passed, do a check if it's an existing state
            if (!is_predefined) throw new TypeError('Only predefined daemon states are allowed');

            this.$$state = state;
        }
    }], [{
        key: 'shutdown',
        value: function shutdown(msg) {
            (_instance || {}).shutdown(msg);
        }
    }, {
        key: 'log',
        value: function log(msg) {
            (_instance || {}).log(msg);
        }
    }]);
    return WorkerDaemon;
}();

;