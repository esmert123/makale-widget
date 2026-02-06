// ─────────────────────────────────────────────────────────
// VELO SAYFA KODU — Wix Editör > Page Code bölümüne yapıştır
// ─────────────────────────────────────────────────────────
// Gereksinimler:
//   1) Sayfada bir HtmlComponent olmalı → id: #html1
//   2) CMS (Content Manager) koleksiyonu: "Makaleler"
//      Alan (field) isimleri aşağıda belirtilmiştir.
//      Eğer kendi koleksiyonunda farklı field key'lerin varsa
//      FIELD_MAP objesini güncelle.
// ─────────────────────────────────────────────────────────

import wixData from "wix-data";

// ── CMS Koleksiyon adı ──
const COLLECTION = "Makaleler";

// ── CMS field key → widget field eşlemesi ──
// Sol taraf: CMS'deki field key (Content Manager'da görünen)
// Sağ taraf: widget'ın beklediği alan adı
// NOT: Wix CMS field key'leri genellikle camelCase olur.
//      Content Manager > Collection > alan ismine tıklayınca
//      "Field Key" kısmında gerçek key'i görebilirsin.
const FIELD_MAP = {
  title:       "title",        // Makale başlığı (text)
  authors:     "authors",      // Yazarlar, noktalı virgülle ayrılmış (text)
  year:        "year",         // Yayın yılı (number)
  highlights:  "highlights",   // Etiketler/kategoriler (tags veya text[])
  doi:         "doi",          // DOI numarası veya URL (text)
  abstract1:   "abstract",     // Özet (text)  — "abstract" reserved olabilir, abstract1 kullan
  imageUrl:    "imageUrl",     // Görsel URL (image veya url)
  figureNote:  "figureNote",   // Şekil notu (text)
  results:     "results",      // Bulgular (tags veya text[])
  note:        "note",         // Ek not (text)
};

// ── Logo URL'leri (statik veya CMS'den çekilebilir) ──
const LOGOS = {
  ktu:      "https://static.wixstatic.com/media/YOUR_KTU_LOGO.png",
  manyetam: "https://static.wixstatic.com/media/YOUR_MANYETAM_LOGO.png",
};

$w.onReady(function () {
  loadArticlesAndSend();

  // HTML bileşeninden gelen mesajları dinle (opsiyonel)
  $w("#html1").onMessage((event) => {
    const msg = event.data;
    if (msg && msg.type === "widgetReady") {
      // Widget hazır olduğunu bildirdi, veriyi tekrar gönder
      loadArticlesAndSend();
    }
  });
});

async function loadArticlesAndSend() {
  try {
    // CMS'den tüm makaleleri çek (1000'e kadar)
    const result = await wixData
      .query(COLLECTION)
      .limit(1000)
      .descending("year")
      .find();

    const articles = result.items.map((item, index) => {
      const mapped = { id: item._id || String(index) };

      for (const [cmsKey, widgetKey] of Object.entries(FIELD_MAP)) {
        let val = item[cmsKey];

        // Wix image field'ları "wix:image://..." formatında olabilir
        if (widgetKey === "imageUrl" && val && val.startsWith("wix:image://")) {
          // Wix image URL'ini kullanılabilir hale getir
          // Media Manager URL'i doğrudan kullanılabilir;
          // eğer sorun çıkarsa image alanı yerine URL alanı kullan
          val = val;
        }

        // Tags alanı Wix'te array olarak gelir
        if (Array.isArray(val)) {
          mapped[widgetKey] = val;
        } else {
          mapped[widgetKey] = val ?? "";
        }
      }

      return mapped;
    });

    // HTML bileşenine postMessage ile gönder
    $w("#html1").postMessage({
      type: "articlesData",
      articles: articles,
      logos: LOGOS,
    });

    console.log(`✓ ${articles.length} makale HTML bileşenine gönderildi.`);
  } catch (err) {
    console.error("CMS veri çekme hatası:", err);
  }
}
