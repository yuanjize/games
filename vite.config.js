import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  // 构建配置
  build: {
    // 产物目录
    outDir: 'dist',
    // 静态资源目录
    assetsDir: 'assets',
    // 生成 sourcemap
    sourcemap: false,
    // 构建后的最小文件体积警告阈值（kb）
    chunkSizeWarningLimit: 1000,

    // Rollup 配置
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        // 静态资源命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',

        // 手动代码分割
        manualChunks: {
          // 第三方库单独打包
          'vendor': []
        }
      }
    },

    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        // 移除 console
        drop_console: false,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      },
      format: {
        // 移除注释
        comments: false
      }
    },

    // CSS 代码拆分
    cssCodeSplit: true,

    // 资源内联限制
    assetsInlineLimit: 4096
  },

  // 开发服务器配置
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true
  },

  // 预览服务器配置
  preview: {
    port: 4173,
    host: true,
    open: true
  },

  // 优化配置
  optimizeDeps: {
    include: [],
    exclude: []
  },

  // 插件
  plugins: [
    // 打包体积分析（仅在运行 npm run analyze 时启用）
    process.env.ANALYZE && visualizer({
      filename: 'stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean)
});
