const util = require('util');
const EventEmitter = require('events');

const { Session } = require('flowdock');
const EnMap = require('enmap');

const flowdockInternalConfig = require('../../config/flowdock-internal');
const Flow = require('../structures/Flow');
const Organization = require('../structures/Organization');
const FlowStream = require('../structures/FlowStream');

class FlowdockClient extends EventEmitter  {
   constructor(options = {}) {
      super();

      this.options = Object.assign({
         updateJoinedFlows: true,
         retrieveAllFlows: true
      }, options);

      const { session } = options;

      // Validate session and set FlowdockClient.session
      if (typeof session === 'string') {
         this.session = new Session(session);
      } else if (typeof session === 'object') {
         if (Array.isArray(session)) {
            // Assume [user, pass]
            const [user, pass] = session;
            this.session = new Session(user, pass);
         } else {
            const user = session.user || session.username;
            const pass = session.pass || session.password;

            if (user && pass) {
               this.session = new Session(user, pass);
            } else {
               if (session.token) {
                  this.session = new Session(session.token);
               } else {
                  throw new Error('Invalid parameters passed inside session constructor parameter');
               }
            }
         }
      } else {
         throw new TypeError('Expected type string or object in session constructor parameter, got type ' + typeof session);
      }

      this._promisifySession();

      this._selfIds = new Set();
      // ID -> User
      this.self = new EnMap();
      // ID -> Organization
      this.organizations = new EnMap();
      // ID -> Flow
      this.flows = new EnMap();
      this._joinedFlows = new Set();
      // ID -> User
      /**
       * All users in this client.
       * @type {module:enmap.Enmap<number, User>}
       */
      this.users = new EnMap();
   }

   _promisifySession() {
      for (const prop of flowdockInternalConfig.toPromisify) {
         // completely replace the existing item with the promisified version
         this.session[prop] = util.promisify(this.session[prop]);
      }
   }

   /**
    * Perform a request with the flowdock API.
    * This method returns a promise that resolves and rejects
    * in expected conditions. The resolved variable will be
    * parsed JSON from the response body.
    *
    * @example
    * client.request('get', '/flows/find', {id: 'shrug'})
    *    .then(flow => { /* do something with it /* })
    *
    * @param options - Options to use.
    * @param options.type - Either get, post, put, or delete. Based on the endpoint.
    * @param options.path - The API path to request.
    * @param options.data - Data to be included in the request
    * @returns {Promise<any>}
    */
   async request({ type = 'get', path, data }) {
      type = type.toLowerCase();

      if (!['get', 'post', 'put', 'delete'].includes(type)) {
         throw new Error('Invalid HTTP method: ' + type);
      }

      return new Promise((resolve, reject) => {
         this.session[type](path, data, (err, resData, rawRes) => {
            if (err) {
               reject(err);
               return;
            }

            if (rawRes && rawRes.headers && rawRes.headers['Flowdock-User']
               && !isNaN(rawRes.headers['Flowdock-User'])) {
               this._addSelf(parseInt(rawRes.headers['Flowdock-User']));
            }

            resolve(resData);
         });
      });
   }

   _addSelf(id) {
      this._selfIds.add(id);

      if (this.self.has(id)) {
         // my own id's user better be loaded!
         this.self.set(id, this.users.get(id));
      }
   }

   async retrieveFlows(all = true) {
      const path = all ? '/flows/all' : '/flows';

      let flowDataList;
      try {
         flowDataList = await this.request({ path, data: { users: 1 } });
      } catch (e) {
         throw e;
      }

      for (const flowData of flowDataList) {
         // This initializes users for us. Thanks Flow!
         const flow = new Flow(this, flowData);

         this.flows.set(flow.id, flow);
      }
   }

   async retrieveOrganizations() {
      let organizationDataList;
      try {
         organizationDataList = await this.request({ path: '/organizations' });
      } catch (e) {
         throw e;
      }

      for (const organizationData of organizationDataList) {
         const organization = new Organization(this, organizationData);

         this.organizations.set(organization.id, organization);
      }
   }

   chat(organization, flow) {

   }

   isSelf(user) {
      return this._selfIds.has(user.id);
   }

   _startFlowUpdater() {
      if (this._flowUpdaterInterval) {
         clearInterval(this._flowUpdaterInterval);
         this._flowUpdaterInterval = null;
      }

      setInterval(() => {
         this.request({ path: '/flows' })
            .then((responseFlows) => {
               if (responseFlows.length !== this._joinedFlows.size) {
                  const newlyJoinedFlows = [];

                  for (const responseFlow of responseFlows) {
                     if (!this.flows.has(responseFlow.id)) {
                        // Definitely new if it's not cached
                        const flow = new Flow(this, responseFlow);

                        this.flows.set(flow.id, flow);

                        newlyJoinedFlows.push(flow);
                     } else {
                        const flow = this.flows.get(responseFlow.id);

                        if (!this._joinedFlows.has(flow)) {
                           // new flow, not in joined
                           newlyJoinedFlows.push(flow);
                        }
                     }
                  }

                  if (!newlyJoinedFlows || !newlyJoinedFlows.length) {
                     return;
                  }

                  for (const flow of newlyJoinedFlows) {
                     this._joinedFlows.add(flow);
                     this.emit('joinedFlow', flow);
                  }

                  this.emit('joinedFlows', newlyJoinedFlows);
               }
            })
            .catch((e) => {
               this.emit('error', e);
            });
      }, 30*1000);
   }

   async init() {
      try {
         await this.retrieveOrganizations();
      } catch (e) {
         throw e;
      }

      // This is second so it can do the organizations
      try {
         await this.retrieveFlows(this.options.retrieveAllFlows);
      } catch (e) {
         throw e;
      }

      if (this.options.updateJoinedFlows) {
         this._startFlowUpdater();
      }
   }

   stream(...flows) {
      return new FlowStream(this, ...flows);
   }
}

module.exports = FlowdockClient;