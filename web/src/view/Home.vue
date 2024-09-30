<template>
  <el-container class="home-page">
    <el-aside width="80px" class="navi-bar">
      <div class="user-head-image">
        <head-image
          :name="$store.state.userStore.userInfo.nickName"
          :url="$store.state.userStore.userInfo.headImageThumb"
          :size="60"
          @click="showSettingDialog = true"
        >
        </head-image>
      </div>
      <el-menu background-color="#E8F2FF" style="margin-top: 25px;padding-left: 15px;">
        <el-menu-item title="聊天" :index="'/home/chat'">
          <router-link :to="'/home/chat'" class="link">
            <span class="icon iconfont icon-chat"></span>
            <div v-show="unreadCount > 0" class="unread-text">
              {{ unreadCount }}
            </div>
          </router-link>
        </el-menu-item>
        <el-menu-item title="好友" :index="'/home/friend'">
          <router-link :to="'/home/friend'" class="link">
            <span class="icon iconfont icon-friend"></span>
          </router-link>
        </el-menu-item>
        <el-menu-item title="群聊" :index="'/home/group'">
          <router-link :to="'/home/group'" class="link">
            <span class="icon iconfont icon-group"></span>
          </router-link>
        </el-menu-item>
        <el-menu-item
          title="设置"
          :index="'/home/setting'"
          @click="showSetting()"
        >
          <span class="icon iconfont icon-setting"></span>
        </el-menu-item>
      </el-menu>
      <el-menu background-color="#E8F2FF" 
      style="position: absolute; bottom: 60px;padding-left: 15px;">
        <el-menu-item
          title="管理菜单"
          :index="'/home/manage'"
          @click="showSetting()"
        >
        <el-icon style="font-size: 30px;"><Menu /></el-icon>
        </el-menu-item>
      </el-menu>
      <div class="exit-box" @click="onExit()" title="退出">
        <span class="icon iconfont icon-exit"></span>
      </div>
    </el-aside>
    <el-main class="content-box">
      <router-view></router-view>
    </el-main>
    <setting :visible="showSettingDialog" @close="closeSetting()"></setting>
    <user-info
      v-show="uiStore.userInfo.show"
      :pos="uiStore.userInfo.pos"
      :user="uiStore.userInfo.user"
      @close="$store.commit('closeUserInfoBox')"
    ></user-info>
    <full-image
      :visible="uiStore.fullImage.show"
      :url="uiStore.fullImage.url"
      @close="$store.commit('closeFullImageBox')"
    ></full-image>
    <rtc-private-video ref="rtcPrivateVideo"></rtc-private-video>
    <rtc-group-video ref="rtcGroupVideo"></rtc-group-video>
  </el-container>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex';
import { $on, $off, $once, $emit } from '../utils/gogocodeTransfer';
import HeadImage from '../components/common/HeadImage.vue';
import Setting from '../components/setting/Setting.vue';
import UserInfo from '../components/common/UserInfo.vue';
import FullImage from '../components/common/FullImage.vue';
import RtcPrivateVideo from '../components/rtc/RtcPrivateVideo.vue';
import RtcPrivateAcceptor from '../components/rtc/RtcPrivateAcceptor.vue';
import RtcGroupVideo from '../components/rtc/RtcGroupVideo.vue';
import { io } from 'socket.io-client';
import { DEFAULT_FORMATS_DATE } from 'element-plus';
import { C } from 'jssip';

