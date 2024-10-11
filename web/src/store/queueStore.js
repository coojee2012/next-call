import http from '../api/httpRequest.js';

const queueStore = {
  namespaced: true,
  state: {
    list: [],
    members: [],
  },
  mutations: {
    SET_QUEUES(state, list) {
      state.list = [...list];
    },
  },
  actions: {
    async fetch({ commit }, { searchKey }) {
      const response = await http.get(`/pbx/queue?searchKey=${searchKey}`);
      commit('SET_QUEUES', response);
    },
    async create({ commit }, payload) {
      const response = await http.post('/pbx/queue', payload);
      return response;
    },

    async update({ commit }, payload) {
      const response = await http.put(`/pbx/queue/${payload.id}`, payload);
      return response;
    },
   
    async delete({ commit }, id) {
      const response = await http.delete(`/pbx/queue/${id}`);
      return response;
    },
    async saveMembers({ commit }, payload) {
        const { id, members, queueNumber } = payload;
      const response = await http.put(`/pbx/queue/${id}/members`, { members, queueNumber });
      return response;
    },
  },
};

export default queueStore;
