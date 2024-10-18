import http from '../api/httpRequest.js';

const ivrStore = {
  namespaced: true,
  state: {
    list: [],
  },
  mutations: {
    SET_IVRS(state, list) {
      state.list = [...list];
    },
  },
  actions: {
    async fetch({ commit }, { searchKey }) {
      const response = await http.get(`/pbx/ivr?searchKey=${searchKey}`);
      commit('SET_IVRS', response);
    },
    async create({ commit }, payload) {
      const response = await http.post('/pbx/ivr', payload);
      return response;
    },

    async update({ commit }, payload) {
        const response = await http.put(`/pbx/ivr/${payload.id}`, payload);
        return response;
      },
   
    async delete({ commit }, id) {
      const response = await http.delete(`/pbx/ivr/${id}`);
      return response;
    },
  },
};

export default ivrStore;
