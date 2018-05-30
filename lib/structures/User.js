const EnMap = require('enmap');

const Structure = require('./Structure');
const ObjectUtil = require('../util/ObjectUtil');

class User extends Structure {
   constructor(client, data) {
      super(client, data);

      this.flows = new EnMap();

      /**
       * The user's organization
       * @type {Organization}
       */
      this.organization = null;
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
       */
      Object.assign(this, ObjectUtil.convertProperties(data));
   }
}

module.exports = User;