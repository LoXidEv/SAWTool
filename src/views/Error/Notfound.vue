<template>
    <div class="animate__animated animate__fadeIn">
        <mdui-card clickable class="card" @click="$router.push('/')">
            <div class="card_title">{{ $t('notfound.title') }}</div>
            <div class="card_content">{{ $t('notfound.content') }}</div>
            <div class="card_actions">
                <div class="link_text">{{ $t('notfound.back_to_home') }}</div>
            </div>
        </mdui-card>
    </div>
</template>