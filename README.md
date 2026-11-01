# ReportDesk 展示网站

ReportDesk 插件的静态展示 / 落地页。纯 HTML + CSS + 原生 JS，无任何构建工具、无外部依赖，双击 `index.html` 即可在浏览器中打开，也可直接部署到任意静态托管（GitHub Pages / Vercel / Netlify / 对象存储）。

## 目录结构

```text
ReportDesk-Web/
├── index.html        单页展示（特性 / 命令 / 增强层 / 配置 / i18n / 权限 / 架构 / 路线图 / 安装）
├── css/style.css     深色主题样式
├── js/main.js        交互（菜单 / 复制 / 滚动动画 / 流程演示 / 数字滚动 / 进度条 / 返回顶部）
├── icon.png          插件图标（512×512 最简 Web PNG，用作 logo 与 favicon）
└── README.md         本文件
```

## 外部链接

| 平台 | 地址 |
|---|---|
| GitHub 仓库 | https://github.com/leocodes-mc/ReportDesk |
| Hangar 分发页 | https://hangar.papermc.io/William/ReportDesk |
| Modrinth 分发页 | https://modrinth.com/plugin/reportdesk |
| 1.0.0 发行版 | https://github.com/leocodes-mc/ReportDesk/releases/download/v1.0.0/ReportDesk-1.0.0.jar |

页面上的"下载 1.0.0 jar"按钮直连发行版地址；Hero 下方与页脚各有一组 GitHub / Hangar / Modrinth 链接。

## 使用

- 本地：双击 `index.html`，或 `python -m http.server` 后访问 `http://localhost:8000`。
- 部署：整个目录上传即可，无任何构建步骤。

## 内容来源

页面信息来自插件仓库的 `README.md`、`docs/`（01–09）与 `ROADMAP.md`。改动插件功能或配置后，请同步更新本页面。
