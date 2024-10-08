import { EventEmitter2 } from 'eventemitter2';
import util = require('util');
import * as xml2js from 'xml2js';
import { Buffer } from 'buffer';


import net = require('net');
import * as generateUuid from 'node-uuid';
import { ESLLogger } from './logger';
import { Event } from './Event';
import { Parser } from './Parser';


//- function(host, port, password)
//Initializes a new instance of ESLconnection, and connects to the
// host $host on the port $port, and supplies $password to freeswitch.
//
//Intended only for an event socket in "Inbound" mode. In other words,
// this is only intended for the purpose of creating a connection to
// FreeSWITCH that is not initially bound to any particular call or channel.
//
//Does not initialize channel information (since inbound connections are
// not bound to a particular channel). In plain language, this means that
// calls to getInfo() will always return NULL.
//
//- function(fd)
//Initializes a new instance of ESLconnection, using the existing file
// number contained in $fd.
//
//Intended only for Event Socket Outbound connections. It will fail on
// Inbound connections, even if passed a valid inbound socket.
//
//The standard method for using this function is to listen for an incoming
// connection on a socket, accept the incoming connection from FreeSWITCH,
// fork a new copy of your process if you want to listen for more connections,
// and then pass the file number of the socket to new($fd).
//
//NOTE: The Connection class only supports 1 connection from FSW, the second
//  ctor option will take in a net.Socket instance (gained from net.connect or
//  on a server's connection event). For multiple connections use esl.Server

export class Connection extends EventEmitter2 {
  execAsync: boolean;
  execLock: boolean;
  connecting: boolean;
  authed: boolean;
  channelData: any;
  cmdCallbackQueue: any[];
  apiCallbackQueue: any[];
  executeCallbacks: any;
  executeHandlers: any;
  reqEvents: string[];
  listeningEvents: any[];
  private _inbound: boolean;
  private parser: Parser;
  socket: net.Socket;
  private password: string;
  usingFilters: boolean;
  logger: ESLLogger;
  constructor() {
    super({ wildcard: true, delimiter: '::', maxListeners: 10000 });
    //reasonable defaults for values
    this.execAsync = false;
    this.execLock = false;
    this.connecting = true;
    this.authed = false;
    this.channelData = null;
    this.usingFilters = false;
    this.cmdCallbackQueue = [];
    this.apiCallbackQueue = [];
    this.executeCallbacks = {};
    this.executeHandlers = {};

    //events required for the module to operate properly
    this.reqEvents = ['BACKGROUND_JOB', 'CHANNEL_EXECUTE_COMPLETE'];
    this.listeningEvents = [];
    this.logger = new ESLLogger();

  }
  /**
   * Inbound
   * @param host 
   * @param port 
   * @param password 
   * @param callback 
   */
  client(host: string, port: number, password: string, callback?: any) {
    //set inbound to true
    this._inbound = true;
    //save password
    this.password = password;

    //connect to ESL Socket
    this.socket = net.connect({
      port: port,
      host: host
    }, this._onConnect.bind(this));

    this.socket.on('error', this._onError.bind(this));
    this.handleEvent();
  }

  /**
   * Outbound Server
   * @param socket 
   * @param callback 
   */
  server(socket?: net.Socket, callback?: any) {
    //set inbound to false
    const self = this;
    this._inbound = false;

    this.socket = arguments[0];
    this.connecting = false;
    this._onConnect();

    this.send('connect');

    this.once('esl::event::CHANNEL_DATA::**', function () {
      self.subscribe(self.reqEvents, function () {
        self.emit('esl::ready');
      });
    });

    this.socket.on('error', this._onError.bind(this));
    this.handleEvent();
  }

  isInBound(): boolean {
    return this._inbound;
  }

