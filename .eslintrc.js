module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        // 代码质量
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        'no-debugger': 'warn',
        'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'no-const-assign': 'error',
        'no-var': 'error',
        'prefer-const': 'error',
        'prefer-arrow-callback': 'warn',

        // 最佳实践
        'eqeqeq': ['error', 'always'],
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',

        // 代码风格
        'semi': ['error', 'always'],
        'comma-dangle': ['error', 'never']
    },
    ignorePatterns: [
        'dist/',
        'node_modules/',
        '*.min.js',
        'build.sh'
    ],
    globals: {
        // 游戏页面全局变量
        'canvas': 'readonly',
        'ctx': 'readonly',
        'game': 'writable'
    }
};
