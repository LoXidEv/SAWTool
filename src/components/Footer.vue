<template>
    <mdui-card class="footer_card animate__animated animate__fadeIn">
        <div class="footer_content">{{ $t('footer.content') }}</div>
        <div class="footer_content">{{ $t('footer.content4') }} <a href="https://github.com/LoXidEv/SAWTool"
                target="_blank" class="link">github.com/LoXidEv/SAWTool</a></div>
        <hr>
        {{ $t('footer.content1') + " " + new Date().getFullYear() + " " + $t('footer.content3') }}
    </mdui-card>
</template>

<style scoped>
.footer_card {
    padding: 16px 20px;
    width: 100%;
}

.footer_content {
    font-size: 14px;
    font-weight: bold;
}

hr {
    border: none;
    height: 2px;
    background: var(--text-color-oc-up);
}
</style>
