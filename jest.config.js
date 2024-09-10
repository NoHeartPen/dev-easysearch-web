// jest.config.js
module.exports = {
  testEnvironment: 'jsdom', // 或 'jsdom'，取决于您的测试环境
  transform: {
    '^.+\\.jsx?$': 'babel-jest', // 使用 babel-jest 转译 .js 和 .jsx 文件
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'], // 支持的文件扩展名
  transformIgnorePatterns: [
    '/node_modules/(?!your-module-to-transform)', // 如果需要转译特定的 node_modules
  ],
  moduleNameMapper: {
    // 如果需要模拟非 JS 模块，可以在这里配置
  },
};
