<template>
  <view v-if="visible" class="privacy-mask" :style="themeStyle">
    <view class="privacy-modal">
      <text class="privacy-title">隐私协议授权</text>
      <text class="privacy-content">
        使用图片功能需要先同意{{ contractName }}，以便正常访问相册和相机。
      </text>
      <view class="privacy-actions">
        <button class="privacy-btn privacy-cancel" @click="onCancel">取消</button>
        <button
          class="privacy-btn privacy-confirm"
          open-type="agreePrivacyAuthorization"
          @agreeprivacyauthorization="onAgree"
        >
          同意
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { themeStyle } from '@/utils/theme'

const visible = ref(false)
const contractName = ref('隐私保护指引')
let resolveCallback: ((value: boolean) => void) | null = null

const ensurePrivacyAgreement = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!uni.getPrivacySetting) {
      resolve(true)
      return
    }
    uni.getPrivacySetting({
      success: (res: any) => {
        if (!res.needAuthorization) {
          resolve(true)
          return
        }
        contractName.value = res.privacyContractName || '隐私保护指引'
        resolveCallback = resolve
        visible.value = true
      },
      fail: () => resolve(false)
    })
  })
}

const onAgree = () => {
  visible.value = false
  if (resolveCallback) {
    resolveCallback(true)
    resolveCallback = null
  }
}

const onCancel = () => {
  visible.value = false
  if (resolveCallback) {
    resolveCallback(false)
    resolveCallback = null
  }
}

defineExpose({ ensurePrivacyAgreement })
</script>

<style scoped>
.privacy-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.privacy-modal {
  width: 280px;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.privacy-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.privacy-content {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  text-align: center;
  margin-bottom: 24px;
}

.privacy-actions {
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 12px;
}

.privacy-btn {
  flex: 1;
  height: 40px;
  line-height: 40px;
  border-radius: 20px;
  font-size: 14px;
  text-align: center;
  padding: 0;
  margin: 0;
}

.privacy-btn::after {
  border: none;
}

.privacy-cancel {
  background: #f5f5f5;
  color: #666;
}

.privacy-confirm {
  background: var(--theme-primary);
  color: #fff;
}
</style>
