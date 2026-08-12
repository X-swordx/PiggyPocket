<template>
  <view class="page" :style="themeStyle">
    <view class="top-bar">
      <view class="top-inner">
        <button class="icon-button back-button" @click="goBack">
          <text class="icon-text primary-icon">‹</text>
        </button>
        <text class="page-title">饭搭子管理</text>
        <button class="icon-button" @click="showMore">
          <text class="icon-text">⋯</text>
        </button>
      </view>
    </view>

    <view class="content">
      <view class="summary-card soft-glow">
        <view class="summary-text">
          <view class="summary-title-row">
            <text class="summary-title">饭搭子队友</text>
            <text class="small-icon">✎</text>
          </view>
          <view class="summary-count">
            <text>你当前拥有</text>
            <text class="count-number">{{ buddyCount }}</text>
            <text>位饭搭子</text>
          </view>
        </view>
        <view class="summary-icon-wrap">
          <text class="summary-symbol">餐</text>
        </view>
        <view class="summary-shine"></view>
      </view>

      <view class="section">
        <view class="section-title-row">
          <text class="section-symbol">群</text>
          <text class="section-title">我的饭搭子</text>
        </view>

        <view class="buddy-list">
          <view v-for="member in buddyMembers" :key="member.id" class="buddy-item">
            <view class="avatar-wrap">
              <view class="avatar-placeholder">
                <text class="avatar-symbol">人</text>
              </view>
              <view class="status-dot"></view>
            </view>
            <view class="buddy-info">
              <text class="buddy-name">{{ memberName(member) }}</text>
            </view>
            <button class="unlink-button" @click="unlinkBuddy(member)">解除关联</button>
          </view>
        </view>
      </view>

      <view class="invite-card soft-glow">
        <view class="invite-bg-icon">
          <text class="invite-bg-symbol">↗</text>
        </view>
        <view class="invite-icon-wrap">
          <text class="invite-symbol">+</text>
        </view>
        <view class="invite-copy">
          <text class="invite-title">发现新的饭搭子</text>
          <text class="invite-desc">分享美食乐趣，一起开启省钱之旅</text>
        </view>
        <button class="invite-button" open-type="share">
          <text class="send-icon">↗</text>
          <text>邀请好友</text>
        </button>
      </view>

      <view class="empty-card"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShareAppMessage, onShow } from '@dcloudio/uni-app'
import {
  addDiningGroupMember,
  createDiningGroup,
  getCurrentUser,
  getDiningGroup,
  getMyDiningGroups,
  removeDiningGroupMember,
  type DiningGroup,
  type DiningGroupMember,
  type FoodieUser
} from '@/services/foodieBuddy'
import { themeStyle } from '@/utils/theme'

const currentUser = ref<FoodieUser | null>(null)
const currentGroup = ref<DiningGroup | null>(null)
const members = ref<DiningGroupMember[]>([])
const inviteGroupId = ref<number | null>(null)
const loading = ref(false)

const buddyMembers = computed(() => members.value.filter((member) => member.userId !== currentUser.value?.id))
const buddyCount = computed(() => buddyMembers.value.length)

const memberName = (member: DiningGroupMember) => member.nickname || member.user?.nickname || member.user?.name || '饭搭子'

const loadGroup = async (groupId?: number) => {
  const user = currentUser.value || await getCurrentUser()
  currentUser.value = user

  if (groupId) {
    let joined = false
    try {
      await addDiningGroupMember(groupId, {
        openid: user.openid,
        nickname: user.nickname || user.name
      })
      joined = true
    } catch (err: any) {
      if (!String(err.message || '').includes('已在组内')) {
        uni.showToast({ title: err.message || '加入饭搭子失败', icon: 'none' })
      }
    }
    currentGroup.value = await getDiningGroup(groupId)
    if (joined && currentGroup.value) {
      const host = currentGroup.value.creator?.nickname || currentGroup.value.creator?.name || currentGroup.value.name
      uni.showToast({ title: `已加入${host}的饭搭子`, icon: 'none' })
    }
    // 加入过邀请群后，本次会话不再重复处理，避免下次 onShow 反复弹 toast
    inviteGroupId.value = null
  } else {
    const groups = await getMyDiningGroups(user.id)
    if (groups.length === 0) {
      // 没有群时自动建一个默认群，保证分享链接一定带 groupId
      currentGroup.value = await createDiningGroup({ name: '我的饭搭子', creatorId: user.id })
    } else {
      currentGroup.value = groups[0]
    }
  }

  if (currentGroup.value) {
    const detail = await getDiningGroup(currentGroup.value.id)
    currentGroup.value = detail
    members.value = detail.members || []
  } else {
    members.value = []
  }
}

