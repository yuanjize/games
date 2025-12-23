#!/usr/bin/env node

/**
 * Sitemap 生成脚本
 * 为搜索引擎生成 XML 站点地图
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 游戏列表
const GAMES = [
    { id: 'space-shooter', folder: 'space-shooter' },
    { id: 'platform-jumper', folder: 'platform-jumper' },
    { id: 'fruit-2048', folder: 'fruit-2048' },
    { id: 'memory-cards', folder: 'memory-cards' },
    { id: 'snake-game', folder: 'snake-game' },
    { id: 'brick-breaker', folder: 'brick-breaker' },
    { id: 'tic-tac-toe', folder: 'tic-tac-toe' },
    { id: 'minesweeper', folder: 'minesweeper' },
    { id: 'typing-test', folder: 'typing-test' },
    { id: 'physics-pinball', folder: 'physics-pinball' }
];

// 基础 URL（部署时需要替换为实际域名）
const BASE_URL = 'https://your-domain.pages.dev';

/**
 * 生成 XML Sitemap
 */
function generateSitemap() {
    const now = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- 主页 -->
    <url>
        <loc>${BASE_URL}/</loc>
        <lastmod>${now}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
`;

    // 添加游戏页面
    GAMES.forEach(game => {
        xml += `    <url>
        <loc>${BASE_URL}/${game.folder}/</loc>
        <lastmod>${now}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
`;
    });

    xml += `</urlset>`;

    return xml;
}

/**
 * 主函数
 */
function main() {
    const distDir = path.join(__dirname, '../dist');
    const sitemapPath = path.join(distDir, 'sitemap.xml');

    // 确保 dist 目录存在
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }

    // 生成 sitemap
    const sitemap = generateSitemap();
    fs.writeFileSync(sitemapPath, sitemap);

    console.log('🗺️  Sitemap 已生成: dist/sitemap.xml');
    console.log('⚠️  请记得将 BASE_URL 替换为实际域名');
}

main();
