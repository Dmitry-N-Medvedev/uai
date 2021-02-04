import util from 'util';
import uWS from 'uWebSockets.js';
import {
  LibRedisAdapter,
} from '@dmitry-n-medvedev/libredisadapter/LibRedisAdapter.mjs';
import {
  LibReplyResolver,
} from '@dmitry-n-medvedev/libreplyresolver/LibReplyResolver.mjs';
import {
  resolveReply,
} from './handlers/resolveReply.mjs';

const ALL_NET_INTERFACES = '0.0.0.0';

export class LibReplyResolverServer {
  #debuglog = null;
  #config = null;
  #server = null;
  #handle = null;
  #libReplyResolver = null;
  #libRedisAdapter = null;
  #redisInstance = null;

  constructor(config = null) {
    if (config === null) {
      throw new ReferenceError('config is undefined');
    }

    this.#debuglog = util.debuglog(this.constructor.name);
    this.#config = Object.freeze({ ...config });
  }

  get isRunning() {
    return this.#handle !== null;
  }

  async start() {
    if (this.#handle !== null) {
      return Promise.resolve();
    }

    this.#libRedisAdapter = new LibRedisAdapter();
    this.#libReplyResolver = new LibReplyResolver({
      redis: await this.#libRedisAdapter.newInstance(this.#config.redis, this.constructor.name),
    });

    return new Promise((resolve, reject) => {
      try {
        this.#server = uWS
          .App({})
          .post('/resolve', (res, req) => resolveReply(res, req, this.#libReplyResolver, this.#debuglog))
          .listen(ALL_NET_INTERFACES, this.#config.uWS.port, (handle = null) => {
            if (handle === null) {
              throw new Error(`failed to listen on port ${this.#config.uWS.port}`);
            }

            this.#handle = handle;

            this.#debuglog(`started on port ${this.#config.uWS.port}`);

            resolve();
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop() {
    if (this.#handle === null) {
      return Promise.resolve();
    }

    uWS.us_listen_socket_close(this.#handle);
    this.#handle = null;

    this.#debuglog(`stopped listening on port: ${this.#config.uWS.port}`);
    this.#libRedisAdapter.shutDownInstance(this.#redisInstance);

    this.#libRedisAdapter = null;
    this.#redisInstance = null;
    this.#server = null;
    this.#config = null;
    this.#debuglog = null;

    return Promise.resolve();
  }
}
