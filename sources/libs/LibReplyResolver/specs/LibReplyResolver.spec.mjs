import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
import {
  nanoid,
} from 'nanoid';
import {
  LibRedisAdapter,
} from '@dmitry-n-medvedev/libredisadapter/LibRedisAdapter.mjs';
import {
  LibReplyWriter,
} from '@dmitry-n-medvedev/libreplywriter/LibReplyWriter.mjs';
import {
  LibReplyResolver,
} from '../LibReplyResolver.mjs';

const debuglog = util.debuglog('LibReplyResolver:specs');
const {
  describe,
  before,
  after,
  it,
} = mocha;
const {
  expect,
} = chai;

describe('LibReplyResolver', () => {
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

  it('should resolveReply', async () => {
    const name = `name:${nanoid(15)}`;
    const reply = `reply to <${name}>`;
    const replies = Object.freeze([
      {
        name,
        reply,
      },
    ]);
    const LibReplyWriterConfig = Object.freeze({
      redis: await libRedisAdapter.newInstance(LibRedisAdapterConfig, 'LibReplyWriter'),
    });
    const libReplyWriter = new LibReplyWriter(LibReplyWriterConfig);
    const libReplyResolver = new LibReplyResolver(LibReplyWriterConfig);

    keysToCleanUp.push('replies');

    await libReplyWriter.write(replies);

    const resolvedReply = await libReplyResolver.resolveReply(name);

    debuglog({
      resolvedReply,
    });

    expect(resolvedReply).to.equal(reply);
  });

  it('should fail on undefined intent', async () => {
    const name = `name:${nanoid(15)}`;
    const reply = `reply to <${name}>`;
    const replies = Object.freeze([{
      name,
      reply,
    }]);

    const LibReplyWriterConfig = Object.freeze({
      redis: await libRedisAdapter.newInstance(LibRedisAdapterConfig, 'LibReplyWriter'),
    });
    const libReplyWriter = new LibReplyWriter(LibReplyWriterConfig);
    const libReplyResolver = new LibReplyResolver(LibReplyWriterConfig);

    keysToCleanUp.push('replies');

    await libReplyWriter.write(replies);

    let error = null;

    try {
      const resolvedReply = await libReplyResolver.resolveReply(null);

      debuglog({
        resolvedReply,
      });
    } catch (resolveError) {
      error = resolveError;
    } finally {
      expect(error).to.be.instanceOf(ReferenceError);
    }
  });
});
