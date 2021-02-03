import util from 'util';
import mocha from 'mocha';
import chai from 'chai';
import {
  filterIntents,
} from '../filterIntents.mjs';

const debuglog = util.debuglog('LibIntentsFilter:spec');
const {
  describe,
  it,
} = mocha;
const {
  expect,
} = chai;

describe('LibIntentsFilter', () => {
  const highestConfidence = 0.9999980926513672;
  const intents = Object.freeze([
    {
      confidence: highestConfidence,
      name: 'Greeting',
    }, {
      confidence: 0.0000014951139064578456,
      name: 'Means or need to contact ',
    }, {
      confidence: 3.858517061416933e-7,
      name: 'Goodbye',
    }, {
      confidence: 3.389718017388077e-8,
      name: 'What can I ask you?',
    }, {
      confidence: 9.127305133915797e-9,
      name: 'Affirmative',
    },
  ]);

  it('should return an intent with the highest confidence score', async () => {
    const result = filterIntents(intents);

    expect(result.confidence).to.equal(highestConfidence);
  });

  it('should fail w/ erroneous intents', async () => {
    const erroneousIntents = Object.freeze([
      {
        intents: null,
        error: ReferenceError,
      },
      {
        intents: undefined,
        error: ReferenceError,
      },
      {
        intents: 'not-an-array',
        error: TypeError,
      },
      {
        intents: [],
        error: EvalError,
      },
    ]);

    for (const erroneousIntent of erroneousIntents) {
      let error = null;

      try {
        filterIntents(erroneousIntent.intents);
      } catch (caughtError) {
        error = caughtError;
      } finally {
        expect(error).to.be.an.instanceof(erroneousIntent.error);
      }
    }
  });
});
