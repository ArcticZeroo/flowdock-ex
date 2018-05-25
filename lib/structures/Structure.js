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
   async update() {}
}

module.exports = Structure;