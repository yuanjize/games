import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // 测试环境
        environment: 'jsdom',

        // 全局配置
        globals: true,

        // 覆盖率配置
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'dist/',
                '**/*.test.js',
                '**/*.spec.js',
                '**/*.config.js',
                'scripts/',
                'build.sh'
            ],
            // 覆盖率阈值
            thresholds: {
                lines: 0,
                functions: 0,
                branches: 0,
                statements: 0
            }
        },

        // 测试文件匹配模式
        include: [
            'tests/**/*.test.js',
            '**/*.test.js'
        ],
        exclude: [
            'node_modules/',
            'dist/',
            'build.sh'
        ],

        // UI 模式
        ui: true,

        // 报告器
        reporters: ['default', 'html']
    }
});
