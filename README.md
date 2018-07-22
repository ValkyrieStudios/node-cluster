## @valkyriestudios/node-cluster

A lightweight node clustering script that can be used to cluster a single worker up to the max amount of cpu's available on a system.

## Basic Setup

The easiest way to make it work is running it as an npm lifecycle hook, set your `start` command in **package.json** to the following:

```
...
"scripts": {
    "start": "node node_modules/@valkyriestudios/node-cluster --worker=PATH_TO_MY_SCRIPT"
},
...

```

For example if the script that you use to run your server is under dist/server/index.js :

```
...
"scripts": {
    "start": "node node_modules/@valkyriestudios/node-cluster --worker=dist/server/index.js"
},
...
```

In essence that's all there is to it!


## Configuration

Some aspects of the clustering can be controlled through arguments passed to the node-cluster script. Below is a full overview of these
parameters, along with a small description of each and their defaults.

- **worker**<br> (required)
Configures the script of the worker instance that is to be clustered. (shorthand: '-w')

- **count**<br> (default: amount of cpus that are available on the system that this is run on)
Configures the amount of instances to create of the worker script. (shorthand: '-c')

- **timeout**<br> (default: 10000)
Configures the time in miliseconds that the node-cluster script will wait for a 'listen' event from a worker instance before shutting it down.
(shorthand: '-t')

## Getting into the nitty-gritty

To allow for communication between the workers and it's master, node-cluster provides an easy-to-use singleton class called '**WorkerDaemon**'. This singleton only needs to be instantiated once and will be used as a proxy on top of the raw node process.

The following is a simple example of setting up the WorkerDaemon on a small Koa application :

```
'use strict';

import Koa from 'koa';

import { WorkerDaemon } from '@valkyriestudios/node-cluster/WorkerDaemon';

const app = new Koa();
const daemon = new WorkerDaemon();

try {
	app.listen(3000);
} catch (err) {
	daemon.shutdown(err);
}

```

Take note at the try-catch handler where we use the WorkerDaemon's '**daemon.shutdown**' function to tell the master that the boot sequence of the instance failed.

**Quicktip** : You can call the WorkerDaemon.shutdown function anywhere in your code, for example when your mongo middleware fails to connect, or when your redis instance can't be reached.

## WorkerDaemon functionality

### shutdown(msg)
Tells the master to shutdown this specific instance on the cluster<br>
@variable: **msg** (String): A message to be logged by the master


### log(msg)
Tells the master to log a message <br>
@variable: **msg** (String): A message to be logged by the master


## Author
- Peter Vermeulen : [Valkyrie Studios](www.valkyriestudios.be)


## Contributors
- Peter Vermeulen : [Valkyrie Studios](www.valkyriestudios.be)
