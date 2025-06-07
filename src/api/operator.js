import request from '@/utils/request'

/**
 * 获取操作员列表
 * @param {Object} params - 查询参数
 * @returns {Promise} 操作员列表响应
 */
export const getOperatorsApi = (params) => {
  return request({
    url: '/api/operators',
    method: 'GET',
    params
  })
}

/**
 * 创建操作员
 * @param {Object} data - 操作员数据
 * @returns {Promise} 创建响应
 */
export const createOperatorApi = (data) => {
  return request({
    url: '/api/operators',
    method: 'POST',
    data
  })
}

/**
 * 更新操作员
 * @param {number} id - 操作员ID
 * @param {Object} data - 更新数据
 * @returns {Promise} 更新响应
 */
export const updateOperatorApi = (id, data) => {
  return request({
    url: `/api/operators/${id}`,
    method: 'PUT',
    data
  })
}

/**
 * 删除操作员
 * @param {number} id - 操作员ID
 * @returns {Promise} 删除响应
 */
export const deleteOperatorApi = (id) => {
  return request({
    url: `/api/operators/${id}`,
    method: 'DELETE'
  })
}

/**
 * 获取当前用户信息
 * @returns {Promise} 用户信息响应
 */
export const getCurrentOperatorApi = () => {
  return request({
    url: '/api/operators/profile',
    method: 'GET'
  })
}