  handleEvent() {
    const self = this;
    try {
      //emit end when stream closes
      this.socket.on('end', function () {
        self.emit('esl::end');
        //self.socket = null;
      });

      //handle logdata events
      this.on('esl::event::logdata', function (log) {
        this.logger._doLog(log);
      });

      //handle command reply callbacks
      this.on('esl::event::command::reply', function () {
        if (self.cmdCallbackQueue.length === 0) return;

        var fn = self.cmdCallbackQueue.shift();

        if (fn && typeof fn === 'function') {
          fn.apply(self, arguments);
        }

      });

      //handle api response callbacks
      this.on('esl::event::api::response', function () {
        if (self.apiCallbackQueue.length === 0) return;

        var fn = self.apiCallbackQueue.shift();

        if (fn && typeof fn === 'function')
          fn.apply(self, arguments);
      });
    }
    catch (ex) {
      console.log('[handleEvent]Error:', ex);
    }
  }





  /*********************
   ** Lower-level ESL Specification
   ** http://wiki.freeswitch.org/wiki/Event_Socket_Library
   **********************/

  //Returns the UNIX file descriptor for the connection object,
  // if the connection object is connected. This is the same file
  // descriptor that was passed to new($fd) when used in outbound mode.
  socketDescriptor() {
    if (this._inbound) return null;

    return this.socket;
  };

  //Test if the connection object is connected. Returns `true` if connected, `false` otherwise.
  connected() {
    return (!this.connecting && !!this.socket);
  };

  //When FS connects to an "Event Socket Outbound" handler, it sends
  // a "CHANNEL_DATA" event as the first event after the initial connection.
  // getInfo() returns an ESLevent that contains this Channel Data.
  //
  //getInfo() returns NULL when used on an "Event Socket Inbound" connection.
  getInfo() {
    return this.channelData; //remains null on Inbound socket
  };

  //Sends a command to FreeSWITCH.
  //
  //Does not wait for a reply. You should immediately call recvEvent
  // or recvEventTimed in a loop until you get the reply. The reply
  // event will have a header named "content-type" that has a value
  // of "api/response" or "command/reply".
  //
  //To automatically wait for the reply event, use sendRecv() instead of send().
  //
  //NOTE: This is a FAF method of sending a command
  send(command:any, args?: any) {
    var self = this;

    //write raw command to socket
    try {
      self.socket.write(command + '\n');
      if (args) {
        Object.keys(args).forEach(function (key) {
          self.socket.write(key + ': ' + args[key] + '\n');
        });
      }
      self.socket.write('\n');
    }
    catch (e) {
      self.emit('error', e);
    }
  };

  //Internally sendRecv($command) calls send($command) then recvEvent(),
  // and returns an instance of ESLevent.
  //
  //recvEvent() is called in a loop until it receives an event with a header
  // named "content-type" that has a value of "api/response" or "command/reply",
  // and then returns it as an instance of ESLevent.
  //
  //Any events that are received by recvEvent() prior to the reply event are queued
  // up, and will get returned on subsequent calls to recvEvent() in your program.
  //
  //NOTE: This listens for a response when calling `.send()` doing recvEvent() in a loop
  //  doesn't make sense in the contet of Node.
  sendRecv(command:any, args:any, cb?: any) {
    if (typeof args === 'function') {
      cb = args;
      args = null;
    }

    //queue callback for command reply
    this.cmdCallbackQueue.push(cb);

    this.send(command, args);
  };

  //Send an API command (http://wiki.freeswitch.org/wiki/Mod_commands#Core_Commands)
  // to the FreeSWITCH server. This method blocks further execution until
  // the command has been executed.
  //
  //api($command, $args) is identical to sendRecv("api $command $args").
  api(command:any, args:any, cb:any) {
    if (typeof args === 'function') {
      cb = args;
      args = '';
    }

    if (args instanceof Array)
      args = args.join(' ');

    args = (args ? ' ' + args : '');

    //queue callback for api response
    this.apiCallbackQueue.push(cb);

    this.send('api ' + command + args);
  };