export default {
  components: {
    HeadImage,
    Setting,
    UserInfo,
    FullImage,
    RtcPrivateVideo,
    RtcPrivateAcceptor,
    RtcGroupVideo,
  },
  data() {
    return {
      showSettingDialog: false,
      lastPlayAudioTime: new Date().getTime() - 1000,
    };
  },
  methods: {
    init() {
      $on(this.$eventBus, 'openPrivateVideo', (rctInfo) => {
        // 进入单人视频通话
        this.$refs.rtcPrivateVideo.open(rctInfo);
      });
      $on(this.$eventBus, 'openGroupVideo', (rctInfo) => {
        // 进入多人视频通话
        this.$refs.rtcGroupVideo.open(rctInfo);
      });

      this.$store
        .dispatch('load')
        .then(() => {
          console.log('开始初始化SIP');
          this.$store.dispatch('vsip/init', {
            configuration: {
              register: true,
              uri: 'sip:1001@192.168.2.162:5060',
              password: '1234',
            },
            listeners: [
              {
                name: 'connecting',
                cb: () => {
                  console.log('sip正在连接');
                },
              },
              {
                name: 'connected',
                cb: () => {
                  console.log('sip连接成功');
                },
              },
              {
                name: 'unregistered',
                cb: () => {
                  console.log('sip取消注册');
                },
              },
              {
                name: 'registrationFailed',
                cb: () => {
                  console.log('sip注册失败');
                },
              },
              {
                name: 'registered',
                cb: () => {
                  console.log('sip注册成功');
                },
              },
            ],
            socketInterfaces: [`ws://192.168.2.162:5066`],
            sipDomain: '192.168.2.162',
            sipOptions: {
              session_timers: false,
              extraHeaders: ['extraHeaderA'],
              pcConfig: {},
            },
          });
          // ws初始化
          console.log('开始初始化IM SOCKET');
          this.$wsApi.onConnect(() => {
            console.log('IM SOCKET连接成功-加载离线消息');
            // 加载离线消息
            this.pullPrivateOfflineMessage(
              this.$store.state.chatStore.privateMsgMaxId,
            );
            this.pullGroupOfflineMessage(
              this.$store.state.chatStore.groupMsgMaxId,
            );
          });
          this.$wsApi.onMessage((cmd, msgInfo) => {
            console.log('IM SOCKET收到消息', cmd, msgInfo);
            if (cmd == 2) {
              // 关闭ws
              this.$wsApi.close(3000);
              // 异地登录，强制下线
              this.$alert('您已在其他地方登陆，将被强制下线', '强制下线通知', {
                confirmButtonText: '确定',
                callback: (action) => {
                  location.href = '/';
                },
              });
            } else if (cmd == 3) {
              // 插入私聊消息
              this.handlePrivateMessage(msgInfo);
            } else if (cmd == 4) {
              // 插入群聊消息
              this.handleGroupMessage(msgInfo);
            } else if (cmd == 5) {
              // 处理系统消息
              this.handleSystemMessage(msgInfo);
            } else if (cmd == 6) {
              // 处理好友申请消息
              this.handleFriendReaded(msgInfo);
            } else if (cmd == 7) {
              // 处理好友阅读了消息
              console.log('处理好友阅读了消息');
            
            } else if (cmd == 8) {
              // 处理群申请消息
            
            } else if (cmd == 9) {
              // 处理群成员变更消息
            
            } else if (cmd == 10) {
              // 处理群成员移除消息
       
            } 
          });
          this.$wsApi.onClose((e) => {
            console.log(e);
            if (e.code != 3000) {
              // 断线重连
              this.$message.error('连接断开，正在尝试重新连接...');
              this.$wsApi.reconnect(
                process.env.VUE_APP_WS_URL,
                sessionStorage.getItem('accessToken'),
              );
            }
          });
          this.$wsApi.connect(
            process.env.VUE_APP_WS_URL,
            sessionStorage.getItem('accessToken'),
          );
        })
        .catch((e) => {
          console.log('初始化失败:', e);
        });
    },
    pullPrivateOfflineMessage(minId) {
      this.$store.commit('loadingPrivateMsg', true);
      this.$http({
        url: '/private-message/pullOfflineMessage?minId=' + minId,
        method: 'GET',
      })
        .then((data) => {
          console.log('pullPrivateOfflineMessage', data);
          this.$store.commit('loadingPrivateMsg', false);
          if ( data && data.length > 0) {
            data.forEach((msg) => {
              this.handlePrivateMessage(msg);
            });
          }
        })
        .catch(() => {
          this.$store.commit('loadingPrivateMsg', false);
        });
    },
    goRoute(path) {
      this.$router.push(path);
    },
    pullGroupOfflineMessage(minId) {
      this.$store.commit('loadingGroupMsg', true);
      this.$http({
        url: '/group-message/pullOfflineMessage?minId=' + minId,
        method: 'GET',
      })
        .then((res) => {
          console.log('pullGroupOfflineMessage', res);
          this.$store.commit('loadingGroupMsg', false);
          if (res.data.length > 0) {
            this.$store.commit('insertGroupOfflineMessage', res.data);
          }
        })
        .catch(() => {
          this.$store.commit('loadingGroupMsg', false);
        });
    },
    handlePrivateMessage(msg) {
      // 消息加载标志
      if (msg.type == this.$enums.MESSAGE_TYPE.LOADING) {
        this.$store.commit('loadingPrivateMsg', JSON.parse(msg.content));
        return;
      }
      // 消息已读处理，清空已读数量
      if (msg.type == this.$enums.MESSAGE_TYPE.READED) {
        this.$store.commit('resetUnreadCount', {
          type: 'PRIVATE',
          targetId: +msg.recvId,
        });
        return;
      }
      // 消息回执处理,改消息状态为已读
      if (msg.type == this.$enums.MESSAGE_TYPE.RECEIPT) {
        this.$store.commit('readedMessage', {
          friendId: msg.sendId,
        });
        return;
      }
      // 标记这条消息是不是自己发的
      msg.selfSend = msg.sendId == this.$store.state.userStore.userInfo.id;
      // 单人webrtc 信令
      if (this.$msgType.isRtcPrivate(msg.type)) {
        this.$refs.rtcPrivateVideo.onRTCMessage(msg);
        return;
      }
      // 好友id
      let friendId = msg.selfSend ? msg.recvId : msg.sendId;
      
      this.loadFriendInfo(friendId).then((friend) => {
        if(friend && friend.friendId){
          this.insertPrivateMessage(friend, msg);
        } else {
          //console.log('friend not found:', friendId);
          // TODO 好友信息不存在，需要请求接口获取
          // 比如双方已经不再是好友，消息将直接丢弃
        }
      });
    },
    insertPrivateMessage(friend, msg) {
      let chatInfo = {
        type: 'PRIVATE',
        targetId: friend.friendId,
        showName: friend.nickName,
        headImage: friend.headImage,
      };
      // 打开会话
      this.$store.commit('openChat', chatInfo);
      // 插入消息
      msg.loadStatus = 'ok'; // 标记消息已加载,针对图片等
      this.$store.commit('insertMessage', msg);
      // 播放提示音
      if (
        !msg.selfSend &&
        this.$msgType.isNormal(msg.type) &&
        msg.status != this.$enums.MESSAGE_STATUS.READED
      ) {
        this.playAudioTip();
      }
    },
    handleGroupMessage(msg) {
      // 消息加载标志
      if (msg.type == this.$enums.MESSAGE_TYPE.LOADING) {
        this.$store.commit('loadingGroupMsg', JSON.parse(msg.content));
        return;
      }
      // 消息已读处理
      if (msg.type == this.$enums.MESSAGE_TYPE.READED) {
        // 我已读对方的消息，清空已读数量
        let chatInfo = {
          type: 'GROUP',
          targetId: +msg.groupId,
        };
        this.$store.commit('resetUnreadCount', chatInfo);
        return;
      }
      // 消息回执处理
      if (msg.type == this.$enums.MESSAGE_TYPE.RECEIPT) {
        // 更新消息已读人数
        let msgInfo = {
          id: msg.id,
          groupId: msg.groupId,
          readedCount: msg.readedCount,
          receiptOk: msg.receiptOk,
        };
        this.$store.commit('updateMessage', msgInfo);
        return;
      }
      // 标记这条消息是不是自己发的
      msg.selfSend = msg.sendId == this.$store.state.userStore.userInfo.id;
      // 群视频信令
      if (this.$msgType.isRtcGroup(msg.type)) {
        this.$nextTick(() => {
          this.$refs.rtcGroupVideo.onRTCMessage(msg);
        });
        return;
      }
      this.loadGroupInfo(msg.groupId).then((group) => {
        // 插入群聊消息
        this.insertGroupMessage(group, msg);
      });
    },
    insertGroupMessage(group, msg) {
      let chatInfo = {
        type: 'GROUP',
        targetId: +group.id,
        showName: group.showGroupName,
        headImage: group.headImageThumb,
      };
      // 打开会话
      this.$store.commit('openChat', chatInfo);
      // 插入消息
      this.$store.commit('insertMessage', msg);
      // 播放提示音
      if (
        !msg.selfSend &&
        msg.type <= this.$enums.MESSAGE_TYPE.VIDEO &&
        msg.status != this.$enums.MESSAGE_STATUS.READED
      ) {
        this.playAudioTip();
      }
    },
    handleSystemMessage(msg) {
      // 用户被封禁

      if (msg.type == this.$enums.MESSAGE_TYPE.USER_BANNED) {
        this.$wsApi.close(3000);
        this.$alert(
          '您的账号已被管理员封禁,原因:' + msg.content,
          '账号被封禁',
          {
            confirmButtonText: '确定',
            callback: (action) => {
              this.onExit();
            },
          },
        );
        return;
      }
    },
    handleFriendReaded(msg) {
      // 处理好友阅读了消息
      console.log('handleFriendReaded', msg);
      this.$store.commit('readedMessage', msg);
    },
    onExit() {
      this.$wsApi.close(3000);
      sessionStorage.removeItem('accessToken');
      location.href = '/';
    },
    playAudioTip() {
      // 离线消息不播放铃声
      if (this.$store.getters.isLoading()) {
        return;
      }
      // 防止过于密集播放
      if (new Date().getTime() - this.lastPlayAudioTime > 1000) {
        this.lastPlayAudioTime = new Date().getTime();
        try {
          let audio = new Audio();
          let url = require(`@/assets/audio/tip.wav`);
          console.log('playAudioTip:', url);
          audio.src = url;
          //audio.play(); // TODO
        } catch (error) {
          console.log('playAudioTip error:', error);
        }
      }
    },
    showSetting() {
      this.showSettingDialog = true;
    },
    closeSetting() {
      this.showSettingDialog = false;
    },
    loadFriendInfo(friendId) {
      return new Promise((resolve, reject) => {

        let friend = this.$store.state.friendStore.friends.find(
          (f) => f.friendId == friendId,
        );
        if (friend) {
          resolve(friend);
        } else {
          this.$http({
            url: `/friend/find/${friendId}`,
            method: 'get',
          }).then((friend) => {
            this.$store.commit('addFriend', friend);
            resolve(friend);
          });
        }
      });
    },
    loadGroupInfo(id) {
      return new Promise((resolve, reject) => {
        let group = this.$store.state.groupStore.groups.find((g) => g.id == id);
        if (group) {
          resolve(group);
        } else {
          this.$http({
            url: `/group/find/${id}`,
            method: 'get',
          }).then((group) => {
            resolve(group);
            this.$store.commit('addGroup', group);
          });
        }
      });
    },
  },
  computed: {
    ...mapGetters('vsip', ['isMuted', 'getSipDomain']),
    uiStore() {
      return this.$store.state.uiStore;
    },
    unreadCount() {
      let unreadCount = 0;
      let chats = this.$store.state.chatStore.chats;
      chats.forEach((chat) => {
        if (!chat.delete) {
          unreadCount += chat.unreadCount;
        }
      });
      return unreadCount;
    },
  },
  watch: {
    unreadCount: {
      deep: true,

      handler(newCount, oldCount) {
        let tip = newCount > 0 ? `${newCount}条未读` : '';
        this.$elm.setTitleTip(tip);
      },

      immediate: true,
    },
  },
  mounted() {
    this.init();
  },
  unmounted() {
    this.$wsApi.close();
  },
};
</script>

