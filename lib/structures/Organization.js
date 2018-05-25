const EnMap = require('enmap');

const Structure = require('./Structure');
const ObjectUtil = require('../util/ObjectUtil');
const User = require('./User');

class Organization extends Structure {
   constructor(client, data) {
      super(client);

      this.users = new EnMap();
   }

   setup(data) {
      super.setup(data);

      for (const userData of data.users) {
         if (!this.client.users.has(userData.id)) {
            this.client.users.set(userData.id, new User(this.client, userData));
         }

         const user = this.client.users.get(userData.id);

         if (!user) {
            continue;
         }

         // noinspection JSUndefinedPropertyAssignment
         user.organization = this;

         this.users.set(userData.id, user);
      }

      /**
       * @namespace
       * @property {number} Organization.id - The ID of this organization
       * @property {string} Organization.name - The name of this organization.
       * @property {string} Organization.paramaterizedName - Not really sure what this does.
       * @property {string} Organization.url - This organization's url
       * @property {number} Organization.userLimit - The cap for users in this organization.
       * @property {number} Organization.userCount - The number of users in this organization.
       * @property {boolean} Organization.active - Whether this organization is currently active.
       * @property {object} Organization.subscription - Subscription info for this organizatiohn.
       * @property {boolean} Organization.subscription.trial - Whether this organization is on a trial.
       */
      ObjectUtil.convertProperties(data);
   }
}