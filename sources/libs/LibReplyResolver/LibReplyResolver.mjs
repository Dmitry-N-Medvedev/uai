import util from 'util';

const REPLIES_KEY = 'replies';

export class LibReplyResolver {
  #debuglog = null;
  #config = null;

  constructor(config = null) {
    if (config === null) {
      throw new ReferenceError('config is undefined');
    }

    this.#debuglog = util.debuglog(this.constructor.name);
    this.#config = Object.freeze({ ...config });
  }

  async resolveReply(byIntent = null) {
    if (byIntent === null) {
      throw new ReferenceError('byIntent is undefined');
    }

    this.#debuglog({ byIntent });

    // eslint-disable-next-line no-return-await
    return await this.#config.redis.rawCallAsync(['HGET', REPLIES_KEY, byIntent.toString()]);
  }
}