const refresh = async () => {
  loading.value = true
  try {
    await loadGroup(inviteGroupId.value || undefined)
  } catch (err: any) {
    uni.showToast({ title: err.message || '饭搭子加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const unlinkBuddy = (member: DiningGroupMember) => {
  if (!currentGroup.value) return
  uni.showModal({
    title: '解除关联',
    content: `确定要解除与${memberName(member)}的关联吗？`,
    success: async (res) => {
      if (!res.confirm || !currentGroup.value) return
      try {
        await removeDiningGroupMember(currentGroup.value.id, member.userId)
        await refresh()
      } catch (err: any) {
        uni.showToast({ title: err.message || '解除失败', icon: 'none' })
      }
    }
  })
}

const goBack = () => {
  uni.navigateBack({
    fail: () => uni.reLaunch({ url: '/pages/profile/index' })
  })
}

const showMore = () => {
  if (currentGroup.value) {
    uni.showToast({ title: currentGroup.value.name, icon: 'none' })
  }
}

onLoad((options: any) => {
  inviteGroupId.value = options?.groupId ? Number(options.groupId) : null
})

onShow(refresh)

onShareAppMessage(() => ({
  title: '邀请你成为我的饭搭子',
  path: currentGroup.value ? `/pages/foodie-buddy/index?groupId=${currentGroup.value.id}` : '/pages/foodie-buddy/index',
  imageUrl: '/static/logo.png'
}))
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--theme-bg);
  color: #1f1a1b;
}

.top-bar {
  padding-top: calc(var(--status-bar-height) + 12px);
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid var(--theme-primary-lighter);
  box-shadow: 0 4px 16px rgba(31, 26, 27, 0.06);
}

.top-inner {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.icon-button {
  width: 40px;
  height: 40px;
  padding: 0;
  margin: 0;
  border-radius: 999px;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-button::after,
.invite-button::after,
.unlink-button::after {
  border: 0;
}

.icon-button:active,
.invite-button:active,
.unlink-button:active {
  transform: scale(0.96);
}

.icon-text {
  color: #504445;
  font-size: 30px;
  line-height: 40px;
  font-weight: 500;
}

.primary-icon {
  color: var(--theme-primary);
  font-size: 36px;
}

.page-title {
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
  color: #1f1a1b;
}

.content {
  box-sizing: border-box;
  padding: 16px;
}

.soft-glow {
  box-shadow: 0 4px 20px -5px rgba(var(--theme-primary-rgb), 0.4);
}

.summary-card {
  min-height: 104px;
  margin-top: 16px;
  padding: 24px;
  border-radius: 8px;
  background: var(--theme-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.summary-text {
  position: relative;
  z-index: 1;
}

.summary-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.summary-title {
  color: #321018;
  font-size: 20px;
  line-height: 28px;
  font-weight: 700;
}

.summary-count {
  display: flex;
  align-items: baseline;
  color: rgba(50, 16, 24, 0.8);
  font-size: 14px;
}

.count-number {
  margin: 0 4px;
  color: #321018;
  font-size: 24px;
  line-height: 32px;
  font-weight: 700;
}

.summary-icon-wrap {
  position: relative;
  z-index: 1;
  opacity: 1;
}

.small-icon {
  color: rgba(50, 16, 24, 0.45);
  font-size: 14px;
}

.summary-symbol {
  color: rgba(50, 16, 24, 0.2);
  font-size: 64px;
  line-height: 76px;
}

.summary-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
}

.section {
  margin-top: 24px;
}

.section-title-row {
  padding: 0 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-symbol {
  font-size: 18px;
  line-height: 22px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #504445;
}

.buddy-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.buddy-item {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--theme-primary-lighter);
  background: #ffffff;
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-wrap {
  width: 56px;
  height: 56px;
  position: relative;
  flex-shrink: 0;
}

.avatar-img,
.avatar-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.avatar-img {
  display: block;
}

.avatar-placeholder {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-gradient-end));
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-symbol {
  color: #ffffff;
  font-size: 24px;
  font-weight: 700;
}

.status-dot {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #44664c;
  border: 2px solid #ffffff;
}

.status-dot.offline {
  background: #ebe8ea;
}

.buddy-info {
  flex: 1;
  min-width: 0;
}

.buddy-name {
  display: block;
  color: #1f1a1b;
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unlink-button {
  height: 32px;
  line-height: 32px;
  padding: 0 16px;
  margin: 0;
  border: 0;
  border-radius: 8px;
  background: rgba(248, 216, 220, 0.5);
  color: #574145;
  font-size: 14px;
  font-weight: 500;
}

.invite-card {
  margin-top: 24px;
  padding: 32px;
  border-radius: 12px;
  border: 1px solid var(--theme-primary-light);
  background: linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.4), #ffffff);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.invite-bg-icon {
  position: absolute;
  top: -24px;
  right: -24px;
}

.invite-bg-symbol {
  color: rgba(31, 26, 27, 0.1);
  font-size: 88px;
  line-height: 88px;
}

.invite-icon-wrap {
  width: 80px;
  height: 80px;
  margin-bottom: 8px;
  border-radius: 50%;
  background: var(--theme-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 6px rgba(128, 81, 90, 0.08);
}

.invite-symbol {
  color: var(--theme-primary);
  font-size: 46px;
  line-height: 48px;
  font-weight: 700;
}

.invite-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.invite-title {
  color: #1f1a1b;
  font-size: 20px;
  line-height: 28px;
  font-weight: 700;
}

.invite-desc {
  color: #504445;
  font-size: 14px;
}

.invite-button {
  height: 48px;
  line-height: 48px;
  margin: 8px 0 0;
  padding: 0 32px;
  border: 0;
  border-radius: 999px;
  background: var(--theme-primary);
  color: #321018;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 18px rgba(var(--theme-primary-rgb), 0.3);
}

.send-icon {
  font-size: 20px;
  line-height: 20px;
  font-weight: 700;
}

.empty-card {
  height: 96px;
  margin-top: 24px;
  border-radius: 8px;
  border: 1px solid var(--theme-primary-lightest);
  background: rgba(248, 245, 246, 0.5);
  opacity: 0.6;
}
</style>
