// @flow
const responseSupport = require('./response_support');

module.exports = function () {
  responseSupport.initialize.call(this);
  this.Then(/^responded with status code (\d+)$/, responseSupport.statusCode);
  this.Then(/^response matched pattern$/, responseSupport.matchPattern);
};
