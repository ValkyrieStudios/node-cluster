# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic
Versioning](https://semver.org/spec/v2.0.0.html).

## 3.0.2 - 2018-11-20
### Added
- Npm version badge to Readme
- Npm downloads badge to Readme

## Fixed
- issue with babel-runtime not being included in fresh install

## 3.0.1 - 2018-07-23
### Changed
- Adjust cjs require statement to be native node 'setupMaster' from node cluster

## 3.0.0 - 2018-07-23
### Added
- Changelog
- Added build script
- Configuration option for the timeout that the cluster script waits before shutting down a worker due to inactivity during bootup
- Configuration option to specify the amount of instances of the worker script to be created

### Breaking
- Due to moving from the legacy [minimist](https://github.com/substack/minimist) to the newer
  [node-args](https://github.com/valkyriestudios/node-args), the syntax for passing arguments has changed. To migrate you will need to adopt to the new syntax, for example if your script is named worker.js:
**old (2.0.0)**
```
node node_modules/@valkyriestudios/node-cluster --worker worker.js
```

**new (3.0.0)**
```
node node_modules/@valkyriestudios/node-cluster --worker=worker.js
```

### Changed
- Updated outdated packages, including migrate towards gulp 4
- Updated Readme with new configuration options

## 2.0.0 - 2017-08-21
### Added
- Readme
- MIT License
- Functionality to cluster a single worker script
- Functionality to shutdown a specific worker instance from instance itself through a WorkerDaemon static class
- Automatically scale up to the amount of cpu's on the host system
- Fixed timeout of 10.000ms before the worker script is shut down
