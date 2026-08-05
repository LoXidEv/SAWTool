import fs from 'fs/promises';
import path from 'path';

// ====================== 在这里修改你的配置 ======================
const CONFIG = {
    // 目标文件夹，改成你的实际文件夹路径
    dir: "./public/image/skins/prefabricated",
    // 是否先预览（true=只打印不修改；false=执行真正重命名）
    dryRun: false,

    // 模式1：序号重命名（像 Prefabricated1.webp, Prefabricated2.webp）
    enableIndexRename: true,
    prefix: "Prefabricated",
    startIndex: 1,
    // 只处理这些后缀
    allowExt: [".webp"],

    // 模式2：字符串替换，不需要就 keep false
    enableReplace: false,
    replaceFrom: "old",
    replaceTo: "new"
};
// ================================================================

async function main() {
    const folder = path.resolve(CONFIG.dir);
    console.log(`📂 目标目录: ${folder}`);
    const entries = await fs.readdir(folder, { withFileTypes: true });

    let index = CONFIG.startIndex;
    const todo = [];

    for (const entry of entries) {
        // 跳过子文件夹，只处理文件
        if (entry.isDirectory()) continue;
        const oldName = entry.name;
        const ext = path.extname(oldName).toLowerCase();

        if (!CONFIG.allowExt.includes(ext)) continue;

        let newName;
        if (CONFIG.enableIndexRename) {
            newName = `${CONFIG.prefix}${index}${ext}`;
            index++;
        } else if (CONFIG.enableReplace) {
            newName = oldName.replaceAll(CONFIG.replaceFrom, CONFIG.replaceTo);
        } else {
            continue;
        }

        if (oldName === newName) continue;

        const oldPath = path.join(folder, oldName);
        const newPath = path.join(folder, newName);
        todo.push({ oldPath, newPath, oldName, newName });
    }

    if (todo.length === 0) {
        console.log("✅ 没有需要重命名的文件");
        return;
    }

    console.log("\n======= 待修改列表 =======");
    todo.forEach(item => {
        console.log(`${item.oldName}  →  ${item.newName}`);
    });
    console.log(`\n总共 ${todo.length} 个文件`);

    if (CONFIG.dryRun) {
        console.log("\n⚠️ 当前是预览模式，没有实际修改。把 dryRun 设置为 false 执行重命名！");
        return;
    }

    // 执行重命名
    for (const item of todo) {
        await fs.rename(item.oldPath, item.newPath);
    }
    console.log("\n✅ 全部重命名完成！");
}

main().catch(err => {
    console.error("❌出错：", err);
});