import * as Vue from 'vue'
import * as Vuex from 'vuex'
import chatStore from './chatStore.js'
import friendStore from './friendStore.js'
import userStore from './userStore.js'
import groupStore from './groupStore.js'
import configStore from './configStore.js'
import uiStore from './uiStore.js'
import extensionStore from './extensionStore.js'

export default Vuex.createStore({
  modules: {
    chatStore,
    friendStore,
    userStore,
    groupStore,
    configStore,
    uiStore,
    extensionStore,
  },
  state: {},
  mutations: {},
  actions: {
    load(context) {
      return this.dispatch('loadUser').then(() => {
        console.log('loadUser OK')
        const promises = []
        promises.push(this.dispatch('loadFriend'))
        promises.push(this.dispatch('loadGroup'))
        promises.push(this.dispatch('loadChat'))
        promises.push(this.dispatch('loadConfig'))
        return Promise.all(promises)
      })
    },
    unload(context) {
      context.commit('clear')
    },
  },
  strict: process.env.NODE_ENV !== 'production',
})
