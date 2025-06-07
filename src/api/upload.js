import request from '@/utils/request'

/**
 * 单个图片上传
 * @param {FormData} formData - 表单数据
 * @returns {Promise} 上传响应
 */
export const uploadImageApi = (formData) => {
  return request({
    url: '/api/upload/image',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 60000 // 上传文件时间较长，增加超时时间
  })
}

/**
 * 批量图片上传
 * @param {FormData} formData - 表单数据
 * @returns {Promise} 上传响应
 */
export const uploadImagesApi = (formData) => {
  return request({
    url: '/api/upload/images',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 120000 // 批量上传时间更长
  })
}

/**
 * 删除上传文件
 * @param {string} filePath - 文件路径
 * @returns {Promise} 删除响应
 */
export const deleteUploadFileApi = (filePath) => {
  return request({
    url: '/api/upload/file',
    method: 'DELETE',
    params: { file_path: filePath }
  })
}
