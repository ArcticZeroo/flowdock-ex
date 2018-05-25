const assert = require('assert');

const { Session } = require('flowdock');
const EnMap = require('enmap');

const FlowdockClient = require('../lib/client/FlowdockClient');
const token = process.env.TEST_TOKEN;

describe('FlowdockClient', function () {
   const baseClient = new FlowdockClient({
      session: token
   });

   it('Sets required properties', function () {
      assert.ok(baseClient.hasOwnProperty('session') && baseClient.session instanceof Session);
   });

   it('Throws an error when session is invalid', function () {
      assert.throws(() => {
         new FlowdockClient({ session: { hello: 'world' } });
      }, Error);

      assert.throws(() => {
         new FlowdockClient({ });
      }, TypeError);

      assert.throws(() => {
         new FlowdockClient({ session: 2 });
      }, TypeError);
   });

   it('Populates organizations, flows, and users on init', async function () {
      try {
         await baseClient.init();
      } catch (e) {
         throw e;
      }
   });
});