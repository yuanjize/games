#!/usr/bin/env node

/**
 * 资源哈希生成脚本
 * 为 CSS 和 JS 文件添加内容哈希，用于缓存破坏
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_DIR = path.join(__dirname, '../dist');

/**
 * 生成文件内容的 SHA256 哈希
 */
function generateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);
}

/**
 * 处理目录中的所有文件
 */
function processDirectory(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`目录不存在: ${dir}`);
        return;
    }

    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            processDirectory(fullPath);
            continue;
        }

        // 只处理 CSS 和 JS 文件
        if (!file.name.match(/\.(css|js)$/)) {
            continue;
        }

        // 跳过已有哈希的文件
        if (file.name.includes('-[hash]')) {
            continue;
        }

        try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const hash = generateHash(content);

            // 重命名文件
            const ext = path.extname(file.name);
            const baseName = path.basename(file.name, ext);
            const newName = `${baseName}-[hash]${ext}`;
            const newPath = path.join(dir, newName);

            // 替换哈希占位符
            const actualName = `${baseName}-${hash}${ext}`;
            const actualPath = path.join(dir, actualName);

            fs.renameSync(fullPath, actualPath);
            console.log(`📝 ${file.name} → ${actualName}`);

            // 更新 HTML 中的引用
            updateHtmlReferences(dir, baseName + ext, actualName);

        } catch (error) {
            console.error(`处理文件失败: ${file.name}`, error.message);
        }
    }
}

/**
 * 更新 HTML 文件中的资源引用
 */
function updateHtmlReferences(dir, oldName, newName) {
    const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

    htmlFiles.forEach(htmlFile => {
        const htmlPath = path.join(dir, htmlFile);
        let content = fs.readFileSync(htmlPath, 'utf8');

        // 替换 CSS 引用
        content = content.replace(
            new RegExp(`href=["']\\.\\./[^"']*${oldName.replace('.', '\\.')}["']`, 'g'),
            (match) => match.replace(oldName, newName)
        );

        // 替换 JS 引用
        content = content.replace(
            new RegExp(`src=["']\\.\\./[^"']*${oldName.replace('.', '\\.')}["']`, 'g'),
            (match) => match.replace(oldName, newName)
        );

        fs.writeFileSync(htmlPath, content);
    });
}

/**
 * 生成资源清单
 */
function generateAssetManifest(dir) {
    const manifest = {};

    function collectFiles(directory, basePath = '') {
        const files = fs.readdirSync(directory, { withFileTypes: true });

        for (const file of files) {
            const fullPath = path.join(directory, file.name);
            const relativePath = path.join(basePath, file.name);

            if (file.isDirectory()) {
                collectFiles(fullPath, relativePath);
            } else if (file.name.match(/\.(css|js|png|jpg|jpeg|svg|webp|woff2?)$/)) {
                const stats = fs.statSync(fullPath);
                manifest[relativePath] = {
                    size: stats.size,
                    hash: generateHash(fs.readFileSync(fullPath))
                };
            }
        }
    }

    collectFiles(dir);

    const manifestPath = path.join(dir, 'asset-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('📋 已生成资源清单: asset-manifest.json');
}

// 主函数
function main() {
    console.log('🔐 开始生成资源哈希...\n');

    if (!fs.existsSync(DIST_DIR)) {
        console.error('❌ dist 目录不存在，请先运行构建');
        process.exit(1);
    }

    processDirectory(DIST_DIR);
    generateAssetManifest(DIST_DIR);

    console.log('\n✅ 资源哈希生成完成！');
}

main();
