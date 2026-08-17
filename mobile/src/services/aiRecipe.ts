import { API_BASE_URL, request } from './request'

export interface AiRecipeIngredient {
  name: string
  amount: string
}

/** 流式中间结果：字段与数组元素都可能只补全了一半 */
export interface AiRecipePartial {
  ingredients?: Partial<AiRecipeIngredient>[]
  steps?: string[]
}

interface StreamRecipeHandlers {
  onPartial: (partial: AiRecipePartial) => void
  onDone: () => void
  onError: (message: string) => void
}

export interface StreamRecipeTask {
  abort: () => void
}

/**
 * 手写 UTF-8 解码：小程序基础库的 TextDecoder 不可靠，且中文可能被切在
 * 两个 chunk 之间，所以要把不完整的多字节序列留在缓冲区里等下一个 chunk。
 * 返回解码出的字符串和未消费的尾部字节。
 */
const decodeUtf8 = (bytes: Uint8Array): { text: string; rest: Uint8Array } => {
  let i = 0
  let text = ''
  while (i < bytes.length) {
    const byte = bytes[i]
    let size = 1
    if (byte >= 0xf0) size = 4
    else if (byte >= 0xe0) size = 3
    else if (byte >= 0xc0) size = 2

    // 多字节字符被截断，留给下一个 chunk
    if (i + size > bytes.length) break

    if (size === 1) {
      text += String.fromCharCode(byte)
    } else if (size === 2) {
      text += String.fromCharCode(((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f))
    } else if (size === 3) {
      text += String.fromCharCode(
        ((byte & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)
      )
    } else {
      const code =
        ((byte & 0x07) << 18) |
        ((bytes[i + 1] & 0x3f) << 12) |
        ((bytes[i + 2] & 0x3f) << 6) |
        (bytes[i + 3] & 0x3f)
      const surrogate = code - 0x10000
      text += String.fromCharCode(0xd800 + (surrogate >> 10), 0xdc00 + (surrogate & 0x3ff))
    }
    i += size
  }
  return { text, rest: bytes.subarray(i) }
}

const concatBytes = (a: Uint8Array, b: Uint8Array) => {
  const merged = new Uint8Array(a.length + b.length)
  merged.set(a, 0)
  merged.set(b, a.length)
  return merged
}

/**
 * 流式生成菜谱。
 *
 * 小程序端走 enableChunked + onChunkReceived 真流式；H5 端 onChunkReceived 不会触发，
 * 由 success 回调解析完整响应体取最后一帧，退化为非流式 —— 单条代码路径覆盖两端。
 */
export const streamRecipe = (
  name: string,
  handlers: StreamRecipeHandlers
): StreamRecipeTask => {
  const url = `${API_BASE_URL}/ai/recipe/stream?name=${encodeURIComponent(name)}`

  let finished = false
  let aborted = false
  let pendingBytes = new Uint8Array(0)
  let buffer = ''

  const finish = () => {
    if (finished || aborted) return
    finished = true
    handlers.onDone()
  }

  const fail = (message: string) => {
    if (finished || aborted) return
    finished = true
    handlers.onError(message)
  }

  /** 按 SSE 空行切帧，处理 data: 载荷；返回是否已收到结束帧 */
  const consume = (chunk: string) => {
    buffer += chunk
    const frames = buffer.split('\n\n')
    // 最后一段可能是不完整的帧，留在缓冲区
    buffer = frames.pop() || ''

    for (const frame of frames) {
      const line = frame.split('\n').find((item) => item.startsWith('data:'))
      if (!line) continue
      const payload = line.slice(5).trim()
      if (!payload) continue
      if (payload === '[DONE]') {
        finish()
        return true
      }
      try {
        const parsed = JSON.parse(payload)
        if (parsed && parsed.error) {
          fail(parsed.error)
          return true
        }
        if (!finished && !aborted) handlers.onPartial(parsed as AiRecipePartial)
      } catch {
        // 半个 JSON，忽略即可，后续帧会带上完整内容
      }
    }
    return false
  }

  // enableChunked / onChunkReceived 不在 @dcloudio/types 里，需要绕过类型检查
  const task = uni.request({
    url,
    method: 'GET',
    enableChunked: true,
    responseType: 'text',
    success: (res: any) => {
      // H5 分支：没有 chunk 回调，这里一次性拿到完整响应体
      if (finished || aborted) return
      if (res.statusCode < 200 || res.statusCode >= 300) {
        fail(typeof res.data === 'string' ? 'AI 生成失败，请重试' : res.data?.message || 'AI 生成失败，请重试')
        return
      }
      if (typeof res.data === 'string' && res.data) consume(res.data)
      finish()
    },
    fail: (error: any) => {
      if (aborted) return
      fail(error?.errMsg || '网络异常，请重试')
    }
  } as any) as any

  task?.onChunkReceived?.((res: { data: ArrayBuffer }) => {
    if (finished || aborted) return
    const incoming = new Uint8Array(res.data)
    const { text, rest } = decodeUtf8(concatBytes(pendingBytes, incoming))
    pendingBytes = rest
    if (text) consume(text)
  })

  return {
    abort: () => {
      if (finished) return
      aborted = true
      task?.abort?.()
    }
  }
}

/**
 * 估算每人份热量（千卡）。普通请求，不走上面那套流式解码。
 * 返回 0 表示 AI 估不出来。
 */
export const estimateCalories = (name: string, ingredients: AiRecipeIngredient[]) => {
  return request<{ calories: number }>({
    url: '/ai/calories',
    method: 'POST',
    data: { name, ingredients }
  })
}
