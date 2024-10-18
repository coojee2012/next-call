<template>
  <div class="draggable-table">
    <el-button @click="resetDateFilter">reset date filter</el-button>
    <el-button @click="clearFilter">reset all filters</el-button>
    <el-table
      ref="tableRef"
      :data="tableData.data"
      :key="'table' + tableData.key"
      @header-dragend="handleHeaderDragend"
      style="width: 100%"
    >
      <template v-for="(item,index) of tableData.columnList" :key="index">
        <el-table-column
          show-overflow-tooltip
          :prop="item.prop"
          :label="item.label"
          :width="item.width"
          
        ></el-table-column>
      </template>
    </el-table>
  </div>
</template>
<script setup>
import {nextTick, onMounted, reactive, ref} from "vue";
import Sortable from 'sortablejs';

const tableData = reactive({
  key: new Date().getTime(),
  data: [
    {
      id: 'id',
      name: 'name',
      amount1: 'amount1',
      amount2: 'amount2',
      amount3: 'amount3',
    },
    {
      id: '12987123',
      name: 'Tom',
      amount1: '165',
      amount2: '4.43',
      amount3: 12,
    },
    {
      id: '12987124',
      name: 'Tom',
      amount1: '324',
      amount2: '1.9',
      amount3: 9,
    },
    {
      id: '12987125',
      name: 'Tom',
      amount1: '621',
      amount2: '2.2',
      amount3: 17,
    },
    {
      id: '12987126',
      name: 'Tom',
      amount1: '539',
      amount2: '4.1',
      amount3: 15,
    },
  ],
  columnList: [
    {
      label: 'ID',
      prop: "id",
      width: "180"
    },
    {
      label: 'Name',
      prop: "name",
      width: "180"
    },
    {
      label: 'Amount1',
      prop: "amount1",
      width: "180"
    },
    {
      label: 'Amount2',
      prop: "amount2",
      width: "180"
    },
    {
      label: 'Amount3',
      prop: "amount3",
      width: "180"
    },

  ]
})
const tableRef = ref();
let sortable;
onMounted(() => {
  initTableHeaderDrag(); // 初始化拖拽事件
})

function initTableHeaderDrag(){
  if(sortable){
    sortable.destroy();
  }
  let el = tableRef.value.$el.querySelector('.el-table__header-wrapper tr')
  sortable = Sortable.create(el, {
    animation: 150,
    onEnd(evt) {
      const oldItem = tableData.columnList[evt.oldIndex];
      tableData.columnList.splice(evt.oldIndex, 1);
      tableData.columnList.splice(evt.newIndex, 0, oldItem);
      tableData.key = new Date().getTime(); // 变更key，强制重绘table。如果不强制变更的话，会出现一些奇奇怪怪的问题，列宽度调整也会出现问题
      nextTick(() => {
        initTableHeaderDrag(); // 因为table被强制重新绘制，因此需要重新监听
      })
    }
  })
}
function handleHeaderDragend(newWidth, oldWidth, column, event){
  for(let item of tableData.columnList){
    if(item.label == column.label){
      item.width = newWidth;
    }
  }
  initTableHeaderDrag(); // 重新注册，防止变更宽度后无法拖动
}

const clearFilter = () => {
 
}
const resetDateFilter = () => {
  
}
</script>
<style scoped lang="scss"></style>
