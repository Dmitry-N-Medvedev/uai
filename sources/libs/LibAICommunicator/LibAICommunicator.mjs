import util from 'util';
import {
  customAlphabet,
} from 'nanoid';
import got from 'got';
import {
  HTTPStatusCodes,
} from './constants/HTTPStatusCodes.mjs';

export class LibAICommunicator {
  #degublog = null;
  #config = null;
  #nanoid = null;
  #conversationId = null;
  #client = null;

  constructor(config = null) {
    if (config === null) {
      throw new ReferenceError('config is undefined');
    }

    this.#degublog = util.debuglog(this.constructor.name);
    this.#config = Object.freeze({ ...config });
    this.#nanoid = customAlphabet('abcdef0123456789', 24);

    this.#degublog(this.#config);
  }

  async start() {
    this.#conversationId = await this.#nanoid();
    this.#client = got.extend({
      prefixUrl: this.#config.servers.prefixUrl,
      http2: true,
      throwHttpErrors: false,
      responseType: 'json',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        authorization: this.#config.apiKey,
      },
    });
  }

  async stop() {
    this.#client = null;
  }

  async getIntents(humanSaid = null) {
    if (humanSaid === null) {
      throw new ReferenceError('humanSaid is undefined');
    }

    const message = {
      message: humanSaid.toString(),
      botId: this.#config.botId,
      conversationId: this.#conversationId,
    };

    const reply = await this.#client.post(this.#config.servers.paths.intents, {
      body: JSON.stringify(message),
    });

    const {
      statusCode,
      statusMessage,
      body: {
        intents,
      },
    } = reply;

    if (statusCode !== HTTPStatusCodes.SUCCESS) {
      this.#degublog({
        statusCode,
        statusMessage,
      });

      throw new Error(statusMessage);
    }

    this.#degublog({
      intents,
    });

    return intents ?? [];
  }
}
