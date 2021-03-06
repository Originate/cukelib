/* eslint-env mocha */
// @flow

const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');

const { expect, AssertionError } = chai;
chai.use(chaiAsPromised);


const stepMods = require('./');

describe('lib/step_mods', () => {
  describe('#throwStep sync', () => {
    it('returns a function', () => {
      expect(stepMods.throwStep(() => {}, 'Error', '')).to.be.a('function');
    });
    it('returns a function with the same number of arguments as the original function', () => {
      const testFn = (a1, a2) => {}; // eslint-disable-line no-unused-vars
      const throwStepFn = stepMods.throwStep(testFn, 'Error', '');
      expect(throwStepFn.length).to.equal(2);
    });
    it("throws an AssertionError when the original function doesn't throw", () => {
      const testFn = () => {};
      const throwStepFn = stepMods.throwStep(testFn, 'Error', '');
      expect(throwStepFn).to.throw(AssertionError);
    });
    it('passes when the original function throws', () => {
      const testFn = () => { throw new Error('an error message'); };
      const throwStepFn = stepMods.throwStep(testFn, 'Error', 'whatever');
      expect(throwStepFn).to.not.throw(/.*/);
    });
  });
  describe('#throwStep async', () => {
    it('rejects with an AssertionError when the original function resolves', () => {
      const testFn = () => Promise.resolve('abc');
      const throwStepFn = stepMods.throwStep(testFn, 'Error', '');
      const result = throwStepFn();
      // $FlowFixMe
      return expect(result).to.be.rejectedWith(AssertionError);
    });
    it('passes when the original function rejects', () => {
      const testFn = () => Promise.reject(new Error('a rejection'));
      const throwStepFn = stepMods.throwStep(testFn, 'Error', '');
      // $FlowFixMe
      return expect(throwStepFn).to.resolve;
    });
  });
});
