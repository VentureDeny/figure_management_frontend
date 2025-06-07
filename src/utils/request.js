import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'

// 创建axios实例
const request = axios.create({
  baseURL: 'http://localhost:8080', // 使用代理，无需设置baseURL
  timeout: 30000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 获取token
    const token = localStorage.getItem('token')

    // 如果存在token，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 打印请求信息（开发环境）
    if (import.meta.env.DEV) {
      console.log('请求发送:', {
        url: config.url,
        method: config.method?.toUpperCase(),
        data: config.data,
        params: config.params
      })
    }

    return config
  },
  (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response

    // 打印响应信息（开发环境）
    if (import.meta.env.DEV) {
      console.log('响应接收:', {
        url: response.config.url,
        status: response.status,
        data: data
      })
    }

    // 直接返回响应数据
    return data
  },
  (error) => {
    console.error('响应拦截器错误:', error)

    // 处理网络错误
    if (!error.response) {
      ElMessage.error('网络连接失败，请检查网络设置')
      return Promise.reject(error)
    }

    const { status} = error.response

    // 根据状态码处理不同错误
    switch (status) {
      case 401:
        // 未授权，清除token并跳转到登录页
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')

        // 避免在登录页重复跳转
        if (router.currentRoute.value.path !== '/login') {
          ElMessageBox.alert('登录已过期，请重新登录', '提示', {
            confirmButtonText: '确定',
            type: 'warning'
          }).then(() => {
            router.push('/login')
          })
        }
        break

      case 403:
        ElMessage.error('没有权限访问该资源')
        break

      case 404:
        ElMessage.error('请求的资源不存在')
        break

      case 500:
        ElMessage.error('服务器内部错误')
        break

      default:
        // 显示后端返回的错误信息


    }

    return Promise.reject(error)
  }
)

export default request
