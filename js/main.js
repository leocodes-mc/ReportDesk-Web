/* ReportDesk 展示站 — 交互脚本（丝滑版）
   性能原则：
   - 滚动相关全部走 requestAnimationFrame 节流，不直接监听 scroll 重排
   - 动画只用 transform / opacity（合成器层，不触发重排）
   - 磁吸光效用 pointermove 更新 CSS 变量，不操作 DOM 结构 */
(function () {
  "use strict";

  // ---------- 移动端菜单 ----------
  var toggle = document.getElementById("menuToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      links.classList.toggle("open");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
      });
    });
  }

  // ---------- 滚动：rAF 节流的阴影 / 进度条 / 返回顶部 ----------
  var nav = document.getElementById("nav");
  var progress = document.getElementById("progress");
  var toTop = document.getElementById("toTop");
  var ticking = false;
  function updateScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle("scrolled", y > 8);
    if (toTop) toTop.classList.toggle("show", y > 600);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
    ticking = false;
  }
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateScroll);
      }
    },
    { passive: true }
  );
  updateScroll();
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ---------- 代码块复制 ----------
  document.querySelectorAll("[data-copybtn]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var block = btn.parentElement;
      var code = block.querySelector("code");
      if (code) copyText(code.textContent.trim(), "示例已复制");
    });
  });

  // ---------- 滚动浮现：按视口批次入场，批内 DOM 顺序错峰 ----------
  var revealEls = document.querySelectorAll(
    ".group-bar, .card, .demo, .cmd-block, .example, .i18n-block, .arch-block, .cfg-block, .verdict-block, .matrix, .enh-guide, .rm-group, .perm-table, .perm-tips, .install-meta div, .repo"
  );
  revealEls.forEach(function (el) {
    el.classList.add("reveal");
  });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          io.unobserve(e.target);
          // 入场后释放 will-change，避免长期占用合成器内存
          setTimeout(function () {
            e.target.style.willChange = "auto";
          }, 900);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("in");
    });
  }

  // ---------- GUI 流程轮播：点击某步会重置计时 ----------
  var steps = Array.prototype.slice.call(document.querySelectorAll(".step"));
  var activeIdx = 0;
  var timer = null;
  function paint() {
    steps.forEach(function (s, i) {
      s.classList.toggle("active", i === activeIdx);
    });
  }
  function restartTimer() {
    clearInterval(timer);
    timer = setInterval(function () {
      activeIdx = (activeIdx + 1) % steps.length;
      paint();
    }, 1800);
  }
  if (steps.length > 1) {
    paint();
    restartTimer();
    steps.forEach(function (s, i) {
      s.addEventListener("click", function () {
        activeIdx = i;
        paint();
        restartTimer();
      });
    });
  }

  // ---------- 数字滚动 ----------
  var counters = document.querySelectorAll("[data-count]");
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          var target = parseInt(el.getAttribute("data-count"), 10);
          var dur = 1000;
          var t0 = null;
          function tick(ts) {
            if (t0 === null) t0 = ts;
            var p = Math.min(1, (ts - t0) / dur);
            el.textContent = Math.round(target * easeOutCubic(p));
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
          cio.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (el) {
      cio.observe(el);
    });
  }

  // ---------- 磁吸光效：pointer 跟随的径向高光（纯 CSS 变量，零重排） ----------
  document.querySelectorAll(".btn, .card").forEach(function (el) {
    el.addEventListener("pointermove", function (ev) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", ev.clientX - r.left + "px");
      el.style.setProperty("--my", ev.clientY - r.top + "px");
    });
  });

  // ---------- 剪贴板（兼容 file:// 协议，clipboard API 可能不可用） ----------
  function copyText(text, msg) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          showToast(msg || "已复制");
        })
        .catch(function () {
          fallbackCopy(text, msg);
        });
    } else {
      fallbackCopy(text, msg);
    }
  }
  function fallbackCopy(text, msg) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showToast(msg || "已复制");
    } catch (e) {
      showToast("复制失败，请手动复制");
    }
    document.body.removeChild(ta);
  }
  var toastTimer = null;
  function showToast(text) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove("show");
    }, 1800);
  }
})();
