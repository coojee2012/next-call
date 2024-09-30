import * as Vue from 'vue'
import mitt from 'mitt';
import ElementUI from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import VueJsSIP from './vsip';
import App from './App'
import router from './router'
import './assets/iconfont/iconfont.css'
import httpRequest from './api/httpRequest'
import * as socketApi from './api/wssocket'
import * as messageType from './api/messageType'
import emotion from './api/emotion.js'
import element from './api/element.js'
import store from './store'
import * as enums from './api/enums.js'
import * as date from './api/date.js'
//import './utils/directive/dialogDrag'

 // 引入element-plus依赖
//import ElementPlus from 'element-plus'
//import 'element-plus/dist/index.css'
// 引入element-plus里的图标
//import * as ElementPlusIconsVue from '@element-plus/icons-vue'

window.$vueApp = Vue.createApp(App)
window.$vueApp.config.productionTip = false
if (process.env.ENV === 'development') {
  window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = true
}

window.$vueApp.use(ElementUI)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  window.$vueApp.component(key, component)
}

// 挂载全局
window.$vueApp.config.globalProperties.$wsApi = socketApi
window.$vueApp.config.globalProperties.$msgType = messageType
window.$vueApp.config.globalProperties.$date = date
window.$vueApp.config.globalProperties.$http = httpRequest // http请求方法
window.$vueApp.config.globalProperties.$emo = emotion // emo表情
window.$vueApp.config.globalProperties.$elm = element // 元素操作
window.$vueApp.config.globalProperties.$enums = enums // 枚举
const eventBus = mitt()
window.$vueApp.config.globalProperties.$eventBus = eventBus // 全局事件


window.$vueApp.config.globalProperties.routerAppend = (path, pathToAppend) => {
  return path + (path.endsWith('/') ? '' : '/') + pathToAppend
}
window.$vueApp.use(store)
window.$vueApp.use(router)
window.$vueApp.use(VueJsSIP, {
  store // Vuex store
})

// v-dialogDrag: 弹窗拖拽
window.$vueApp.directive('dialogDrag', {
  beforeMount(el, binding, vnode, oldVnode) {
    const dialogHeaderEl = el.querySelector('.el-dialog__header')
    const dragDom = el.querySelector('.el-dialog')
    dialogHeaderEl.style.cursor = 'move' // 获取原有属性 ie dom元素.currentStyle 火狐谷歌 window.getComputedStyle(dom元素, null);
    const sty = dragDom.currentStyle || window.getComputedStyle(dragDom, null)
    dialogHeaderEl.onmousedown = (e) => {
      // 鼠标按下，计算当前元素距离可视区的距离
      const disX = e.clientX - dialogHeaderEl.offsetLeft
      const disY = e.clientY - dialogHeaderEl.offsetTop
      const screenWidth = document.body.clientWidth // body当前宽度
      const screenHeight = document.documentElement.clientHeight // 可见区域高度(应为body高度，可某些环境下无法获取)
      const dragDomWidth = dragDom.offsetWidth // 对话框宽度
      const dragDomheight = dragDom.offsetHeight // 对话框高度
      const minDragDomLeft = dragDom.offsetLeft
      const maxDragDomLeft = screenWidth - dragDom.offsetLeft - dragDomWidth
      const minDragDomTop = dragDom.offsetTop
      const maxDragDomTop = screenHeight - dragDom.offsetTop - dragDomheight // 获取到的值带px 正则匹配替换
      let styL, styT // 注意在ie中 第一次获取到的值为组件自带50% 移动之后赋值为px
      if (sty.left.includes('%')) {
        styL = +document.body.clientWidth * (+sty.left.replace(/%/g, '') / 100)
        styT = +document.body.clientHeight * (+sty.top.replace(/%/g, '') / 100)
      } else {
        styL = +sty.left.replace(/\px/g, '')
        styT = +sty.top.replace(/\px/g, '')
      }
      document.onmousemove = function (e) {
        // 获取body的页面可视宽高
        // var clientHeight = document.documentElement.clientHeight || document.body.clientHeight
        // var clientWidth = document.documentElement.clientWidth || document.body.clientWidth
        // 通过事件委托，计算移动的距离
        var l = e.clientX - disX
        var t = e.clientY - disY // 边界处理
        if (-l > minDragDomLeft) {
          l = -minDragDomLeft
        } else if (l > maxDragDomLeft) {
          l = maxDragDomLeft
        }
        if (-t > minDragDomTop) {
          t = -minDragDomTop
        } else if (t > maxDragDomTop) {
          t = maxDragDomTop
        } // 移动当前元素
        dragDom.style.left = `${l + styL}px`
        dragDom.style.top = `${t + styT}px` // 将此时的位置传出去 // binding.value({x:e.pageX,y:e.pageY})
      }
      document.onmouseup = function (e) {
        document.onmousemove = null
        document.onmouseup = null
      }
    }
  },
})

window.$vueApp.mount('#app')
