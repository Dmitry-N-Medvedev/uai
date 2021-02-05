import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
import dotenv from 'dotenv';
import got from 'got';
import {
  LibAICommunicatorServer,
} from '../LibAICommunicatorServer.mjs';

dotenv.config({
  path: './specs/.env',
});

const debuglog = util.debuglog('LibAICommunicatorServer:specs');
const {
  describe,
  before,
  after,
  it,
} = mocha;
const {
  expect,
} = chai;

describe('LibAICommunicatorServer', () => {
  const LibAICommunicatorServerConfig = Object.freeze({
    apiKey: process.env.UAI_API_KEY ?? null,
    servers: {
      prefixUrl: process.env.UAI_SERVERS_PREFIX_URL ?? null,
      paths: {
        intents: process.env.UAI_SERVERS_PATHS_INTENTS ?? null,
      },
    },
    botId: process.env.UAI_BOT_ID ?? null,
    replyResolverServer: {
      host: process.env.REPLY_RESOLVER_SERVER_HOST ?? null,
      port: parseInt(process.env.REPLY_RESOLVER_SERVER_PORT, 10) ?? null,
      path: process.env.REPLY_RESOLVER_SERVER_PATH ?? null,
    },
    uWS: {
      port: parseInt(process.env.UWS_PORT, 10) ?? null,
    },
  });
  let libAICommunicatorServer = null;

  before(async () => {
    libAICommunicatorServer = new LibAICommunicatorServer(LibAICommunicatorServerConfig);

    await libAICommunicatorServer.start();

    debuglog(`libAICommunicatorServer.isRunning: ${libAICommunicatorServer.isRunning}`);

    expect(libAICommunicatorServer.isRunning).to.be.true;
  });

  after(async () => {
    await libAICommunicatorServer.stop();

    debuglog(`libAICommunicatorServer.isRunning: ${libAICommunicatorServer.isRunning}`);

    expect(libAICommunicatorServer.isRunning).to.be.false;
  });

  it.only('should getIntents for "Hello"', async () => {
    const client = got.extend({
      prefixUrl: `http://127.0.0.1:${LibAICommunicatorServerConfig.uWS.port}`,
      method: 'POST',
      http2: true,
      throwHttpErrors: true,
      responseType: 'json',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        authorization: LibAICommunicatorServerConfig.apiKey,
      },
    });

    const reply = await client.post('say', {
      body: 'Hello',
    });

    debuglog({ reply });

    expect(reply).to.exist;
  }).timeout(0);
});
