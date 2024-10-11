import http from '../api/httpRequest.js';

const extensionStore = {
  namespaced: true,
  state: {
    extensions: [],
  },
  mutations: {
    SET_EXTENSIONS(state, extensions) {
      state.extensions = [...extensions];
    },
  },
  actions: {
    async fetchExtensions({ commit }, { searchKey }) {
      const response = await http.get(`/pbx/extension?searchKey=${searchKey}`);
      commit('SET_EXTENSIONS', response);
    },
    async createExtension({ commit }, payload) {
      console.log('createExtension payload:', payload);
      const response = await http.post('/pbx/extension', payload);
      return response;
    },

    async batchCreateExtensions({ commit }, payload) {
      console.log('batchCreateExtensions payload:', payload);
      const response = await http.post('/pbx/extension/batch', payload);
      return response;
    },
    async deleteExtension({ commit }, extensionId) {
      console.log('deleteExtension extensionId:', extensionId);
      const response = await http.delete(`/pbx/extension/${extensionId}`);
      return response;
    },
  },
};

export default extensionStore;
