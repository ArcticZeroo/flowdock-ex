const Collection = require('@arcticzeroo/djs-collection');

const Structure = require('./Structure');
const ObjectUtil = require('../util/ObjectUtil');
const User = require('./User');

class Flow extends Structure {
   constructor(client ,data) {
      super(client);

      this.users = new Collection();

      if (data) {
         this.setup(data);
      }
   }

   setup(data) {
      // Don't really care if this ends up being null, but it shouldn't be
      this.organization = this.client.organizations.get(data.organization.id);
      delete data.organization;

      if (data.users) {
         for (const userData of data.users) {
            if (!this.client.users.has(userData.id)) {
               this.client.users.set(userData.id, new User(this.client, userData));
            }

            const user = this.client.users.get(userData.id);

            user.flows.set(data.id, this);

            this.users.set(userData.id, user);
         }

         delete data.users;
      }

      // This will assign id, name, parameterizedName, organization,
      // unreadMentions, open, joined, url, webUrl, and accessMode
      /**
       * @namespace
       * @property {number} Flow.id - The ID of this flow
       * @property {string} Flow.name - The name of this flow.
       * @property {string} Flow.paramaterizedName - Not really sure what this does.
       * @property {Organization} Flow.organization - This flow's organization
       * @property {number} Flow.unreadMentions - How many unread mentions the authenticated user has here.
       * @property {boolean} Flow.open - Whether this flow is open
       * @property {boolean} Flow.joined - Whether the authenticated user is in this flow currently
       * @property {string} Flow.url - This flow's url
       * @property {string} Flow.webUrl - This flow's web url?
       * @property {string} Flow.accessMode - This flow's... access mode? idunno what that is either.
       */
      Object.assign(this, ObjectUtil.convertProperties(data, true));

      // Add this flow to its organization's flows!
      this.organization.flows.set(this.id, this);

      // And add all users from this flow to the organization
      for (const [id, user] of this.users.entries()) {
         this.organization.users.set(id, user);

         user.organizations.set(this.organization.id, this.organization);
      }

      super.setup(data);
   }

   chat(message, tags) {
      return this.client.session.message(this.id, message, tags);
   }

   status(message) {
      return this.client.status(this.id, message);
   }

   toString() {
      return `Flow@${this.id}[name="${this.name}",users=${this.users.size}]`;
   }

   stream() {
      return this.client.stream(this);
   }

   sendMessage(message) {
      message.flow = this;
      return message.send();
   }
}

module.exports = Flow;