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
      <el-col :span="24">队列管理</el-col>
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
          >新建队列</el-button
        >
      </el-col>
    </el-row>
    <el-table :data="dataList" style="width: 100%" :border="true">
      <el-table-column prop="queueNumber" label="号码" width="80" />
      <el-table-column prop="queueName" label="名称" width="120" />

      <el-table-column prop="status" label="状态" width="60">
        <template #default="scope">
          {{ scope.row.status === 0 ? '启用' : '停用' }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="成员" width="60">
        <template #default="scope">
          <el-tooltip
            class="box-item"
            effect="dark"
            :content="
              scope.row.members ? scope.row.members.join(', ') : '未分配'
            "
            placement="top-start"
          >
            <el-link type="success" style="text-align: center; width: 100%">
              {{ scope.row.members ? scope.row.members.length : 0 }}
            </el-link>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" />

      <el-table-column prop="createAt" label="创建时间" width="180">
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
              content="队列成员设置"
              placement="top"
            >
              <el-button
                size="small"
                type="success"
                @click="openMemberDialog(scope.$index, scope.row)"
              >
                <el-icon><Avatar /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip
              class="box-item"
              effect="dark"
              content="配置队列特性"
              placement="top"
            >
              <el-button
                size="small"
                type="warning"
                @click="configQueue(scope.$index, scope.row)"
              >
                <el-icon><Operation /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip
              class="box-item"
              effect="dark"
              content="编辑队列"
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
              content="删除队列"
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
      ref="extFormRef"
      style="max-width: 600px"
      :model="extForm"
      :rules="rules"
      label-width="auto"
      class="demo-ruleForm"
      :size="formSize"
      status-icon
    >
      <el-form-item label="队列号码" prop="queueNumber" required>
        <el-input
          v-model="extForm.queueNumber"
          type="number"
          min="400"
          max="499"
          :readonly="isEdit"
          placeholder="3位数字队列号"
        />
      </el-form-item>
      <el-form-item label="队列名称" prop="queueName" required>
        <el-input
          v-model="extForm.queueName"
          type="text"
          min="2"
          max="12"
          placeholder=""
        />
      </el-form-item>
      <el-form-item label="描述" prop="description" required>
        <el-input
          v-model="extForm.description"
          type="text"
          min="4"
          max="255"
          placeholder=""
        />
      </el-form-item>
    </el-form>
    <el-alert
      v-if="errorMessage.length > 0"
      :title="errorMessage"
      type="error"
      show-icon
      @close="errorMessage = ''"
    />
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm"> 确认 </el-button>
      </div>
    </template>
  </el-dialog>
  <el-dialog
    v-model="showMemberDialog"
    :title="memberDialogTitle"
    width="650"
    :before-close="onCloseMemberDialog"
  >
    <p style="margin-top: 10px">
      说明：队列成员设置，可以将队列成员分配给不同的技能组，以便更好的管理队列。
    </p>
    <el-transfer
      v-model="selectedMembers"
      filterable
      :filter-method="filterMemberMethod"
      filter-placeholder="搜索成员"
      :titles="['未分配', '已分配']"
      :data="membersData"
      />
    <el-alert
      v-if="errorMessage.length > 0"
      :title="errorMessage"
      type="error"
      show-icon
      @close="errorMessage = ''"
    />
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showMemberDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMember"> 确认 </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup>
import { ref, onMounted, watchEffect, nextTick, computed, readonly } from 'vue';
import { debounce } from 'lodash';
import { useStore } from 'vuex';
import moment from 'moment';
import { ElMessage } from 'element-plus';

const store = useStore();
const fetchList = async (searchKey = '') => {
  const res = await store.dispatch('queueStore/fetch', {
    searchKey,
  });
};
const dataList = computed(() => {
  return [...store.state.queueStore.list];
});
const extForm = ref({
  id: null,
  queueName: '',
  queueNumber: '',
  description: '',
});
const rules = ref({
  queueNumber: [
    { required: true, message: '请输入队列号码', trigger: 'blur' },
    {
      min: 3,
      max: 3,
      message: '长度为3位数字',
      trigger: 'blur',
    },
  ],
  queueName: [
    { required: true, message: '请输入队列名称', trigger: 'blur' },
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

const selectedRow = ref(null);
const searchKey = ref('');
const dialogVisible = ref(false);
const errorMessage = ref('');
const isEdit = ref(false);
const dialogTitle = ref('');
const formSize = ref('default');
const extFormRef = ref(null);
const formReady = ref(false);

const showMemberDialog = ref(false);
const memberDialogTitle = ref('');
const selectedMembers = ref([]);
const membersData = computed(() => {
  const data = store.state.extensionStore.extensions;
  return data.map((item) => {
    return {
      label: item.accountCode,
      key: item.accountCode,
    };
  });
});

const filterMemberMethod = (query, item) => {
  return item.label.toLowerCase().indexOf(query.toLowerCase()) > -1;
};

const onCloseMemberDialog = () => {
  showMemberDialog.value = false;
};
onMounted(() => {
  watchEffect(() => {
    if (extFormRef.value) {
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
      extFormRef.value.resetFields();
    }
  });
  dialogTitle.value = '新建队列';
  dialogVisible.value = true;
  isEdit.value = false;
};

const formatedDate = (date) => {
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

const handleSearch = debounce(async (value) => {
  console.log('handleSearch', value, searchKey.value);
  await fetchList(value);
}, 500);

const submitForm = async () => {
  try {
    const isValid = await extFormRef.value.validate();
    if (isValid) {
      const res = isEdit.value
        ? await store.dispatch('queueStore/update', extForm.value)
        : await store.dispatch('queueStore/create', extForm.value);
      if (res) {
        dialogVisible.value = false;
        isEdit.value = false;
        await fetchList();
      }
      ElMessage({
        message: '创建/修改队列成功',
        type: 'success',
        duration: 1500,
        customClass: 'element-error-message-zindex',
      });
    }
  } catch (error) {
    console.log('error', error);
    errorMessage.value = error.message;
  }
};

const openMemberDialog = async (index, row) => {
  await store.dispatch('extensionStore/fetchExtensions', { searchKey: '' });
  const { id, queueNumber, queueName, description, members } = row;
  selectedRow.value = {...row};
  if (members && members.length > 0) {
    selectedMembers.value = [...members];
  } else {
    selectedMembers.value = [];
  }
  memberDialogTitle.value = `队列成员设置 - ${queueNumber} - ${queueName}`;
  showMemberDialog.value = true;
};

const saveMember = async () => {
  try {
    const {id, queueNumber} = selectedRow.value;
    const res = await store.dispatch('queueStore/saveMembers', 
    {members: selectedMembers.value, id, queueNumber});
    if (res) {
      showMemberDialog.value = false;
      ElMessage({
        message: '队列成员设置成功',
        type: 'success',
        duration: 1500,
        customClass: 'element-error-message-zindex',
      });
      await fetchList();
    } else {
        console.log('saveMember error', res);
      errorMessage.value = '队列成员设置失败';      
    }
  } catch (error) {
    console.log('error', error);
    errorMessage.value = error.message;
  }
};

const configQueue = async (index, row) => {
 
  ElMessage({
    message: '高级功能暂未开放，敬请期待。',
    type: 'warning',
  })
};

const handleEdit = (index, row) => {
  const { id, queueNumber, queueName, description } = row;
  extForm.value = { id, queueNumber, queueName, description };
  dialogTitle.value = '编辑队列';
  dialogVisible.value = true;
  isEdit.value = true;
};

const handleDelete = async (index, row) => {
  try {
    await store.dispatch('queueStore/delete', row.id);
    await fetchList();
    ElMessage({
      message: '删除成功',
      type: 'success',
      duration: 1500,
      customClass: 'element-error-message-zindex',
    });
  } catch (error) {
    ElMessage({
      message: '删除失败',
      type: 'error',
      duration: 1500,
      customClass: 'element-error-message-zindex',
    });
  }
};
</script>
<style lang="scss">
.extension-page {
  padding: 20px;
}
</style>
