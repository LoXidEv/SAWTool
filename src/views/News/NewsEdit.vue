<script>
import { nextTick } from 'vue';
import { snackbar } from 'mdui/functions/snackbar.js';
import newsData from '@/assets/configdata/newsData.json';
import { renderMarkdown, slugify } from '@/utils/markdown';
import { getFile, putFile, createBranch, createPullRequest, newFileUrl } from '@/utils/github';

const STORAGE_KEY = 'newsGitHubSettings';

function today() {
    return new Date().toISOString().slice(0, 10);
}

function emptyForm() {
    return {
        id: '',
        title: '',
        author: '',
        date: today(),
        tags: '',
        summary: '',
        cover: '',
        content: ''
    };
}

export default {
    data() {
        return {
            articles: newsData.articles,
            form: emptyForm(),
            editingId: null,
            submitting: false,
            status: null,
            github: {
                owner: 'LoXidEv',
                repo: 'SAWTool',
                branch: 'main',
                path: 'src/assets/configdata/newsData.json',
                token: '',
                usePr: false
            }
        };
    },
    computed: {
        previewHtml() {
            return renderMarkdown(this.form.content);
        },
        tagsArray() {
            return this.form.tags
                .split(',')
                .map(t => t.trim())
                .filter(Boolean);
        },
        articleObject() {
            return {
                id: (this.form.id || slugify(this.form.title)).trim(),
                title: this.form.title.trim(),
                author: this.form.author.trim(),
                date: this.form.date || today(),
                tags: this.tagsArray,
                cover: this.form.cover.trim(),
                summary: this.form.summary.trim(),
                content: this.form.content
            };
        },
        mergedArticles() {
            const list = this.articles.map(a => ({ ...a }));
            const target = this.articleObject;
            if (this.editingId) {
                const idx = list.findIndex(a => a.id === this.editingId);
                if (idx !== -1) list.splice(idx, 1, target);
                else list.unshift(target);
            } else {
                list.unshift(target);
            }
            return list;
        },
        fullJson() {
            return JSON.stringify({ articles: this.mergedArticles }, null, 2);
        }
    },
    watch: {
        github: {
            deep: true,
            handler(val) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
            }
        }
    },
    mounted() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                this.github = { ...this.github, ...JSON.parse(saved) };
            } catch (e) {
                /* 忽略损坏的本地配置 */
            }
        }
        if (this.$route.query.id) {
            this.loadArticle(this.$route.query.id);
        }
    },
    methods: {
        loadArticle(id) {
            const article = this.articles.find(a => a.id === id);
            if (!article) return;
            this.editingId = article.id;
            this.form = {
                id: article.id,
                title: article.title || '',
                author: article.author || '',
                date: article.date || today(),
                tags: (article.tags || []).join(', '),
                summary: article.summary || '',
                cover: article.cover || '',
                content: article.content || ''
            };
        },
        newArticle() {
            this.editingId = null;
            this.form = emptyForm();
            this.status = null;
        },
        onSelectArticle(id) {
            if (id === '__new__') {
                this.newArticle();
            } else {
                this.loadArticle(id);
            }
        },
        insertMarkdown(before, after = '', placeholder = '') {
            const field = this.$refs.contentField;
            const ta = field && field.shadowRoot ? field.shadowRoot.querySelector('textarea') : null;
            const value = this.form.content || '';
            if (!ta) {
                this.form.content = value + before + placeholder + after;
                return;
            }
            const start = ta.selectionStart ?? value.length;
            const end = ta.selectionEnd ?? value.length;
            const selected = value.slice(start, end) || placeholder;
            this.form.content = value.slice(0, start) + before + selected + after + value.slice(end);
            nextTick(() => {
                const newTa = field.shadowRoot.querySelector('textarea');
                if (newTa) {
                    const pos = start + before.length + selected.length;
                    newTa.focus();
                    newTa.setSelectionRange(pos, pos);
                }
            });
        },
        validate() {
            if (!this.form.title.trim()) {
                snackbar({ message: this.$t('news.edit.needTitle') });
                return false;
            }
            if (!this.form.content.trim()) {
                snackbar({ message: this.$t('news.edit.needContent') });
                return false;
            }
            const id = (this.form.id || slugify(this.form.title)).trim();
            if (!this.editingId && this.articles.some(a => a.id === id)) {
                snackbar({ message: this.$t('news.edit.idExists') });
                return false;
            }
            return true;
        },
        async copyText(text, okMessage) {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const ta = document.createElement('textarea');
                    ta.value = text;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }
                snackbar({ message: okMessage });
            } catch (e) {
                snackbar({ message: this.$t('news.edit.copyFailed') });
            }
        },
        copyMarkdown() {
            this.copyText(this.form.content, this.$t('news.edit.copiedMarkdown'));
        },
        copyJson() {
            this.copyText(this.fullJson, this.$t('news.edit.copiedJson'));
        },
        downloadJson() {
            const blob = new Blob([this.fullJson], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'newsData.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 0);
        },
        openNewFile() {
            const { owner, repo, branch, path } = this.github;
            window.open(newFileUrl({ owner, repo, branch, path }), '_blank');
        },
        clearToken() {
            this.github.token = '';
            snackbar({ message: this.$t('news.edit.tokenCleared') });
        },
        async submitToGitHub() {
            if (!this.validate()) return;
            const { owner, repo, branch, path, token, usePr } = this.github;
            if (!owner || !repo || !path || !token) {
                snackbar({ message: this.$t('news.edit.needToken') });
                return;
            }

            this.submitting = true;
            this.status = null;
            try {
                const slug = this.articleObject.id;
                const commitMessage = `docs(news): ${this.editingId ? 'update' : 'add'} ${slug}`;
                let targetBranch = branch;
                let prUrl = '';

                if (usePr) {
                    targetBranch = `news/${slug}-${Date.now().toString(36)}`;
                    await createBranch({ owner, repo, newBranch: targetBranch, fromBranch: branch, token });
                }

                const meta = await getFile({ owner, repo, path, ref: branch, token });
                await putFile({
                    owner,
                    repo,
                    path,
                    content: this.fullJson,
                    message: commitMessage,
                    branch: targetBranch,
                    sha: meta ? meta.sha : undefined,
                    token
                });

                let fileUrl = `https://github.com/${owner}/${repo}/blob/${targetBranch}/${path}`;

                if (usePr) {
                    const pr = await createPullRequest({
                        owner,
                        repo,
                        head: targetBranch,
                        base: branch,
                        title: commitMessage,
                        body: `由 SAWTool 资讯编辑器提交：**${this.articleObject.title}**`,
                        token
                    });
                    prUrl = pr.html_url;
                }

                this.status = {
                    type: 'success',
                    message: usePr ? this.$t('news.edit.prCreated') : this.$t('news.edit.committed'),
                    url: prUrl || fileUrl
                };
                snackbar({ message: this.$t('news.edit.submitSuccess') });
            } catch (e) {
                this.status = { type: 'error', message: (e && e.message) || String(e), url: '' };
                snackbar({ message: this.$t('news.edit.submitFailed') });
            } finally {
                this.submitting = false;
            }
        }
    }
}
</script>

