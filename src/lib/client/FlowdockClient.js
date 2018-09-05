const EventEmitter = require('events');

const { Session } = require('flowdock');
const Collection = require('@arcticzeroo/djs-collection');
const { promisify } = require('bluebird');

const flowdockInternalConfig = require('../../config/flowdock-internal');
const Flow = require('../structures/Flow');
const Organization = require('../structures/Organization');
const FlowStream = require('../structures/FlowStream');
const User = require('../structures/User');
const TimeUtil = require("../util/TimeUtil");

class FlowdockClient extends EventEmitter  {
   constructor(options = {}) {
      super();

      // If the user provided only a string as the argument,
      // assume that the only option they care about is a
      // session token.
      if (typeof options === 'string') {
         options = {
            session: options
         };
      }

      /**
       * Options on this client.
       * @type {object}
       */
      this.options = Object.assign({
         updateJoinedFlows: true,
         updateUsers: true,
         retrieveAllFlows: true,
         autoListenForMessages: true,
         restartMessageStreamInterval: 60 * 60 * 1000
      }, options);

      const { session } = options;

      // Validate session and set FlowdockClient.session
      if (typeof session === 'string') {
         /**
          * This client's active flowdock session.
          * @type {Session}
          */
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
      this._registerSessionEvents();

      this._selfId = null;
      /**
       * The user that is you!
       * @type {User}
       */
      this.self = null;
      // ID -> Organization
      /**
       * A map of organization ID -> organization
       * @type {Collection}
       */
      this.organizations = new Collection();
      // ID -> Flow
      /**
       * A map of flow ID -> flow
       * @type {Collection}
       */
      this.flows = new Collection();
      this._joinedFlows = new Set();
      // ID -> User
      /**
       * All users in this client.
       * @type {Collection}
       */
      this.users = new Collection();
   }

   _promisifySession() {
      for (const prop of flowdockInternalConfig.toPromisify) {
         // completely replace the existing item with the promisified version
         this.session[prop] = promisify(this.session[prop], { context: this.session });
      }
   }

   _registerSessionEvents() {
      this.session.on('error', (e) => {
         this.emit('error', e);
      });
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
    * @returns {Promise<*>}
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

            // This is literally the only way flowdock allows us to get information
            // about us, the currently authenticated user.
            if (rawRes && rawRes.headers && rawRes.headers['flowdock-user']
               && !isNaN(rawRes.headers['flowdock-user'])) {
               this._selfId = parseInt(rawRes.headers['flowdock-user']);
               this.self = this.users.get(this._selfId);
            }

            resolve(resData);
         });
      });
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

   async retrieveUsers() {
      let newUsers = false;
      for (const organization of this.organizations.values()) {
         let userDataList;
         try {
            userDataList = await this.request({ path: `/organizations/${organization.parameterizedName}/users` });
         } catch (e) {
            throw e;
         }

         for (const userData of userDataList) {
            if (!this.users.has(userData.id)) {
               newUsers = true;

               const user = new User(this, userData);

               user.organizations.set(organization.id, organization);

               this.users.set(userData.id, user);

               organization.users.set(userData.id, user);
            } else {
               const existingUser = this.users.get(userData.id);

               const retrievedUser = new User(this, userData);

               for (const prop of Object.getOwnPropertyNames(retrievedUser)) {
                  if (retrievedUser[prop] !== existingUser[prop]) {
                     existingUser[prop] = retrievedUser[prop];
                  }
               }
            }
         }
      }

      if (newUsers) {
         this.emit('newUsers');
      }
   }

   /**
    * Send a message to a specified flow.
    * @param {Message} message
    */
   sendMessage(message) {
      return this.request({
         type: 'post',
         path: '/messages',
         data: {
            flow: message.flow.id,
            event: message.event,
            content: message.content,
            message: message.parent,
            tags: message.tags,
            external_user_name: message.externalUserName,
            thread_id: message.threadId,
            external_thread_id: message.externalThreadId,
            thread: message.thread,
            attachments: message.attachments
         }
      });
   }

   isSelf(user) {
      return this.self.id === user.id;
   }

   _stopFlowUpdater() {
      if (this._flowUpdaterInterval) {
         clearInterval(this._flowUpdaterInterval);
         this._flowUpdaterInterval = null;
      }
   }

   _stopUserUpdater() {
      if (this._userUpdaterInterval) {
         clearInterval(this._userUpdaterInterval);
         this._userUpdaterInterval = null;
      }
   }

   _startFlowUpdater() {
      this._stopFlowUpdater();

      this._flowUpdaterInterval = TimeUtil.setIntervalImmediate(() => {
         this.request({ path: '/flows' })
            .then((responseFlows) => {
               if (responseFlows.length !== this._joinedFlows.size) {
                  const newlyJoinedFlows = [];
                  const newlyLeftFlows = [];

                  // Flows missing from the response flows
                  const missingFlows = Array.from(this.flows.keys());

                  for (const responseFlow of responseFlows) {
                     if (!this.flows.has(responseFlow.id)) {
                        // Definitely new if it's not cached
                        const flow = new Flow(this, responseFlow);

                        this.flows.set(flow.id, flow);
                        this._joinedFlows.add(flow);

                        newlyJoinedFlows.push(flow);
                     } else {
                        const flow = this.flows.get(responseFlow.id);

                        if (!this._joinedFlows.has(flow)) {
                           this._joinedFlows.add(flow);

                           // new flow, not in joined
                           newlyJoinedFlows.push(flow);
                        }

                        // If we've recently left the flow (since joined is no longer true)
                        if (flow.joined && !responseFlow.joined) {
                           newlyLeftFlows.push(flow);
                        }

                        // Remove this one from missing...
                        missingFlows.splice(missingFlows.indexOf(responseFlow.id), 1);

                        // Update the existing flow with data we have
                        flow.setup(responseFlow);
                     }
                  }

                  if (newlyJoinedFlows && newlyJoinedFlows.length) {
                     for (const flow of newlyJoinedFlows) {
                        this._joinedFlows.add(flow);
                        this.emit('joinedFlow', flow);
                     }

                     this.emit('joinedFlows', newlyJoinedFlows);
                  }

                  if (missingFlows.length) {
                     for (const id of missingFlows) {
                        const flow = this.flows.get(id);

                        // Don't retain left channels when
                        // they are private
                        if (!flow.open) {
                           this.flows.delete(flow.id);
                        }

                        newlyLeftFlows.push(flow);

                        this.emit('leftFlow', flow);
                     }

                     this.emit('leftFlows', newlyLeftFlows);
                  }
               }

               this.emit('flowsRefreshed');
            })
            .catch((e) => {
               this.emit('error', e);
            });
      }, 30*1000);
   }

   _startUserUpdater() {
      this._stopUserUpdater();

      this._userUpdaterInterval = setInterval(() => {
         this.retrieveUsers()
            .then(() => {
               this.emit('usersRefreshed');
            })
            .catch((e) => {
               this.emit('error', e);
            });
      }, 30*1000);
   }

   _setupMessageStream() {
      this._messageStream = this.stream();

      this.on('joinedFlows', () => {
         this._messageStream.create();
      });

      this._messageStream.on('event', (type, message, data) => {
         this.emit(type, message, data);
         this.emit('event', type, message, data);
      });

      this._messageStream.on('error', () => {
         this._messageStream.create();
      });

      if (this.options.restartMessageStreamInterval) {
         this._restartMessageStreamInterval = setInterval(() => this.resetMessageStream(), this.options.restartMessageStreamInterval);
      }
   }

   resetMessageStream() {
      if (this._messageStream) {
         this._messageStream.create();
      } else {
         this._setupMessageStream();
      }
   }

   async init() {
      this.destroy();

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
         if (this.options.autoListenForMessages) {
            this._setupMessageStream();
         }

         this._startFlowUpdater();
      }

      if (this.options.updateUsers) {
         this._startUserUpdater();
      }

      this.self = this.users.get(this._selfId);
   }

   stream(...flows) {
      return new FlowStream(this, ...flows);
   }

   destroy() {
      this._stopFlowUpdater();
      this._stopUserUpdater();

      this.organizations.clear();
      this.users.clear();
      this.flows.clear();
   }

   toString() {
      return `FlowdockClient[flows=(${this.flows.size}),users=(${this.users.size})]`
   }

   toJSON() {
      return {
         users: this.users.size,
         flows: this.flows.size,
         organizations: this.organizations.size,
         self: this.self.id,
         options: this.options
      }
   }
   //TODO: event for on flows retrieved, and users retrieved, etc
}

module.exports = FlowdockClient;