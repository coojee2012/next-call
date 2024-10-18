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
                @click="handleIVRDesign(scope.$index, scope.row)"
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
      <el-form-item
        label="IVR号码"
        prop="ivrNumber"
        :readonly="isEdit"
        required
      >
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
    v-model="showIVRDesign"
    :title="ivrDesignTitle"
    width="1024"
    draggable
    :before-close="handleDeignClose"
  >
    <div id="ivr-flow" class="dnd-flow" @drop="onDrop">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :class="{ dark }"
        class="basic-flow"
        :default-viewport="{ zoom: 1.5 }"
        :min-zoom="0.2"
        :max-zoom="4"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
      >
        <!-- <Background pattern-color="#aaa" :gap="16" /> -->
        <DropzoneBackground
          :style="{
            backgroundColor: isDragOver ? '#e7f3ff' : 'transparent',
            transition: 'background-color 0.2s ease',
          }"
        >
          <p v-if="isDragOver">拖到此处</p>
        </DropzoneBackground>
        <MiniMap />

        <Controls position="top-left">
          <ControlButton title="Reset Transform" @click="resetTransform">
            <Icon name="reset" />
          </ControlButton>

          <ControlButton title="Shuffle Node Positions" @click="updatePos">
            <Icon name="update" />
          </ControlButton>

          <ControlButton title="Toggle Dark Mode" @click="toggleDarkMode">
            <Icon v-if="dark" name="sun" />
            <Icon v-else name="moon" />
          </ControlButton>

          <ControlButton title="Log `toObject`" @click="logToObject">
            <Icon name="log" />
          </ControlButton>
        </Controls>
      </VueFlow>
      <Sidebar />
    </div>
  </el-dialog>
</template>
<script setup>
import { ref, onMounted, watchEffect, nextTick, computed } from 'vue';
import { debounce } from 'lodash';
import { useStore } from 'vuex';
import moment from 'moment';
import { ElMessage } from 'element-plus';

