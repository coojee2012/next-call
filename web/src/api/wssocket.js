import { io } from "socket.io-client";
var websock = null
let rec //断线重连后，延迟5秒重新创建WebSocket连接  rec用来存储延迟请求的代码
let isConnect = false //连接标识 避免重复连接
let connectCallBack = null
let messageCallBack = null
let closeCallBack = null

let connect = (wsurl, accessToken) => {
  try {
    if (isConnect) {
      return
    }
    console.log('正在连接WebSocket：' + wsurl)
    websock = io('http://127.0.0.1:3001', {
      extraHeaders: {
        authorization: "Bearer " + encodeURIComponent(accessToken)
      },
      autoConnect: false
    });
    websock.on("connect", () => {
      console.log('WebSocket连接成功')
      isConnect = true
      // 发送登录命令
      let loginInfo = {
        cmd: 0,
        data: {
          accessToken: accessToken,
        },
      }
      connectCallBack && connectCallBack()
      websock.emit('login', JSON.stringify(loginInfo))
    });

    websock.on("disconnect", (e) => {
      console.log("IM服务器WebSocket连接断开");
      console.log('WebSocket连接关闭', e)
      isConnect = false //断开后修改标识
      closeCallBack && closeCallBack(e)
    });

    websock.on("error", (e) => {
      console.log("IM服务器WebSocket连接错误", e);
      console.log('WebSocket连接发生错误', e)
      isConnect = false //连接断开修改标识
      reconnect(wsurl, accessToken)
    });
    // 监听newMessage
    websock.on('newMessage', (message) => {
        console.log(`Received a message for event: ${message}`);
        let sendInfo = JSON.parse(message)
        if (sendInfo.cmd == 0) {
          // 心跳包回复
          heartCheck.start()
        } else if (sendInfo.cmd == 1) {
          // 重新开启心跳定时
          heartCheck.reset()
        } else {
          // 其他消息转发出去
          console.log('收到消息:', sendInfo)
          messageCallBack && messageCallBack(sendInfo.cmd, sendInfo.data)
        }
    });
    websock.connect();
    
  } catch (e) {
    console.log('尝试创建连接失败')
    reconnect(wsurl, accessToken) //如果无法连接上webSocket 那么重新连接！可能会因为服务器重新部署，或者短暂断网等导致无法创建连接
  }
}

//定义重连函数
let reconnect = (wsurl, accessToken) => {
  console.log('尝试重新连接')
  if (isConnect) {
    //如果已经连上就不在重连了
    return
  }
  rec && clearTimeout(rec)
  rec = setTimeout(function () {
    // 延迟5秒重连  避免过多次过频繁请求重连
    connect(wsurl, accessToken)
  }, 15000)
}
//设置关闭连接
let close = (code) => {
  websock && websock.disconnect(code)
}

//心跳设置
let heartCheck = {
  timeout: 5000, //每段时间发送一次心跳包 这里设置为20s
  timeoutObj: null, //延时发送消息对象（启动心跳新建这个对象，收到消息后重置对象）
  start: function () {
    if (isConnect) {
      console.log('发送WebSocket心跳')
      let heartBeat = {
        cmd: 1,
        data: {},
      }
      websock.emit('heartbeat' ,JSON.stringify(heartBeat))
    }
  },

  reset: function () {
    clearTimeout(this.timeoutObj)
    this.timeoutObj = setTimeout(function () {
      heartCheck.start()
    }, this.timeout)
  },
}

// 实际调用的方法
let sendMessage = (msgType, agentData) => {
  websock.emit(msgType, JSON.stringify(agentData))
}

let onConnect = (callback) => {
  connectCallBack = callback
}

let onMessage = (callback) => {
  messageCallBack = callback
}

let onClose = (callback) => {
  closeCallBack = callback
}
// 将方法暴露出去
export { connect, reconnect, close, sendMessage, onConnect, onMessage, onClose }
