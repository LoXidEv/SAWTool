import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const newsData = require('../src/assets/configdata/newsData.json');

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const MAX_LIMIT = 50;

function getQuery(req) {
    const url = new URL(req.url || '/', 'http://localhost');
    return url.searchParams;
}

/**
 * 生成文章链接所用的站点根地址：优先环境变量 SITE_URL，其次 ?site= 参数，最后从请求头推断
 */
function getBaseUrl(req, query) {
    if (process.env.SITE_URL) return String(process.env.SITE_URL).replace(/\/+$/, '');
    const candidate = query.get('site');
    if (candidate) return candidate.replace(/\/+$/, '');
    const headers = req.headers || {};
    const protoHeader = String(headers['x-forwarded-proto'] || '').split(',')[0].trim();
    const host = String(headers['x-forwarded-host'] || headers.host || '').split(',')[0].trim();
    if (!host) return '';
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
    const proto = protoHeader || (isLocal ? 'http' : 'https');
    return `${proto}://${host}`;
}

function sortByDate(list) {
    return [...list].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

function toListItem(article, baseUrl) {
    return {
        id: article.id,
        title: article.title,
        author: article.author || '',
        date: article.date || '',
        tags: article.tags || [],
        cover: article.cover || '',
        summary: article.summary || '',
        url: baseUrl ? `${baseUrl}/news/detail/${encodeURIComponent(article.id)}` : '',
    };
}

function toTextDigest(list, baseUrl, total) {
    const lines = [`SAWTool 资讯（共 ${total} 条）`, ''];
    list.forEach((article, index) => {
        lines.push(`${index + 1}. ${article.title}（${article.date}${article.author ? ' · ' + article.author : ''}）`);
        if (article.summary) lines.push(`   ${article.summary}`);
        if (baseUrl) lines.push(`   ${baseUrl}/news/detail/${encodeURIComponent(article.id)}`);
        lines.push('');
    });
    return lines.join('\n').trim();
}

function send(res, status, body, contentType = 'application/json; charset=utf-8') {
    res.statusCode = status;
    Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
    res.setHeader('Content-Type', contentType);
    res.end(body);
}

function sendJson(res, status, data) {
    send(res, status, JSON.stringify(data, null, 2));
}

export default function handler(req, res) {
    if (req.method === 'OPTIONS') {
        send(res, 204, '');
        return;
    }
    if (req.method !== 'GET') {
        sendJson(res, 405, { error: 'Method Not Allowed' });
        return;
    }

    try {
        const query = getQuery(req);

        // 可选访问令牌：配置了环境变量 NEWS_API_TOKEN 时，需通过 ?token= 或 Authorization: Bearer 传入
        const requiredToken = process.env.NEWS_API_TOKEN;
        if (requiredToken) {
            const headerToken = String((req.headers && req.headers.authorization) || '').replace(/^Bearer\s+/i, '');
            const provided = query.get('token') || headerToken;
            if (provided !== requiredToken) {
                sendJson(res, 401, { error: '无效的访问令牌' });
                return;
            }
        }

        const baseUrl = getBaseUrl(req, query);
        const format = (query.get('format') || 'json').toLowerCase();
        const full = ['1', 'true', 'yes'].includes(String(query.get('full') || '').toLowerCase());
        const id = query.get('id');

        // 单篇文章
        if (id) {
            const article = newsData.articles.find(item => item.id === id);
            if (!article) {
                sendJson(res, 404, { error: `未找到文章：${id}` });
                return;
            }
            const item = { ...toListItem(article, baseUrl), content: article.content || '' };
            if (format === 'text') {
                const meta = [item.date, item.author].filter(Boolean).join(' · ');
                send(res, 200, `${item.title}\n${meta}\n${item.url}\n\n${item.content}`, 'text/plain; charset=utf-8');
            } else {
                sendJson(res, 200, { article: item });
            }
            return;
        }

        // 列表
        let list = sortByDate(newsData.articles);

        const tag = query.get('tag');
        if (tag) {
            list = list.filter(article => (article.tags || []).some(t => String(t).toLowerCase() === tag.toLowerCase()));
        }

        const keyword = query.get('q');
        if (keyword) {
            const normalized = keyword.toLowerCase();
            list = list.filter(article => `${article.title || ''} ${article.summary || ''}`.toLowerCase().includes(normalized));
        }

        const total = list.length;
        const offset = Math.max(0, Number.parseInt(query.get('offset'), 10) || 0);
        const limitRaw = Number.parseInt(query.get('limit'), 10);
        const limit = Number.isNaN(limitRaw) ? MAX_LIMIT : Math.min(Math.max(limitRaw, 0), MAX_LIMIT);
        list = list.slice(offset, offset + limit);

        if (format === 'text') {
            send(res, 200, toTextDigest(list, baseUrl, total), 'text/plain; charset=utf-8');
            return;
        }

        const articles = list.map(article => (
            full
                ? { ...toListItem(article, baseUrl), content: article.content || '' }
                : toListItem(article, baseUrl)
        ));

        sendJson(res, 200, { total, count: articles.length, offset, limit, articles });
    } catch (error) {
        sendJson(res, 500, { error: (error && error.message) || String(error) });
    }
}
