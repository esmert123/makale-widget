(function(){
  const root = document.getElementById("worksPapersWidget");
  if(!root) return;

  // Veriyi HTML'den al
  const dataAttr = root.getAttribute('data-articles');
  const logosAttr = root.getAttribute('data-logos');
  
  let articles = [];
  let logos = {};
  
  try {
    if(dataAttr) articles = JSON.parse(dataAttr);
    if(logosAttr) logos = JSON.parse(logosAttr);
  } catch(e) {
    console.error('Makale verisi yüklenemedi:', e);
    return;
  }

  articles.sort((a,b)=> (b.year||0) - (a.year||0));

  const logoKtu = root.querySelector("#logoKtu");
  const logoMany = root.querySelector("#logoManyetam");
  if(logoKtu && logos.ktu) logoKtu.src = logos.ktu;
  if(logoMany && logos.manyetam) logoMany.src = logos.manyetam;

  const listEl   = root.querySelector("#wList");
  const searchEl = root.querySelector("#wSearch");
  const countEl  = root.querySelector("#wCount");

  const titleEl   = root.querySelector("#wTitle");
  const authorsEl = root.querySelector("#wAuthors");
  const yearEl    = root.querySelector("#wYear");
  const chipsEl   = root.querySelector("#wChips");
  const doiBtnEl  = root.querySelector("#wDoiBtn");
  const absEl     = root.querySelector("#wAbstract");
  const imgBoxEl  = root.querySelector("#wImageBox");
  const figNoteEl = root.querySelector("#wFigNote");
  const resEl     = root.querySelector("#wResults");
  const noteEl    = root.querySelector("#wNote");

  let activeId = articles[0]?.id;

  function setText(el, v){ if(el) el.textContent = v ?? ""; }
  function setMaybe(el, v){
    const val = (v ?? "").toString().trim();
    if(!el) return;
    el.textContent = val;
    el.style.display = val ? "block" : "none";
  }

  function hrefFromDoi(doi){
    const d = (doi || "").trim();
    if(!d) return "";
    if(/^https?:\/\//i.test(d)) return d;
    return "https://doi.org/" + d;
  }

  function doiBtnLabel(doi){
    const d = (doi || "").trim();
    if(!d) return "DOI";
    if(/^https?:\/\//i.test(d) && !/doi\.org/i.test(d)) return "LINK";
    return "DOI";
  }

  function buildList(items){
    listEl.innerHTML = "";
    countEl.textContent = items.length + " adet";

    items.forEach(a=>{
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "w-item" + (a.id === activeId ? " active" : "");
      btn.setAttribute("role","option");
      btn.setAttribute("aria-selected", a.id === activeId ? "true":"false");

      const firstTag = (a.highlights && a.highlights[0]) ? a.highlights[0] : "Makale";
      const auth = (a.authors || "").trim();
      const authShort = auth ? auth.split(";").slice(0,2).join("; ") + (auth.split(";").length>2 ? "…" : "") : "";

      btn.innerHTML = `
        <div class="w-itemTop">
          <div class="t">${a.title || ""}</div>
          <div class="w-badges">
            <span class="w-badge">${a.year ?? ""}</span>
            <span class="w-badge">${firstTag}</span>
          </div>
        </div>
        <div class="m">${authShort}</div>
      `;

      btn.addEventListener("click", ()=>{
        activeId = a.id;
        buildList(filter(searchEl.value));
        render(a);
        try{ root.scrollIntoView({behavior:"smooth", block:"start"}); }catch(e){}
      });

      listEl.appendChild(btn);
    });
  }

  function buildChips(a){
    chipsEl.innerHTML = "";
    const arr = a.highlights || [];
    if(!arr.length){ chipsEl.style.display="none"; return; }
    chipsEl.style.display="flex";
    arr.forEach(h=>{
      const s = document.createElement("span");
      s.className = "chip";
      s.textContent = h;
      chipsEl.appendChild(s);
    });
  }

  function buildResults(a){
    resEl.innerHTML = "";
    (a.results || []).forEach(r=>{
      const li = document.createElement("li");
      li.textContent = r;
      resEl.appendChild(li);
    });
  }

  function buildImage(a){
    imgBoxEl.innerHTML = "";
    if(a.imageUrl){
      const img = document.createElement("img");
      img.src = a.imageUrl;
      img.alt = a.title || "Paper image";
      img.loading = "lazy";
      imgBoxEl.appendChild(img);
    } else {
      const empty = document.createElement("div");
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

    const href = hrefFromDoi(a.doi);
    doiBtnEl.href = href || "#";
    doiBtnEl.textContent = doiBtnLabel(a.doi);
    doiBtnEl.style.pointerEvents = href ? "auto" : "none";
    doiBtnEl.style.opacity = href ? "1" : ".45";

    setText(absEl, a.abstract || "");
    buildImage(a);
    buildResults(a);
    setMaybe(noteEl, a.note || "");
  }

  function filter(q){
    q = (q || "").trim().toLowerCase();
    if(!q) return articles;
    return articles.filter(a=>{
      const hay = [
        a.title, a.authors, a.doi, String(a.year||""),
        (a.highlights||[]).join(" ")
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  searchEl.addEventListener("input", ()=>{
    const filtered = filter(searchEl.value);
    if(filtered.length && !filtered.some(x=>x.id===activeId)) activeId = filtered[0].id;
    buildList(filtered);
    const cur = filtered.find(x=>x.id===activeId);
    if(cur) render(cur);
  });

  buildList(articles);
  if(articles[0]) render(articles[0]);
})();