  //Send a background API command to the FreeSWITCH server to be executed in
  // it's own thread. This will be executed in it's own thread, and is non-blocking.
  //
  //bgapi($command, $args) is identical to sendRecv("bgapi $command $args")
  bgapi(command:any, args:any, jobid?:any, cb?:any) {
    if (typeof args === 'function') {
      cb = args;
      args = '';
      jobid = null;
    }

    if (typeof jobid === 'function') {
      cb = jobid;
      jobid = null;
    }

    args = args || ''; //incase they pass null/false

    if (args instanceof Array)
      args = args.join(' ');

    args = ' ' + args;

    jobid = jobid || generateUuid.v4();

    var self = this,
      params:any = {},
      addToFilter = (cb?: any) => {
        if (cb) cb();
      },
      removeFromFilter = addToFilter,
      sendApiCommand = (cb:any) => {
        params['Job-UUID'] = jobid;

        addToFilter(function () {
          if (cb) {
            self.once('esl::event::BACKGROUND_JOB::' + jobid, function (evt) {
              removeFromFilter(function () {
                cb(evt);
              });
            });
          } else {
            removeFromFilter();
          }
          self.sendRecv('bgapi ' + command + args, params);
        });
      };

    if (self.usingFilters) {

      addToFilter = function (cb) {
        self.filter('Job-UUID', jobid, cb);
      };
      removeFromFilter = function (cb) {
        self.filterDelete('Job-UUID', jobid, cb);
      };

      sendApiCommand(cb);
    }
    else {
      sendApiCommand(cb);
    }
  };

  //NOTE: This is a wrapper around sendRecv, that uses an ESLevent for the data
  sendEvent(event:any, cb:any) {
    this.sendRecv('sendevent ' + event.getHeader('Event-Name') + '\n' + event.serialize(), cb);
  };

  //Returns the next event from FreeSWITCH. If no events are waiting, this
  // call will block until an event arrives.
  //
  //If any events were queued during a call to sendRecv(), then the first
  // one will be returned, and removed from the queue. Otherwise, then next
  // event will be read from the connection.
  //
  //NOTE: This is the same as `connection.once('esl::event::**', ...)` and in fact
  //  that is all it does. It does not block as the description says, nor does
  //  it queue events. Node has a better Event system than this, use it.
  recvEvent(cb:any) {
    cb = cb || this._noop;

    this.once('esl::event::**', cb);
  };

  //Similar to recvEvent(), except that it will block for at most $milliseconds.
  //
  //A call to recvEventTimed(0) will return immediately. This is useful for polling for events.
  //
  //NOTE: This does the same as recvEvent, except will timeout if an event isn't received in
  //  the specified timeframe
  recvEventTimed(ms:any, cb:any) {
    var self = this, timeout:any, fn:any;

    fn = function (to:any, event:any) {
      clearTimeout(to);
      if (cb) cb(event);
    };

    timeout = setTimeout(function () {
      self.removeListener('esl::event::**', fn);
      if (cb) cb();
    }, ms);

    //proxy to ensure we pass this timeout to the callback
    self.once('esl::event::**', fn.bind(self, timeout));
  };

  //See the event socket filter command (http://wiki.freeswitch.org/wiki/Event_Socket#filter).
  filter(header:any, value:any, cb:any) {
    this.usingFilters = true;
    this.sendRecv('filter ' + header + ' ' + value, cb);
  };

  filterDelete(header:any, value:any, cb:any) {
    if (typeof value === 'function') {
      cb = value;
      value = null;
    }

    this.sendRecv('filter delete ' + header + (!!value ? ' ' + value : ''), cb);
  };

  //$event_type can have the value "plain" or "xml" or "json". Any other value specified
  // for $event_type gets replaced with "plain".
  //
  //See the event socket event command for more info (http://wiki.freeswitch.org/wiki/Event_Socket#event).
  events(type:any, events:any, cb:any) {
    if (['plain', 'xml', 'json'].indexOf(type) === -1)
      type = 'plain';

    if (typeof events === 'function') {
      cb = events;
      events = 'all';
    }

    events = events || 'all';

    var all = false;
    if (events instanceof Array)
      all = (events.length === 1 && events[0].toLowerCase() === 'all');
    else
      all = (events.toLowerCase() === 'all');

    //if we specify all that includes required events
    if (all) {
      this.listeningEvents = ['all'];
    }
    //otherwise we need to concat the events to the required events
    else {
      //set listeningEvents to the new events
      try {
        this.listeningEvents = (events instanceof Array ? events : events.split(' '));

        //if the required events are not in there, add them
        for (var i = 0, len = this.reqEvents.length; i < len; ++i) {
          if (this.listeningEvents.indexOf(this.reqEvents[i]) !== -1)
            continue;

          this.listeningEvents.push(this.reqEvents[i]);
        }
      } catch (ex) {
        console.log('f the required events are not in there, add them', ex);
      }

    }

    this.sendRecv('event ' + type + ' ' + this.listeningEvents.join(' '), cb);
  };

