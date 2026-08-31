<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElUpload, ElMessage } from 'element-plus'
import type { UploadRawFile, UploadRequestOptions } from 'element-plus'
import { getOssSignedUrl, getOssUploadToken, type OssPolicy } from '@/api/modules/piggy'

/**
 * 通过后台的 OSS 代理接口拿到 Post Policy，然后直传到 OSS。
 * OSS Post Policy 是全局公用签名，dir 是前缀限制。上传完成后 URL = `${host}/${key}`。
 * bucket 是私有读，裸 URL 展示不了，所以拿签名版预览；保存时后端会把签名剥回裸 URL 入库。
 */

const props = defineProps<{
  modelValue?: string | null
  dir?: string
  size?: number // 缩略图尺寸（px）
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | null): void
}>()

const uploading = ref(false)
const previewSize = computed(() => `${props.size ?? 120}px`)

async function customRequest(options: UploadRequestOptions) {
  uploading.value = true
  try {
    const policy = await getOssUploadToken(props.dir ?? 'admin/uploads')
    const url = await uploadToOss(policy, options.file as UploadRawFile)
    emit('update:modelValue', url)
    ElMessage.success('上传成功')
  }
  catch (err: any) {
    console.error('OSS 上传失败', err)
    ElMessage.error(err?.message ?? '上传失败')
  }
  finally {
    uploading.value = false
  }
}

async function uploadToOss(policy: OssPolicy, file: UploadRawFile) {
  const ext = file.name.split('.').pop() || 'bin'
  const key = `${policy.dir}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const form = new FormData()
  form.append('key', key)
  form.append('OSSAccessKeyId', policy.accessid)
  form.append('policy', policy.policy)
  form.append('signature', policy.signature)
  form.append('success_action_status', '200')
  form.append('file', file)

  const resp = await fetch(policy.host, { method: 'POST', body: form })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`OSS 上传失败：${resp.status} ${text}`)
  }
  // 拼接可访问 URL
  const host = policy.host.replace(/\/$/, '')
  const signed = await getOssSignedUrl(`${host}/${key}`)
  return signed.url
}

function beforeUpload(file: UploadRawFile) {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.warning('只能上传图片')
    return false
  }
  if (file.size / 1024 / 1024 > 5) {
    ElMessage.warning('图片大小不能超过 5MB')
    return false
  }
  return true
}

function onRemove() {
  emit('update:modelValue', null)
}
</script>

<template>
  <div class="flex items-start gap-2">
    <div v-if="modelValue" class="relative group">
      <img
        :src="modelValue"
        class="rounded border object-cover"
        :style="{ width: previewSize, height: previewSize }"
      >
      <button
        type="button"
        class="absolute right-1 top-1 hidden group-hover:flex bg-black/60 text-white rounded-full w-6 h-6 items-center justify-center"
        @click="onRemove"
      >
        <FaIcon name="i-lucide:trash-2" class="size-4" />
      </button>
    </div>
    <ElUpload
      v-else
      :show-file-list="false"
      :before-upload="beforeUpload"
      :http-request="customRequest"
      accept="image/*"
    >
      <div
        class="border border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:border-primary transition"
        :style="{ width: previewSize, height: previewSize }"
      >
        <FaIcon
          :name="uploading ? 'i-lucide:loader-2' : 'i-lucide:image-plus'"
          class="size-6"
          :class="{ 'animate-spin': uploading }"
        />
        <span class="text-xs text-muted-foreground mt-1">
          {{ uploading ? '上传中...' : '点击上传' }}
        </span>
      </div>
    </ElUpload>
  </div>
</template>
