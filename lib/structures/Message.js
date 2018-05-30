const EnMap = require('enmap');

const Structure = require('./Structure');
const ObjectUtil = require('../util/ObjectUtil');
const MessageType = require('../enum/MessageType');

class Message extends Structure {
   constructor(client, data) {
      super(client, data);
   }

   setup(data) {
      super.setup(data);

      /**
       * @namespace
       * @property {number} Message.id - This message's ID
       * @property {string} Message.event - The message event type
       * @property {string} Message.content - The content of this message, whose format differs based on the event type
       * @property {Array.<string>} Message.tags - Tags for this message
       * @property {string} Message.externalUserName - The name that appears as the message sender
       * @property {string} Message.uuid - A client-generated UUID (for tagging purposes?)
       * @property {string} Message.threadId - The ID of the thread this message is in
       * @property {string} Message.externalThreadId - The custom identifier of the thread this message is in
       * @property {string} Message.thread - The thread's state
       * @property {Array} Message.attachments - The message's attachment
       * @property {number} Message.sentTimestamp - The timestamp at which this message was sent
       * @property {string} Message.app - Not really sure what this does. Perhaps where the user sent it from?
       * @property {number} Message.createdAtTimestamp - The timestamp at which this message was... created? dunno
       * @property {User} Message.user - The user that sent this message
       * @property {number} Message.parent - The ID of this message's parent message (if it's going to be threaded)
       * @property {Flow} Message.flow - The flow this message was or will be sent to
       */

      this.id = data.id;

      this.event = data.event;

      this.content = data.content;

      this.parent = data.message;

      this.tags = data.tags || [];

      this.attachments = data.attachments || [];

      this.sentTimestamp = data.sent;

      this.createdAtTimestamp = (data.created_at) ? new Date(data.created_at).getTime() : null;

      this.user = this.client.users.get(data.user);

      this.externalUserName = data.external_user_name;

      this.uuid = data.uuid;

      this.externalThreadId = data.external_thread_id;

      this.app = data.app;

      this.threadId = data.thread_id;

      this.thread = data.thread;

      this.flow = data.flow;
   }

   get sent() {
      return new Date(this.sentTimestamp);
   }

   get createdAt() {
      return new Date(this.createdAtTimestamp);
   }

   get isChat() {
      return this.event === MessageType.CHAT_MESSAGE;
   }

   get organization() {
      return (this.flow) ? this.flow.organization : null;
   }

   send() {
      return this.client.sendMessage(this);
   }
}

module.exports = Message;