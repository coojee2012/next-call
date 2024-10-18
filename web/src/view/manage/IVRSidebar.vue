<script setup>
import { ref, watch } from 'vue'
import useDragAndDrop from './IVRUseDnD'

const { onDragStart, selectEdge, selectNode } = useDragAndDrop()
watch(selectNode, (node) => {
    console.log(node)
  })
</script>

<template>
  <aside>
    <div class="description">流程动作</div>

    <div class="nodes">
      <div class="vue-flow__node-input" :draggable="true" @dragstart="onDragStart($event, 'input')">播放语音</div>

      <div class="vue-flow__node-default" :draggable="true" @dragstart="onDragStart($event, 'default')">拨打本地</div>

      <div class="vue-flow__node-output" :draggable="true" @dragstart="onDragStart($event, 'output')">结束</div>
    </div>
    <div class="description">动作数据</div>
    <div>
        <p v-if="selectNode ">{{selectNode.type }}</p>
        {{ selectEdge && selectEdge.value && selectEdge.value.type }}
    </div>
  </aside>
</template>