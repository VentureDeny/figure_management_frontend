import request from '@/utils/request'

/**
 * 获取标签列表
 * @returns {Promise} 标签列表响应
 */
export const getTagsApi = () => {
  return request.get('/api/tags')
}

/**
 * 创建标签
 * @param {Object} data - 标签数据
 * @param {string} data.name - 标签名称
 * @param {string} data.color - 标签颜色
 * @returns {Promise} 创建响应
 */
export const createTagApi = (data) => {
  return request.post('/api/tags', data)
}

/**
 * 更新标签
 * @param {number} id - 标签ID
 * @param {Object} data - 更新数据
 * @param {string} data.name - 标签名称
 * @param {string} data.color - 标签颜色
 * @returns {Promise} 更新响应
 */
export const updateTagApi = (id, data) => {
  return request.put(`/api/tags/${id}`, data)
}

/**
 * 删除标签
 * @param {number} id - 标签ID
 * @returns {Promise} 删除响应
 */
export const deleteTagApi = (id) => {
  return request.delete(`/api/tags/${id}`)
}
