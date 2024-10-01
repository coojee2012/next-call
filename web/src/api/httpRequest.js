import axios from 'axios'

import { ElMessage  } from 'element-plus'

const http = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 1000 * 30,
  withCredentials: true,
})

/**
 * 请求拦截
 */
http.interceptors.request.use(
  (config) => {
    let accessToken = sessionStorage.getItem('accessToken')
    if (accessToken) {
      // config.headers.accessToken = encodeURIComponent(accessToken)
      config.headers.authorization = "Bearer " + encodeURIComponent(accessToken)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截
 */
http.interceptors.response.use(
  async (response) => {
    if(!response) {
      console.log('response is null', response)
      return Promise.reject('response is null')
    }
    if (response.status === 200 || response.status === 201) {
      return response.data
    } else if (response.status === 400) {
      location.href = '/'
    } else if (response.status === 401) {
      console.log('token失效，尝试重新获取')
      let refreshToken = sessionStorage.getItem('refreshToken')
      if (!refreshToken) {
        location.href = '/'
      }
      // 发送请求, 进行刷新token操作, 获取新的token
      const data = await http({
        method: 'put',
        url: '/refreshToken',
        headers: {
          refreshToken: refreshToken,
        },
      }).catch(() => {
        location.href = '/'
      })
      // 保存token
      sessionStorage.setItem('accessToken', data.accessToken)
      sessionStorage.setItem('refreshToken', data.refreshToken)
      // 重新发送刚才的请求
      return http(response.config)
    } else {
      ElMessage({
        message: response.data.message,
        type: 'error',
        duration: 1500,
        customClass: 'element-error-message-zindex',
      })
      return Promise.reject(response.data)
    }
  },
  (error) => {
    switch (error.response.status) {
      case 400:
        ElMessage({
          message: error.response.data,
          type: 'error',
          duration: 1500,
          customClass: 'element-error-message-zindex',
        })
        break
      case 401:
        location.href = '/'
        break
      case 405:
        ElMessage({
          message: 'http请求方式有误',
          type: 'error',
          duration: 1500,
          customClass: 'element-error-message-zindex',
        })
        break
      case 404:
      case 500:
        ElMessage({
          message: '服务器出了点小差，请稍后再试',
          type: 'error',
          duration: 1500,
          customClass: 'element-error-message-zindex',
        })
        break
      case 501:
        ElMessage({
          message: '服务器不支持当前请求所需要的某个功能',
          type: 'error',
          duration: 1500,
          customClass: 'element-error-message-zindex',
        })
        break
    }

    return Promise.reject(error)
  }
)

export default http
