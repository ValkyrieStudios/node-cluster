'use strict';

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _defineProperties = require('babel-runtime/core-js/object/define-properties');

var _defineProperties2 = _interopRequireDefault(_defineProperties);

var _freeze = require('babel-runtime/core-js/object/freeze');

var _freeze2 = _interopRequireDefault(_freeze);

var _cluster = require('cluster');

var _cluster2 = _interopRequireDefault(_cluster);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _nodeArgs = require('@valkyriestudios/node-args');

var _nodeArgs2 = _interopRequireDefault(_nodeArgs);

var _WorkerDaemon = require('./WorkerDaemon');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//  Parse incoming parameters using minimist
var params = (0, _nodeArgs2.default)();
var config_worker = params.flags.w !== undefined ? params.flags.w : params.flags.worker;
var config_count = params.flags.c !== undefined ? params.flags.c : params.flags.count;
var config_timeout = params.flags.t !== undefined ? params.flags.t : params.flags.timeout;

var scope = (0, _freeze2.default)({
    path: _path2.default.relative(process.cwd(), _path2.default.resolve(config_worker)),
    amt: config_count || _os2.default.cpus().length,
    timeout: config_timeout || 10000,
    name: 'web',
    instances: {}
});

//  MASTER BOOTSTRAP
var utils = (0, _defineProperties2.default)((0, _create2.default)(null), {
    logWorker: {
        value: function value(inst, msg) {
            return console.log('worker::' + inst.process.pid + ' || ' + msg);
        }
    },
    logMaster: {
        value: function value(inst, msg) {
            return console.log('master [worker::' + inst.process.pid + '] || ' + msg);
        }
    },
    clean: {
        value: function value(inst) {
            clearTimeout((scope.instances[inst.process.pid] || {}).ttl || null);
            delete scope.instances[inst.process.pid];
        }
    },
    noop: {
        value: function value() {}
    }
});

//  Listen for fork events and register a timer that checks for process completeness
_cluster2.default.on('fork', function (inst) {
    utils.logWorker(inst, 'forked');

    scope.instances[inst.process.pid] = {
        proc: inst,
        ttl: setTimeout(function () {
            utils.clean(inst);
            utils.logWorker(inst, 'timeout');
        }, scope.timeout)
    };
});

//  Log a message for each worker starting
_cluster2.default.on('online', function (inst) {
    utils.logWorker(inst, 'online');
});

//  Log a message for each worker starting
_cluster2.default.on('listening', function (inst, addr) {
    utils.clean(inst);
    utils.logWorker(inst, 'listening ' + (addr.address || '127.0.0.1') + ':' + addr.port);
});

//  Log a message if the worker is shutting down
_cluster2.default.on('exit', function (inst, code, signal) {
    utils.clean(inst);
});

//  A clustered worker can communicate with the master through means of an ipc channel
//  these messages have types that need to be complacent with the ones defined in the master's register
_cluster2.default.on('message', function (inst, msg, handle) {
    var _WORKER_DAEMON_EVENTS;

    ((_WORKER_DAEMON_EVENTS = {}, (0, _defineProperty3.default)(_WORKER_DAEMON_EVENTS, _WorkerDaemon.WORKER_DAEMON_EVENTS.SHUTDOWN, function () {
        utils.logMaster(inst, 'shutting down | reason : ' + msg.data);
        utils.clean(inst);
        inst.kill();
    }), (0, _defineProperty3.default)(_WORKER_DAEMON_EVENTS, _WorkerDaemon.WORKER_DAEMON_EVENTS.LOG, function () {
        utils.logMaster(inst, msg.data);
    }), _WORKER_DAEMON_EVENTS)[msg.type] || utils.noop)();
});

//  Configure master
_cluster2.default.setupMaster({
    exec: scope.path
});

//  Fork the exact amount of cpu cores as workers
for (var i = 0; i < scope.amt; i++) {
    _cluster2.default.fork();
}