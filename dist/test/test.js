function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const assert = require('assert');

const { Session } = require('flowdock');
const EnMap = require('enmap');

const FlowdockClient = require('../lib/client/FlowdockClient');
const MessageBuilder = require('../lib/structures/MessageBuilder');
const MessageType = require("../lib/enum/MessageType");

const token = process.env.TEST_TOKEN;

describe('Environment', function () {
   it('has a test token set', function () {
      assert.ok(token != null, 'No token is set in TEST_TOKEN env variable');
   });
});

describe('FlowdockClient', function () {
   let baseClient;

   before(function () {
      baseClient = new FlowdockClient({
         session: token
      });
   });

   it('Sets required properties', function () {
      assert.ok(baseClient.hasOwnProperty('session') && baseClient.session instanceof Session);
   });

   it('Throws an error when session is invalid', function () {
      assert.throws(() => {
         new FlowdockClient({ session: { hello: 'world' } });
      }, Error);

      assert.throws(() => {
         new FlowdockClient({});
      }, TypeError);

      assert.throws(() => {
         new FlowdockClient({ session: 2 });
      }, TypeError);
   });

   it('Populates organizations, flows, and users on init', _asyncToGenerator(function* () {
      this.timeout(10000);

      try {
         yield baseClient.init();
      } catch (e) {
         throw e;
      }

      assert.notEqual(baseClient.organizations.size, 0, 'no organizations were populated');
      assert.notEqual(baseClient.flows.size, 0, 'no flows were populated');
      assert.notEqual(baseClient.users.size, 0, 'no users were populated');
      assert.ok(baseClient.self != null, 'self is null');
   }));

   after(function () {
      baseClient.destroy();
   });
});