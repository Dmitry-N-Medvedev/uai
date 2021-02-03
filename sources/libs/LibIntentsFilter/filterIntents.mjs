import util from 'util';

const debuglog = util.debuglog('LibIntentsFilter');

export const filterIntents = (intents = null) => {
  if (intents === null) {
    throw new ReferenceError('intents is undefined');
  }

  if (Array.isArray(intents) === false) {
    throw new TypeError('intents is not an array');
  }

  if (intents.length === 0) {
    throw new TypeError('intents is empty');
  }

  debuglog({
    intents,
  });

  const highestConfidence = (intents.map((intent) => parseFloat(intent.confidence)).sort((a, b) => b - a))[0];

  debuglog({
    highestConfidence,
  });

  const result = (intents.filter((intent) => intent.confidence === highestConfidence))[0];

  debuglog({
    result,
  });

  return result;
};
