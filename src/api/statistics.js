import request from '@/utils/request'

/**
 * 获取总体统计数据
 * @returns {Promise} 统计数据响应
 */
export const getOverviewStatsApi = () => {
  return request({
    url: '/api/statistics/overview',
    method: 'GET'
  })
}

/**
 * 获取财务统计数据
 * @param {Object} params - 查询参数
 * @param {string} params.range - 时间范围
 * @returns {Promise} 财务统计响应
 */
export const getFinancialStatsApi = (params) => {
  return request({
    url: '/api/statistics/financial',
    method: 'GET',
    params
  })
}

/**
 * 获取库存统计数据
 * @returns {Promise} 库存统计响应
 */
export const getInventoryStatsApi = () => {
  return request({
    url: '/api/statistics/inventory',
    method: 'GET'
  })
}

/**
 * 获取会员统计数据
 * @returns {Promise} 会员统计响应
 */
export const getMemberStatsApi = () => {
  return request({
    url: '/api/statistics/member',
    method: 'GET'
  })
}

/**
 * 获取交易统计数据
 * @returns {Promise} 交易统计响应
 */
export const getTransactionStatsApi = () => {
  return request({
    url: '/api/statistics/transaction',
    method: 'GET'
  })
}

/**
 * 获取今日交易数据
 * @param {Object} params - 查询参数
 * @returns {Promise} 交易记录响应
 */
export const getTodayTransactionsApi = (params) => {
  return request({
    url: '/api/transactions',
    method: 'GET',
    params
  })
}
