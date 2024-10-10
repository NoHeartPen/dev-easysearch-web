// vitest.config.js
export default {
  test: {
    coverage: {
      provider: 'istanbul', // 或者您使用的覆盖率工具
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage', // 输出目录
    },
  },
};
