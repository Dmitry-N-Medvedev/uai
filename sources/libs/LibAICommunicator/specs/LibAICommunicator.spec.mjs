import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
import dotenv from 'dotenv';
import {
  LibAICommunicator,
} from '../LibAICommunicator.mjs';

const debuglog = util.debuglog('LibAICommunicator:specs');
const {
  describe,
  it,
} = mocha;
const {
  expect,
} = chai;

dotenv.config({
  path: './specs/.env',
});

// FIXME: rm this when all tests are ready

describe('LibAICommunicator', () => {
  const LibAICommunicatorConfig = Object.freeze({
    apiKey: process.env.API_KEY,
    servers: {
      prefixUrl: 'https://chat.ultimate.ai/api',
      paths: {
        intents: 'intents',
      },
    },
    botId: process.env.BOT_ID,
  });

  it('should getIntents for "Hello"', async () => {
    const humanSaid = 'Hello';
    const libAICommunicator = new LibAICommunicator(LibAICommunicatorConfig);

    await libAICommunicator.start();
    const intents = await libAICommunicator.getIntents(humanSaid);

    expect(Array.isArray(intents)).to.be.true;
    expect(intents).to.have.lengthOf.above(0);

    await libAICommunicator.stop();
  }).timeout(1500);
});
