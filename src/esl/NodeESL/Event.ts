//can be (type {string}[, subclass {string}])
//or (headers {object/map}[, body {string}])

interface PRIORITY {
  LOW: string,
  NORMAL: string,
  HIGH: string
}
export class Event {
  type: string;
  hPtr: any;
  subclass: string;
  headers: any;
  body: string;
  // private PRIORITY: PRIORITY;
  constructor(type:any, subclass?:any) {
    this.headers = new Map();

    this.hPtr = null;

    //case where we actually have type/subclass
    if (typeof type === 'string') {
      this.type = type;
      this.subclass = subclass;
      this.body = '';

      this.addHeader('Event-Name', type);
      if (subclass) this.addHeader('Event-Subclass', subclass);
    }
    //case were we have headers/body
    else if (typeof type === 'object') {
      this.type = type['Event-Name'];
      this.subclass = type['Event-Subclass'];
      this.body = subclass || type._body || '';

      var self = this;
      Object.keys(type).forEach(function (key) {
        if (key === '_body') return;

        self.addHeader(key, type[key]);
      });
    }
    //case where we get no params
    else {
      this.type = '';
      this.subclass = '';
      this.body = '';
    }
    // this.PRIORITY = {
    //   LOW: 'LOW',
    //   NORMAL: 'NORMAL',
    //   HIGH: 'HIGH'
    // };
  }

  //Turns an event into colon-separated 'name: value'
  // pairs similar to a sip/email packet
  // (the way it looks on '/events plain all').
  serialize(format:any) {
    format = format || 'plain';

    this.addHeader('Content-Length', Buffer.byteLength(this.body, 'utf8'));

    var data:any;

    switch (format) {
      case 'json':
        /*
         {
         "Event-Name":   "CUSTOM",
         "Core-UUID":    "8b192020-7368-4498-9b11-cbe10f48a784",
         "FreeSWITCH-Hostname":  "smsdev",
         "FreeSWITCH-Switchname":        "smsdev",
         "FreeSWITCH-IPv4":      "10.1.12.115",
         "FreeSWITCH-IPv6":      "::1",
         "Event-Date-Local":     "2012-09-25 14:22:37",
         "Event-Date-GMT":       "Tue, 25 Sep 2012 18:22:37 GMT",
         "Event-Date-Timestamp": "1348597357036551",
         "Event-Calling-File":   "switch_cpp.cpp",
         "Event-Calling-Function":       "Event",
         "Event-Calling-Line-Number":    "262",
         "Event-Sequence":       "11027",
         "Event-Subclass":       "SMS::SEND_MESSAGE",
         "proto":        "sip",
         "dest_proto":   "sip",
         "from": "9515529832",
         "from_full":    "9515529832",
         "to":   "internal/8507585138@sms-proxy-01.bandwidthclec.com",
         "subject":      "PATLive Testing",
         "type": "text/plain",
         "hint": "the hint",
         "replying":     "true",
         "Content-Length":       "23",
         "_body":        "Hello from Chad Engler!"
         }
         */

        data = this._strMapToObj() || {};
        if (this.body) {
          data._body = this.body;
        }
        return JSON.stringify(data, null, 2);

      case 'plain':
        /*
         Event-Name: CUSTOM
         Core-UUID: 8b192020-7368-4498-9b11-cbe10f48a784
         FreeSWITCH-Hostname: smsdev
         FreeSWITCH-Switchname: smsdev
         FreeSWITCH-IPv4: 10.1.12.115
         FreeSWITCH-IPv6: %3A%3A1
         Event-Date-Local: 2012-09-25%2014%3A21%3A56
         Event-Date-GMT: Tue,%2025%20Sep%202012%2018%3A21%3A56%20GMT
         Event-Date-Timestamp: 1348597316736546
         Event-Calling-File: switch_cpp.cpp
         Event-Calling-Function: Event
         Event-Calling-Line-Number: 262
         Event-Sequence: 11021
         Event-Subclass: SMS%3A%3ASEND_MESSAGE
         proto: sip
         dest_proto: sip
         from: 9515529832
         from_full: 9515529832
         to: internal/8507585138%40sms-proxy-01.bandwidthclec.com
         subject: PATLive%20Testing
         type: text/plain
         hint: the%20hint
         replying: true
         Content-Length: 23
         */
        data = '';

        this.headers.forEach(function (value:any, key:any, map:any) {
          data += key + ': ' + value + '\n';
        });

        if (this.body) {
          //url encode newlines in the body
          data += '\n' + this.body.replace('\n', '%0A');
        }

        return data.trim();

      /*
       <event>
       <headers>
       <Event-Name>CUSTOM</Event-Name>
       <Core-UUID>8b192020-7368-4498-9b11-cbe10f48a784</Core-UUID>
       <FreeSWITCH-Hostname>smsdev</FreeSWITCH-Hostname>
       <FreeSWITCH-Switchname>smsdev</FreeSWITCH-Switchname>
       <FreeSWITCH-IPv4>10.1.12.115</FreeSWITCH-IPv4>
       <FreeSWITCH-IPv6>%3A%3A1</FreeSWITCH-IPv6>
       <Event-Date-Local>2012-09-25%2014%3A26%3A17</Event-Date-Local>
       <Event-Date-GMT>Tue,%2025%20Sep%202012%2018%3A26%3A17%20GMT</Event-Date-GMT>
       <Event-Date-Timestamp>1348597577616542</Event-Date-Timestamp>
       <Event-Calling-File>switch_cpp.cpp</Event-Calling-File>
       <Event-Calling-Function>Event</Event-Calling-Function>
       <Event-Calling-Line-Number>262</Event-Calling-Line-Number>
       <Event-Sequence>11057</Event-Sequence>
       <Event-Subclass>SMS%3A%3ASEND_MESSAGE</Event-Subclass>
       <proto>sip</proto>
       <dest_proto>sip</dest_proto>
       <from>9515529832</from>
       <from_full>9515529832</from_full>
       <to>internal/8507585138%40sms-proxy-01.bandwidthclec.com</to>
       <subject>PATLive%20Testing</subject>
       <type>text/plain</type>
       <hint>the%20hint</hint>
       <replying>true</replying>
       </headers>
       <Content-Length>23</Content-Length>
       <body>Hello from Chad Engler!</body>
       </event>
       */
      case 'xml':
        data = '<event>\n';

        //add headers
        data += '  <headers>\n';
        this.headers.forEach(function (value:any, key:any, map:any) {
          data += '    <' + key + '>' + value + '</' + key + '>\n';
        });
        data += '  </headers>\n';

        //add body
        if (this.body) {
          data += '  <body>' + this.body + '</body>\n';
        }

        data += '</event>';

        return data;
    }
  };

