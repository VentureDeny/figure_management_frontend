import request from '@/utils/request'

/**
 * 获取会员列表
 * @param {Object} params - 查询参数
 * @returns {Promise} 会员列表响应
 */
export const getMembersApi = (params) => {
  return request({
    url: '/api/members',
    method: 'GET',
    params
  })
}

/**
 * 搜索会员
 * @param {Object} params - 搜索参数
 * @param {string} params.keyword - 搜索关键词
 * @returns {Promise} 会员列表响应
 */
export const searchMembersApi = (params) => {
  return request({
    url: '/api/members/search',
    method: 'GET',
    params
  })
}

/**
 * 获取会员详情
 * @param {number} id - 会员ID
 * @returns {Promise} 会员详情响应
 */
export const getMemberDetailApi = (id) => {
  return request({
    url: `/api/members/${id}`,
    method: 'GET'
  })
}

/**
 * 创建会员
 * @param {Object} data - 会员数据
 * @returns {Promise} 创建响应
 */
export const createMemberApi = (data) => {
  return request({
    url: '/api/members',
    method: 'POST',
    data
  })
}

/**
 * 更新会员
 * @param {number} id - 会员ID
 * @param {Object} data - 更新数据
 * @returns {Promise} 更新响应
 */
export const updateMemberApi = (id, data) => {
  return request({
    url: `/api/members/${id}`,
    method: 'PUT',
    data
  })
}

/**
 * 删除会员
 * @param {number} id - 会员ID
 * @returns {Promise} 删除响应
 */
export const deleteMemberApi = (id) => {
  return request({
    url: `/api/members/${id}`,
    method: 'DELETE'
  })
}

/**
 * 添加会员照片
 * @param {number} id - 会员ID
 * @param {Object} data - 照片数据
 * @returns {Promise} 添加响应
 */
export const addMemberPhotosApi = (id, data) => {
  return request({
    url: `/api/members/${id}/photos`,
    method: 'POST',
    data
  })
}

/**
 * 删除会员照片
 * @param {number} memberId - 会员ID
 * @param {number} photoId - 照片ID
 * @returns {Promise} 删除响应
 */
export const deleteMemberPhotoApi = (memberId, photoId) => {
  return request({
    url: `/api/members/${memberId}/photos/${photoId}`,
    method: 'DELETE'
  })
}

/**
 * 设置主照片
 * @param {number} memberId - 会员ID
 * @param {number} photoId - 照片ID
 * @returns {Promise} 设置响应
 */
export const setMainPhotoApi = (memberId, photoId) => {
  return request({
    url: `/api/members/${memberId}/photos/${photoId}/main`,
    method: 'PUT'
  })
}
