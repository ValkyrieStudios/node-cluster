## @valkyriestudios/node-cluster

A lightweight node clustering script that can be used to cluster a single worker up to the max amount of cpu's available on a system.

## Basic Setup

The easiest way to make it work is running it as an npm lifecycle hook, set your `start` command to the following:

```
node node_modules/@valkyriestudios/node-cluster --worker PATH_TO_MY_SCRIPT
```

For example if the script that you use to run your server is under dist/server/index.js :

```
node node_modules/@valkyriestudios/node-cluster --worker 'dist/server/index.js'
```

In essence that's all there is to it!

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


## Contributors
- Peter Vermeulen : [Valkyrie Studios](www.valkyriestudios.be)
