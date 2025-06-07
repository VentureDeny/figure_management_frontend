import request from '@/utils/request'

/**
 * 用户登录
 * @param {Object} data - 登录数据
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @returns {Promise} 登录响应
 */
export const loginApi = (data) => {
  return request({
    url: '/api/login',
    method: 'POST',
    data
  })
}

/**
 * 用户登出
 * @returns {Promise} 登出响应
 */
export const logoutApi = () => {
  return request({
    url: '/api/logout',
    method: 'POST'
  })
}

/**
 * 获取当前用户信息
 * @returns {Promise} 用户信息响应
 */
export const getCurrentUserApi = () => {
  return request({
    url: '/api/operators/profile',
    method: 'GET'
  })
}
