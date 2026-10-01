(function () {
  "use strict";

  var PAGES = [
    { n: 1, id: "about", label: "About" },
    { n: 2, id: "experience", label: "Experience" },
    { n: 3, id: "work", label: "Work" },
    { n: 4, id: "contact", label: "Discord" }
  ];
  var TOTAL = PAGES.length;

  var navbar = document.getElementById("navbar");
  var topPager = document.getElementById("topPager");
  var topSlider = document.getElementById("topPagerSlider");
  var topCount = document.getElementById("topPagerCount");
  var topProgress = document.getElementById("topPagerProgress");
  if (!topPager) return;

  var tabs = Array.prototype.slice.call(topPager.querySelectorAll('[role="tab"][data-goto]'));
  tabs.forEach(function (b) {
    if (!b.querySelector(".btn-dot")) {
      var d = document.createElement("i");
      d.className = "btn-dot";
      d.setAttribute("aria-hidden", "true");
      b.appendChild(d);
    }
  });
  var allGoto = Array.prototype.slice.call(document.querySelectorAll("[data-goto]"));
  var forceAnim = false;
  try { forceAnim = window.location.href.indexOf("anim=full") !== -1; } catch (errLoc) {}
  var reduceMotion = !forceAnim && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function byNum(n) {
    for (var i = 0; i < PAGES.length; i++) if (PAGES[i].n === n) return PAGES[i];
    return PAGES[0];
  }
  function byId(id) {
    if (!id) return null;
    id = String(id).toLowerCase();
    if (id.charAt(0) === "/" || id.charAt(0) === "#") id = id.slice(1);
    for (var i = 0; i < PAGES.length; i++) {
      if (PAGES[i].id === id) return PAGES[i];
    }
    return null;
  }
  function current() {
    var p = parseInt(document.body.getAttribute("data-page"), 10);
    return p >= 1 && p <= TOTAL ? p : 1;
  }
  function headerH() {
    return (navbar && navbar.offsetHeight) || 56;
  }
  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  var pagerList = topPager.querySelector(".top-pager-list");
  var sliderTimer = null;
  var lastSliderPos = null;
  var lastVertical = null;
  var trail = document.createElement("span");
  trail.className = "top-pager-trail";
  trail.setAttribute("aria-hidden", "true");
  topPager.insertBefore(trail, topSlider);
  // The rail stands down the side of the page on desktop and lies along the bottom on phones,
  // so every slider effect runs on whichever axis the tabs are laid out on.
  function isVertical() {
    return tabs.length > 1 && tabs[1].offsetTop > tabs[0].offsetTop + 4;
  }
  function axis(vert) {
    return vert
      ? { move: "translateY(", grow: "scaleY(", cross: "scaleX(", size: "height", other: "width" }
      : { move: "translateX(", grow: "scaleX(", cross: "scaleY(", size: "width", other: "height" };
  }
  function place(ax, pos, grow, cross) {
    return ax.move + pos + "px) " + ax.grow + grow + ") " + ax.cross + cross + ")";
  }
  function setTrail(ax, pos, size) {
    topPager.style.setProperty("--trail-pos", pos + "px");
    trail.style[ax.size] = size + "px";
    trail.style[ax.other] = "";
  }
  function ripple(btn, e) {
    var rect = btn.getBoundingClientRect();
    var s = document.createElement("span");
    s.className = "ripple";
    var size = Math.max(rect.width, rect.height) * 2.4;
    s.style.width = size + "px";
    s.style.height = size + "px";
    var cx = e && e.clientX ? e.clientX - rect.left : rect.width / 2;
    var cy = e && e.clientY ? e.clientY - rect.top : rect.height / 2;
    s.style.left = cx + "px";
    s.style.top = cy + "px";
    btn.appendChild(s);
    if (s.animate) {
      try {
        s.animate(
          [
            { transform: "translate(-50%,-50%) scale(0)", opacity: 0.9 },
            { transform: "translate(-50%,-50%) scale(1)", opacity: 0 }
          ],
          { duration: 600, easing: "cubic-bezier(.22,1.4,.36,1)" }
        ).finished.then(function () {
          if (s.parentNode) s.parentNode.removeChild(s);
        }).catch(function () {
          if (s.parentNode) s.parentNode.removeChild(s);
        });
        return;
      } catch (errR) {}
    }
    setTimeout(function () {
      if (s.parentNode) s.parentNode.removeChild(s);
    }, 620);
  }
  function wipeSweep(dirSign) {
    if (reduceMotion) return;
    var len = (isVertical() ? topPager.offsetHeight : topPager.offsetWidth) || 300;
    topPager.style.setProperty("--wipe-s", "0.6");
    topPager.style.setProperty("--wipe-o", "1");
    topPager.style.setProperty("--wipe-pos", dirSign > 0 ? (-160 + "px") : (len + 20 + "px"));
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        topPager.style.setProperty("--wipe-s", "1.4");
        topPager.style.setProperty("--wipe-pos", dirSign > 0 ? (len + 20 + "px") : (-160 + "px"));
        setTimeout(function () {
          topPager.style.setProperty("--wipe-o", "0");
          topPager.style.setProperty("--wipe-s", "1");
        }, 520);
      });
    });
  }
  function tabFor(n) {
    var found = null;
    tabs.forEach(function (b) {
      if (parseInt(b.getAttribute("data-goto"), 10) === n) found = b;
    });
    return found;
  }
  // Where a switch to page n visibly starts: the middle of its tab on the rail.
  function tabPoint(n) {
    var t = tabFor(n);
    if (!t) return { x: (window.innerWidth || 1200) / 2, y: 70 };
    var r = t.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function setProgress(n) {
    if (!topProgress) return;
    var ax = axis(isVertical());
    topProgress.style[ax.size] = (n / TOTAL) * 100 + "%";
    topProgress.style[ax.other] = "";
  }
  function moveSlider(n, animated) {
    if (!topSlider || !tabs.length) return;
    var active = tabFor(n);
    if (!active) return;
    var vert = isVertical();
    var ax = axis(vert);
    if (vert !== lastVertical) {
      // Crossed the phone breakpoint: the previous position was on the other axis.
      topPager.classList.toggle("is-vertical", vert);
      if (pagerList) pagerList.setAttribute("aria-orientation", vert ? "vertical" : "horizontal");
      topSlider.style[ax.other] = "";
      lastVertical = vert;
      lastSliderPos = null;
      animated = false;
      setProgress(n);
    }
    // Layout offsets, not getBoundingClientRect: the tab-pop animation scales the
    // button, and measuring mid-pop left the slider smaller than its tab.
    var pos = vert
      ? (pagerList ? pagerList.offsetTop : 0) + active.offsetTop
      : (pagerList ? pagerList.offsetLeft : 0) + active.offsetLeft;
    var size = vert ? active.offsetHeight : active.offsetWidth;
    if (!size) return;
    function popTab(el) {
      if (!el.animate || reduceMotion) return;
      try {
        el.animate(
          [
            { transform: "scale(.86) translateY(3px)" },
            { transform: "scale(1.08) translateY(-2px)" },
            { transform: "scale(.99) translateY(1px)" },
            { transform: "scale(1.03) translateY(0)" }
          ],
          { duration: 520, easing: "cubic-bezier(.34,1.56,.64,1)" }
        );
      } catch (err3) {}
    }
    function bounceSlider(from, to, dirS) {
      if (!topSlider.animate || reduceMotion) return;
      try {
        topSlider.animate(
          [
            { transform: place(ax, from, 1.35, 0.78), borderRadius: vert ? "420px 420px 999px 999px" : "420px 999px 999px 420px" },
            { transform: place(ax, ((from + to) / 2).toFixed(1), dirS > 0 ? 0.9 : 1.2, 1.08) },
            { transform: place(ax, to, 1, 1), borderRadius: "999px" }
          ],
          { duration: 580, easing: "cubic-bezier(.34,1.56,.64,1)" }
        );
      } catch (errB) {}
    }
    if (animated !== false && !reduceMotion) {
      if (lastSliderPos !== null) {
        var dist = Math.abs(pos - lastSliderPos);
        var jdir = pos > lastSliderPos ? 1 : -1;
        if (dist > 4) {
          var stretch = 1 + Math.min(dist / 150, 0.7);
          var squash = 1 - Math.min(dist / 420, 0.22);
          topPager.style.setProperty("--blob", stretch.toFixed(3));
          topPager.classList.add("is-moving");
          setTrail(ax, pos, size);
          topSlider.style[ax.size] = size + "px";
          topSlider.style.transform = place(ax, pos, stretch.toFixed(3), squash.toFixed(3));
          bounceSlider(lastSliderPos, pos, jdir);
          popTab(active);
          lastSliderPos = pos;
          if (sliderTimer) clearTimeout(sliderTimer);
          sliderTimer = setTimeout(function () {
            topSlider.style.transform = place(ax, pos, 1, 1);
            setTimeout(function () {
              topPager.classList.remove("is-moving");
              topPager.style.setProperty("--blob", "1");
            }, 420);
          }, 300);
          return;
        }
      } else {
        setTrail(ax, pos, size);
      }
      popTab(active);
    } else {
      setTrail(ax, pos, size);
    }
    lastSliderPos = pos;
    topSlider.style[ax.size] = size + "px";
    topSlider.style.transform = ax.move + pos + "px)";
  }
  tabs.forEach(function (b) {
    b.addEventListener("pointerdown", function (e) {
      if (!reduceMotion) ripple(b, e);
      if (reduceMotion || !b.animate) return;
      try {
        b.animate(
          [{ transform: "scale(.9)" }, { transform: "scale(1.06)" }, { transform: "scale(1.02)" }],
          { duration: 300, easing: "cubic-bezier(.3,1.35,.4,1)" }
        );
      } catch (err2) {}
    });
    b.addEventListener("pointermove", function (e) {
      if (reduceMotion) return;
      var rect = b.getBoundingClientRect();
      var ox = (e.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
      var oy = (e.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
      b.style.setProperty("--mag-x", (ox * 5).toFixed(2) + "px");
      b.style.setProperty("--mag-y", (oy * 4).toFixed(2) + "px");
    });
    b.addEventListener("pointerleave", function () {
      b.style.setProperty("--mag-x", "0px");
      b.style.setProperty("--mag-y", "0px");
    });
  });

  if (topPager && !reduceMotion) {
    topPager.addEventListener("pointermove", function (e) {
      var r = topPager.getBoundingClientRect();
      var px = ((e.clientX - r.left) / Math.max(r.width, 1)) * 100;
      var py = ((e.clientY - r.top) / Math.max(r.height, 1)) * 100;
      topPager.style.setProperty("--mx", Math.max(0, Math.min(100, px)).toFixed(2) + "%");
      topPager.style.setProperty("--my", Math.max(0, Math.min(100, py)).toFixed(2) + "%");
    });
  }
  var touchSX = 0;
  var touchSY = 0;
  var touchActive = false;
  function inSideScroller(el) {
    for (; el && el !== document.body; el = el.parentElement) {
      if (el.scrollWidth > el.clientWidth + 1) {
        var ox = getComputedStyle(el).overflowX;
        if (ox === "auto" || ox === "scroll") return true;
      }
    }
    return false;
  }
  document.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1) return;
    // A sideways drag on the code sample scrolls it; it must not flip the page too.
    if (inSideScroller(e.target)) return;
    touchSX = e.touches[0].clientX;
    touchSY = e.touches[0].clientY;
    touchActive = true;
  }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (!touchActive) return;
    touchActive = false;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchSX;
    var dy = t.clientY - touchSY;
    if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (dx < 0) apply(Math.min(current() + 1, TOTAL));
    else apply(Math.max(current() - 1, 1));
  }, { passive: true });

  function setTabs(n) {
    tabs.forEach(function (b) {
      var on = parseInt(b.getAttribute("data-goto"), 10) === n;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
      if (on) b.removeAttribute("tabindex");
      else b.setAttribute("tabindex", "-1");
    });
  }

  function showPageSections(n) {
    var page = byNum(n);
    document.querySelectorAll("[data-page]").forEach(function (el) {
      if (el === document.body) return;
      var p = parseInt(el.getAttribute("data-page"), 10);
      if (!p) return;
      el.classList.toggle("page-hidden", p !== n);
    });
    document.body.setAttribute("data-page", String(n));
  }

  var enterTimer = null;
  var exitTimer = null;
  var applyToken = 0;
  var flash = document.createElement("div");
  flash.className = "page-flash";
  flash.setAttribute("aria-hidden", "true");
  document.body.appendChild(flash);
  var curtain = document.createElement("div");
  curtain.className = "page-curtain";
  curtain.setAttribute("aria-hidden", "true");
  curtain.innerHTML = '<span class="curtain-sweep"></span>';
  document.body.appendChild(curtain);
  function burst(px, py, big) {
    if (reduceMotion) return;
    var count = big ? 16 : 10;
    for (var i = 0; i < count; i++) {
      (function (k) {
        var s = document.createElement("span");
        s.className = "burst-dot";
        var sz = 4 + Math.random() * 8;
        s.style.width = sz + "px";
        s.style.height = sz + "px";
        s.style.left = px + "px";
        s.style.top = py + "px";
        document.body.appendChild(s);
        var ang = (k / count) * Math.PI * 2 + Math.random() * 0.6;
        var dist = 60 + Math.random() * (big ? 150 : 90);
        var dx = Math.cos(ang) * dist;
        var dy = Math.sin(ang) * dist - 40;
        try {
          var a = s.animate(
            [
              { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
              { transform: "translate(" + (dx - 4).toFixed(0) + "px," + dy.toFixed(0) + "px) scale(.2)", opacity: 0 }
            ],
            { duration: 650 + Math.random() * 350, easing: "cubic-bezier(.2,.8,.3,1)" }
          );
          if (a && a.finished) {
            a.finished.then(function () {
              if (s.parentNode) s.parentNode.removeChild(s);
            }).catch(function () {
              if (s.parentNode) s.parentNode.removeChild(s);
            });
          } else {
            setTimeout(function () {
              if (s.parentNode) s.parentNode.removeChild(s);
            }, 900);
          }
        } catch (errB) {
          setTimeout(function () {
            if (s.parentNode) s.parentNode.removeChild(s);
          }, 900);
        }
      })(i);
    }
  }
  function originKids(el) {
    var kids = el.querySelectorAll(".intro-copy,.player,.page-head,.card,.mc-clock,.guild-list,.item,.dc-card");
    return Array.prototype.slice.call(kids).slice(0, 14);
  }
  function playEnter(n, dir, jump, origin) {
    if (reduceMotion) return;
    var page = byNum(n);
    var el = document.getElementById(page.id);
    if (!el) return;
    el.classList.remove("page-enter");
    el.classList.remove("page-enter-fallback");
    void el.offsetWidth;
    el.classList.add("page-enter");
    flash.style.setProperty("--flash-x", origin.x.toFixed(0) + "px");
    flash.style.setProperty("--flash-y", origin.y.toFixed(0) + "px");
    if (flash.animate) {
      try {
        flash.animate(
          [{ opacity: 0.9 }, { opacity: 0 }],
          { duration: 520, easing: "ease-out" }
        );
      } catch (errF) {}
    }
    el.classList.add("page-enter-fallback");
    var kids = originKids(el);
    kids.forEach(function (k, i) {
      if (!k.animate) return;
      try {
        var d = Math.min(60 + i * 48, 620);
        var sway = (i % 2 === 0 ? 1 : -1) * Math.min(4 + i, 10);
        k.animate(
          [
            { opacity: 0, transform: "translate3d(" + sway + "px,26px,0) rotateX(9deg) scale(.97)", filter: "blur(8px)" },
            { opacity: 1, transform: "translate3d(0,0,0) rotateX(0) scale(1)", filter: "blur(0)" }
          ],
          { duration: 620, delay: d, easing: "cubic-bezier(.25,1.1,.35,1)", fill: "backwards" }
        );
      } catch (errK) {}
    });
    if (enterTimer) clearTimeout(enterTimer);
    enterTimer = setTimeout(function () {
      el.classList.remove("page-enter");
      el.classList.remove("page-enter-fallback");
      try { el.style.clipPath = ""; } catch (errS) {}
    }, 760);
  }

  var switchTimer = null;
  function rollCount(n) {
    if (!topCount) return;
    var oldB = topCount.querySelector("b");
    var html = '<span class="count-roll"><b>' + pad(n) + "</b></span> / " + pad(TOTAL);
    if (!oldB || reduceMotion || !oldB.animate) {
      topCount.innerHTML = html;
      topCount.classList.remove("swap");
      void topCount.offsetWidth;
      topCount.classList.add("swap");
      return;
    }
    try {
      var out = oldB.animate(
        [
          { transform: "translateY(0)", opacity: 1, filter: "blur(0)" },
          { transform: "translateY(-110%)", opacity: 0, filter: "blur(4px)" }
        ],
        { duration: 170, easing: "cubic-bezier(.5,0,.7,.4)" }
      );
      if (out && out.finished) {
        out.finished.then(function () {
          topCount.innerHTML = html;
          var nb = topCount.querySelector("b");
          if (nb && nb.animate) {
            try {
              nb.animate(
                [
                  { transform: "translateY(110%)", opacity: 0, filter: "blur(4px)" },
                  { transform: "translateY(0)", opacity: 1, filter: "blur(0)" }
                ],
                { duration: 420, easing: "cubic-bezier(.25,1.2,.35,1)" }
              );
            } catch (errN) {}
          }
        }).catch(function () {
          topCount.innerHTML = html;
        });
      } else {
        setTimeout(function () {
          topCount.innerHTML = html;
        }, 170);
      }
    } catch (errR) {
      topCount.innerHTML = html;
    }
    topCount.classList.remove("swap");
    void topCount.offsetWidth;
    topCount.classList.add("swap");
  }
  // Page 1 lives at the bare URL. With "#about" in the address bar the browser
  // jumped past the hero to the About section on every reload or shared link.
  function setUrl(page) {
    try {
      history.replaceState(null, "", page.n === 1 ? location.pathname + location.search : "#" + page.id);
    } catch (e) {}
  }
  function jumpTop() {
    // "instant": plain scrollTo follows html{scroll-behavior:smooth}.
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }
  var curtainTimer = null;
  // Finish any switch still in flight, so a quick back-and-forth can't leave
  // the old section faded out or the curtain stuck over the page.
  function settleTransition() {
    if (exitTimer) {
      clearTimeout(exitTimer);
      exitTimer = null;
    }
    if (curtainTimer) {
      clearTimeout(curtainTimer);
      curtainTimer = null;
    }
    Array.prototype.forEach.call(document.querySelectorAll(".page-exit"), function (el) {
      el.classList.remove("page-exit");
    });
    try {
      var anims = curtain.getAnimations();
      for (var ai = 0; ai < anims.length; ai++) anims[ai].cancel();
    } catch (errCancel) {}
    curtain.classList.remove("cover", "exit", "exit-l", "exit-r");
  }
  function apply(n, opts, origin) {
    opts = opts || {};
    n = Math.max(1, Math.min(TOTAL, n));
    var prev = current();
    var dir = n === prev ? 1 : (n > prev ? 1 : -1);
    var jump = Math.abs(n - prev);
    var page = byNum(n);
    var myToken = ++applyToken;
    settleTransition();
    var animate = !reduceMotion && !opts.instant;
    if (!origin) origin = tabPoint(n);
    function commit() {
      if (myToken !== applyToken) return;
      showPageSections(n);
      setTabs(n);
      rollCount(n);
      setProgress(n);
      if (!reduceMotion) {
        topPager.classList.add("is-switching");
        if (switchTimer) clearTimeout(switchTimer);
        switchTimer = setTimeout(function () {
          topPager.classList.remove("is-switching");
        }, 750);
        if (topSlider.animate) {
          var sq = isVertical() ? [".82 1.3", "1.05 .94"] : ["1.3 .82", ".94 1.05"];
          try {
            topSlider.animate(
              [{ scale: "1 1" }, { scale: sq[0] }, { scale: sq[1] }, { scale: "1 1" }],
              { duration: 520, easing: "cubic-bezier(.3,1.2,.4,1)" }
            );
          } catch (errW) {}
        }
      }
      playEnter(n, dir, jump, origin);
      setUrl(page);
      // Jump rather than glide: the old page is already gone, and a smooth scroll
      // up through the new one only played its scroll effects on the way.
      jumpTop();
      requestAnimationFrame(function () {
        moveSlider(n);
      });
      setTimeout(function () {
        moveSlider(n);
      }, 90);
      document.dispatchEvent(new CustomEvent("pagechange", { detail: { page: n, id: page.id } }));
    }
    if (animate && n !== prev) {
      burst(origin.x, origin.y, jump > 1);
      var oldPage = byNum(prev);
      var oldEl = document.getElementById(oldPage.id);
      if (oldEl) {
        moveSlider(n);
        wipeSweep(dir);
        curtain.style.opacity = "0";
        void curtain.offsetWidth;
        curtain.style.opacity = "";
        curtain.classList.add("cover");
        oldEl.style.setProperty("--exit-x", dir > 0 ? "-22px" : "22px");
        oldEl.classList.remove("page-exit");
        void oldEl.offsetWidth;
        oldEl.classList.add("page-exit");
        exitTimer = setTimeout(function () {
          if (myToken !== applyToken) return;
          oldEl.classList.remove("page-exit");
          commit();
          curtain.classList.remove("cover");
          curtain.classList.add("exit");
          curtain.classList.add(dir > 0 ? "exit-l" : "exit-r");
          curtainTimer = setTimeout(function () {
            curtainTimer = null;
            curtain.style.transition = "none";
            curtain.classList.remove("cover", "exit", "exit-l", "exit-r");
            void curtain.offsetWidth;
            curtain.style.transition = "";
          }, 340);
        }, 170);
        return;
      }
      wipeSweep(dir);
    }
    commit();
  }

  function goToSection(id, opts) {
    var page = byId(id);
    if (!page) return false;
    var el = document.getElementById(page.id);
    if (page.n !== current()) apply(page.n, opts);
    else setUrl(page);
    if (el && opts && opts.scroll !== false) {
      setTimeout(function () {
        var y = el.getBoundingClientRect().top + (window.scrollY || 0) - headerH() - 12;
        window.scrollTo({ top: Math.max(y, 0), behavior: reduceMotion ? "auto" : "smooth" });
      }, 90);
    }
    return true;
  }

  allGoto.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var n = parseInt(btn.getAttribute("data-goto"), 10);
      if (!n) return;
      // The logo is an <a href="#about">: without this the browser also follows the hash.
      e.preventDefault();
      // Keyboard "clicks" report 0,0; start those from the tab instead.
      var origin = e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : tabPoint(n);
      if (n === current()) window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      else apply(n, {}, origin);
    });
  });

  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
    // [data-goto] links are handled above; handling them here too ran the switch twice.
    if (!a || a.hasAttribute("data-goto")) return;
    var raw = a.getAttribute("href").slice(1);
    if (!raw) return;
    var page = byId(raw);
    if (!page) return;
    e.preventDefault();
    goToSection(page.id);
  });

  topPager.addEventListener("keydown", function (e) {
    var idx = -1;
    tabs.forEach(function (b, i) {
      if (b === document.activeElement) idx = i;
    });
    if (idx === -1) return;
    var next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % tabs.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    tabs[next].focus();
    apply(parseInt(tabs[next].getAttribute("data-goto"), 10));
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    if (e.target && e.target.closest && e.target.closest('[role="tablist"]')) return;
    var tag = (document.activeElement && document.activeElement.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || (document.activeElement && document.activeElement.isContentEditable)) return;
    if (e.key === "ArrowRight") apply(Math.min(current() + 1, TOTAL));
    else apply(Math.max(current() - 1, 1));
  });

  function fromHash() {
    var h = (location.hash || "").replace(/^#\/?/, "");
    if (!h) return 1;
    var m = h.match(/^page-([1-4])$/);
    if (m) return parseInt(m[1], 10);
    var page = byId(h);
    return page ? page.n : 1;
  }
  window.addEventListener("hashchange", function () {
    var n = fromHash();
    if (n !== current()) apply(n);
  });

  function realign() {
    moveSlider(current(), false);
    setProgress(current());
  }
  window.addEventListener("resize", realign);
  window.addEventListener("load", realign);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(realign);
  if (window.ResizeObserver && topPager) {
    new ResizeObserver(realign).observe(topPager);
  }
  setTimeout(realign, 300);

  var backToTop = document.getElementById("backToTop");
  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  var startHash = location.hash;
  apply(fromHash(), { instant: true });
  if (startHash && current() === 1) {
    // An old "#about" link: if the browser still scrolls to the fragment once the
    // page has loaded, put the visitor back on the hero unless they already scrolled.
    var touched = false;
    var markTouched = function () {
      touched = true;
    };
    ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (type) {
      window.addEventListener(type, markTouched, { once: true, passive: true });
    });
    window.addEventListener("load", function () {
      if (!touched && window.scrollY > 0) jumpTop();
    });
  }
})();
