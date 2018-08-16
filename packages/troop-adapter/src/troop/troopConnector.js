const STARTUPEVENT = 'troop/ready';

class TroopEventConnector {
  constructor() {
    this.__troopHandler = null;
    this.cache = {
      sub: [],
      pub: []
    };

    if (this.__isTroopReady()) {
      this.__registerTroopHandler();
    } else {
      const __handler = e => {
        this.__registerTroopHandler();
      };
      if (window.addEventListener) {
        document.addEventListener(STARTUPEVENT, __handler, false);
      } else if (window.attachEvent) {
        document.attachEvent(`on${STARTUPEVENT}`, __handler);
      } else {
        throw new Error('too old browser, can not support');
      }
    }
  }
  __isTroopReady() {
    return (
      !!window.requirejs &&
      window.requirejs.s &&
      window.requirejs.s.contexts &&
      window.requirejs.s.contexts['troopjs-2.0'] &&
      window.requirejs.s.contexts['troopjs-2.0'].defined['troopjs-core/pubsub/hub']
    );
  }

  __registerTroopHandler() {
    this.__troopHandler = window.requirejs.s.contexts['troopjs-2.0'].defined['troopjs-core/pubsub/hub'];
    this.cache.sub.map(sub => {
      this.__sub(sub.eventName, this.__troopHandler, sub.cb);
    });
    this.cache.sub = [];
    this.cache.pub.map(pub => {
      this.__troopHandler
        .publish(pub.eventName, pub.data)
        .then(args => pub.res(args))
        .catch(err => pub.rej(err));
    });
    this.cache.pub = [];
  }

  isConnected() {
    return !!this.__troopHandler;
  }

  __sub(eventName, context, cb) {
    const MEMORY_PREFIX = /^hub(:memory)?\//;
    let _eventName = eventName.replace(MEMORY_PREFIX, '');

    this.__troopHandler.subscribe(_eventName, context, cb);

    if (MEMORY_PREFIX.test(eventName.trim())) {
      this.__troopHandler.republish(_eventName, false, context, cb);
    }
  }

  subscribe(eventName, cb) {
    if (this.isConnected()) {
      this.__sub(eventName, this.__troopHandler, cb);
    } else {
      this.cache.sub.push({
        eventName,
        cb
      });
    }
  }
  publish(eventName, data) {
    if (this.isConnected()) {
      return this.__troopHandler.publish(eventName, data);
    } else {
      return new Promise((res, rej) => {
        this.cache.pub.push({
          eventName,
          cb,
          res,
          rej
        });
      });
    }
  }
  unsubscribe(eventName, cb) {
    let inx = -1;
    if (
      this.cache.sub.some((sub, index) => {
        inx = index;
        return eventName === sub.eventName && (cb === undefined || cb === sub.cb);
      })
    ) {
      this.cache.splice(inx, 1);
    } else {
      this.__troopHandler.unsubscribe(eventName, this.__troopHandler, cb);
    }
  }
}

const tc = new TroopEventConnector();

const getTroopConnector = () => {
  return tc;
};

export { getTroopConnector };