<style lang="scss" scoped>
.navi-bar {
  background: #e8f2ff;
  padding: 10px;
  padding-top: 20px;
  border-right: #53a0e79c solid 1px;
  .el-menu {
    border: none;
    flex: 1;

    .el-menu-item {
      margin: 25px 0;
      background-color: #e8f2ff !important;
      padding: 0 !important;
      text-align: center;

      .link {
        text-decoration: none;

        &.router-link-active .icon {
          color: #195ee2;
          font-size: 28px;
        }
      }

      .icon {
        font-size: 26px;
        color: #888;
      }

      .unread-text {
        position: absolute;
        line-height: 20px;
        background-color: #f56c6c;
        left: 36px;
        top: 7px;
        color: white;
        border-radius: 30px;
        padding: 0 5px;
        font-size: 10px;
        text-align: center;
        white-space: nowrap;
        border: 1px solid #f1e5e5;
      }
    }
  }

  .exit-box {
    position: absolute;
    width: 60px;
    bottom: 40px;
    text-align: center;
    cursor: pointer;

    .icon {
      font-size: 28px;
    }

    &:hover {
      font-weight: 600;
    }
  }
}
.content-box {
  padding: 0;
  background-color: #f8f8f8;
  color: black;
  text-align: center;
}
</style>
