/* eslint no-multi-spaces: "off", prefer-rest-params: "off", no-unused-vars: "off" */

const assert = require('assert');
const chai = require('chai');

module.exports = {
  notStep(fn) {
    const genericWrap = function (...args) {
      assert.throws(fn.bind(this, ...args), chai.AssertionError, 'An expectation succeeded that should have failed.');
    };
    const fnTemplates = [
      function () { return genericWrap.apply(this, arguments); },
      function (a1) { return genericWrap.apply(this, arguments); },
      function (a1, a2) { return genericWrap.apply(this, arguments); },
      function (a1, a2, a3) { return genericWrap.apply(this, arguments); },
      function (a1, a2, a3, a4) { return genericWrap.apply(this, arguments); },
      function (a1, a2, a3, a4, a5) { return genericWrap.apply(this, arguments); },
      function (a1, a2, a3, a4, a5, a6) { return genericWrap.apply(this, arguments); },
      function (a1, a2, a3, a4, a5, a6, a7) { return genericWrap.apply(this, arguments); },
      function (a1, a2, a3, a4, a5, a6, a7, a8) { return genericWrap.apply(this, arguments); },
      function (a1, a2, a3, a4, a5, a6, a7, a8, a9) { return genericWrap.apply(this, arguments); },
    ];
    return fnTemplates[fn.length];
  },
};