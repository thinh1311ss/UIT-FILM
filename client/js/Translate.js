// Translate.js — i18n for text + all data-i18n-* attributes

let currentLang = localStorage.getItem("language") || "vi";
let listenersBound = false;

// Load language file
async function loadTranslations(lang) {
  try {
    const key = 'locale_' + lang;
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() <= parsed.exp) {
          window.translations = parsed.data;
          return window.translations;
        }
        sessionStorage.removeItem(key);
      }
    } catch {}
    const res = await fetch(`../../public/locales/${lang}.json`);
    const data = await res.json();

    window.translations = data;
    try {
      sessionStorage.setItem(key, JSON.stringify({ data, exp: Date.now() + 30 * 60 * 1000 }));
    } catch {}

    return window.translations;
  } catch (error) {
    console.error("Load translations failed:", error);
    window.translations = {};
    return {};
  }
}

// Apply translations to text and attributes with data-i18n- prefix
function translatePage(translations) {
  // text node
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[key] !== undefined) {
      el.textContent = translations[key];
    }
  });

  // any attribute: data-i18n-attrName="key"
  document.querySelectorAll("*").forEach((el) => {
    for (const attr of el.attributes) {
      if (!attr.name.startsWith("data-i18n-") || attr.name === "data-i18n")
        continue;
      const targetAttr = attr.name.replace("data-i18n-", "");
      const key = attr.value;
      const val = translations[key];
      if (val !== undefined) el.setAttribute(targetAttr, val);
    }
  });
}

// Update language label and button states
function updateLanguageLabel(lang) {
  const langLabel = document.querySelector(".current-lang-label");
  const langOptions = document.querySelectorAll(".lang-option");
  if (langLabel)
    langLabel.textContent = lang === "vi" ? "Vietnamese" : "English";
  langOptions.forEach((opt) => {
    const optLang = opt.getAttribute("data-lang");
    opt.classList.toggle("is-active", optLang === lang);
  });
}

// Initialization
export async function initTranslate() {
  document.documentElement.lang = currentLang;
  const translations = await loadTranslations(currentLang);
  translatePage(translations);
  updateLanguageLabel(currentLang);

  if (!listenersBound) {
    document.querySelectorAll(".lang-option").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const lang = e.currentTarget.getAttribute("data-lang");
        if (!lang || lang === currentLang) return;

        currentLang = lang;
        localStorage.setItem("language", lang);
        document.documentElement.lang = lang;

        location.reload();
      });
    });
    listenersBound = true;
  }
}
