<template>
    <mdui-card class="card animate__animated animate__fadeIn">
        <div class="card_content">
            <div class="footer_content">{{ $t('footer.content') }}</div>
            <div class="footer_content">{{ $t('footer.content4') }} <a href="https://github.com/SARLaboTry/SAWTool" target="_blank">GitHub</a></div>
            <hr>
            {{ $t('footer.content1') + " " + new Date().getFullYear() + " " + $t('footer.content3') }}
        </div>
    </mdui-card>
</template>

<style scoped>
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
