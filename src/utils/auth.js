/**
 * 认证相关工具函数
 */

const TOKEN_KEY = 'auth_token'

/**
 * 获取存储的认证Token
 * @returns {string|null} JWT Token
 */
export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

/**
 * 设置认证Token
 * @param {string} token - JWT Token
 * @param {boolean} remember - 是否记住登录状态
 */
export const setAuthToken = (token, remember = false) => {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token)
    sessionStorage.removeItem(TOKEN_KEY)
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
    localStorage.removeItem(TOKEN_KEY)
  }
}

/**
 * 清除认证Token
 */
export const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

/**
 * 检查是否已登录
 * @returns {boolean} 是否已登录
 */
export const isAuthenticated = () => {
  return !!getAuthToken()
}

/**
 * 获取认证请求头
 * @returns {Object} 包含Authorization的请求头对象
 */
export const getAuthHeaders = () => {
  const token = getAuthToken()
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}
