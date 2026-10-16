import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({
    gfm: true,
    breaks: true,
});

/**
 * 将 Markdown 渲染为安全的 HTML
 * @param {string} markdown
 * @returns {string}
 */
export function renderMarkdown(markdown) {
    if (!markdown) return '';
    const html = marked.parse(markdown);
    return DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
        ADD_ATTR: ['target', 'rel'],
    });
}

/**
 * 根据标题生成 URL 友好的 id
 * @param {string} title
 * @returns {string}
 */
export function slugify(title) {
    const base = String(title || '')
        .trim()
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return base || 'article-' + Date.now();
}
