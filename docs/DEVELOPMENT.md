# 开发指南

本指南介绍如何设置和运行本项目的前端和后端开发环境，包括依赖安装、开发模式启动及依赖更新。

## 环境依赖

确保基于以下版本的环境运行项目，否则可能会出现兼容性问题：
- **Node.js**: >= 16.x
- **npm**: >= 8.x
- **Python**: >= 3.10
- **pip**: >= 21.x

## 全局步骤

1. 克隆项目代码：
   ```bash
   git clone <https://github.com/NoHeartPen/dev-easysearch-web.git>
   cd easy-search-web
   ```

2. 初始化虚拟环境（推荐用于后端依赖隔离）：
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # MacOS/Linux
   .venv\Scripts\activate     # Windows
   ```

## 前端部分

### 1. 安装依赖

安装前端项目所需的依赖：

### 安装依赖

```bash
npm install --include=dev
```

### 启动开发模式

运行以下命令启动前端开发环境：

```bash
npm run dev
```

指定的开发脚本会启动 Webpack 的开发服务器，搭建前端的实时热更新环境。

## 后端部分

### 安装依赖

安装后端所需的 Python 依赖：

```bash
pip install -r requirements.txt
```

### 启动开发模式

运行以下命令启动后端服务（基于 Flask）

```bash
FLASK_APP=app.py FLASK_ENV=development flask run
```

通过以上步骤，你可以顺利运行和维护本项目。如有其他问题，请联系项目维护者。

## 更新项目依赖

如无特殊需求，可以忽略此步骤，由项目维护者负责完成。

### 更新前端依赖

全局安装 npm-check-updates（如未安装）

```bash
npm install -g npm-check-updates
```

使用上一步安装的工具，检查依赖更新情况

```bash
ncu -u
```

使用更新后的版本号安装最新依赖

```bash
npm install
```

### 更新后端依赖

安装依赖更新工具

```bash
pip install pip-tools
```

给当前状态的依赖生成 requirements.txt

```bash
pip-compile requirements.in
```

更新依赖版本

```bash
pip-compile --upgrade requirements.in

pip-compile requirements.in

pip install -r requirements.txt
```
