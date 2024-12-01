# Git 多仓库管理工具 RFC

## 背景
在日常开发中，我们经常需要管理多个 Git 仓库。虽然每个仓库内部的 Git 操作已经很完善，但是在多仓库管理层面还缺乏便捷的工具。

## 功能需求

### 核心命令

#### 1. 初始化
- [ ] `repo init`
  - 初始化配置文件
  - 设置默认的仓库存放目录
  - 设置默认的代码托管平台配置

#### 2. 仓库管理
- [ ] `repo add <repository_url>`
  - 支持通过 URL 添加新的仓库
  - 支持不同的代码托管平台
    - GitHub: `github.com/owner/repo`
    - GitLab: `gitlab.com/owner/repo`
    - 自定义 Git 服务: `git.example.com/owner/repo`
  - 自动解析 host 信息并进行分类管理
  - 自动执行 clone 操作
  - 记录仓库信息到配置文件

- [ ] `repo remove <repository_name>`
  - 从配置文件中移除仓库记录
  - 可选择是否同时删除本地文件

- [ ] `repo list [options]`
  - 展示所有已管理的仓库列表
  - 显示仓库基本信息（名称、路径、远程地址等）
  - 支持按 host 分组展示
  - 支持格式化输出（table/json/yaml）

- [ ] `repo find <keyword>`
  - 支持模糊搜索仓库
  - 可通过名称、路径、host 等条件搜索
  - 支持正则表达式

#### 3. 配置管理
- [ ] `repo config [key] [value]`
  - 查看当前配置：`repo config`
  - 查看指定配置：`repo config <key>`
  - 设置配置：`repo config <key> <value>`
  - 支持的配置项：
    - `baseDir`: 仓库默认存放目录
    - `format`: 默认输出格式
    - `username`: 默认的 git username
    - `email`: 默认的 git email
    - `hosts`: 不同托管平台的 git 配置

### 配置文件

#### 1. 主配置文件
```yaml
# ~/.repo-copilot/config.yaml
baseDir: ~/workspace
format: table

# 默认的 git 配置
username: atian25
email: atian25@qq.com

# 不同托管平台的 git 配置
hosts:
  github.com:
    username: atian25
    email: atian25@qq.com
  gitlab.com:
    username: admin
    email: admin@example.com
  git.example.com:
    username: dev
    email: dev@example.com
```

#### 2. 仓库列表文件
```yaml
# ~/.repo-copilot/repositories.yaml
repositories:
  - name: repo-copilot
    owner: atian25
    url: github.com/atian25/repo-copilot
    path: ~/workspace/github.com/atian25/repo-copilot
    host: github.com
    created_at: 2024-01-20T10:00:00Z
```

### 技术方案

### 技术选型
- 开发语言：TypeScript
- 包管理工具：pnpm
- 代码规范：ESLint
- CLI 框架：建议使用 commander.js 或 yargs
- Git 操作：使用 simple-git 包
- 测试框架：Vitest
  - 单元测试
  - 集成测试
  - Mock 依赖

### 项目结构
```
repo-copilot/
  ├── src/
  │   ├── commands/      # 命令实现
  │   ├── config/        # 配置管理
  │   ├── utils/         # 工具函数
  │   └── index.ts       # 入口文件
  ├── test/             # 测试文件
  ├── package.json
  └── tsconfig.json
```

## TODO List

### 错误处理优化
- [ ] 重构错误处理，避免直接使用 `process.exit(1)`
- [ ] 添加更具体的错误信息，包括错误原因和建议
- [ ] 定义自定义错误类型，区分不同类型的错误

### 配置管理改进
- [ ] 修改 Config 类的 save() 方法返回 this，支持链式调用
- [ ] 实现配置文件的原子写入（先写临时文件再重命名）
- [ ] 优化配置目录的创建时机，移到类初始化时

### 代码组织重构
- [ ] 将 parseRepositoryUrl 函数移到 utils 目录
- [ ] 增强命令行参数解析，支持更多选项（如 --force）
- [ ] 添加统一的日志管理模块

### 测试改进
- [ ] 优化文件写入等待机制，避免使用 setTimeout
- [ ] 补充更多测试用例，如无效 URL 格式测试
- [ ] 添加集成测试

### 类型系统增强
- [ ] 为命令行参数添加类型定义
- [ ] 使用 zod/joi 验证配置文件结构
- [ ] 导出更多类型定义

### 功能完善
- [ ] 支持更多 URL 格式（如带协议的 URL）
- [ ] 添加配置文件版本管理和迁移功能
- [ ] 支持更多命令行选项（如指定配置路径）

### 文档完善
- [ ] 添加详细的代码注释
- [ ] 完善 README，包括使用说明和配置指南
- [ ] 为每个命令添加帮助信息

### 性能优化
- [ ] 添加配置文件读写缓存
- [ ] 预编译 URL 解析正则表达式
- [ ] 使用 worker 线程处理耗时操作

## 后续规划
1. 基础功能实现
2. 单元测试覆盖
3. 使用文档完善
4. 发布到 npm