  //Execute a dialplan application (http://wiki.freeswitch.org/wiki/Mod_dptools#Applications),
  // and wait for a response from the server.
  // On socket connections not anchored to a channel (most of the time inbound),
  // all three arguments are required -- $uuid specifies the channel to execute
  // the application on.
  //
  //Returns an ESLevent object containing the response from the server. The
  // getHeader("Reply-Text") method of this ESLevent object returns the server's
  // response. The server's response will contain "+OK [Success Message]" on success
  // or "-ERR [Error Message]" on failure.
  execute(app:any, arg:any, uuid:any, cb:any) {
    var self = this, opts:any = {};

    if (typeof arg === 'function') {
      cb = arg;
      arg = '';
    }

    if (typeof uuid === 'function') {
      cb = uuid;
      uuid = null;
    }

    //setup options
    opts['execute-app-name'] = app;
    opts['execute-app-arg'] = arg;

    var eventUuid;
    //if inbound
    if (self._inbound) {
      //if no uuid passed, create one
      uuid = uuid || generateUuid.v4();

      //execute with the new uuid
      eventUuid = self._doExec(uuid, 'execute', opts, cb);
    }
    //if outbound
    else {
      //grab our unique-id from channel_data
      uuid = self.getInfo().getHeader('Unique-ID');
      eventUuid = self._doExec(uuid, 'execute', opts, cb);
    }
    return eventUuid;
  };

  //Same as execute, but doesn't wait for a response from the server.
  //
  //This works by causing the underlying call to execute() to append
  // "async: true" header in the message sent to the channel.
  executeAsync(app:any, arg:any, uuid:any, cb:any) {
    //temporarily set async to true
    var old = this.execAsync;
    this.execAsync = true;

    //run execute
    var eventUuid = this.execute(app, arg, uuid, cb);

    //reset async
    this.execAsync = old;

    return eventUuid;
  };

  //Force async mode on for a socket connection. This command has
  // no effect on outbound socket connections that are set to "async"
  // in the dialplan and inbound socket connections, since these
  // connections are already set to async mode on.
  //
  //$value should be `true` to force async mode, and `false` to not force it.
  //
  //Specifically, calling setAsyncExecute(true) operates by causing future calls
  // to execute() to include the "async: true" header in the message sent to
  // the channel. Other event socket library routines are not affected by this call.
  //
  setAsyncExecute(value:any) {
    this.execAsync = value;
  };

  //Force sync mode on for a socket connection. This command has no effect on
  // outbound socket connections that are not set to "async" in the dialplan,
  // since these connections are already set to sync mode.
  //
  //$value should be `true` to force sync mode, and `false` to not force it.
  //
  //Specifically, calling setEventLock(1) operates by causing future calls to
  // execute() to include the "event-lock: true" header in the message sent
  // to the channel. Other event socket library routines are not affected by this call.
  //
  //See Also:
  // Q: Ordering and async keyword
  //      (http://wiki.freeswitch.org/wiki/Event_socket_outbound#Q:_Ordering_and_async_keyword)
  // Q: Can I bridge a call with an Outbound Socket?
  //      (http://wiki.freeswitch.org/wiki/Event_socket_outbound#Q:_Can_I_bridge_a_call_with_an_Outbound_socket_.3F)
  setEventLock(value:any) {
    this.execLock = value;
  };

  //Close the socket connection to the FreeSWITCH server.
  disconnect() {
    if (this.socket) {
      this.send('exit');
      this.socket.end();
      //this.socket = null;
    }
  };

