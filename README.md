# Flowdock EX

It's like the flowdock module, but **EX**tended. It's way easier and better to use.

Features:

- Higher level, so there's less raw data manipulation
- Things make more sense
- Easier to access all your client's flows, organizations, users
- Easier to message people
  - Soon it will also be way easier to thread messages (I hate flowdock's threading API so currently don't want to deal with that PITA)
- Easier to stream and manage streams
- Everything uses promises rather than callbacks
- Supports the ability to detect when you join a flow (or multiple at once)
- It's just better, use this instead of the regular flowdock module and you probably won't be sorry
  - Even if it's missing a feature, you can still access the full flowdock api (and I've wrapped the request so it uses promises instead)
  - I really dislike flowdock's API and documentation, but this module makes me not want to die when using it.

That's pretty much it.

## Usage:

```javascript
const { FlowdockClient } = require('flowdock-ex');

const client = new FlowdockClient(MY_TOKEN);

client.init()
    .then(() => {
       client
         .stream(Array.from(client.flows.values()))
         .on('event', ...);
    })
    .catch(console.error)
```

This will create a client, initialize it, and then stream all of its flows at once, 
then use the resulting event emitter to listen for events. Note that this is not
best practice, because you won't be able to clean up the FlowStream returned by
Client#stream.

Though I was too lazy for v0.0.1, stuff will eventually be documented and viewable
with jsdoc, but for now just poke around and look at it. There's not a whole lot
to it for the time being.