function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

class Structure {
   constructor(client, data) {
      /**
       * The client used by this structure.
       * @type {FlowdockClient}
       */
      this.client = client;

      if (data) {
         this.setup(data);
      }
   }

   /**
    * Use given data to set this structure up.
    */
   setup() {
      /**
       * The last time at which this structure was updated, as an epoch timestamp.
       * @type {number}
       */
      this.updated = Date.now();
   }

   /**
    * Update this structure. This method, when overridden by base classes, should call {@link Structure#setup}
    * @returns {Promise}
    */
   update() {
      return _asyncToGenerator(function* () {})();
   }
}

module.exports = Structure;