  //Sets the priority of an event to $number in case it's fired.
  //'NORMAL', 'LOW', 'HIGH', 'INVALID'
  setPriority(priority:any) {
    this.addHeader('priority', priority);
  };

  //Gets the header with the key of $header_name from an event object.
  getHeader(name:any) {
    return this.headers.has(name) ? this.headers.get(name) : null;
  };

  //Gets the body of an event object.
  getBody() {
    return this.body;
  };

  //Gets the event type of an event object.
  getType() {
    return this.type;
  };

  //Add $value to the body of an event object.
  // This can be called multiple times for the same event object.
  addBody(value:any) {
    return this.body += value;
  };

  //Add a header with key = $header_name and value = $value
  // to an event object. This can be called multiple times
  // for the same event object.
  addHeader(name:any, value:any) {
    this.headers.set(name, value);
    return value;
  };

  //Delete the header with key $header_name from an event object.
  delHeader(name:any) {
    return this.headers.delete(name);
  };

  //Sets the pointer to the first header in an event object,
  // and returns it's key name. This must be called before nextHeader is called.
  firstHeader() {
    this.hPtr = 0;
    const firstKey = this.headers.keys()[0];
    return firstKey;//  this.headers.get(firstKey);
  };

  //Moves the pointer to the next header in an event object,
  // and returns it's key name. firstHeader must be called
  // before this method to set the pointer. If you're already
  // on the last header when this method is called, then it will return NULL.
  nextHeader() {
    //if no firstHeader called yet
    if (this.hPtr === null)
      return null;

    //if reached end
    if (this.hPtr === (this.headers.size - 1)) {
      this.hPtr = null;
      return null;
    }

    //increment and return
    const keys = this.headers.keys();
    const key = keys[++this.hPtr];
    return key;
  };

  _findHeaderIndex(name:any) {
    for (var i = 0, len = this.headers.length; i < len; ++i) {
      if (this.headers[i].name === name)
        return i;
    }
    return null;
  };

  _findHeader(name:any) {
    return this.headers.has(name) ? { name, value: this.headers.get(name) } : null;
  }

  _strMapToObj() {
    let obj = Object.create(null);
    for (let [k, v] of this.headers) {
      obj[k] = v;
    }
    return obj;
  }
}



