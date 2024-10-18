<template>
    <el-table :data="tableData" :header-cell-style="{'text-align': 'center'}" style="width: 100%">
      <el-table-column v-for="(column, index) in visibleColumns" 
      :key="column.prop + index" 
      :prop="column.prop" 
      :label="column.label" 
      :width="column.width"
      class="ex-table__header"  
      show-overflow-tooltip>
        <template #header>
          <span class="drag-handle">{{ column.label }}</span>
          <el-checkbox v-model="column.show" style="float: right; margin-right: 10px" />
        </template>
      </el-table-column>
    </el-table>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, defineProps,defineEmits } from 'vue';
  import Sortable from 'sortablejs';
  const emit = defineEmits(['update:columns']);
  const props = defineProps({
    tableData: {
      type: Array,
      default: () => []
    },
    columns: {
      type: Array,
      default: () => []
    }
  });
  
  const visibleColumns = computed(() => {
    return props.columns.filter(column => column.show);
  });
  
  onMounted(() => {
    const el = document.querySelector('.el-table__header');
    console.log("222222222", el);
    Sortable.create(el, {
      handle: '.drag-handle',
      animation: 150,
      onEnd: (evt) => {
        console.log("111111111", evt);
        const cl = [...props.columns];
        const oldIndex = cl.findIndex(column => column.prop === evt.item.dataset.prop);
        const newIndex = evt.newIndex;
        if (oldIndex === newIndex) return;
        cl.splice(evt.newIndex, 0, cl.splice(evt.oldIndex, 1)[0]);
        emit('update:columns', [...cl]);
      }
    });
  });
  </script>