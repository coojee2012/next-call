<template>
  <el-dialog
    title="邀请好友"
    v-model="isVisible"
    width="50%"
    :before-close="onClose"
  >
    <div class="agm-container">
      <div class="agm-l-box">
        <el-input
          placeholder="搜索好友"
          v-model="searchText"
          @keyup.enter="onSearch()"
        >
          <template v-slot:suffix>
            <i class="el-icon-search el-input__icon"> </i>
          </template>
        </el-input>
        <el-scrollbar style="height: 400px">
          <div v-for="(friend, index) in friends" :key="friend.id">
            <friend-item
              v-show="friend.nickName.includes(searchText)"
              :showDelete="false"
              @click="onSwitchCheck(friend)"
              :menu="false"
              :friend="friend"
              :index="index"
              :active="false"
            >
              <el-checkbox
                :disabled="friend.disabled"
                @click.stop=""
                class="agm-friend-checkbox"
                v-model="friend.isCheck"
                size="default"
              ></el-checkbox>
            </friend-item>
          </div>
        </el-scrollbar>
      </div>
      <div class="agm-arrow el-icon-d-arrow-right"></div>
      <div class="agm-r-box">
        <div class="agm-select-tip">已勾选{{ checkCount }}位好友</div>
        <el-scrollbar style="height: 400px">
          <div v-for="(friend, index) in friends" :key="friend.id">
            <friend-item
              v-if="friend.isCheck && !friend.disabled"
              :friend="friend"
              :index="index"
              :active="false"
              @del="onRemoveFriend(friend, index)"
              :menu="false"
            >
            </friend-item>
          </div>
        </el-scrollbar>
      </div>
    </div>
    <template v-slot:footer>
      <span class="dialog-footer">
        <el-button @click="onClose()">取 消</el-button>
        <el-button type="primary" @click="onOk()">确 定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { $on, $off, $once, $emit } from '../../utils/gogocodeTransfer'
import FriendItem from '../friend/FriendItem.vue'

export default {
  name: 'addGroupMember',
  components: {
    FriendItem,
  },
  data() {
    return {
      isVisible: false,
      searchText: '',
      friends: [],
    }
  },
  methods: {
    onClose() {
      console.log('close in dialog')
      $emit(this, 'close')
    },
    onOk() {
      let inviteVO = {
        groupId: this.groupId,
        friendIds: [],
      }
      this.friends.forEach((f) => {
        if (f.isCheck && !f.disabled) {
          inviteVO.friendIds.push(f.id)
        }
      })
      if (inviteVO.friendIds.length > 0) {
        this.$http({
          url: `/group/invite/${this.groupId}`,
          method: 'post',
          data: inviteVO,
        }).then(() => {
          this.$message.success('邀请成功')
          $emit(this, 'reload')
          $emit(this, 'close')
        })
      }
    },
    onRemoveFriend(friend, index) {
      friend.isCheck = false
    },
    onSwitchCheck(friend) {
      if (!friend.disabled) {
        friend.isCheck = !friend.isCheck
      }
    },
  },
  props: {
    visible: {
      type: Boolean,
    },
    groupId: {
      type: Number,
    },
    members: {
      type: Array,
    },
  },
  computed: {
    checkCount() {
      return this.friends.filter((f) => f.isCheck && !f.disabled).length
    },
  },
  watch: {
    visible: function (newData, oldData) {
      console.log('visible change', newData, oldData)
      this.isVisible = newData
      if (newData) {
        this.friends = []
        this.$store.state.friendStore.friends.forEach((f) => {
          let friend = JSON.parse(JSON.stringify(f))
          let m = this.members
            .filter((m) => !m.quit)
            .find((m) => m.userId == f.id)
          if (m) {
            // 好友已经在群里
            friend.disabled = true
            friend.isCheck = true
          } else {
            friend.disabled = false
            friend.isCheck = false
          }
          this.friends.push(friend)
        })
        
      }
    },
  },
  emits: ['close', 'reload'],
}
</script>

<style lang="scss">
.agm-container {
  display: flex;
  .agm-l-box {
    flex: 1;
    margin-top: 10px;
    border: #587ff0 solid 1px;
    border-radius: 5px;
    overflow: hidden;

    .agm-friend-checkbox {
      margin-right: 20px;
    }
  }

  .agm-arrow {
    display: flex;
    align-items: center;
    font-size: 20px;
    padding: 10px;
    font-weight: 600;
    color: #687ff0;
  }

  .agm-r-box {
    margin-top: 10px;
    flex: 1;
    border: #587ff0 solid 1px;
    border-radius: 5px;

    .agm-select-tip {
      text-align: left;
      height: 40px;
      line-height: 40px;
      text-indent: 5px;
    }
  }
}
</style>
