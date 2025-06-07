import request from '@/utils/request'

/**
 * 获取会员积分记录
 * @param {number} memberId - 会员ID
 * @param {Object} params - 查询参数
 * @returns {Promise} 积分记录响应
 */
export const getMemberPointsApi = (memberId, params) => {
  return request({
    url: `/api/points/member/${memberId}`,
    method: 'GET',
    params
  })
}

/**
 * 调整会员积分
 * @param {Object} data - 调整数据
 * @param {number} data.member_id - 会员ID
 * @param {number} data.points_change - 积分变化
 * @param {string} data.reason - 调整原因
 * @returns {Promise} 调整响应
 */
export const adjustMemberPointsApi = (data) => {
  return request({
    url: '/api/points/adjust',
    method: 'POST',
    data
  })
}

/**
 * 获取积分调整记录
 * @param {Object} params - 查询参数
 * @returns {Promise} 调整记录响应
 */
export const getPointsAdjustmentsApi = (params) => {
  return request({
    url: '/api/points/adjustments',
    method: 'GET',
    params
  })
}
