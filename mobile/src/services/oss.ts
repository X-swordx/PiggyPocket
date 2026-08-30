import { request } from './request'

interface OssUploadToken {
  host: string
  accessid: string
  policy: string
  signature: string
  expire: number
  dir: string
}

/**
 * 从后端获取 OSS Post Policy 签名
 */
export const getUploadToken = (dir: string): Promise<OssUploadToken> => {
  return request<OssUploadToken>({
    url: '/oss/upload-token',
    query: { dir }
  })
}

/**
 * 将本地文件直传到阿里云 OSS
 * @param filePath 本地文件临时路径（wx.chooseImage 返回的 tempFilePath）
 * @param dir 上传到 OSS 的目录，如 'dishes'、'avatars'、'foods'
 * @returns OSS 文件的裸 URL（bucket 私有读，展示时由后端加签名）
 */
export const uploadToOSS = async (filePath: string, dir: string): Promise<string> => {
  const token = await getUploadToken(dir)

  // 生成唯一文件名：时间戳 + 随机字符串
  const random = Math.random().toString(36).substring(2, 10)
  const ext = filePath.split('.').pop() || 'jpg'
  const fileName = `${Date.now()}_${random}.${ext}`
  const ossKey = `${dir}/${fileName}`

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: token.host,
      filePath,
      name: 'file',
      formData: {
        key: ossKey,
        policy: token.policy,
        OSSAccessKeyId: token.accessid,
        signature: token.signature,
        success_action_status: '200'
      },
      success: (res) => {
        // uni.uploadFile 只要服务端有响应就走 success（403 也算），
        // 不判状态码会把失败的上传当成功，把无效 URL 写进数据库
        if (res.statusCode < 200 || res.statusCode >= 300) {
          console.error('uploadToOSS fail', res.statusCode, res.data)
          reject(new Error(`图片上传失败（${res.statusCode}）`))
          return
        }
        // 入库存裸 URL，bucket 私有读，展示时由后端加签名
        const url = `${token.host}/${ossKey}`
        resolve(url)
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '图片上传失败'))
      }
    })
  })
}
