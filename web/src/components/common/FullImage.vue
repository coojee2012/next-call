<template>
  <div
    class="full-image"
    v-show="visible"
    :before-close="onClose"
    :modal="true"
  >
    <div class="mask"></div>
    <div class="image-box">
      <img :src="url" />
    </div>
    <div class="close" @click="onClose">x</div>
  </div>
</template>

<script>
import { $on, $off, $once, $emit } from '../../utils/gogocodeTransfer'
export default {
  name: 'fullImage',
  data() {
    return {
      fit: 'contain',
    }
  },
  methods: {
    onClose() {
      $emit(this, 'close')
    },
  },
  props: {
    visible: {
      type: Boolean,
    },
    url: {
      type: String,
    },
  },
  emits: ['close'],
}
</script>

<style lang="scss">
.full-image {
  position: fixed;
  width: 100%;
  height: 100%;
  .mask {
    position: fixed;
    width: 100%;
    height: 100%;
    background: black;
    opacity: 0.9;
  }

  .image-box {
    position: relative;
    width: 100%;
    height: 100%;

    img {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      max-height: 100%;
      max-width: 100%;
    }
  }

  .close {
    position: fixed;
    top: 10px;
    right: 10px;
    color: white;
    font-size: 25px;
    cursor: pointer;
  }
}
</style>