  /*********************
   ** Higher-level Library-Specific Functions
   ** Some of these simply provide syntatic sugar
   **********************/
  auth(cb:any) {
    var self = this;

    //send auth command
    self.sendRecv('auth ' + self.password, function (evt:any) {
      if (evt.getHeader('Modesl-Reply-OK') === 'accepted') {
        self.authed = true;

        self.subscribe(self.reqEvents);

        self.emit('esl::event::auth::success', evt);
        self.emit('esl::ready');

        if (cb && typeof cb === 'function') cb(null, evt);
      } else {
        self.authed = false;
        self.emit('esl::event::auth::fail', evt);

        if (cb && typeof cb === 'function') cb(new Error('Authentication Failed'), evt);
      }
    });
  };

  //subscribe to events using json format (native support)
  subscribe(events:any, cb?:any) {
    events = events || 'all';

    this.events('json', events, cb);
  };

  //wraps the show mod_commands function and parses the return
  //value into a javascript array
  show(item:any, format:any, cb:any) {
    if (typeof format === 'function') {
      cb = format;
      format = null;
    }

    format = format || 'json';

    this.bgapi('show ' + item + ' as ' + format, function (e:any) {
      var data = e.getBody(), parsed: any = {};

      //if error send them that
      if (data.indexOf('-ERR') !== -1) {
        if (cb) cb(new Error(data));
        return;
      }

      //otherwise parse the event
      switch (format) {
        case 'json': //json format, easy and efficient
          try {
            parsed = JSON.parse(data);
          }
          catch (e) {
            if (cb) cb(e);
            return;
          }

          if (!parsed.rows) parsed.rows = [];

          break;

        case 'xml': //xml format, need to massage a bit after parsing
          var parser = new xml2js.Parser({ explicitArray: false, explicitRoot: false, emptyTag: '' });

          parser.parseString(data, function (err, doc) {
            if (err) {
              if (cb) cb(err);
              return;
            }
            parsed.rowCount = parseInt(doc.$.row_count, 10);
            parsed.rows = [];

            //case where only one row, means "row" is not an array
            if (parsed.rowCount === 1) {
              delete doc.row.$;
              parsed.rows.push(doc.row);
            } else if (parsed.rowCount > 1) {
              doc.row.forEach(function (row:any) {
                delete row.$;
                parsed.rows.push(row);
              });
            }
          });
          break;

        default: //delim seperated values, custom parsing
          if (format.indexOf('delim')) {
            try {
              var delim = format.replace('delim ', ''),
                lines = data.split('\n'),
                cols = lines[0].split(delim);

              parsed = { rowCount: lines.length - 1, rows: [] };

              for (var i = 1, len = lines.length; i < len; ++i) {
                var vals = lines[i].split(delim),
                  o:any = {};
                for (var x = 0, xlen = vals.length; x < xlen; ++x) {
                  o[cols[x]] = vals[x];
                }

                parsed.rows.push(o);
              }
            } catch (ex) {
              console.log('/delim seperated values, custom parsing', ex);
            }

          }
          break;
      }

      //return the parsed version of the data
      if (cb) cb(null, parsed, data);
      return;
    });
  };

  //make an originating call
  originate(options:any, cb:any) {
    if (typeof options === 'function') {
      cb = options;
      options = null;
    }

    options.profile = options.profile || '';
    options.gateway = options.gateway || '';
    options.number = options.number || '';
    options.app = options.app || '';
    options.sync = options.sync || false;

    var arg = 'sofia/' + options.profile +
      '/' + options.number +
      '@' + options.gateway +
      (options.app ? ' &' + options.app : '');

    if (options.sync) {
      this.api('originate', arg, cb);
    } else {
      this.bgapi('originate', arg, cb);
    }
  };

