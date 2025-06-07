// src/api/transactions.js
import request from '@/utils/request'

// 获取交易记录列表
export const getTransactionsApi = (params) => {
  return request({
    url: '/api/transactions',
    method: 'get',
    params
  })
}

// 获取交易详情
export const getTransactionApi = (id) => {
  return request({
    url: `/api/transactions/${id}`,
    method: 'get'
  })
}

// 买入交易
export const buyTransactionApi = (data) => {
  return request({
    url: '/api/transactions/buy',
    method: 'post',
    data
  })
}

// 卖出交易（原有接口）
export const sellTransactionApi = (data) => {
  return request({
    url: '/api/transactions/sell',
    method: 'post',
    data
  })
}

// 卖出交易V2（新增接口，支持指定手办ID）
export const sellTransactionV2Api = (data) => {
  return request({
    url: '/api/transactions/sell-v2',
    method: 'post',
    data
  })
}

// 更新交易记录
export const updateTransactionApi = (id, data) => {
  return request({
    url: `/api/transactions/${id}`,
    method: 'put',
    data
  })
}

// 删除交易记录
export const deleteTransactionApi = (id) => {
  return request({
    url: `/api/transactions/${id}`,
    method: 'delete'
  })
}
