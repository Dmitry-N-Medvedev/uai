import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
import dotenv from 'dotenv';
import {
  nanoid,
} from 'nanoid';
import {
  LibAICommunicator,
} from '../LibAICommunicator.mjs';

const debuglog = util.debuglog('LibAICommunicator:specs');
const {
  describe,
  before,
  after,
  it,
} = mocha;
const {
  expect,
} = chai;

dotenv.config({
  path: './specs/.env',
});

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
  let libAICommunicator = null;

  before(async () => {
    libAICommunicator = new LibAICommunicator(LibAICommunicatorConfig);

    // eslint-disable-next-line no-return-await
    return await libAICommunicator.start();
  });

  // eslint-disable-next-line arrow-body-style
  after(async () => {
    // eslint-disable-next-line no-return-await
    return await libAICommunicator.stop();
  });

  it('should getIntents for "Hello"', async () => {
    const humanSaid = 'Hello';
    const intents = await libAICommunicator.getIntents(humanSaid);

    expect(Array.isArray(intents)).to.be.true;
    expect(intents).to.have.lengthOf.above(0);
  }).timeout(0);

  it('should throw ReferenceError w/ an undefined message', async () => {
    const humanSaid = null;
    let error = null;

    try {
      await libAICommunicator.getIntents(humanSaid);
    } catch (referenceError) {
      error = referenceError;
    } finally {
      expect(error).to.be.an.instanceof(ReferenceError);
    }
  });

  it('should fail w/ incorrect settings', async () => {
    const invalidUrl = nanoid(7);
    const interventions = [
      {
        key: {
          apiKey: nanoid(36),
        },
        error: {
          message: 'Unauthorized',
        },
      },
      {
        key: {
          botId: nanoid(24),
        },
        error: {
          message: 'Bad Request',
        },
      },
      {
        key: {
          servers: {
            paths: {
              intents: invalidUrl,
            },
          },
        },
        error: {
          message: `Invalid URL: ${invalidUrl}`,
        },
      },
    ];
    const humanSaid = 'Hello';
    let errorCounter = 0;

    for await (const intervention of interventions) {
      const apiCommunicatorConfig = {
        ...LibAICommunicatorConfig,
        ...intervention.key,
      };

      let apiCommunicator = new LibAICommunicator(apiCommunicatorConfig);

      try {
        await apiCommunicator.start();
        await apiCommunicator.getIntents(humanSaid);
      } catch (error) {
        errorCounter += 1;

        expect(error.message).to.equal(intervention.error.message);
      } finally {
        await apiCommunicator.stop();
        apiCommunicator = null;
      }
    }

    expect(errorCounter).to.equal(interventions.length);
  });
});
