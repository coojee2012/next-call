<template>
  <el-container class="manage-page">
    <el-aside width="280px" class="manage-list-box">
      <h5 class="mb-2" style="padding-left: 20px;text-align: left;">平台设置</h5>
      <el-menu
        default-active="/cc/manage/extension"
        :router="true"
        class="el-menu-vertical-demo"
        @open="handleOpen"
        @close="handleClose"
      >
        <el-sub-menu index="1">
          <template #title>
            <el-icon><location /></el-icon>
            <span>语音平台</span>
          </template>
          <el-menu-item-group title="基础设置" style="text-align: left;">
            <el-menu-item index="/cc/manage/extension"  :route="'/cc/manage/extension'">分机管理</el-menu-item>
            <el-menu-item index="/cc/manage/queue">队列管理</el-menu-item>
            <el-menu-item index="/cc/manage/ivr">IVR管理</el-menu-item>
            <el-menu-item index="1-4">语音管理</el-menu-item>
          </el-menu-item-group>
          <el-menu-item-group title="进阶配置" style="text-align: left;">
            <el-menu-item index="1-5">item three</el-menu-item>
          </el-menu-item-group>
          
        </el-sub-menu>
        <el-menu-item index="2">
          <el-icon><Document /></el-icon>
          <span>Navigator Two</span>
        </el-menu-item>
        <el-menu-item index="3" disabled>
          <el-icon><document /></el-icon>
          <span>Navigator Three</span>
        </el-menu-item>
        <el-menu-item index="4">
          <el-icon><setting /></el-icon>
          <span>Navigator Four</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
        <router-view></router-view>
    </el-container>
  </el-container>
</template>
<script>
export default {
  name: "WorkPlate",
  data() {
    return {
      activeName: "1",
      menuList: [
        {
          name: "语音平台",
          children: [
            { name: "分机管理" },
            { name: "队列管理" },
            { name: "IVR管理" },
            { name: "语音管理" },
          ],
        },
        { name: "Navigator Two" },
        { name: "Navigator Three" },
        { name: "Navigator Four" },
      ],
    };
  },
  methods: {
    handleOpen(key, keyPath) {
      console.log(key, keyPath);
    },
    handleClose(key, keyPath) {
      console.log(key, keyPath);
    },
  },
};
</script>
<style lang="scss">
.manage-page {
  .manage-list-box {
    display: flex;
    flex-direction: column;
    border-right: #53a0e79c solid 1px;
    background: white;

    .manage-list-header {
      height: 50px;
      display: flex;
      align-items: center;
      padding: 3px 8px;
      border-bottom: 1px #ddd solid;

      // .el-input__inner {
      //   border-radius: 10px !important;
      //   background-color: #f8f8f8;
      // }

      .add-btn {
        //padding: 5px !important;
        margin: 5px;
        font-size: 20px;
        color: #587ff0;
        border: #587ff0 1px solid;
        background-color: #f0f8ff;
        border-radius: 50%;
      }
    }

    .manage-list-items {
      flex: 1;
      margin: 0 3px;
      background: #f8f8f8;
    }
  }

  .manage-box {
    display: flex;
    flex-direction: column;

    .manage-header {
      padding: 3px;
      height: 50px;
      line-height: 50px;
      font-size: 20px;
      font-weight: 600;
      text-align: center;
      background-color: white;
      border-bottom: 1px #ddd solid;
    }

    .manage-detail {
      display: flex;
      padding: 50px 80px 20px 80px;
      text-align: center;

      .info-item {
        margin-left: 20px;
        background-color: #ffffff;
        border-radius: 10px;
        border: 1px #ddd solid;
      }

      .description {
        padding: 20px 20px 0px 20px;
      }
    }

    .frient-btn-group {
      text-align: left !important;
      padding: 20px;
    }
  }
}
</style>
