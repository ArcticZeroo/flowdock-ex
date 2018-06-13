const MessageType = require('../enum/MessageType');
const Message = require('./Message');

class MessageBuilder {
   constructor(content) {
      this.data = { content, event: MessageType.CHAT_MESSAGE, tags: [] };
   }

   setType(type) {
      this.data.event = type;
      return this;
   }

   setFlow(flow) {
      this.data.flow = flow;
      return this;
   }

   addTags(...tags) {
      this.data.tags.push(...tags);
      return this;
   }

   addTag(tag) {
      return this.data.tags(tag);
   }

   setExternalName(name) {
      this.data.externalName = name;
      return this;
   }

   setUuid(uuid) {
      this.data.uuid = uuid;
      return this;
   }

   setThread(id) {
      this.data.thread_id = id;
      return this;
   }

   setExternalThread(id) {
      this.data.external_thread_id = id;
      return this;
   }

   setThreadState(state) {
      this.data.thread = state;
      return this;
   }

   setParent(parent) {
      // Allow a Message or a direct value
      this.data.parent = (parent.id || parent);
      return this;
   }

   setContent(content) {
      this.data.content = content;
      return this;
   }

   setText(text) {
      return this.setContent(text);
   }

   build(client) {
      return new Message(client, this.data);
   }
}

module.exports = MessageBuilder;