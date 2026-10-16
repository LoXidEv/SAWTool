<script>
import { snackbar } from 'mdui/functions/snackbar.js';

const STORAGE_KEY = 'newsApiConfig';

export default {
    data() {
        return {
            config: {
                baseUrl: '',
                token: '',
                id: '',
                tag: '',
                q: '',
                limit: 10,
                format: 'json',
                full: false
            },
            testing: false,
            testResult: null
        };
    },
    computed: {
        requestUrl() {
            const base = (this.config.baseUrl || '').replace(/\/+$/, '');
            const params = new URLSearchParams();
            if (this.config.id) params.set('id', this.config.id);
            if (this.config.tag) params.set('tag', this.config.tag);
            if (this.config.q) params.set('q', this.config.q);
            if (this.config.limit !== '' && this.config.limit !== null) params.set('limit', String(this.config.limit));
            if (this.config.format && this.config.format !== 'json') params.set('format', this.config.format);
            if (this.config.full) params.set('full', '1');
            if (this.config.token) params.set('token', this.config.token);
            const qs = params.toString();
            return `${base}/api/news${qs ? '?' + qs : ''}`;
        },
        curlExample() {
            return `curl "${this.requestUrl}"`;
        }
    },
    watch: {
        config: {
            deep: true,
            handler(val) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
            }
        }
    },
    mounted() {
        this.config.baseUrl = window.location.origin;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                this.config = { ...this.config, ...JSON.parse(saved) };
            } catch (e) {
                /* 忽略损坏的本地配置 */
            }
        }
        if (!this.config.baseUrl) {
            this.config.baseUrl = window.location.origin;
        }
    },
    methods: {
        async copyText(text) {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const ta = document.createElement('textarea');
                    ta.value = text;
                    document.body.appendChild(ta);
                    ta.select();
                    // 兼容旧浏览器的复制方案，虽然execCommand已弃用但仍为低版本环境提供支持
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }
                snackbar({ message: this.$t('news.api.copied') });
            } catch (e) {
                snackbar({ message: this.$t('news.edit.copyFailed') });
            }
        },
        openUrl() {
            window.open(this.requestUrl, '_blank');
        },
        async testApi() {
            this.testing = true;
            this.testResult = null;
            try {
                const res = await fetch(this.requestUrl);
                const text = await res.text();
                let body = text;
                try {
                    body = JSON.stringify(JSON.parse(text), null, 2);
                } catch (e) {
                    /* 非 JSON（format=text）时原样展示 */
                }
                this.testResult = { ok: res.ok, status: res.status, body };
            } catch (e) {
                this.testResult = { ok: false, status: 0, body: (e && e.message) || String(e) };
            } finally {
                this.testing = false;
            }
        }
    }
}
</script>

