/* eslint max-len: ["error", { "code": 100, "ignoreComments": true }]*/
/**
 * @module childService
 */
 // @flow

const _ = require('lodash');
const Promise = require('bluebird');
const childProcess = require('child_process');
const chalk = require('chalk');
const serviceControl = require('../service_control');
const universe = require('../universe');

const { get, unset } = universe.namespaceFactory('_cukelib');


const killProcWhenOrphaned = function (proc, name) {
  const removeListenerList =
    'exit SIGHUP SIGINT SIGQUIT SIGILL SIGABRT SIGFPE SIGSEGV SIGPIPE SIGTERM SIGBUS'
    .split(/\s+/)
    .map((sig) => {
      const killFn = () => {
        unset(`_services.${name}`);
        proc.kill('SIGTERM');
      };
      process.on(sig, killFn);
      return () => process.removeListener(sig, killFn);
    });
  return () => removeListenerList.map((rmListener) => rmListener());
};

const promiseToResolveOnMatch = (stream, matchTarget) =>
  new Promise((resolve) => {
    const resolveOnMatch = (data) => {
      if (data.toString().match(matchTarget)) {
        resolve(data);
        stream.removeListener('data', resolveOnMatch);
      }
    };
    stream.on('data', resolveOnMatch);
  });

const childService =
module.exports = {

  /**
   * initialize - Initializes the childService using the serviceControl module
   *
   * Typically called at the top of cucumber support file that uses the childService using the
   * cucumber context that contains `Before`, `After`, `Given`, etc.
   * Usage:
   *
   * - `childService.initialize.call(this); `
   *
   * @returns {undefined}
   */
  initialize() {
    return serviceControl.initialize.call(this);
  },

  /**
   * getService - Given a childService name returns the childService object.
   *
   * @param {string} name
   *
   * @returns {Object} childService
   */
  getService(name: string) {
    return serviceControl.getService(`child.${name}`);
  },

  makeSpawnConfig(spawnArgs: Object) {
    if (!spawnArgs.name) throw new Error('name is a required argument');
    const spawnDefaultArgs = {
      args: [],
      options: {},
      isReadyMatch: /./,
      isReady(proc) {
        return Promise.race([
          promiseToResolveOnMatch(proc.stdout, spawnArgs.isReadyMatch),
          promiseToResolveOnMatch(proc.stderr, spawnArgs.isReadyMatch),
        ]);
      },
      stderrHandler(data) {
        // eslint-disable-next-line no-console
        console.error(chalk.magenta(`${spawnArgs.name}.stderr: ${data}`));
      },
      stdoutHandler(data) {
        // eslint-disable-next-line no-console
        console.log(chalk.magenta(`${spawnArgs.name}.stdout: ${data}`));
      },
      errorHandler(err) {
        // eslint-disable-next-line no-console
        console.log(chalk.magenta(`${spawnArgs.name} Error:`, err));
      }
    };
    return _.defaults(spawnArgs, spawnDefaultArgs);
  },

  launch(configOverrides: Object = {}, childLauncher: Function) {
    const config = childService.makeSpawnConfig(configOverrides);
    const start = () => {
      let isProcReady = false;
      return childLauncher(config)
      .then((proc) => {
        proc.stderr.on('data', config.stderrHandler);
        proc.stdout.on('data', config.stdoutHandler);
        proc.on('error', config.errorHandler);
        const exitPromise = new Promise((resolve, reject) => {
          proc.once('exit', (code) => {
            if (isProcReady) {
              // This is the resolution case for the stop function.
              const msg = `Server "${config.name}" exited with code ${code}`;
              if (get(`_services.${config.name}`)) {
                // This happens if the proc exits from something other than the stop.
                reject(new Error(msg));
              } else {
                // This is the normal exit case from the stop.
                resolve(msg);
              }
            } else {
              // This is the resolution case for the Promise.race against isReadyPromise
              reject(new Error(`Server "${config.name}" exited with code ${code} before ready`));
            }
          });
        });
        const removeOrphanProcListeners = killProcWhenOrphaned(proc, config.name);
        const isReadyPromise = config.isReady.call(config, proc)
        .then(() => {
          isProcReady = true;
          return {
            config,
            proc,
            stop: () => {
              removeOrphanProcListeners();
              proc.kill('SIGTERM');
              return exitPromise;
            },
          };
        });
        return Promise.race([isReadyPromise, exitPromise]);
      });
    };
    return serviceControl.launchService(config.name, start);
  },

  /**
   * spawn - Launches a Node child process from a shell command via
   *
   * [`require('child_process').spawn(...)`](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)
   *
   * The `spawnArgs` parameter allows these options:
   *
   *  - `name: string` The name of the cukelib service (required).
   *  - `cmd: string` Spawn command argument (required).
   *  - `args: [string]` Spawn args argument
   *  - `options: Object` [childProcess.spawn options argument (env, cwd, etc.)](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)
   *  - `isReadyMatch: string|RegExp` default: `/./` Pattern that is matched from stdout or stderr to indicate the child process is ready.
   *  - `isReady: (proc: childProcess) => Promise` the promise is resolved when the child process is ready. The default is to resolve when data from stdout or stderr matches the `isReadyMatch` pattern.
   *  - `stderrHandler: Function(data: string)` default is to print via `console.error(chalk.magenta(...))`
   *  - `stdoutHandler: Function(data: string)` default is to print via `console.log(chalk.magenta(...))`. Assign the function `(data) => null` for a "quiet" output.
   *  - `errorHandler: Function(err: Error)` default is to print the err via `console.error(chalk.magenta(...))`
   *
   * @param {Object} [spawnArgs={}] see above
   *
   * @returns {Promise} launchService promise
   */
  spawn(spawnArgs: Object = {}) {
    if (!spawnArgs.cmd) throw new Error('cmd is a required argument');
    return childService.launch(spawnArgs, (config) =>
      Promise.resolve(childProcess.spawn(config.cmd, config.args, config.options)));
  },
};

module.exports = childService;
