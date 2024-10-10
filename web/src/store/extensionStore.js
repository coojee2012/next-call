import http from '../api/httpRequest.js'

const extensionStore = {
  namespaced: true,
  state: {
    extensions: []
  },
  mutations: {
    SET_EXTENSIONS(state, extensions) {
      state.extensions = [...extensions]
    }
  },
  actions: {
    async fetchExtensions({ commit }, {searchKey}) {
      const response = await http.get(`/pbx/extension?searchKey=${searchKey}`)
      commit('SET_EXTENSIONS', response)
    },
    async createExtension({ commit }, payload) {
      console.log('createExtension payload:', payload)
      const response = await http.post('/pbx/extension', payload)
      return response
    }
  }
}

export default  extensionStore