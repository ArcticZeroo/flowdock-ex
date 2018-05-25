const EnMap = require('enmap');

const Structure = require('./Structure');
const ObjectUtil = require('../util/ObjectUtil');

class Message extends Structure {
   constructor(client, data) {
      super(client, data);
   }

   setup(data) {
      super.setup(data);


   }
}

module.exports = Message;