<template>
    <div class="animate__animated animate__fadeIn">
        <mdui-card class="card">
            <div class="card_title">{{ $t('news.edit.title') }}</div>
            <div class="card_content">{{ $t('news.edit.content') }}</div>
            <div class="card_actions">
                <mdui-button variant="text" icon="arrow_back--outlined" @click="$router.push({ name: 'news' })">{{
                    $t('news.back') }}</mdui-button>
            </div>
        </mdui-card>

        <!-- 文章元数据 -->
        <mdui-card class="section_card">
            <div class="section_header">
                <div class="header_content">
                    <mdui-icon name="article--outlined"></mdui-icon>
                    <div>{{ $t('news.edit.meta') }}</div>
                </div>
                <mdui-select class="article_select" variant="outlined" :value="editingId || '__new__'"
                    @change="onSelectArticle($event.target.value)">
                    <mdui-menu-item value="__new__">{{ $t('news.edit.newArticle') }}</mdui-menu-item>
                    <mdui-menu-item v-for="a in articles" :key="a.id" :value="a.id">{{ a.title }}
                    </mdui-menu-item>
                </mdui-select>
            </div>

            <div class="meta_grid">
                <mdui-text-field variant="outlined" :label="$t('news.edit.fieldTitle')" :value="form.title"
                    @input="form.title = $event.target.value"></mdui-text-field>
                <mdui-text-field variant="outlined" :label="$t('news.edit.fieldId')" :value="form.id"
                    :helper="$t('news.edit.fieldIdHelper')" @input="form.id = $event.target.value"></mdui-text-field>
                <mdui-text-field variant="outlined" :label="$t('news.edit.fieldAuthor')" :value="form.author"
                    @input="form.author = $event.target.value"></mdui-text-field>
                <mdui-text-field variant="outlined" type="date" :label="$t('news.edit.fieldDate')" :value="form.date"
                    @input="form.date = $event.target.value"></mdui-text-field>
                <mdui-text-field variant="outlined" :label="$t('news.edit.fieldTags')" :value="form.tags"
                    :helper="$t('news.edit.fieldTagsHelper')"
                    @input="form.tags = $event.target.value"></mdui-text-field>
                <mdui-text-field variant="outlined" :label="$t('news.edit.fieldCover')" :value="form.cover"
                    @input="form.cover = $event.target.value"></mdui-text-field>
                <mdui-text-field variant="outlined" class="meta_full" :label="$t('news.edit.fieldSummary')"
                    :value="form.summary" rows="2" @input="form.summary = $event.target.value"></mdui-text-field>
            </div>
        </mdui-card>

        <!-- Markdown 编辑 + 实时预览 -->
        <mdui-card class="section_card">
            <div class="section_header">
                <mdui-icon name="edit--outlined"></mdui-icon>
                <span>{{ $t('news.edit.editor') }}</span>
                <div class="editor_toolbar">
                    <mdui-button-icon icon="title--outlined" :title="$t('news.edit.tbTitle')"
                        @click="insertMarkdown('## ', '', '标题')"></mdui-button-icon>
                    <mdui-button-icon icon="format_bold--outlined" :title="$t('news.edit.tbBold')"
                        @click="insertMarkdown('**', '**', '加粗文字')"></mdui-button-icon>
                    <mdui-button-icon icon="format_italic--outlined" :title="$t('news.edit.tbItalic')"
                        @click="insertMarkdown('*', '*', '斜体文字')"></mdui-button-icon>
                    <mdui-button-icon icon="format_quote--outlined" :title="$t('news.edit.tbQuote')"
                        @click="insertMarkdown('> ', '', '引用内容')"></mdui-button-icon>
                    <mdui-button-icon icon="format_list_bulleted--outlined" :title="$t('news.edit.tbList')"
                        @click="insertMarkdown('- ', '', '列表项')"></mdui-button-icon>
                    <mdui-button-icon icon="code--outlined" :title="$t('news.edit.tbCode')"
                        @click="insertMarkdown('`', '`', 'code')"></mdui-button-icon>
                    <mdui-button-icon icon="link--outlined" :title="$t('news.edit.tbLink')"
                        @click="insertMarkdown('[', '](https://)', '链接文字')"></mdui-button-icon>
                    <mdui-button-icon icon="image--outlined" :title="$t('news.edit.tbImage')"
                        @click="insertMarkdown('![', '](https://)', '图片描述')"></mdui-button-icon>
                </div>
            </div>

            <div class="editor_grid">
                <div class="editor_pane">
                    <div class="pane_label">{{ $t('news.edit.markdown') }}</div>
                    <mdui-text-field ref="contentField" variant="outlined" rows="22" :value="form.content"
                        :placeholder="$t('news.edit.markdownPlaceholder')"
                        @input="form.content = $event.target.value"></mdui-text-field>
                </div>
                <div class="editor_pane">
                    <div class="pane_label">{{ $t('news.edit.preview') }}</div>
                    <div class="preview_box">
                        <div v-if="form.content" class="markdown_body" v-html="previewHtml"></div>
                        <div v-else class="preview_empty">{{ $t('news.edit.previewEmpty') }}</div>
                    </div>
                </div>
            </div>
        </mdui-card>

        <!-- GitHub 提交 -->
        <mdui-card class="section_card">
            <div class="section_header">
                <mdui-icon name="cloud_upload--outlined"></mdui-icon>
                <span>{{ $t('news.edit.github') }}</span>
            </div>
            <div class="github_hint">{{ $t('news.edit.githubHint') }}</div>

            <div class="meta_grid">
                <mdui-text-field variant="outlined" :label="$t('news.edit.owner')" :value="github.owner"
                    @input="github.owner = $event.target.value"></mdui-text-field>
                <mdui-text-field variant="outlined" :label="$t('news.edit.repo')" :value="github.repo"
                    @input="github.repo = $event.target.value"></mdui-text-field>
                <mdui-text-field variant="outlined" :label="$t('news.edit.branch')" :value="github.branch"
                    @input="github.branch = $event.target.value"></mdui-text-field>
                <mdui-text-field variant="outlined" :label="$t('news.edit.path')" :value="github.path"
                    @input="github.path = $event.target.value"></mdui-text-field>
                <mdui-text-field variant="outlined" class="meta_full" type="password" toggle-password
                    :label="$t('news.edit.token')" :value="github.token" :helper="$t('news.edit.tokenHelper')"
                    @input="github.token = $event.target.value"></mdui-text-field>
            </div>

            <div class="github_options">
                <div class="switch_field">
                    <mdui-switch :checked="github.usePr" @change="github.usePr = $event.target.checked"></mdui-switch>
                    <span class="switch_label" @click="github.usePr = !github.usePr">{{ $t('news.edit.usePr') }}</span>
                </div>
                <mdui-button variant="text" icon="clear--outlined" @click="clearToken">{{ $t('news.edit.clearToken')
                    }}</mdui-button>
            </div>

            <div class="github_actions">
                <mdui-button variant="filled" icon="cloud_upload--outlined" :disabled="submitting"
                    @click="submitToGitHub">{{ submitting ? $t('news.edit.submitting') : $t('news.edit.submit')
                    }}</mdui-button>
                <mdui-button variant="tonal" icon="content_copy--outlined" @click="copyMarkdown">{{
                    $t('news.edit.copyMarkdown') }}</mdui-button>
                <mdui-button variant="tonal" icon="content_copy--outlined" @click="copyJson">{{ $t('news.edit.copyJson')
                }}</mdui-button>
                <mdui-button variant="tonal" icon="download--outlined" @click="downloadJson">{{
                    $t('news.edit.downloadJson') }}</mdui-button>
                <mdui-button variant="outlined" icon="open_in_new--outlined" @click="openNewFile">{{
                    $t('news.edit.openNewFile') }}</mdui-button>
            </div>

            <mdui-card v-if="status" variant="filled" class="status_card"
                :class="status.type === 'success' ? 'status_ok' : 'status_err'">
                <mdui-icon :name="status.type === 'success' ? 'check_circle--outlined' : 'error--outlined'"></mdui-icon>
                <div class="status_body">
                    <div>{{ status.message }}</div>
                    <a v-if="status.url" :href="status.url" target="_blank" rel="noopener">{{ status.url }}</a>
                </div>
            </mdui-card>

            <mdui-collapse>
                <mdui-collapse-item :header="$t('news.edit.jsonPreview')">
                    <pre class="json_preview">{{ fullJson }}</pre>
                </mdui-collapse-item>
            </mdui-collapse>
        </mdui-card>
    </div>
