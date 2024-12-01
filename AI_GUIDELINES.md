# AI Coding Guidelines

## 沟通规范
1. 所有对话必须使用中文进行沟通
2. 每一轮对话，都需要关注这个 Guidelines 文件有没有变更，并遵循我的要求。

## 开发规范
1. 代码规范：
  - 使用 ESLint
  - 使用 TypeScript
  - 在本地调试的时候不要编译 TypeScript

2. 依赖管理
  - 使用 pnpm
  - 使用 npmmirror 作为镜像源
  - 给我的指令都是在根目录下执行的，不需要 cd 目录

3. Git 规范
  - 不要每轮会话都提交代码，当我需要你帮我提交的时候，我会告诉你
  - 用 feature 的方式进行开发
  - 合并回主干的时候，用 fast-forward 的方式进行合并，不要加额外的 commit 节点。

## 流程规范
1. 我跟你的沟通，请帮提炼出功能需求，记录到 `RFC.md` 文档中。