<template>
    <div class="animate__animated animate__fadeIn">
        <mdui-card class="card">
            <div class="card_title">{{ $t('news.api.title') }}</div>
            <div class="card_content">{{ $t('news.api.content') }}</div>
            <div class="card_actions">
                <mdui-button variant="text" icon="arrow_back--outlined" @click="$router.push({ name: 'news' })">{{
                    $t('news.back') }}</mdui-button>
            </div>
        </mdui-card>

        <!-- 接口地址 -->
        <mdui-card class="api_card">
            <div class="api_header">
                <mdui-icon name="dns--outlined"></mdui-icon>
                <span>{{ $t('news.api.endpoint') }}</span>
            </div>
            <mdui-text-field variant="outlined" :label="$t('news.api.baseUrl')"
                :helper="$t('news.api.baseUrlHelper')" :value="config.baseUrl"
                @input="config.baseUrl = $event.target.value"></mdui-text-field>
            <mdui-text-field variant="outlined" type="password" toggle-password :label="$t('news.api.token')"
                :helper="$t('news.api.tokenHelper')" :value="config.token"
                @input="config.token = $event.target.value"></mdui-text-field>
            <div class="api_note">
                <mdui-icon name="info--outlined"></mdui-icon>
                <span>{{ $t('news.api.tokenEnv') }}</span>
            </div>
        </mdui-card>

        <!-- 请求参数 -->
        <mdui-card class="api_card">
            <div class="api_header">
                <mdui-icon name="tune--outlined"></mdui-icon>
                <span>{{ $t('news.api.params') }}</span>
            </div>
            <div class="api_grid">
                <mdui-text-field variant="outlined" :label="$t('news.api.paramId')" :value="config.id"
                    @input="config.id = $event.target.value"></mdui-text-field>
                <mdui-text-field variant="outlined" :label="$t('news.api.paramTag')" :value="config.tag"
                    @input="config.tag = $event.target.value"></mdui-text-field>
                <mdui-text-field variant="outlined" :label="$t('news.api.paramQ')" :value="config.q"
                    @input="config.q = $event.target.value"></mdui-text-field>
                <mdui-text-field variant="outlined" type="number" min="0" max="50" :label="$t('news.api.paramLimit')"
                    :value="config.limit" @input="config.limit = $event.target.value"></mdui-text-field>
                <mdui-select variant="outlined" :label="$t('news.api.paramFormat')" :value="config.format"
                    @change="config.format = $event.target.value">
                    <mdui-menu-item value="json">JSON</mdui-menu-item>
                    <mdui-menu-item value="text">{{ $t('news.api.formatText') }}</mdui-menu-item>
                </mdui-select>
                <div class="api_switch">
                    <mdui-switch :checked="config.full" @change="config.full = $event.target.checked">{{
                        $t('news.api.paramFull') }}</mdui-switch>
                </div>
            </div>
        </mdui-card>

        <!-- 生成地址 + 测试 -->
        <mdui-card class="api_card">
            <div class="api_header">
                <mdui-icon name="link--outlined"></mdui-icon>
                <span>{{ $t('news.api.requestUrl') }}</span>
            </div>
            <pre class="url_box">{{ requestUrl }}</pre>
            <div class="api_actions">
                <mdui-button variant="tonal" icon="content_copy--outlined" @click="copyText(requestUrl)">{{
                    $t('news.api.copyUrl') }}</mdui-button>
                <mdui-button variant="tonal" icon="open_in_new--outlined" @click="openUrl">{{ $t('news.api.openUrl')
                    }}</mdui-button>
                <mdui-button variant="filled" icon="play_arrow--outlined" :disabled="testing" @click="testApi">{{
                    testing ? $t('news.api.testing') : $t('news.api.test') }}</mdui-button>
            </div>

            <mdui-card v-if="testResult" variant="filled" class="result_card"
                :class="testResult.ok ? 'result_ok' : 'result_err'">
                <div class="result_header">
                    <mdui-icon :name="testResult.ok ? 'check_circle--outlined' : 'error--outlined'"></mdui-icon>
                    <span>{{ $t('news.api.status') }}: {{ testResult.status || '-' }}</span>
                </div>
                <pre class="result_body">{{ testResult.body }}</pre>
            </mdui-card>
        </mdui-card>

        <!-- 机器人接入示例 -->
        <mdui-card class="api_card">
            <div class="api_header">
                <mdui-icon name="smart_toy--outlined"></mdui-icon>
                <span>{{ $t('news.api.example') }}</span>
            </div>
            <div class="api_note">
                <mdui-icon name="info--outlined"></mdui-icon>
                <span>{{ $t('news.api.exampleHint') }}</span>
            </div>
            <pre class="code_box">{{ curlExample }}</pre>
            <div class="api_actions">
                <mdui-button variant="tonal" icon="content_copy--outlined" @click="copyText(curlExample)">{{
                    $t('news.api.copyCurl') }}</mdui-button>
            </div>
        </mdui-card>
    </div>
</template>

<style scoped>
.api_card {
    margin-bottom: 8px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.api_header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: bold;
    color: var(--text-color);
    font-family: 'Poppins SemiBold';
}

.api_grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.api_switch {
    display: flex;
    align-items: center;
}

.api_note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    color: var(--text-color-oc);
    line-height: 1.6;
    padding: 10px 14px;
    border-radius: var(--card-border-radius);
    background: var(--theme-color-2-oc-up);
}

.api_note mdui-icon {
    color: var(--theme-color-2);
    flex-shrink: 0;
}

.api_actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.url_box,
.code_box {
    margin: 0;
    padding: 12px 14px;
    font-size: 12px;
    line-height: 1.6;
    border-radius: var(--card-border-radius);
    border: 1px solid var(--border-color);
    background: rgba(0, 0, 0, 0.03);
    font-family: 'Consolas', 'Menlo', monospace;
    white-space: pre-wrap;
    word-break: break-all;
    color: var(--text-color-oc);
}

.result_card {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.result_ok {
    background: rgba(0, 200, 83, 0.12);
    color: #00893a;
}

.result_err {
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
}

.result_header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: bold;
}

.result_body {
    margin: 0;
    max-height: 360px;
    overflow: auto;
    font-size: 12px;
    line-height: 1.5;
    font-family: 'Consolas', 'Menlo', monospace;
    white-space: pre-wrap;
    word-break: break-all;
    color: var(--text-color);
}

@media (max-width: 900px) {
    .api_grid {
        grid-template-columns: 1fr;
    }
}
</style>
