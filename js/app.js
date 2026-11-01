/* ReportDesk 展示站 — i18n 引擎
   切换语言时重建所有动态表格；静态 data-i18n 文案走 strings。
   选择持久化在 localStorage(rd-site-lang)，刷新后保留。 */
(function () {
  "use strict";

  var dict = { zh: window.I18N_ZH, en: window.I18N_EN };
  var storeKey = "rd-site-lang";

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  /* 安全的内联 HTML（文案中有意使用 <code>/<b>/<strong>/<br> 等白名单标签） */
  function safeHtml(s) {
    var allowed = /<\s*(\/)?(code|b|strong|br|a|small)\b[^>]*>/gi;
    var out = "";
    var last = 0;
    var m;
    while ((m = allowed.exec(s)) !== null) {
      out += esc(s.slice(last, m.index));
      if (m[1] !== "/") out += m[0];
      else out += esc(m[0]);
      last = m.index + m[0].length;
    }
    out += esc(s.slice(last));
    return out;
  }

  function setStatic(lang) {
    var s = dict[lang].strings;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = s[el.getAttribute("data-i18n")];
      if (v != null) el.innerHTML = safeHtml(v);
    });
    var title = document.querySelector('[data-i18n="meta.title"]');
    document.title = s["meta.title"];
    document.documentElement.lang = dict[lang].lang;
  }

  function renderTables(lang) {
    var D = dict[lang];
    var s = D.strings;

    /* 特性卡 */
    var featCards = document.querySelectorAll("#features .feat .card");
    featCards.forEach(function (card, i) {
      var f = D.features[i];
      if (!f) return;
      var h3 = card.querySelector("h3");
      var p = card.querySelector("p");
      if (h3) h3.textContent = f.t;
      if (p) p.innerHTML = safeHtml(f.d);
    });

    /* 功能矩阵 */
    var mb = document.getElementById("matrixBody");
    if (mb) {
      mb.innerHTML = D.matrix.map(function (r) {
        return "<tr><td class='mc'>" + esc(r[0]) + "</td>" +
          "<td class='mk'>" + (r[1] ? "✔" : "—") + "</td>" +
          "<td class='mk'>" + (r[2] ? "✔" : "—") + "</td>" +
          "<td class='mn'>" + safeHtml(s["matrix.note"] ? r[3] : r[3]) + "</td></tr>";
      }).join("");
    }

    /* 命令表 */
    function cmdRows(arr) {
      return arr.map(function (r) {
        return "<tr><td><code>" + esc(r[0]) + "</code></td><td>" + esc(r[1]) + "</td></tr>";
      }).join("");
    }
    var pt = document.getElementById("cmdPlayerTable");
    if (pt) pt.innerHTML = cmdRows(D.cmdsPlayer);
    var st = document.getElementById("cmdStaffTable");
    if (st) st.innerHTML = cmdRows(D.cmdsStaff);

    /* 裁决表 */
    var vb = document.getElementById("verdictBody");
    if (vb) {
      vb.innerHTML = D.verdicts.map(function (r) {
        return "<tr><td><code>" + esc(r[0]) + "</code></td><td>" + esc(r[1]) + "</td><td>" +
          esc(r[2]) + "</td><td><code>" + esc(r[3]) + "</code></td></tr>";
      }).join("");
    }

    /* 增强层卡 */
    var enhKeys = ["snap", "break", "move", "auto", "punish"];
    var enhEls = document.querySelectorAll("#enhancements .card.off");
    enhEls.forEach(function (card, i) {
      var k = enhKeys[i];
      if (!k || !D["enh." + k + ".t"]) return;
      card.querySelector("h3").textContent = D["enh." + k + ".t"];
      card.querySelector("p").innerHTML = safeHtml(D["enh." + k + ".d"]);
      card.querySelector(".switch-pill").textContent = s["enh.pill"];
    });
    var eg = document.getElementById("enhGuideList");
    if (eg) eg.innerHTML = D.enhGuide.map(function (li) {
      return "<li>" + safeHtml(li) + "</li>";
    }).join("");

    /* 权限表 + 建议 */
    var pb = document.getElementById("permBody");
    if (pb) {
      pb.innerHTML = D.perms.map(function (r) {
        return "<tr><td><code>" + esc(r[0]) + "</code></td><td>" + esc(r[1]) +
          "</td><td class='def-" + r[3] + "'>" + esc(r[2]) + "</td></tr>";
      }).join("");
    }
    var tips = document.getElementById("permTips");
    if (tips) {
      tips.innerHTML = "<div class='perm-tips-title'>" + esc(s["perm.tipsTitle"] || "建议") + "</div>" +
        "<ul>" + D.permTips.map(function (li) {
          return "<li>" + safeHtml(li) + "</li>";
        }).join("") + "</ul>";
    }

    /* 配置参考 */
    var cd = document.getElementById("configDocs");
    if (cd) {
      cd.innerHTML = D.configSections.map(function (sec) {
        var rows = sec.rows.map(function (r) {
          return "<tr><td><code>" + safeHtml(r[0]) + "</code></td><td class='cfg-default'>" +
            safeHtml(r[1]) + "</td><td>" + safeHtml(r[2]) + "</td></tr>";
        }).join("");
        return "<div class='cfg-block'><h3>" + safeHtml(sec.title) + "</h3>" +
          "<table class='cfg-table'><thead><tr><th>" + esc(s["cfg.key"] || "键") + "</th>" +
          "<th>" + esc(s["cfg.def"] || "默认") + "</th><th>" + esc(s["cfg.note"] || "说明") +
          "</th></tr></thead><tbody>" + rows + "</tbody></table></div>";
      }).join("");
    }

    /* i18n 三层合并 */
    var ml = document.getElementById("i18nMergeList");
    if (ml) ml.innerHTML = D.i18nMerge.map(function (li) {
      return "<li>" + safeHtml(li) + "</li>";
    }).join("");

    /* 设计原则 */
    var pg = document.getElementById("principleGrid");
    if (pg) {
      pg.innerHTML =
        '<div class="principle-title">' + safeHtml(s["principle.title"] || "") + "</div>" +
        '<div class="principle-cards">' +
        D.principles.map(function (p) {
          return "<div class='principle-card'><h3>" + safeHtml(p.t) + "</h3><p>" + safeHtml(p.d) + "</p></div>";
        }).join("") +
        "</div>";
    }

    /* FAQ */
    var fl = document.getElementById("faqList");
    if (fl) {
      fl.innerHTML = D.faqs.map(function (f, i) {
        return "<details class='faq-item'><summary>" + safeHtml(f.q) + "</summary>" +
          "<div class='faq-a'>" + safeHtml(f.a) + "</div></details>";
      }).join("");
    }

    /* 线程模型表 */
    var tt = document.getElementById("threadTable");
    if (tt) {
      tt.innerHTML = D.threadRows.map(function (r) {
        return "<tr><td>" + esc(r[0]) + "</td><td>" + safeHtml(r[1]) + "</td></tr>";
      }).join("");
    }

    /* 路线图 */
    var rg = document.getElementById("roadmapGroups");
    if (rg) {
      rg.innerHTML = D.roadmap.map(function (g) {
        return "<div class='rm-group'><div class='rm-label'>" + esc(g.label) + "</div>" +
          "<div class='rm-items'>" + g.items.map(function (it) {
            return "<span>" + esc(it) + "</span>";
          }).join("") + "</div></div>";
      }).join("");
    }

    /* 语言按钮态 */
    document.getElementById("langZh").classList.toggle("active", lang === "zh");
    document.getElementById("langEn").classList.toggle("active", lang === "en");
    var mZh = document.getElementById("langZhMobile");
    var mEn = document.getElementById("langEnMobile");
    if (mZh) mZh.classList.toggle("active", lang === "zh");
    if (mEn) mEn.classList.toggle("active", lang === "en");
  }

  function apply(lang) {
    setStatic(lang);
    renderTables(lang);
  }

  var current = "zh";
  try {
    current = localStorage.getItem(storeKey) === "en" ? "en" : "zh";
  } catch (e) { /* 无痕模式可能拒绝 */ }

  apply(current);
  window.addEventListener("storage", function (e) {
    if (e.key === storeKey && e.newValue) {
      current = e.newValue === "en" ? "en" : "zh";
      apply(current);
    }
  });

  var zhBtn = document.getElementById("langZh");
  var enBtn = document.getElementById("langEn");
  var zhM = document.getElementById("langZhMobile");
  var enM = document.getElementById("langEnMobile");
  function pick(lang) {
    if (lang === current) return;
    current = lang;
    try { localStorage.setItem(storeKey, lang); } catch (e) { /* ignore */ }
    apply(lang);
  }
  if (zhBtn) zhBtn.addEventListener("click", function () { pick("zh"); });
  if (enBtn) enBtn.addEventListener("click", function () { pick("en"); });
  if (zhM) zhM.addEventListener("click", function () { pick("zh"); });
  if (enM) enM.addEventListener("click", function () { pick("en"); });

  window.RDSetLang = function (lang) {
    pick(lang === "en" ? "en" : "zh");
  };
})();
