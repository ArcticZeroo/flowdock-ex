const EventEmitter = require('events');
const Message = require('./Message');

class FlowStream extends EventEmitter {
   constructor(client, ...flows) {
      super();

      this.events = new EventEmitter();
      this.client = client;
      this._stream = null;

      if (flows && flows.length) {
         this.create(...flows);
      }
   }

   set stream(v) {
      this.destroy();

      this._stream = v;
      this._registerListeners();
   }

   get stream() {
      return this._stream;
   }

   _registerListeners() {
      this._stream.on('message', (data) => {
         const type = data.event;
         this.events.emit('event', type, data);
         this.events.emit(type, data);

         const message = new Message(this.client, data);
         this.emit(type, message, data);
         this.emit('event', type, message, data);
      });

      this._stream.on('error', e => {
         this.emit('error', e);
      });
   }

   create(...flows) {
      if (!flows || !flows.length) {
         flows = Array.from(this.client.flows.values());
      }

      this.stream = this.client.session.stream(flows.map(flow => flow.id));
   }

   destroy() {
      if (this._stream) {
         this._stream.removeAllListeners();
         this._stream.end();
      }
   }
}

module.exports = FlowStream;