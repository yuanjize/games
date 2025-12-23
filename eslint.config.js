import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            '*.min.js',
            'build.sh',
            'coverage/**',
            'test-*.js',
            'html-*/**'
        ]
    },
    // 浏览器环境配置
    {
        files: ['tests/**/*.js', '*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                fetch: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                performance: 'readonly'
            }
        },
        rules: {
            'no-console': 'off',
            'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-const-assign': 'error',
            'no-var': 'error',
            'prefer-const': 'error',
            'semi': ['error', 'always']
        }
    },
    // Node.js环境配置
    {
        files: ['scripts/**/*.js', 'worker.js', 'http-server.js', '*-test.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                URL: 'readonly',
                Response: 'readonly',
                fetch: 'readonly'
            }
        },
        rules: {
            'no-console': 'off',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-const-assign': 'error',
            'no-var': 'error',
            'prefer-const': 'error',
            'semi': ['error', 'always'],
            'comma-dangle': ['warn', 'never']
        }
    }
];
