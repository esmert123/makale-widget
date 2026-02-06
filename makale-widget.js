// ─────────────────────────────────────────────────────────
// Makale Widget — Wix HtmlComponent (iframe) içinde çalışır
// Velo page code'undan postMessage ile veri alır.
//
// Kullanım:
//   1) embed-widget.html dosyasını Wix HtmlComponent'e yapıştır
//      (bu script zaten o dosyanın içinde gömülü)
//   2) VEYA bu dosyayı ayrı barındırıp iframe src olarak kullan
// ─────────────────────────────────────────────────────────
(function(){
  var articles = [];
  var logos = {};
  var activeId = null;

  var root      = document.getElementById("worksPapersWidget");
  var loading   = document.getElementById("loadingState");
  var listEl    = document.getElementById("wList");
  var searchEl  = document.getElementById("wSearch");
  var countEl   = document.getElementById("wCount");
  var titleEl   = document.getElementById("wTitle");
  var authorsEl = document.getElementById("wAuthors");
  var yearEl    = document.getElementById("wYear");
  var chipsEl   = document.getElementById("wChips");
  var doiBtnEl  = document.getElementById("wDoiBtn");
  var absEl     = document.getElementById("wAbstract");
  var imgBoxEl  = document.getElementById("wImageBox");
  var figNoteEl = document.getElementById("wFigNote");
  var resEl     = document.getElementById("wResults");
  var noteEl    = document.getElementById("wNote");

  function setText(el, v){ if(el) el.textContent = v ?? ""; }

  function setMaybe(el, v){
    var val = (v ?? "").toString().trim();
    if(!el) return;
    el.textContent = val;
    el.style.display = val ? "block" : "none";
  }

  function hrefFromDoi(doi){
    var d = (doi || "").trim();
    if(!d) return "";
    if(/^https?:\/\//i.test(d)) return d;
    return "https://doi.org/" + d;
  }

  function doiBtnLabel(doi){
    var d = (doi || "").trim();
    if(!d) return "DOI";
    if(/^https?:\/\//i.test(d) && !/doi\.org/i.test(d)) return "LINK";
    return "DOI";
  }

  function escapeHtml(str){
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function buildList(items){
    listEl.innerHTML = "";
    countEl.textContent = items.length + " adet";

    items.forEach(function(a){
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "w-item" + (a.id === activeId ? " active" : "");
      btn.setAttribute("role","option");
      btn.setAttribute("aria-selected", a.id === activeId ? "true":"false");

      var firstTag = (a.highlights && a.highlights[0]) ? a.highlights[0] : "Makale";
      var auth = (a.authors || "").trim();
      var parts = auth.split(";");
      var authShort = auth ? parts.slice(0,2).join("; ") + (parts.length > 2 ? "..." : "") : "";

      btn.innerHTML =
        '<div class="w-itemTop">' +
          '<div class="t">' + escapeHtml(a.title || "") + '</div>' +
          '<div class="w-badges">' +
            '<span class="w-badge">' + escapeHtml(String(a.year ?? "")) + '</span>' +
            '<span class="w-badge">' + escapeHtml(firstTag) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="m">' + escapeHtml(authShort) + '</div>';

      btn.addEventListener("click", function(){
        activeId = a.id;
        buildList(filterArticles(searchEl.value));
        render(a);
      });

      listEl.appendChild(btn);
    });
  }

  function buildChips(a){
    chipsEl.innerHTML = "";
    var arr = a.highlights || [];
    if(!arr.length){ chipsEl.style.display="none"; return; }
    chipsEl.style.display="flex";
    arr.forEach(function(h){
      var s = document.createElement("span");
      s.className = "chip";
      s.textContent = h;
      chipsEl.appendChild(s);
    });
  }

  function buildResults(a){
    resEl.innerHTML = "";
    (a.results || []).forEach(function(r){
      var li = document.createElement("li");
      li.textContent = r;
      resEl.appendChild(li);
    });
  }

  function buildImage(a){
    imgBoxEl.innerHTML = "";
    if(a.imageUrl){
      var img = document.createElement("img");
      img.src = a.imageUrl;
      img.alt = a.title || "Makale gorseli";
      img.loading = "lazy";
      imgBoxEl.appendChild(img);
    } else {
      var empty = document.createElement("div");
      empty.className = "imgEmpty";
      imgBoxEl.appendChild(empty);
    }
    setMaybe(figNoteEl, a.figureNote || "");
  }

  function render(a){
    setText(titleEl, a.title);
    setText(authorsEl, a.authors);
    setText(yearEl, a.year);
    buildChips(a);

    var href = hrefFromDoi(a.doi);
    doiBtnEl.href = href || "#";
    doiBtnEl.textContent = doiBtnLabel(a.doi);
    doiBtnEl.style.pointerEvents = href ? "auto" : "none";
    doiBtnEl.style.opacity = href ? "1" : ".45";

    setText(absEl, a.abstract || "");
    buildImage(a);
    buildResults(a);
    setMaybe(noteEl, a.note || "");
  }

  function filterArticles(q){
    q = (q || "").trim().toLowerCase();
    if(!q) return articles;
    return articles.filter(function(a){
      var hay = [
        a.title, a.authors, a.doi, String(a.year||""),
        (a.highlights||[]).join(" ")
      ].join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  searchEl.addEventListener("input", function(){
    var filtered = filterArticles(searchEl.value);
    if(filtered.length && !filtered.some(function(x){ return x.id===activeId; })){
      activeId = filtered[0].id;
    }
    buildList(filtered);
    var cur = filtered.find(function(x){ return x.id===activeId; });
    if(cur) render(cur);
  });

  // ── Veri geldiğinde widget'ı başlat ──
  function initWidget(data){
    articles = data.articles || [];
    logos = data.logos || {};

    articles.sort(function(a,b){ return (b.year||0) - (a.year||0); });

    var logoKtu = document.getElementById("logoKtu");
    var logoMany = document.getElementById("logoManyetam");
    if(logoKtu && logos.ktu){ logoKtu.src = logos.ktu; logoKtu.style.display = "inline"; }
    if(logoMany && logos.manyetam){ logoMany.src = logos.manyetam; logoMany.style.display = "inline"; }

    activeId = articles[0] ? articles[0].id : null;

    if(loading) loading.style.display = "none";
    if(root) root.classList.add("loaded");

    buildList(articles);
    if(articles[0]) render(articles[0]);
  }

  // ── Wix postMessage dinleyicisi ──
  window.onmessage = function(event){
    if(!event.data) return;
    var msg = event.data;
    if(typeof msg === "string"){
      try { msg = JSON.parse(msg); } catch(e){ return; }
    }
    if(msg.type === "articlesData"){
      initWidget(msg);
    }
  };

  // Widget hazır sinyali gönder
  if(window.parent !== window){
    window.parent.postMessage({ type: "widgetReady" }, "*");
  }
})();
