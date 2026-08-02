# Spring Boot BMS 可视化互动课程

本课程依据用户提供的 Spring Boot 监控平台技术说明重新组织，共 27 章，面向自动朗读、教学视频录制、GitHub 静态阅读和本地互动答题。

## 文件结构

- `01.md` 至 `27.md`：章节知识图、核心要点、实现边界、5 道单项选择题和机器可读数据。
- `01.conversation` 至 `27.conversation`：与同编号 Markdown 严格对应的双人讲解稿。
- `player/`：本地网页播放器，读取 `QUIZ_DATA` 后实现点击答题。
- `validate_course.py`：课程结构与数据一致性检查脚本。

文件编号连续且使用两位数字。推荐按 `01` 到 `27` 播放；每次先展示 `.md` 教学画面，同时朗读对应 `.conversation`。

## 两种答题方式

普通 GitHub Markdown 只能通过折叠区域查看答案，不能自动判定用户选择。

如需实现点击选项后自动判断正误并显示答案，需要由课程播放器读取 QUIZ_DATA 数据块并实现交互逻辑。

本课程的本地播放器会隐藏 Markdown 中的折叠答案，只显示可点击选项。学习者提交后，播放器锁定该题，标记所选项与正确项，再显示结果、正确答案和解析。每章完成后显示得分和正确率，并可重新答题。

## 启动互动播放器

在课程根目录执行：

```powershell
python -m http.server 8000
```

然后打开 `http://localhost:8000/player/`。浏览器的 `file://` 模式通常不允许播放器读取相邻章节文件，因此应使用本地 HTTP 服务。

播放器通过 CDN 加载 Markdown 与 Mermaid 渲染库；离线时测验交互仍可工作，但教学正文可能以简化样式显示。

## QUIZ_DATA 读取方式

每章末尾包含 `QUIZ_DATA_START` 与 `QUIZ_DATA_END` 之间的标准 JSON。`chapter` 对应文件编号，`questions` 固定包含 5 项；每题有 `id`、`question`、`options`、`answer` 与 `explanation`。

## 计分规则

每题 1 分，每章满分 5 分：

- 5 分：本章知识掌握得很好。
- 4 分：整体掌握良好，可以复习答错的知识点。
- 3 分：已经理解主要内容，建议重新查看本章重点。
- 0～2 分：建议重新学习本章后再次答题。

## 内容边界

- Visual Explorer 是 Vue 3、TypeScript、Vite 构建的纯前端教学站，其中协议、告警与 Kubernetes 操作是浏览器内模拟。
- 本课程讲解的真实后端是 Spring Boot 模块化单体。根据所给素材，当前代码基线为 Java 25 与 Spring Boot 3.5.14；旧材料中的 Java 21 是需要统一的文档差异。
- 课程明确区分当前实现、演示数据、配置脚手架与生产改进建议，不把文件存在或配置渲染等同于真实部署成功。

## 自检

```powershell
python validate_course.py
```

通过时输出章节数、题目数和全部检查结果。
