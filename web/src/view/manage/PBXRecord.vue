<template>
    <el-container class="extension-page" :direction="'vertical'">
      <el-row
        style="
          text-align: left;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
        "
      >
        <el-col :span="24">IVR管理</el-col>
      </el-row>
      <el-row class="mb-10" style="text-align: left; margin-bottom: 10px">
        <el-col :span="24">
          <el-input
            v-model="searchKey"
            clearable
            size="default"
            style="max-width: 300px; margin-right: 10px"
            placeholder="关键字搜索"
            @input="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
  
          <el-button type="primary" size="default" @click="handleCreateExt"
            >新建IVR</el-button
          >
         
        </el-col>
      </el-row>
      <el-table :data="extList" style="width: 100%" :border="true">
        <el-table-column prop="ivrNumber" label="号码" width="80" />
        <el-table-column prop="ivrName" label="名称" width="180" />
        <el-table-column prop="readOnly" label="内置" width="60">
          <template #default="scope">
            {{ scope.row.readOnly === 0 ? '是' : '否' }}
          </template>
        </el-table-column>
        <el-table-column prop="canTransfer" label="可转接" width="60">
          <template #default="scope">
            {{ scope.row.canTransfer === 0 ? '是' : '否' }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="createAt" label="创建时间">
          <template #default="scope">
            {{ formatedDate(scope.row.createAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button-group>
            <el-tooltip
              class="box-item"
              effect="dark"
              content="IVR流程设计"
              placement="top"
            >
              <el-button
                size="small"
                type="success"
                @click="handleEdit(scope.$index, scope.row)"
              >
              <el-icon><SetUp /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip
              class="box-item"
              effect="dark"
              content="IVR流程配置"
              placement="top"
            >
              <el-button
                size="small"
                type="warning"
                @click="handleEdit(scope.$index, scope.row)"
              >
                <el-icon><Operation /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip
              class="box-item"
              effect="dark"
              content="编辑"
              placement="top"
            >
              <el-button
                size="small"
                type="primary"
                @click="handleEdit(scope.$index, scope.row)"
              >
                <el-icon><Edit /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip
              class="box-item"
              effect="dark"
              content="删除"
              placement="top"
            >
              <el-button
                type="danger"
                size="small"
                @click="handleDelete(scope.$index, scope.row)"
                ><el-icon><Delete /></el-icon
              ></el-button>
            </el-tooltip>
          </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-container>
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="650"
      :before-close="handleClose"
    >
      <p style="margin-top: 10px">
        说明：一个位于400-499之间的三位数字的队列号，通常用于服务分组。
      </p>
      <el-form
        ref="baseFormRef"
        style="max-width: 600px"
        :model="baseForm"
        :rules="rules"
        label-width="auto"
        class="demo-ruleForm"
        :size="formSize"
        status-icon
      >
        
          <el-form-item label="IVR号码" prop="ivrNumber" required>
            <el-input
              v-model="baseForm.ivrNumber"
              type="number"
              min="200"
              max="299"
              placeholder="3位数字IVR流程号码"
            />
          </el-form-item>
          <el-form-item label="IVR名称" prop="ivrName" required>
            <el-input
              v-model="baseForm.ivrName"
              type="text"
              min="2"
              max="12"
              placeholder=""
            />
          </el-form-item>
          <el-form-item label="描述" prop="description" required>
            <el-input
              v-model="baseForm.description"
              type="text"
              min="4"
              max="255"
              placeholder=""
            />
          </el-form-item>
        
      </el-form>
      <el-alert v-if="errorMessage.length > 0" :title="errorMessage" type="error" show-icon @close="errorMessage = ''" />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm"> 确认 </el-button>
        </div>
      </template>
    </el-dialog>
  </template>
  <script setup>
  import { ref, onMounted, watchEffect, nextTick, computed } from 'vue';
  import { debounce } from 'lodash';
  import { useStore } from 'vuex';
  import moment from 'moment';
  import { ElMessage  } from 'element-plus'
  
  const baseStoreName = 'ivrStore';
  const basePageName = 'IVR流程';
  const store = useStore();
  const fetchList = async (searchKey = '') => {
    const res = await store.dispatch(`${baseStoreName}/fetch`, {
      searchKey,
    });
  };
  const extList = computed(() => {
    return [...store.state[baseStoreName].list];
  });
  const baseForm = ref({
    ivrName: '',
    ivrNumber: '',
    description: '',
  });
  const rules = ref({
    ivrNumber: [
      { required: true, message: '请输入IVR流程号码', trigger: 'blur' },
      {
        min: 3,
        max: 3,
        message: '长度为3位数字',
        trigger: 'blur',
      },
    ],
    queueName: [
      { required: true, message: '请输入IVR流程名称', trigger: 'blur' },
      {
        min: 2,
        max: 12,
        message: '长度在 2 到 12 个字符',
        trigger: 'blur',
      },
    ],
    description: [
      { required: true, message: '描述不能为空', trigger: 'blur' },
      {
        min: 4,
        max: 255,
        message: '长度为4-255个字符',
        trigger: 'blur',
      },
    ],
    
  });
  
  const searchKey = ref('');
  const dialogVisible = ref(false);
  const errorMessage = ref('');
  const isEdit = ref(false);
  const dialogTitle = ref('');
  const formSize = ref('default');
  const baseFormRef = ref(null);
  const formReady = ref(false);
  
  onMounted(() => {
    watchEffect(() => {
      if (baseFormRef.value) {
        formReady.value = true;
      }
    });
    fetchList()
      .then()
      .catch((error) => console.log(error));
  });
  
  const handleClose = () => {
    dialogVisible.value = false;
  };
  
  const handleCreateExt = () => {
    // 确保 DOM 已经更新
    nextTick(() => {
      if (formReady.value) {
        baseFormRef.value.resetFields();
      }
    });
    dialogTitle.value = '新建' + basePageName;
    dialogVisible.value = true;
    isEdit.value = false;
  };
  
  const formatedDate = (date) => {
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
  };
  
  const handleSearch = debounce(async (value) => {
    await fetchList(value);
  }, 500);
  
  const submitForm = async () => {
    try {
      const isValid = await baseFormRef.value.validate();
      if (isValid && !isEdit.value) {
        const res = await store.dispatch(
          `${baseStoreName}/create`,
          baseForm.value,
        );
        if (res) {
          dialogVisible.value = false;
          await fetchList();
        }
        ElMessage({
          message: '创建成功',
          type: 'success',
          duration: 1500,
          customClass: 'element-error-message-zindex',
        })
      } 
    } catch (error) {
      console.log('error', error);
      errorMessage.value = error.message;
    }
  };
  
  const handleEdit = (index, row) => {
    const { accountCode, password } = row;
    baseForm.value = { accountCode, password };
    dialogTitle.value = '编辑' + basePageName;
    dialogVisible.value = true;
    isEdit.value = false;
  };
  
  const handleDelete = async (index, row) => {
    console.log('handleDelete', index, row);
    try {
      await store.dispatch(`${baseStoreName}/delete`, row.id);
      await fetchList();
      ElMessage({
        message: '删除成功',
        type:'success',
        duration: 1500,
        customClass: 'element-error-message-zindex',
      })
    } catch (error) {
      ElMessage({
        message: '删除失败',
        type: 'error',
        duration: 1500,
        customClass: 'element-error-message-zindex',
      })
    }
  };
  </script>
  <style lang="scss">
  .extension-page {
    padding: 20px;
  }
  </style>
  