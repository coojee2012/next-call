<template>
  <div class="right-menu-mask" @click="close()" @contextmenu.prevent="close()">
    <div class="right-menu" :style="{ left: pos.x + 'px', top: pos.y + 'px' }">
      <el-menu text-color="#333333">
        <el-menu-item
          v-for="item in items"
          :key="item.key"
          :title="item.name"
          @click.stop="onSelectMenu(item)"
        >
          <span :class="item.icon"></span>
          <span>{{ item.name }}</span>
        </el-menu-item>
      </el-menu>
    </div>
  </div>
</template>

<script>
import { $on, $off, $once, $emit } from '../../utils/gogocodeTransfer'
export default {
  name: 'rightMenu',
  data() {
    return {}
  },
  props: {
    pos: {
      type: Object,
    },
    items: {
      type: Array,
    },
  },
  methods: {
    close() {
      $emit(this, 'close')
    },
    onSelectMenu(item) {
      $emit(this, 'select', item)
      this.close()
    },
  },
  emits: ['select', 'close'],
}
</script>

<style lang="scss">
.right-menu-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}
.right-menu {
  position: fixed;
  box-shadow: 0px 0px 10px #ccc;
  .el-menu {
    border: 1px solid #b4b4b4;
    border-radius: 7px;
    overflow: hidden;

    .el-menu-item {
      height: 40px;
      line-height: 40px;
      border-bottom: 1px solid #d0d0d0;

      span {
        font-weight: 600;
      }
    }
  }
}
</style>