  //send a SIP MESSAGE
  message(options:any, cb:any) {
    if (typeof options === 'function') {
      cb = options;
      options = null;
    }

    options = options || {};

    options.to = options.to || '';
    options.from = options.from || '';
    options.profile = options.profile || '';
    options.body = options.body || '';
    options.subject = options.subject || '';
    options.sessionId = options.sessionId || '';
    options.msgType = options.msgType || '';
    options.deliveryConfirmation = options.deliveryConfirmation || '';

    var event = new Event('custom', 'SMS::SEND_MESSAGE');

    event.addHeader('proto', 'sip');
    event.addHeader('dest_proto', 'sip');

    event.addHeader('from', options.from);
    event.addHeader('from_full', 'sip:' + options.from);

    event.addHeader('to', options.to);
    event.addHeader('sip_profile', options.profile);
    event.addHeader('subject', options.subject);
    event.addHeader('sip_h_X-session-id', options.sessionId);
    event.addHeader('sip_h_X-message-type', options.msgType);
    //event.addHeader('hint','hint_hint');

    if (options.deliveryConfirmation) {
      event.addHeader('blocking', 'true');
    }

    event.addHeader('type', 'text/plain');
    event.addHeader('Content-Type', 'text/plain');

    event.addBody(options.body);

    this.sendEvent(event, cb);
  };


  /*********************
   ** Private helpers
   **********************/
  //noop because EventEmitter2 makes me pass a function
  _noop() {
  };

  //helper for execute, sends the actual message
  _doExec(uuid:any, cmd:any, args:any, cb:any) {
    args['call-command'] = cmd;

    if (this.execAsync) args.async = true;
    if (this.execLock) args['event-lock'] = true;

    //this method of event tracking is based on:
    //http://lists.freeswitch.org/pipermail/freeswitch-users/2013-May/095329.html
    args['Event-UUID'] = generateUuid.v4();
    this.executeCallbacks[args['Event-UUID']] = cb;

    if (!this.executeHandlers[uuid]) {
      var self = this;
      this.on('esl::event::CHANNEL_EXECUTE_COMPLETE::' + uuid, this.executeHandlers[uuid] = function (evt:any) {
        var evtUuid = evt.getHeader('Application-UUID') || evt.getHeader('Event-UUID');

        if (self.executeCallbacks[evtUuid]) {
          self.executeCallbacks[evtUuid].call(self, evt);
        }
      });
    }

    this.send('sendmsg ' + uuid, args);

    return args['Event-UUID'];
  };

  //called on socket/generic error, simply echo the error
  //to the user
  _onError(err:any) {
    this.emit('error', err);
  };


  //called when socket connects to FSW ESL Server
  //or when we successfully listen to the fd
  _onConnect() {
    //initialize parser
    this.parser = new Parser(this.socket);

    //on generic event
    this.parser.on('esl::event', this._onEvent.bind(this));

    //on parser error
    this.parser.on('error', this._onError.bind(this));

    //emit that we conencted
    this.emit('esl::connect');
    this.connecting = false;

    //wait for auth request
    this.on('esl::event::auth::request', this.auth.bind(this));

  };

  //When we get a generic ESLevent from FSW
  _onEvent(event:any, headers:any, body:any) {
    var emit = 'esl::event',
      uuid = event.getHeader('Job-UUID') || event.getHeader('Unique-ID') || event.getHeader('Core-UUID');

    //massage Content-Types into event names,
    //since not all events actually have an Event-Name
    //header; we have to make our own
    //console.log('Event-Name:',event.getHeader('Event-Name'), headers['Event-Name']);
    switch (headers['Content-Type']) {
      case 'auth/request':
        emit += '::auth::request';
        break;

      case 'command/reply':
        emit += '::command::reply';

        if (headers['Event-Name'] === 'CHANNEL_DATA') {
          if (!this._inbound) {
            this.channelData = event;
            emit = 'esl::event::CHANNEL_DATA' + (!!uuid ? '::' + uuid : '');
            //this.emit('esl::event::CHANNEL_DATA' + (!!uuid ? '::' + uuid : ''), event);
          }
        }
        break;

      case 'log/data':
        emit += '::logdata';
        break;

      case 'text/disconnect-notice':
        emit += '::disconnect::notice';
        break;

      case 'api/response':
        emit += '::api::response';
        break;


      case 'text/event-json':
      case 'text/event-plain':
      case 'text/event-xml':
        const evtname = event.getHeader('Event-Name')
        emit += '::' + evtname + (!!uuid ? '::' + uuid : '');
        break;

      default:
        emit += '::raw::' + headers['Content-Type'];
    }

    //console.log('^^^^^^^^^^^^^^^', emit);
    this.emit(emit, event, headers, body);
  };
}
