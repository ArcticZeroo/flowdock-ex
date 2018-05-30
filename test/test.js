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
         new FlowdockClient({ });
      }, TypeError);

      assert.throws(() => {
         new FlowdockClient({ session: 2 });
      }, TypeError);
   });

   it('Populates organizations, flows, and users on init', async function () {
      this.timeout(10000);

      try {
         await baseClient.init();
      } catch (e) {
         throw e;
      }

      assert.notEqual(baseClient.organizations.size, 0, 'no organizations were populated');
      assert.notEqual(baseClient.flows.size, 0, 'no flows were populated');
      assert.notEqual(baseClient.users.size, 0, 'no users were populated');
   });

   describe('MessageBuilder', function () {
      it('Properly builds mundane chat messages', function () {
         const flow = baseClient.flows.find('name', 'spencer-test');

         assert.ok(flow != null, 'spencer-test flow could not be found');

         const message = new MessageBuilder('Hello World!')
            .setFlow(flow)
            .build(baseClient);

         assert.equal(message.content, 'Hello World!', 'Content was not properly set');
         assert.equal(message.flow, flow, 'Flow was not properly set');
         assert.equal(message.event, MessageType.CHAT_MESSAGE, 'Message type was not automatically set');

         message.send();
      });
   });

   after(function () {
      baseClient.destroy();
   });
});