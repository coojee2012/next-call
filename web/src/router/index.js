import * as Vue from 'vue'
import * as VueRouter from 'vue-router'
import Login from '../view/Login'
import Register from '../view/Register'
import Home from '../view/Home'

// 配置导出路由
export default VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      name: 'Login',
      path: '/login',
      component: Login,
    },
    {
      name: 'Register',
      path: '/register',
      component: Register,
    },
    {
      name: 'Home',
      path: '/cc',
      component: Home,
      children: [
        {
          name: 'Chat',
          path: '/cc/chat',
          component: () => import('../view/Chat'), //Vue.defineAsyncComponent(() => import('../view/Chat')),
        },
        {
          name: 'Friend',
          path: '/cc/friend',
          component: () => import('../view/Friend'), // Vue.defineAsyncComponent(() => import('../view/Friend')),
        },
        {
          name: 'Group',
          path: '/cc/group',
          component: () => import('../view/Group'), // Vue.defineAsyncComponent(() => import('../view/Group')),
        },
        {
          name: 'WorkPlate',
          path: '/cc/manage',
          component: () => import('../view/WorkPlate'),
          children: [
            {
              name: 'Extension',
              path: '/cc/manage/extension',
              component: () => import('../view/manage/Extension'), 
            },
            {
              name: 'Queue',
              path: '/cc/manage/queue',
              component: () => import('../view/manage/Queue'), 
            },
            {
              name: 'IVR',
              path: '/cc/manage/ivr',
              component: () => import('../view/manage/IVR'), 
            },
          ]
        }
      ],
    },
  ],
})
