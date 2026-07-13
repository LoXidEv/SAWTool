<script>
export default {
  data() {
    return {
      members: [
        { name: '天冬氨酸', role: 'Website Dev', avatar: 'https://avatars.githubusercontent.com/u/110319858?v=4' },
        // { name: 'FallingStar', role: '', avatar: '' },
        // { name: '', role: '', avatar: '' },
        // { name: '', role: '', avatar: '' },
      ]
    }
  },
}
</script>

<template>
  <div class="animate__animated animate__fadeIn">
    <mdui-card class="card">
      <div class="card_title">{{ $t('home.title') }}</div>
      <div class="card_content">{{ $t('home.content') }}</div>
    </mdui-card>

    <mdui-card class="card">
      <div class="card_title">{{ $t('home.members') }}</div>
      <div class="members_list">
        <div v-for="member in members" :key="member.name" class="member_item">
          <mdui-avatar :src="member.avatar"></mdui-avatar>
          <div class="member_info">
            <div class="member_name">{{ member.name }}</div>
            <div class="member_role">{{ member.role }}</div>
          </div>
        </div>
      </div>
    </mdui-card>
  </div>
</template>

<style scoped>
.members_list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.member_item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px;
  background: var(--text-color-oc-up);
  border-radius: var(--card-border-radius);
}

.member_info {
  display: flex;
  flex-direction: column;
}

.member_name {
  font-size: 14px;
  font-weight: bold;
}

.member_role {
  font-size: 12px;
  color: var(--text-color-oc);
}
</style>