</template>

<style scoped>
.header_content {
    display: flex;
    align-items: center;
    gap: 8px;
    word-break: keep-all;
}

.section_card {
    margin-bottom: 8px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.section_header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: bold;
    color: var(--text-color);
    font-family: 'Poppins SemiBold';
}

.section_header>span {
    flex: 1;
    min-width: 0;
}

.article_select {
    min-width: 220px;
}

.meta_grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.meta_full {
    grid-column: 1 / -1;
}

.editor_toolbar {
    display: flex;
    align-items: center;
    gap: 2px;
}

.editor_grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    align-items: stretch;
}

.editor_pane {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
}

.pane_label {
    font-size: 13px;
    color: var(--text-color-oc);
}

.preview_box {
    flex: 1;
    min-height: 320px;
    max-height: 640px;
    overflow-y: auto;
    padding: 16px;
    border: 1px solid var(--border-color);
    border-radius: var(--card-border-radius);
    background: #fff;
}

.preview_empty {
    color: var(--text-color-oc);
    font-size: 13px;
    text-align: center;
    padding: 40px 0;
}

.github_hint {
    font-size: 13px;
    color: var(--text-color-oc);
    line-height: 1.6;
    padding: 10px 14px;
    border-radius: var(--card-border-radius);
    background: var(--theme-color-2-oc-up);
}

.github_options {
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}

.github_actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.status_card {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    font-size: 13px;
}

.status_ok {
    background: rgba(0, 200, 83, 0.12);
    color: #00893a;
}

.status_err {
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
}

.status_body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    word-break: break-all;
}

.status_body a {
    color: inherit;
}

.json_preview {
    margin: 0;
    padding: 12px;
    font-size: 12px;
    line-height: 1.5;
    max-height: 320px;
    overflow: auto;
    font-family: 'Consolas', 'Menlo', monospace;
    white-space: pre-wrap;
    word-break: break-all;
    color: var(--text-color-oc);
}

.switch_field {
    display: flex;
    align-items: center;
    gap: 8px;
}

.switch_label {
    font-size: 14px;
    color: var(--text-color);
    cursor: pointer;
    user-select: none;
}

@media (max-width: 900px) {

    .meta_grid,
    .editor_grid {
        grid-template-columns: 1fr;
    }
}
</style>
