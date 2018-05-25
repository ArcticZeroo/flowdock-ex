const EventEmitter = require('events');

class FlowStream extends EventEmitter {
   constructor(client) {
      super();

      this.client = client;
      this.flows = [];
      this._stream = null;
   }

   set stream(v) {
      if (this._stream) {
         this._stream.removeAllListeners();
      }

      this._stream = v;
      this._registerListeners();
   }

   get stream() {
      return this._stream;
   }

   _registerListeners() {
      this._stream.on('message', (data) => {
         const type = data.event;
         this.emit('event', data);
         this.emit(type, data);
      });
   }

   create(...flows) {
      this.stream = this.client.session.stream(flows);
   }
}

module.exports = FlowStream;