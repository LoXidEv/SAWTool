<script>
import { nextTick } from 'vue';
import newsData from '@/assets/configdata/newsData.json';
import { renderMarkdown } from '@/utils/markdown';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

export default {
    data() {
        return {
            articles: newsData.articles
        };
    },
    computed: {
        article() {
            return this.articles.find(a => a.id === this.$route.params.id) || null;
        },
        html() {
            return this.article ? renderMarkdown(this.article.content) : '';
        }
    },
    watch: {
        html() {
            this.highlight();
        }
    },
    mounted() {
        this.highlight();
    },
    methods: {
        highlight() {
            nextTick(() => {
                const root = this.$refs.content;
                if (!root) return;
                root.querySelectorAll('pre code').forEach(block => {
                    try {
                        hljs.highlightElement(block);
                    } catch (e) {
                        /* 忽略未知语言的代码块 */
                    }
                });
            });
        }
    }
}
</script>

<template>
    <div class="animate__animated animate__fadeIn">
        <template v-if="article">
            <mdui-card class="card">
                <div v-if="article.cover" class="detail_cover">
                    <img :src="article.cover" alt="" loading="lazy" />
                </div>
                <div class="detail_title">{{ article.title }}</div>
                <div class="detail_meta">
                    <span><mdui-icon name="person--outlined"></mdui-icon>{{ article.author || $t('news.anonymous') }}</span>
                    <span><mdui-icon name="event--outlined"></mdui-icon>{{ article.date }}</span>
                </div>
                <div v-if="article.tags && article.tags.length" class="detail_tags">
                    <mdui-chip v-for="tag in article.tags" :key="tag" variant="assist">{{ tag }}</mdui-chip>
                </div>
                <div v-if="article.summary" class="detail_summary">{{ article.summary }}</div>
            </mdui-card>

            <div class="detail_actions">
                <mdui-button variant="text" icon="arrow_back--outlined" @click="$router.push({ name: 'news' })">{{
                    $t('news.back') }}</mdui-button>
                <mdui-button variant="tonal" icon="edit--outlined"
                    @click="$router.push({ name: 'newsEdit', query: { id: article.id } })">{{ $t('news.editThis')
                    }}</mdui-button>
            </div>

            <mdui-card class="detail_content">
                <div ref="content" class="markdown_body" v-html="html"></div>
            </mdui-card>
        </template>

        <mdui-card v-else class="empty_card">
            <mdui-icon name="info--outlined"></mdui-icon>
            <p>{{ $t('news.notFound') }}</p>
            <mdui-button variant="tonal" @click="$router.push({ name: 'news' })">{{ $t('news.back') }}</mdui-button>
        </mdui-card>
    </div>
</template>

<style scoped>
.detail_cover {
    width: 100%;
    margin-bottom: 8px;
}

.detail_cover img {
    display: block;
    width: 100%;
    max-height: 360px;
    object-fit: cover;
    border-radius: var(--card-border-radius);
    background: var(--text-color-oc-up);
}

.detail_title {
    font-size: 24px;
    font-weight: bold;
    color: var(--text-color);
    font-family: 'Poppins SemiBold';
    line-height: 1.4;
}

.detail_meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 8px;
    font-size: 13px;
    color: var(--text-color-oc);
}

.detail_meta span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.detail_meta mdui-icon {
    font-size: 16px;
}

.detail_tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
}

.detail_summary {
    margin-top: 8px;
    padding: 10px 14px;
    border-radius: var(--card-border-radius);
    background: var(--theme-color-2-oc-up);
    font-size: 14px;
    color: var(--text-color-oc);
}

.detail_actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.detail_content {
    padding: 24px;
    width: 100%;
}

.empty_card {
    padding: 40px 20px;
    margin-bottom: 8px;
    text-align: center;
    color: var(--text-color-oc);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.empty_card mdui-icon {
    font-size: 40px;
    opacity: 0.5;
}

.empty_card p {
    margin: 0;
    font-size: 14px;
}
</style>
