/**
 * 生成 ReportDesk 文档站内容：把 docs/01–09 + README 的 Markdown 转换成
 * docs.html 模板里的 page-panel 片段，以及左侧菜单与右侧 TOC 所需的元数据。
 *
 * 用法：node gen-docs.js
 * 输出：
 *   - docs/pages.js   全局 window.DOC_PAGES = [{id, title, meta, html}]
 *   - docs/menu.js    全局 window.DOC_MENU = [{group, items:[{id, title}]}]
 * 由 index.html 在 docs.html 加载后注入。
 */
const fs = require("fs");
const path = require("path");

const DOCS_DIR = "C:\\Users\\Administrator\\Desktop\\MC\\Server\\plain\\ReportDesk\\docs";
const OUT_DIR = "C:\\Users\\Administrator\\Desktop\\MC\\Web\\ReportDesk-Web\\docs";

const PAGES = [
  { id: "home", file: "README.md", title: "ReportDesk Wiki", group: "总览", nav: "文档首页" },
  { id: "overview", file: "01-overview.md", title: "01 · 插件总览", group: "入门" },
  { id: "installation", file: "02-installation.md", title: "02 · 安装与目录结构", group: "入门" },
  { id: "commands", file: "03-commands.md", title: "03 · 命令参考", group: "命令与权限" },
  { id: "permissions", file: "04-permissions.md", title: "04 · 权限节点", group: "命令与权限" },
  { id: "configuration", file: "05-configuration.md", title: "05 · 配置参考", group: "命令与权限" },
  { id: "enhancements", file: "06-enhancements.md", title: "06 · 证据增强层", group: "进阶" },
  { id: "i18n", file: "07-i18n.md", title: "07 · 多语言", group: "进阶" },
  { id: "architecture", file: "08-architecture.md", title: "08 · 架构与数据流", group: "开发" },
  { id: "development", file: "09-development.md", title: "09 · 开发指南", group: "开发" },
];

/* ---------- 极简 Markdown → HTML ---------- */
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, text, href) => {
      // 站内文档链接 → 锚点跳转
      const target = href.replace(/\.md$/, "");
      const known = PAGES.find((p) => p.file.replace(/\.md$/, "") === target || p.title === target);
      if (known) return `<a href="#" data-doc="${known.id}">${text}</a>`;
      return `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
    })
    .replace(/\b(\d+(?:\.\d+)*)\b(?=[^0-9]|$)/g, (m, n) => n); // 保持数字原样（占位）
}
function inlineText(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, text, href) => {
      const target = href.replace(/\.md$/, "");
      const known = PAGES.find((p) => p.file.replace(/\.md$/, "") === target);
      if (known) return `<a href="#" data-doc="${known.id}">${text}</a>`;
      return `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
    });
}

function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    let line = lines[i];
    // 代码块
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
      i++; // 跳过结束 ```
      out.push(`<pre class="doc-pre"><code>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }
    // 表格
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|[-| :]+\|\s*$/.test(lines[i + 1])) {
      const header = line.split("|").slice(1, -1).map((c) => c.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|")) rows.push(lines[i++].split("|").slice(1, -1).map((c) => c.trim()));
      out.push(
        '<table class="doc-table"><thead><tr>' +
        header.map((h) => `<th>${inlineText(h)}</th>`).join("") +
        "</tr></thead><tbody>" +
        rows.map((r) => "<tr>" + r.map((c) => `<td>${inlineText(c)}</td>`).join("") + "</tr>").join("") +
        "</tbody></table>"
      );
      continue;
    }
    // 标题
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2].trim();
      if (level === 1) out.push(`<h1 class="doc-h1">${inlineText(text)}</h1>`);
      else if (level === 2) {
        const slug = text
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s-]/gu, "")
          .trim()
          .replace(/\s+/g, "-");
        out.push(`<h2 id="h-${slug}">${inlineText(text)}</h2>`);
      } else out.push(`<h${level}>${inlineText(text)}</h3>`);
      i++;
      continue;
    }
    // 列表
    if (/^\s*[-*]\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) buf.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
      out.push("<ul class=\"doc-ul\">" + buf.map((li) => `<li>${inlineText(li)}</li>`).join("") + "</ul>");
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) buf.push(lines[i++].replace(/^\s*\d+\.\s+/, ""));
      out.push("<ol class=\"doc-ol\">" + buf.map((li) => `<li>${inlineText(li)}</li>`).join("") + "</ol>");
      continue;
    }
    // 空行
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }
    // 普通段落（合并连续非空行）
    const buf = [line];
    i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#|```|\||[-*]\s|\d+\.\s)/.test(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${buf.map((l) => inlineText(l.trim())).join("<br>")}</p>`);
  }
  return out.join("\n");
}

/* ---------- 生成 ---------- */
fs.mkdirSync(OUT_DIR, { recursive: true });

const pages = PAGES.map((p) => {
  const md = fs.readFileSync(path.join(DOCS_DIR, p.file), "utf8");
  const html = mdToHtml(md);
  const h2s = [...html.matchAll(/<h2 id="h-([^"]+)">/g)].map((m) => m[1]);
  return { ...p, html, toc: h2s };
});

fs.writeFileSync(
  path.join(OUT_DIR, "pages.js"),
  "window.DOC_PAGES = " + JSON.stringify(pages, null, 1) + ";\n",
  "utf8"
);
fs.writeFileSync(
  path.join(OUT_DIR, "menu.js"),
  "window.DOC_MENU = " +
    JSON.stringify(PAGES.map((p) => ({ id: p.id, title: p.nav || p.title, group: p.group })), null, 1) +
    ";\n",
  "utf8"
);
console.log(
  PAGES.map((p) => `${p.file} → ${p.id} (${pages.find((x) => x.id === p.id).toc.length} h2)`).join("\n")
);
