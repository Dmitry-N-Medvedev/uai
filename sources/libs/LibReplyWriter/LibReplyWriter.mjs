import util from 'util';

const REPLIES_KEY = 'replies';

export class LibReplyWriter {
  #debuglog = null;
  #config = null;

  constructor(config = null) {
    if (config === null) {
      throw new ReferenceError('config is undefined');
    }

    this.#debuglog = util.debuglog(this.constructor.name);
    this.#config = Object.freeze({ ...config });
  }

  // eslint-disable-next-line class-methods-use-this
  async write(replies = null) {
    if (replies === null) {
      throw new ReferenceError('replies is undefined');
    }

    if (Array.isArray(replies) === false) {
      throw new TypeError('replies is not an array');
    }

    if (replies.length === 0) {
      throw new EvalError('replies is empty');
    }

    this.#debuglog({ replies });

    const kvs = (replies.map((item) => [item.name, item.reply])).flat();

    this.#debuglog({ kvs });

    // eslint-disable-next-line no-return-await
    return await this.#config.redis.rawCallAsync(['HSET', REPLIES_KEY, ...kvs]);
  }
}
