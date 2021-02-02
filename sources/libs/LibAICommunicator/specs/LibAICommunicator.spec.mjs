import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
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

// FIXME: rm this when all tests are ready

describe('LibAICommunicator', () => {
  const LibAICommunicatorConfig = Object.freeze({
    apiKey: '825765d4-7f8d-4d83-bb03-9d45ac9c27c0',
    servers: {
      prefixUrl: 'https://chat.ultimate.ai/api',
      paths: {
        intents: 'intents',
      },
    },
    botId: '5f74865056d7bb000fcd39ff',
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
