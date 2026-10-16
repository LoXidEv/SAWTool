<script>
import newsData from '@/assets/configdata/newsData.json';

export default {
    data() {
        return {
            articles: newsData.articles,
            keyword: '',
            activeTag: ''
        };
    },
    computed: {
        tags() {
            const set = new Set();
            this.articles.forEach(a => (a.tags || []).forEach(t => set.add(t)));
            return Array.from(set);
        },
        filteredArticles() {
            const kw = this.keyword.trim().toLowerCase();
            return this.articles.filter(a => {
                const matchTag = !this.activeTag || (a.tags || []).includes(this.activeTag);
                const matchKw = !kw
                    || String(a.title || '').toLowerCase().includes(kw)
                    || String(a.summary || '').toLowerCase().includes(kw);
                return matchTag && matchKw;
            });
        }
    },
    methods: {
        openArticle(article) {
            this.$router.push({ name: 'newsDetail', params: { id: article.id } });
        }
    }
}
</script>

<template>
    <div class="animate__animated animate__fadeIn">
        <mdui-card class="card">
            <div class="card_title">{{ $t('news.title') }}</div>
            <div class="card_content">{{ $t('news.content') }}</div>
            <div class="card_actions">
                <mdui-button variant="filled" icon="note_add--outlined" @click="$router.push({ name: 'newsEdit' })">{{
                    $t('news.publish') }}</mdui-button>
                <mdui-button variant="tonal" icon="smart_toy--outlined"
                    @click="$router.push({ name: 'newsApi' })">{{ $t('news.apiEntry') }}</mdui-button>
            </div>
        </mdui-card>

        <mdui-card class="filter_card">
            <mdui-text-field class="filter_search" variant="outlined" clearable :label="$t('news.search')"
                icon="search--outlined" :value="keyword"
                @input="keyword = $event.target.value"></mdui-text-field>
            <div class="filter_tags">
                <mdui-chip variant="filter" selectable :selected="activeTag === ''" @click="activeTag = ''">{{ $t('news.all')
                    }}</mdui-chip>
                <mdui-chip v-for="tag in tags" :key="tag" variant="filter" selectable :selected="activeTag === tag"
                    @click="activeTag = tag">{{ tag }}</mdui-chip>
            </div>
        </mdui-card>

        <div v-if="filteredArticles.length > 0" class="news_list">
            <mdui-card v-for="article in filteredArticles" :key="article.id" variant="elevated" class="news_item">
                <div v-if="article.cover" class="news_item_cover">
                    <img :src="article.cover" alt="" loading="lazy" />
                </div>
                <div class="news_item_header">
                    <div class="news_item_title">{{ article.title }}</div>
                    <div class="news_item_meta">
                        <span><mdui-icon name="person--outlined"></mdui-icon>{{ article.author || $t('news.anonymous')
                            }}</span>
                        <span><mdui-icon name="event--outlined"></mdui-icon>{{ article.date }}</span>
                    </div>
                </div>
                <div class="news_item_tags">
                    <mdui-chip v-for="tag in article.tags" :key="tag" variant="assist">{{ tag }}</mdui-chip>
                </div>
                <div class="news_item_summary">{{ article.summary }}</div>
                <div class="news_item_actions">
                    <mdui-button variant="text" end-icon="arrow_forward--outlined" @click="openArticle(article)">{{
                        $t('news.readMore') }}</mdui-button>
                </div>
            </mdui-card>
        </div>
        <mdui-card v-else class="empty_card">
            <mdui-icon name="inbox--outlined"></mdui-icon>
            <p>{{ $t('news.empty') }}</p>
        </mdui-card>
    </div>
</template>

<style scoped>
.filter_card {
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.filter_tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.news_list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 8px;
    margin: 8px 0;
}

.news_item {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
}

.news_item_cover {
    width: 100%;
}

.news_item_cover img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: var(--card-border-radius);
    background: var(--text-color-oc-up);
}

.news_item_header {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.news_item_title {
    font-size: 18px;
    font-weight: bold;
    color: var(--text-color);
    font-family: 'Poppins SemiBold';
    line-height: 1.4;
}

.news_item_meta {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    font-size: 12px;
    color: var(--text-color-oc);
}

.news_item_meta span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.news_item_meta mdui-icon {
    font-size: 15px;
}

.news_item_tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.news_item_summary {
    font-size: 14px;
    color: var(--text-color-oc);
    line-height: 1.6;
    flex: 1;
}

.news_item_actions {
    display: flex;
    justify-content: flex-end;
}

.empty_card {
    margin-top: 8px;
    padding: 40px 20px;
    text-align: center;
    color: var(--text-color-oc);
}

.empty_card mdui-icon {
    font-size: 40px;
    opacity: 0.5;
}

.empty_card p {
    margin: 8px 0 0;
    font-size: 14px;
}
</style>
