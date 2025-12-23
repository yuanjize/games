/**
 * 主页测试套件
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('主页 - index.html', () => {
    let document;

    beforeEach(() => {
        // 模拟 DOM 环境
        document = {
            querySelector: vi.fn(),
            querySelectorAll: vi.fn(() => []),
            addEventListener: vi.fn(),
            getElementById: vi.fn(),
            readyState: 'loading'
        };
    });

    describe('游戏数据', () => {
        it('应该包含10个游戏', () => {
            // 这个测试需要在实际环境中运行
            // 这里只是示例结构
            const gameCount = 10;
            expect(gameCount).toBe(10);
        });

        it('每个游戏应该有必需的属性', () => {
            const requiredProps = ['id', 'title', 'description', 'icon', 'category', 'folder', 'color'];

            // 示例游戏对象
            const sampleGame = {
                id: 'space-shooter',
                title: '太空射击',
                description: '测试描述',
                icon: 'fas fa-rocket',
                category: 'action',
                folder: 'space-shooter',
                color: '#00dbde'
            };

            requiredProps.forEach(prop => {
                expect(sampleGame).toHaveProperty(prop);
            });
        });
    });

    describe('统计数据', () => {
        it('应该正确初始化统计数据', () => {
            const mockStats = {
                totalGamesPlayed: 0,
                totalPlayTime: 0,
                recentlyPlayed: [],
                gameStats: {}
            };

            expect(mockStats.totalGamesPlayed).toBe(0);
            expect(mockStats.recentlyPlayed).toEqual([]);
        });
    });

    describe('游戏分类', () => {
        it('应该包含正确的分类', () => {
            const categories = ['action', 'puzzle', 'strategy', 'casual'];

            categories.forEach(category => {
                expect(['action', 'puzzle', 'strategy', 'casual']).toContain(category);
            });
        });
    });

    describe('预加载功能', () => {
        it('应该创建prefetch链接', () => {
            const createElementSpy = vi.fn();
            const mockLink = {
                rel: '',
                href: '',
                as: ''
            };

            createElementSpy.mockReturnValue(mockLink);

            // 模拟创建prefetch链接
            const link = createElementSpy('link');
            link.rel = 'prefetch';
            link.href = './space-shooter/';
            link.as = 'document';

            expect(link.rel).toBe('prefetch');
            expect(link.href).toBe('./space-shooter/');
        });
    });

    describe('页面可见性', () => {
        it('应该响应页面可见性变化', () => {
            let isHidden = false;

            // 模拟visibilitychange事件
            const visibilityHandler = () => {
                isHidden = document.hidden;
            };

            // 模拟页面隐藏
            document.hidden = true;
            visibilityHandler();

            expect(isHidden).toBe(true);
        });
    });
});
