'use strict';

import cluster                  from 'cluster';
import path                     from 'path';
import os                       from 'os';
import NodeArgs                 from '@valkyriestudios/node-args';
import { WORKER_DAEMON_EVENTS } from './WorkerDaemon';

//  Parse incoming parameters using minimist
const params            = NodeArgs();
const config_worker     = params.flags.w !== undefined ? params.flags.w : params.flags.worker;
const config_count      = params.flags.c !== undefined ? params.flags.c : params.flags.count;
const config_timeout    = params.flags.t !== undefined ? params.flags.t : params.flags.timeout;

const scope = Object.freeze({
    path        : path.relative(process.cwd(), path.resolve(config_worker)),
    amt         : config_count || os.cpus().length,
    timeout     : config_timeout || 10000,
    name        : 'web',
    instances   : {},
});

//  MASTER BOOTSTRAP
const utils = Object.defineProperties(Object.create(null), {
    logWorker : {
        value : (inst, msg) => console.log(`worker::${inst.process.pid} || ${msg}`),
    },
    logMaster : {
        value : (inst, msg) => console.log(`master [worker::${inst.process.pid}] || ${msg}`)
    },
    clean : {
        value : (inst) => {
            clearTimeout((scope.instances[inst.process.pid] || {}).ttl || null);
            delete scope.instances[inst.process.pid];
        }
    },
    noop : {
        value : () => {}
    },
});

//  Listen for fork events and register a timer that checks for process completeness
cluster.on('fork', (inst) => {
    utils.logWorker(inst, 'forked');

    scope.instances[inst.process.pid] = {
        proc : inst,
        ttl : setTimeout(() => {
            utils.clean(inst);
            utils.logWorker(inst, 'timeout');
        }, scope.timeout),
    };
});

//  Log a message for each worker starting
cluster.on('online', (inst) => {
    utils.logWorker(inst, 'online');
});

//  Log a message for each worker starting
cluster.on('listening', (inst, addr) => {
    utils.clean(inst);
    utils.logWorker(inst, `listening ${addr.address || '127.0.0.1'}:${addr.port}`);
});

//  Log a message if the worker is shutting down
cluster.on('exit', (inst, code, signal) => {
    utils.clean(inst);
});

//  A clustered worker can communicate with the master through means of an ipc channel
//  these messages have types that need to be complacent with the ones defined in the master's register
cluster.on('message', (inst, msg, handle) => {
    ({
        [WORKER_DAEMON_EVENTS.SHUTDOWN] : () => {
            utils.logMaster(inst, `shutting down | reason : ${msg.data}`);
            utils.clean(inst);
            inst.kill();
        },
        [WORKER_DAEMON_EVENTS.LOG] : () => {
            utils.logMaster(inst, msg.data);
        },
    }[msg.type] || utils.noop)();
});

//  Configure master
cluster.setupMaster({
    exec: scope.path,
});

//  Fork the exact amount of cpu cores as workers
for (let i = 0; i < scope.amt; i++) cluster.fork();
