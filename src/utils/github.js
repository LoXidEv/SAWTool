const API_BASE = 'https://api.github.com';

/**
 * UTF-8 安全的 Base64 编码
 * @param {string} str
 * @returns {string}
 */
function encodeBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach(b => { binary += String.fromCharCode(b); });
    return btoa(binary);
}

/**
 * UTF-8 安全的 Base64 解码
 * @param {string} base64
 * @returns {string}
 */
function decodeBase64(base64) {
    const binary = atob(String(base64).replace(/\n/g, ''));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

function authHeaders(token) {
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
    };
}

async function request(token, path, options = {}) {
    const res = await fetch(API_BASE + path, {
        ...options,
        headers: { ...authHeaders(token), ...(options.headers || {}) },
    });

    if (res.status === 204) return null;

    let data = null;
    const text = await res.text();
    if (text) {
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = { message: text };
        }
    }

    if (!res.ok) {
        const message = data && data.message ? data.message : `请求失败 (${res.status})`;
        const error = new Error(message);
        error.status = res.status;
        throw error;
    }
    return data;
}

/**
 * 读取仓库中某个文件的内容与 sha，文件不存在时返回 null
 */
export async function getFile({ owner, repo, path, ref, token }) {
    try {
        const query = ref ? `?ref=${encodeURIComponent(ref)}` : '';
        const data = await request(token, `/repos/${owner}/${repo}/contents/${path}${query}`, { method: 'GET' });
        return {
            sha: data.sha,
            content: data.content ? decodeBase64(data.content) : '',
        };
    } catch (e) {
        if (e.status === 404) return null;
        throw e;
    }
}

/**
 * 新建或更新仓库中的文件
 */
export async function putFile({ owner, repo, path, content, message, branch, sha, token }) {
    const body = {
        message,
        content: encodeBase64(content),
        branch,
    };
    if (sha) body.sha = sha;

    return request(token, `/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

/**
 * 获取分支最新 commit sha，不存在时返回 null
 */
export async function getRef({ owner, repo, branch, token }) {
    try {
        const data = await request(token, `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`, { method: 'GET' });
        return data.object.sha;
    } catch (e) {
        if (e.status === 404) return null;
        throw e;
    }
}

/**
 * 基于 fromBranch 新建分支 newBranch
 */
export async function createBranch({ owner, repo, newBranch, fromBranch, token }) {
    const sha = await getRef({ owner, repo, branch: fromBranch, token });
    if (!sha) throw new Error(`找不到基础分支：${fromBranch}`);
    await request(token, `/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha }),
    });
    return sha;
}

/**
 * 创建 Pull Request
 */
export async function createPullRequest({ owner, repo, head, base, title, body, token }) {
    return request(token, `/repos/${owner}/${repo}/pulls`, {
        method: 'POST',
        body: JSON.stringify({ title, head, base, body }),
    });
}

/**
 * 生成 GitHub 新建文件的深链接
 */
export function newFileUrl({ owner, repo, branch, path }) {
    const params = new URLSearchParams({ filename: path });
    return `https://github.com/${owner}/${repo}/new/${branch}?${params.toString()}`;
}
