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
      <el-col :span="24">分机管理</el-col>
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
          >新建分机</el-button
        >
        <el-button type="primary" size="default" @click="handleBatchCreateExt"
          >批量新建</el-button
        >
      </el-col>
    </el-row>
    <el-table :data="extList" style="width: 100%" :border="true">
      <el-table-column prop="accountCode" label="分机号码" width="180" />
      <el-table-column prop="status" label="状态" width="180">
        <template #default="scope">
          {{ scope.row.status === 0 ? '启用' : '停用' }}
        </template>
      </el-table-column>
      <el-table-column prop="createAt" label="创建时间">
        <template #default="scope">
          {{ formatedDate(scope.row.createAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="scope">
          <el-button-group>
            <el-tooltip
              class="box-item"
              effect="dark"
              content="分配分机到坐席"
              placement="top"
            >
          <el-button
            size="small"
            type="success"
            @click="handleEdit(scope.$index, scope.row)"
          >
          <el-icon><Avatar /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip
              class="box-item"
              effect="dark"
              content="删除队列"
              placement="top"
            >
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(scope.$index, scope.row)"
          >
          <el-icon><Delete /></el-icon>
          </el-button>
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
      说明：一个四位数字的分机号，通常分配给坐席使用也可用作日常办公分机。
    </p>
    <el-form
      ref="extFormRef"
      style="max-width: 600px"
      :model="extForm"
      :rules="rules"
      label-width="auto"
      class="demo-ruleForm"
      :size="formSize"
      status-icon
    >
      <div v-if="isBatch">
        <el-form-item label="起始号码" prop="startCode" required>
          <el-input
            v-model="extForm.startCode"
            type="number"
            min="1000"
            max="9999"
            placeholder="4位起始分机号"
          />
        </el-form-item>
        <el-form-item label="结束号码" prop="endCode" required>
          <el-input
            v-model="extForm.endCode"
            type="number"
            min="1000"
            max="9999"
            placeholder="4位结束分机号"
          />
        </el-form-item>
      </div>
      <div v-else>
        <el-form-item label="分机号码" prop="accountCode" required>
          <el-input
            v-model="extForm.accountCode"
            type="number"
            min="1000"
            max="9999"
            placeholder="4位数字分机号"
          />
        </el-form-item>
      </div>
      <el-form-item label="注册密码" prop="password">
        <el-input
          v-model="extForm.password"
          type="password"
          placeholder="注册密码"
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

const store = useStore();
console.log('extension page store', store.state.extensionStore);
const fetchExtensions = async (searchKey = '') => {
  const res = await store.dispatch('extensionStore/fetchExtensions', {
    searchKey,
  });
};
const extList = computed(() => {
  console.log('extList computed', store.state.extensionStore.extensions);
  return [...store.state.extensionStore.extensions];
});
const extForm = ref({
  accountCode: '',
  password: '',
  startCode: '',
  endCode: '',
});
const rules = ref({
  accountCode: [
    { required: true, message: '请输入分机号码', trigger: 'blur' },
    {
      min: 4,
      max: 4,
      message: '长度为 4',
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入注册密码', trigger: 'blur' },
    {
      min: 6,
      max: 20,
      message: '长度在 6 到 20 个字符',
      trigger: 'blur',
    },
  ],
  startCode: [
    { required: true, message: '请输入起始号码', trigger: 'blur' },
    {
      min: 4,
      max: 4,
      message: '长度为 4',
      trigger: 'blur',
    },
  ],
  endCode: [
    { required: true, message: '请输入结束号码', trigger: 'blur' },
    {
      min: 4,
      max: 4,
      message: '长度为 4',
      trigger: 'blur',
    },
  ],
});

const searchKey = ref('');
const dialogVisible = ref(false);
const errorMessage = ref('');
const isBatch = ref(false);
const dialogTitle = ref('');
const formSize = ref('default');
const extFormRef = ref(null);
const formReady = ref(false);

onMounted(() => {
  console.log('extension page mounted');
  watchEffect(() => {
    if (extFormRef.value) {
      formReady.value = true;
      // 在这里进行表单验证或其他操作
      console.log('watchEffect', extFormRef.value);
    }
  });
  console.log(extFormRef.value);
  fetchExtensions()
    .then()
    .catch((error) => console.log(error));
});

const handleClose = () => {
  console.log('dialog closed');
  dialogVisible.value = false;
};

const handleCreateExt = () => {
  // 确保 DOM 已经更新
  nextTick(() => {
    if (formReady.value) {
      console.log('formReady:', formReady.value);
      extFormRef.value.resetFields();
    }
  });
  dialogTitle.value = '新建分机';
  dialogVisible.value = true;
  isBatch.value = false;
};

const handleBatchCreateExt = () => {
  dialogTitle.value = '批量新建分机';
  dialogVisible.value = true;
  isBatch.value = true;
  nextTick(() => {
    if (formReady.value) {
      console.log('formReady:', formReady.value);
      extFormRef.value.resetFields();
    }
  });
};

const formatedDate = (date) => {
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

const handleSearch = debounce(async (value) => {
  console.log('handleSearch', value, searchKey.value);
  await fetchExtensions(value);
}, 500);

const submitForm = async () => {
  try {
    const isValid = await extFormRef.value.validate((valid, fields) => {
      if (valid) {
        console.log('submit!');
      } else {
        console.log('error submit!', fields);
      }
    });
    if (isValid && !isBatch.value) {
      const a = await store.dispatch(
        'extensionStore/createExtension',
        extForm.value,
      );
      console.log('createExtension', a);
      if (a) {
        dialogVisible.value = false;
        await fetchExtensions();
      }
      ElMessage({
        message: '创建成功',
        type: 'success',
        duration: 1500,
        customClass: 'element-error-message-zindex',
      })
    } else if (isValid && isBatch.value) {
      const startCode = extForm.value.startCode;
      const endCode = extForm.value.endCode;
      const password = extForm.value.password;
      const codes = [];
      for (let i = startCode; i <= endCode; i++) {
        codes.push(`${i}`);
      }
      const a = await store.dispatch(
        'extensionStore/batchCreateExtensions',
        { accountCodes:codes, password },
      );
      if (a) {
        dialogVisible.value = false;
        await fetchExtensions();
      }
    }
  } catch (error) {
    console.log('error', error);
    errorMessage.value = error.message;
  }
};

const handleEdit = (index, row) => {
  const { accountCode, password } = row;
  extForm.value = { accountCode, password };
  console.log('handleEdit', index, row);
  dialogTitle.value = '编辑分机';
  dialogVisible.value = true;
  isBatch.value = false;
};

const handleDelete = async (index, row) => {
  console.log('handleDelete', index, row);
  try {
    await store.dispatch('extensionStore/deleteExtension', row.id);
    await fetchExtensions();
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
