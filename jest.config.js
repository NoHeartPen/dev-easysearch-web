// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx?$': 'babel-jest', // 使用 babel-jest 转译 .js 和 .jsx 文件
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'], // 支持的文件扩展名
  transformIgnorePatterns: [
    '/node_modules/(?!your-module-to-transform)', // 转译特定的 node_modules
  ],
  moduleNameMapper: {
    // 模拟非 JS 模块
  },
};
