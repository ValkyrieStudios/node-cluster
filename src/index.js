'use strict';

import cluster                  from 'cluster';
import path                     from 'path';
import os                       from 'os';
import NodeArgs                 from '@valkyriestudios/node-args';
import { WORKER_DAEMON_EVENTS } from './WorkerDaemon';

//  Parse incoming parameters using minimist
const params = NodeArgs();
console.log(params);

const scope = Object.freeze({
    path        : path.resolve(params.flags.w || params.flags.worker),
    amt         : params.flags.c || params.flags.count || os.cpus().length,
    timeout     : params.flags.t || params.flags.timeout || 10000,
    name        : 'web',
    instances   : {},
});

if (cluster.isMaster) {
    //  MASTER BOOTSTRAP
    const utils = Object.defineProperties(Object.create(null), {
        logWorker : {
            value : (inst, msg) => console.log(`worker::${inst.process.pid} || ${msg}`),
        },
        logMaster : {
            value : (inst, msg) => console.log(`master [worker::${inst.process.pid}] || ${msg}`)
        },
        clean : {
            value : (inst, msg = false) => {
                if (msg) {
                    utils.logMaster(inst, msg);
                }
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
            }, params.flags.timeout),
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
        utils.clean(inst, 'shutdown');
    });

    //  A clustered worker can communicate with the master through means of an ipc channel
    //  these messages have types that need to be complacent with the ones defined in the master's register
    cluster.on('message', (inst, msg, handle) => {
        ({
            [WORKER_DAEMON_EVENTS.SHUTDOWN] : () => {
                utils.clean(inst, `shutting down | reason : ${msg.data}`);
                inst.kill();
            },
            [WORKER_DAEMON_EVENTS.LOG] : () => {
                utils.logMaster(inst, msg.data);
            },
        }[msg.type] || utils.noop)();
    });

    //  Fork the exact amount of cpu cores as workers
    for (let i = 0; i < scope.amt; i++) cluster.fork();
} else {
    //  WORKER BOOTSTRAP
    require(scope.path);
}
