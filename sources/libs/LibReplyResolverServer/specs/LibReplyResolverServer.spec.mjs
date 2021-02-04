import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
import got from 'got';
import {
  LibRedisAdapter,
} from '@dmitry-n-medvedev/libredisadapter/LibRedisAdapter.mjs';
import {
  LibReplyWriter,
} from '@dmitry-n-medvedev/libreplywriter/LibReplyWriter.mjs';
import {
  LibReplyResolverServer,
} from '../LibReplyResolverServer.mjs';

const debuglog = util.debuglog('LibReplyResolverServer:specs');
const {
  describe,
  before,
  after,
  it,
} = mocha;
const {
  expect,
} = chai;

describe('LibReplyResolverServer', () => {
  const LibRedisAdapterConfig = Object.freeze({
    host: '127.0.0.1',
    port: 6379,
  });
  const libReplyResolverServerConfig = Object.freeze({
    redis: LibRedisAdapterConfig,
    uWS: {
      port: 9091,
    },
  });
  const replies = Object.freeze([{
    name: 'hello',
    reply: 'reply for <hello>',
  }]);
  let libRedisAdapter = null;
  let libReplyWriter = null;
  let libReplyResolverServer = null;
  let client = null;

  before(async () => {
    libRedisAdapter = new LibRedisAdapter();
    const LibReplyWriterConfig = Object.freeze({
      redis: await libRedisAdapter.newInstance(LibRedisAdapterConfig, 'LibReplyWriter'),
    });
    libReplyWriter = new LibReplyWriter(LibReplyWriterConfig);
    await libReplyWriter.write(replies);

    libReplyResolverServer = new LibReplyResolverServer(libReplyResolverServerConfig);

    await libReplyResolverServer.start();

    expect(libReplyResolverServer.isRunning).to.be.true;

    client = got.extend({
      prefixUrl: `http://127.0.0.1:${libReplyResolverServerConfig.uWS.port}`,
      http2: true,
      throwHttpErrors: false,
      responseType: 'json',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  });

  after(async () => {
    client = null;
    libReplyWriter = null;

    await libReplyResolverServer.stop();

    expect(libReplyResolverServer.isRunning).to.be.false;

    libReplyResolverServer = null;
  });

  it(`should resolve reply an the "${(replies[0]).name}" intent`, async () => {
    const intent = 'hello';
    const { body: { reply } } = await client.post('resolve', {
      body: JSON.stringify(intent),
    });

    debuglog('reply:', reply);

    expect(reply).to.equal((replies[0]).reply);
  });

  it.only('should fail to start the server w/ undefined config', async () => {
    const configs = Object.freeze([
      {
        config: null,
        exception: ReferenceError,
      },
      {
        config: {
          ...libReplyResolverServerConfig,
          ...{
            uWS: {
              port: null,
            },
          },
        },
        exception: ReferenceError,
      },
    ]);

    for await (const config of configs) {
      let error = null;
      let server = null;

      try {
        server = new LibReplyResolverServer(config.config) ?? null;

        await server.start();

        debuglog({
          server,
        });
      } catch (anError) {
        error = anError;
      } finally {
        if (server !== null) {
          await server.stop();
        }

        expect(error).to.be.an.instanceof(config.exception);
      }
    }
  });
});
