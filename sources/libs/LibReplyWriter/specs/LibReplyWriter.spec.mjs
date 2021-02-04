import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
import {
  LibRedisAdapter,
} from '@dmitry-n-medvedev/libredisadapter/LibRedisAdapter.mjs';
import {
  LibReplyWriter,
} from '../LibReplyWriter.mjs';

const debuglog = util.debuglog('LibReplyWriter:specs');
const {
  describe,
  before,
  after,
  it,
} = mocha;
const {
  expect,
} = chai;

describe('LibReplyWriter', () => {
  let libRedisAdapter = null;
  let specRedisInstance = null;
  const SpecRedisInstanceName = 'SpecRedisInstance';
  const LibRedisAdapterConfig = Object.freeze({
    host: '127.0.0.1',
    port: 6379,
  });
  const keysToCleanUp = [];
  const cleanUpData = async () => {
    if (keysToCleanUp.length > 0) {
      await specRedisInstance.rawCallAsync(['DEL', ...keysToCleanUp]);
    }
  };

  before(async () => {
    try {
      libRedisAdapter = new LibRedisAdapter();

      specRedisInstance = await libRedisAdapter.newInstance(LibRedisAdapterConfig, SpecRedisInstanceName);
    } catch (redisError) {
      debuglog(redisError.message);

      throw redisError;
    }

    return Promise.resolve();
  });

  after(async () => {
    try {
      await cleanUpData();

      libRedisAdapter.shutDownInstance(specRedisInstance);

      await libRedisAdapter.destroy();
      specRedisInstance = null;
      libRedisAdapter = null;
    } catch (redisError) {
      debuglog(redisError.message);
    }

    return Promise.resolve();
  });

  it('should write replies to DB', async () => {
    const replies = Object.freeze([{
      name: 'Greeting',
      reply: 'reply to <Greeting>',
    }, {
      name: 'Means or need to contact',
      reply: 'reply to <Means or need to contact>',
    }, {
      name: 'Goodbye',
      reply: 'reply to <Goodbye>',
    }, {
      name: 'What can I ask you?',
      reply: 'reply to <What can I ask you>',
    }, {
      name: 'Affirmative',
      reply: 'reply to <Affirmative>',
    }]);
    keysToCleanUp.push('replies');

    const LibReplyWriterConfig = Object.freeze({
      redis: await libRedisAdapter.newInstance(LibRedisAdapterConfig, 'LibReplyWriter'),
    });
    const libReplyWriter = new LibReplyWriter(LibReplyWriterConfig);

    await libReplyWriter.write(replies);

    const dbReplies = await specRedisInstance.rawCallAsync(['HGETALL', 'replies']);

    debuglog({ dbReplies });

    const kvs = (replies.map((item) => [item.name, item.reply])).flat();

    expect(kvs).to.have.members(dbReplies);
  });
});
