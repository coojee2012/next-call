<template>
  <div class="chat-group-side">
    <div v-show="!group.quit" class="group-side-search">
      <el-input placeholder="搜索群成员" v-model="searchText">
        <template v-slot:prefix>
          <i class="el-icon-search el-input__icon"> </i>
        </template>
      </el-input>
    </div>
    <el-scrollbar class="group-side-scrollbar">
      <div v-show="!group.quit" class="group-side-member-list">
        <div class="group-side-invite">
          <div
            class="invite-member-btn"
            title="邀请好友进群聊"
            @click="showAddGroupMember = true"
          >
            <i class="el-icon-plus"></i>
          </div>
          <div class="invite-member-text">邀请</div>
          <add-group-member
            :visible="showAddGroupMember"
            :groupId="group.id"
            :members="groupMembers"
            @reload="$emit('reload')"
            @close="showAddGroupMember = false"
          ></add-group-member>
        </div>
        <div v-for="member in groupMembers" :key="member.id">
          <group-member
            class="group-side-member"
            v-show="!member.quit && member.showNickName.includes(searchText)"
            :member="member"
            :showDel="false"
          ></group-member>
        </div>
      </div>
      <el-divider v-if="!group.quit" content-position="center"></el-divider>
      <el-form labelPosition="top" class="group-side-form" :model="group">
        <el-form-item label="群聊名称">
          <el-input
            v-model="groupData.name"
            disabled
            maxlength="20"
          ></el-input>
        </el-form-item>
        <el-form-item label="群主">
          <el-input :value="ownerName" disabled></el-input>
        </el-form-item>
        <el-form-item label="群公告">
          <el-input
            v-model="groupData.notice"
            disabled
            type="textarea"
            maxlength="1024"
            placeholder="群主未设置"
          ></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="groupData.remarkGroupName"
            :disabled="!editing"
            :placeholder="groupData.name"
            maxlength="20"
          ></el-input>
        </el-form-item>
        <el-form-item label="我在本群的昵称">
          <el-input
            v-model="groupData.remarkNickName"
            :disabled="!editing"
            maxlength="20"
            :placeholder="$store.state.userStore.userInfo.nickName"
          ></el-input>
        </el-form-item>
        <div v-show="!groupData.quit" class="btn-group">
          <el-button v-show="editing" type="success" @click="onSaveGroup()"
            >提交</el-button
          >
          <el-button
            v-show="!editing"
            type="primary"
            @click="editing = !editing"
            >编辑</el-button
          >
          <el-button type="danger" v-show="!isOwner" @click="onQuit()"
            >退出群聊</el-button
          >
        </div>
      </el-form>
    </el-scrollbar>
  </div>
</template>

<script>
import { $on, $off, $once, $emit } from '../../utils/gogocodeTransfer'
import AddGroupMember from '../group/AddGroupMember.vue'
import GroupMember from '../group/GroupMember.vue'

export default {
  name: 'chatGroupSide',
  components: {
    AddGroupMember,
    GroupMember,
  },
  data() {
    return {
      groupData: this.group,
      groupMembersData: this.groupMembers,
      searchText: '',
      editing: false,
      showAddGroupMember: false,
    }
  },
  props: {
    group: {
      type: Object,
    },
    groupMembers: {
      type: Array,
    },
  },
  methods: {
    onClose() {
      $emit(this, 'close')
    },
    loadGroupMembers() {
      this.$http({
        url: `/gmembers/${this.group.id}`,
        method: 'get',
      }).then((members) => {
        this.groupMembersData = members
      })
    },
    onSaveGroup() {
      let vo = this.group
      this.$http({
        url: '/group/modify',
        method: 'put',
        data: vo,
      }).then((group) => {
        this.$store.commit('updateGroup', group)
        $emit(this, 'reload')
        this.$message.success('修改成功')
      })
    },
    onQuit() {
      this.$confirm(
        '退出群聊后将不再接受群里的消息，确认退出吗？',
        '确认退出?',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(() => {
        this.$http({
          url: `/group/quit/${this.group.id}`,
          method: 'delete',
        }).then(() => {
          this.$store.commit('removeGroup', this.group.id)
          this.$store.commit('activeGroup', -1)
          this.$store.commit('removeGroupChat', this.group.id)
        })
      })
    },
  },
  computed: {
    ownerName() {
      let member = this.groupMembers.find((m) => m.userId == this.group.ownerId)
      return member && member.showNickName
    },
    isOwner() {
      return this.group.ownerId == this.$store.state.userStore.userInfo.id
    },
  },
  emits: ['reload', 'close'],
}
</script>

<style lang="scss">
.chat-group-side {
  position: relative;
  .group-side-member-list {
    padding: 10px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    font-size: 16px;
    text-align: center;

    .group-side-member {
      margin-left: 15px;
    }

    .group-side-invite {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 50px;
      margin-left: 15px;

      .invite-member-btn {
        width: 100%;
        height: 50px;
        line-height: 50px;
        border: #cccccc solid 1px;
        font-size: 25px;
        cursor: pointer;
        box-sizing: border-box;

        &:hover {
          border: #aaaaaa solid 1px;
        }
      }

      .invite-member-text {
        font-size: 16px;
        text-align: center;
        width: 100%;
        height: 30px;
        line-height: 30px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
    }
  }

  .group-side-form {
    text-align: left;
    padding: 10px;
    height: 30%;

    .el-form-item {
      margin-bottom: 12px;

      .el-form-item__label {
        padding: 0;
        line-height: 30px;
      }

      .el-textarea__inner {
        min-height: 100px !important;
      }
    }

    .btn-group {
      text-align: center;
    }
  }
}
</style>
