# Changelog

## [0.2.0] - 2024-01-09

### Added
- 实现 remove 命令，支持从配置中移除仓库
- 添加 --force 选项，支持同时删除本地文件
- 添加 TODO 列表到 RFC，规划后续优化项

### Changed
- 重构配置路径管理，使用函数动态获取
- 优化测试用例，支持自定义配置目录
- 改进错误处理和日志输出

## [0.1.0] - 2024-01-08

### Added
- 初始化项目结构
- 实现基础配置管理
- 实现 add 命令，支持添加仓库到配置
- 添加单元测试框架