import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { ControlButton, Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import { initialEdges, initialNodes } from './initial-elements.js';
import Icon from './IVRIcon.vue';
import DropzoneBackground from './IVRDropzoneBackground.vue';
import Sidebar from './IVRSidebar.vue';
import useDragAndDrop from './IVRUseDnD';

/**
 * `useVueFlow` provides:
 * 1. a set of methods to interact with the VueFlow instance (like `fitView`, `setViewport`, `addEdges`, etc)
 * 2. a set of event-hooks to listen to VueFlow events (like `onInit`, `onNodeDragStop`, `onConnect`, etc)
 * 3. the internal state of the VueFlow instance (like `nodes`, `edges`, `viewport`, etc)
 */
const { onInit, onNodeDragStop, onConnect, 
    addEdges, setViewport, toObject } = useVueFlow();
const { onDragOver, onDrop, onDragLeave, isDragOver } = useDragAndDrop();
const nodes = ref(initialNodes);

const edges = ref(initialEdges);

// our dark mode toggle flag
const dark = ref(false);

/**
 * This is a Vue Flow event-hook which can be listened to from anywhere you call the composable, instead of only on the main component
 * Any event that is available as `@event-name` on the VueFlow component is also available as `onEventName` on the composable and vice versa
 *
 * onInit is called when the VueFlow viewport is initialized
 */
onInit((vueFlowInstance) => {
  // instance is the same as the return of `useVueFlow`
  vueFlowInstance.fitView();
});

/**
 * onNodeDragStop is called when a node is done being dragged
 *
 * Node drag events provide you with:
 * 1. the event object
 * 2. the nodes array (if multiple nodes are dragged)
 * 3. the node that initiated the drag
 * 4. any intersections with other nodes
 */
onNodeDragStop(({ event, nodes, node }) => {
  console.log('Node Drag Stop', { event, nodes, node });
});

/**
 * onConnect is called when a new connection is created.
 *
 * You can add additional properties to your new edge (like a type or label) or block the creation altogether by not calling `addEdges`
 */
onConnect((connection) => {
  addEdges(connection);
});

/**
 * To update a node or multiple nodes, you can
 * 1. Mutate the node objects *if* you're using `v-model`
 * 2. Use the `updateNode` method (from `useVueFlow`) to update the node(s)
 * 3. Create a new array of nodes and pass it to the `nodes` ref
 */
function updatePos() {
  nodes.value = nodes.value.map((node) => {
    return {
      ...node,
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
    };
  });
}

/**
 * toObject transforms your current graph data to an easily persist-able object
 */
function logToObject() {
  console.log(toObject());
}

/**
 * Resets the current viewport transformation (zoom & pan)
 */
function resetTransform() {
  setViewport({ x: 0, y: 0, zoom: 1 });
}

function toggleDarkMode() {
  dark.value = !dark.value;
}

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
const selectedRow = ref(null);
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

const showIVRDesign = ref(false);
const ivrDesignTitle = ref('IVR流程设计');
const handleDeignClose = () => {
  showIVRDesign.value = false;
};
const handleIVRDesign = (index, row) => {
  showIVRDesign.value = true;
  ivrDesignTitle.value = 'IVR流程设计-' + row.ivrName;
};

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
    if (isValid) {
      const res = isEdit.value
        ? await store.dispatch(`${baseStoreName}/update`, {
            id: selectedRow.value.id,
            ...baseForm.value,
          })
        : await store.dispatch(`${baseStoreName}/create`, baseForm.value);

      if (res) {
        dialogVisible.value = false;
        isEdit.value = false;
        await fetchList();
      }
      ElMessage({
        message: '创建/修改成功',
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

const handleEdit = (index, row) => {
  const { ivrName, ivrNumber, description } = row;
  selectedRow.value = { ...row };
  baseForm.value = { ivrName, ivrNumber, description };
  dialogTitle.value = '编辑' + basePageName;
  dialogVisible.value = true;
  isEdit.value = true;
};

const handleDelete = async (index, row) => {
  try {
    await store.dispatch(`${baseStoreName}/delete`, row.id);
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
/* import the necessary styles for Vue Flow to work */
@import '@vue-flow/core/dist/style.css';

/* import the default theme, this is optional but generally recommended */
@import '@vue-flow/core/dist/theme-default.css';

@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/minimap/dist/style.css';
@import '@vue-flow/node-resizer/dist/style.css';

#ivr-flow {
  margin-bottom: -26px;
  margin-top: 6px;
  margin-left: -26px;
  margin-right: -32px;
  height: 600px;
}

#ivr-flow {
  text-transform: uppercase;
  font-family: 'JetBrains Mono', monospace;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.vue-flow__minimap {
  transform: scale(75%);
  transform-origin: bottom right;
}

.dnd-flow {
  flex-direction: column;
  display: flex;
  height: 100%;
}

.dnd-flow aside {
  color: #fff;
  font-weight: 700;
  border-right: 1px solid #eee;
  padding: 15px 10px;
  font-size: 12px;
  width: 250px;
  background: #10b981bf;
  -webkit-box-shadow: 0px 5px 10px 0px rgba(0, 0, 0, 0.3);
  box-shadow: 0 5px 10px #0000004d;
}

.dnd-flow aside .nodes > * {
  margin-bottom: 10px;
  cursor: grab;
  font-weight: 500;
  -webkit-box-shadow: 5px 5px 10px 2px rgba(0, 0, 0, 0.25);
  box-shadow: 5px 5px 10px 2px #00000040;
}

.dnd-flow aside .description {
  margin-bottom: 10px;
}

.dnd-flow .vue-flow-wrapper {
  flex-grow: 1;
  height: 100%;
}

@media screen and (min-width: 640px) {
  .dnd-flow {
    flex-direction: row;
  }

 
}

@media screen and (max-width: 639px) {
  .dnd-flow aside .nodes {
    display: flex;
    flex-direction: row;
    gap: 5px;
  }
}

.dropzone-background {
  position: relative;
  height: 100%;
  width: 100%;
}

.dropzone-background .overlay {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  pointer-events: none;
}

.basic-flow.dark {
  background: #2d3748;
  color: #fffffb;
}

.basic-flow.dark .vue-flow__node {
  background: #4a5568;
  color: #fffffb;
}

.basic-flow.dark .vue-flow__node.selected {
  background: #333;
  box-shadow: 0 0 0 2px #2563eb;
}

.basic-flow .vue-flow__controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.basic-flow.dark .vue-flow__controls {
  border: 1px solid #fffffb;
}

.basic-flow .vue-flow__controls .vue-flow__controls-button {
  border: none;
  border-right: 1px solid #eee;
}

.basic-flow .vue-flow__controls .vue-flow__controls-button svg {
  height: 100%;
  width: 100%;
}

.basic-flow.dark .vue-flow__controls .vue-flow__controls-button {
  background: #333;
  fill: #fffffb;
  border: none;
}

.basic-flow.dark .vue-flow__controls .vue-flow__controls-button:hover {
  background: #4d4d4d;
}

.basic-flow.dark .vue-flow__edge-textbg {
  fill: #292524;
}

.basic-flow.dark .vue-flow__edge-text {
  fill: #fffffb;
}

.extension-page {
  padding: 20px;
}
</style>
