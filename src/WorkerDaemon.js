let _instance = null;

function send (type, msg) {
    //  Check if daemon is not in an offline mode
    if (_instance.state === WORKER_DAEMON_STATES.OFFLINE) return;

    process.send({
        type : 'shutdown',
        data : msg.toString(),
    });
}

export const WORKER_DAEMON_STATES = {
    OFFLINE : -1,
    INITIALIZED : 0,
};

export const WORKER_DAEMON_EVENTS = {
    SHUTDOWN : 'worker:daemon:shutdown',
    LOG : 'worker:daemon:log',
};

//
//  EXPORTS
//

export class WorkerDaemon {
    constructor () {
        if (_instance) return _instance;

        this.$$state = WORKER_DAEMON_STATES.INITIALIZED;
        this.$$id = process.pid;

        //  Create a dummy process.send if it doesn't exist (no ipc-channel availability)
        process.send = process.send || function () {};

        _instance = this;
    }

    get state () {
        return this.$$state;
    }

    set state (state = null) {
        const is_predefined = !!(Object.keys(WORKER_DAEMON_STATES).map(
            (state) => WORKER_DAEMON_STATES[state]
        ).indexOf(state) > -1);

        //  Set state if passed, do a check if it's an existing state
        if (!is_predefined) throw new TypeError('Only predefined daemon states are allowed');

        this.$$state = state;
    }

    //  Send shutdown trigger
    shutdown (msg) {
        send(WORKER_DAEMON_EVENTS.SHUTDOWN, msg);
        this.$$state = WORKER_DAEMON_STATES.OFFLINE;
    }

    //  Log a message to the master process
    log (msg) {
        send(WORKER_DAEMON_EVENTS.LOG, msg);
    }

    static shutdown (msg) { (_instance || {}).shutdown(msg); }
    static log (msg) { (_instance || {}).log(msg); }
};
