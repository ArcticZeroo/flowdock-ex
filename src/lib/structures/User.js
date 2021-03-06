const Collection = require('@arcticzeroo/djs-collection');

const Structure = require('./Structure');
const ObjectUtil = require('../util/ObjectUtil');

class User extends Structure {
   constructor(client, data) {
      super(client, data);

      this.flows = new Collection();

      /**
       * This user's organizations
       * @type {Collection}
       */
      this.organizations = new Collection();
   }

   setup(data) {
      super.setup(data);

      /**
       * @namespace
       * @property {number} User.id - The ID of this user
       * @property {string} User.name - The name of this user.
       * @property {string} User.email - The email of this user.
       * @property {boolean} User.admin - Whether this user is an admin of the organization.
       * @property {string} User.website - This user's website
       * @property {string} User.avatar - This user's avatar
       * @property {string} User.nick - This user's nickname
       */
      Object.assign(this, ObjectUtil.convertProperties(data));
   }

   get displayName() {
      return this.nick || this.name;
   }

   toString() {
      return `User@${this.id}[name="${this.name}"]`;
   }
}

module.exports = User;