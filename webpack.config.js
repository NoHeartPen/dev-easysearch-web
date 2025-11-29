const path = require('node:path');
module.exports = {
    entry: 'static/src/script.js', // 入口文件
    output: {
        filename: 'bundle.js', // 输出文件
        path: path.resolve(__dirname, 'static/dist'), // 输出目录
    },
    mode: 'development', // 开发模式
    devtool: 'source-map',
    resolve: {
        alias: {
            'static': path.resolve(__dirname, 'static/')
        },
        extensions: ['.js', '.jsx', '.json'],
    },
};
