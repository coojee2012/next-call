export class ESLLogger   {

//
// ESL Object
// http://wiki.freeswitch.org/wiki/Event_Socket_Library#ESL_Object
//
_log:boolean;
_level:number;
_logger:any;
constructor(logger?:any){
    this._log = false;
    this._level = 0;
    this._logger = typeof logger === 'function' ? logger : console.log;
}


//Calling this function within your program causes your program to
// issue informative messages related to the Event Socket Library
// on STDOUT. $loglevel is an integer between 0 and 7. The values for $loglevel mean:
//
//0 is EMERG
//1 is ALERT
//2 is CRIT
//3 is ERROR
//4 is WARNING
//5 is NOTICE
//6 is INFO
//7 is DEBUG
//
//Messages that have a lower value than $loglevel will be output on STDOUT, so higher
// values of $loglevel will cause the Library to log more information. Once this
// function is called, you can reduce the amount of log messages by calling this
// function again with a $loglevel of 0, but it cannot be completely turned off.
//
//eslSetLogLevel is implemented as class-level method, as opposed to an
// instance-level method, so you do not need to create a new instance of the
// class to call this method.
eslSetLogLevel(level:any) {
    this._log = true;
    if(typeof level === 'number')
    this._level = level;
}

//called by a connection object on log/data events
_doLog(evt:any) {
    if(!this._log || evt.getHeader('Log-Level') > this._level) return;

    var msg = '';

    if(this._level === 7) {
        msg += evt.serialize();
        msg += '\n\n';
    }

    msg += evt.getBody();

    this._logger(msg);
 }
}
