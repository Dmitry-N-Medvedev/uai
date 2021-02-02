import util from 'util';
import mocha from 'mocha';
import chai from 'chai';

const debuglog = util.debuglog('LibAICommunicator:specs');
const {
  describe,
  it,
} = mocha;
const {
  expect,
} = chai;

describe('LibAICommunicator', () => {
  // FIXME: rm this test when proper tests emerge
  it('should just succeed', async () => {
    expect(true).to.be.true;
  });
});
