import util from 'util';
import uWS from 'uWebSockets.js';
import {
  LibAICommunicator,
} from '@dmitry-n-medvedev/libai-communicator/LibAICommunicator.mjs';
import {
  configAnswerTo,
  answerTo,
} from './handlers/answerTo.mjs';

// FIXME: this should be in a shared lib
const ALL_NET_INTERFACES = '0.0.0.0';

export class LibAICommunicatorServer {
  #config = null;
  #debuglog = null;
  #libAICommunicator = null;
  #handle = null;
  #server = null;

  constructor(config = null) {
    // FIXME: validation must be done via [ajv](https://github.com/ajv-validator/ajv)
    if (config === null) {
      throw new ReferenceError('config is undefined');
    }

    this.#debuglog = util.debuglog(this.constructor.name);
    this.#config = Object.freeze({ ...config });

    this.#debuglog(this.#config);
  }

  get isRunning() {
    return this.#handle !== null;
  }

  async start() {
    this.#debuglog('.start');

    if (this.#handle !== null) {
      this.#debuglog('already .started');

      return Promise.resolve();
    }

    this.#libAICommunicator = new LibAICommunicator(this.#config);
    this.#debuglog('new LibAICommunicator', this.#libAICommunicator);

    await this.#libAICommunicator.start();
    this.#debuglog('libAICommunicator.start');

    configAnswerTo(this.#config, this.#debuglog);

    return new Promise((resolve) => {
      this.#server = uWS
        .App({})
        // eslint-disable-next-line no-return-await
        .post('/say', async (res, req) => await answerTo(res, req))
        .listen(ALL_NET_INTERFACES, this.#config.uWS.port, (handle = null) => {
          if (handle === null) {
            throw new Error(`${this.constructor.name} failed to listen on port ${this.#config.uWS.port}`);
          }

          this.#handle = handle;

          this.#debuglog(`${this.constructor.name} started on port ${this.#config.uWS.port}`);

          resolve();
        });
    });
  }

  async stop() {
    if (this.#handle !== null) {
      uWS.us_listen_socket_close(this.#handle);

      this.#handle = null;
    }

    await this.#libAICommunicator.stop();

    this.#libAICommunicator = null;
    this.#server = null;
    this.#debuglog = null;
  }
}
