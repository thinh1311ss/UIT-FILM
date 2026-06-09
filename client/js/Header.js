import { jwtDecode } from "https://cdn.jsdelivr.net/npm/jwt-decode@4.0.0/+esm";

(function () {
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  var s = document.createElement("script");
  s.defer = true;
  s.src = "/_vercel/insights/script.js";
  document.head.appendChild(s);
})();

function saveLanguagePreference(lang) {
  localStorage.setItem("selectedLanguage", lang);
}

function loadLanguagePreference() {
  return localStorage.getItem("selectedLanguage");
}

function applyLanguagePreference(languageSwitchers) {
  const savedLang = loadLanguagePreference();

  languageSwitchers.forEach((switcher) => {
    const allOptions = switcher.querySelectorAll(".lang-option");
    const currentFlag = switcher.querySelector(".current-flag");

    allOptions.forEach((o) => o.classList.remove("is-active"));

    const matchingOption = Array.from(allOptions).find(
      (o) => o.getAttribute("data-lang") === savedLang
    );

    if (matchingOption) {
      matchingOption.classList.add("is-active");

      if (currentFlag) {
        const optionFlag = matchingOption.querySelector(".flag-icon");
        if (optionFlag) {
          currentFlag.src = optionFlag.src;
          currentFlag.alt = savedLang === "vi" ? "VN" : "UK";
          currentFlag.setAttribute("data-lang", savedLang);
        }
      }
    }
  });
}

function checkAuthStatus() {
  const accessToken = localStorage.getItem("accessToken");
  const guest = document.getElementById("user_guest");
  const logged = document.getElementById("main_user");

  if (!guest || !logged) {
    setTimeout(checkAuthStatus, 100);
    return;
  }
  if (accessToken) {
    guest.classList.add("hidden");
    logged.classList.remove("hidden");
    loadUserInfo();
    checkAdminRole();
  } else {
    guest.classList.remove("hidden");
    logged.classList.add("hidden");
    removeAdminMenu();
  }
}

function loadUserInfo() {
  const userName = document.querySelector(".user-name span");
  if (userName) {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        const payloadDecoded = jwtDecode(accessToken);
        userName.textContent = payloadDecoded.username || "User";
      } else {
        userName.textContent = "User";
      }
    } catch (error) {
      userName.textContent = "User";
    }
  }
}

function removeAdminMenu() {
  const existingAdminMenu = document.getElementById("admin-menu-item");
  if (existingAdminMenu) existingAdminMenu.remove();

  const existingSeparator = document.getElementById("admin-menu-separator");
  if (existingSeparator) existingSeparator.remove();
}

function createAdminMenu() {
  removeAdminMenu();

  const dropdownList = document.querySelector(
    ".user-dropdown-menu .dropdown-list"
  );
  if (!dropdownList) return;

  const logoutBtn = document.getElementById("Log-out-Btn");
  if (!logoutBtn) return;

  const adminMenuItem = document.createElement("a");
  adminMenuItem.id = "admin-menu-item";
  adminMenuItem.className = "dropdown-item";
  adminMenuItem.href = "AdminUsers.html";
  adminMenuItem.innerHTML = `
    <div class="line-center">
      <i class="fa-solid fa-users-gear"></i>
      <span>Quản lý</span>
    </div>
  `;

  const separator = document.createElement("hr");
  separator.id = "admin-menu-separator";

  const parent = logoutBtn.parentNode;
  parent.insertBefore(adminMenuItem, logoutBtn);
  parent.insertBefore(separator, logoutBtn);
}

function checkAdminRole() {
  const accessToken = localStorage.getItem("accessToken");

  if (accessToken) {
    try {
      const payloadDecoded = jwtDecode(accessToken);
      const role = payloadDecoded.role || "";
      if (role.toLowerCase() === "admin") {
        createAdminMenu();
      } else {
        removeAdminMenu();
      }
    } catch (error) {
      removeAdminMenu();
    }
  } else {
    removeAdminMenu();
  }
}

function closeAllDropdowns() {
  document.querySelectorAll(".language-switcher").forEach((switcher) => {
    switcher.classList.remove("open");
    switcher
      .querySelector(".swap-language")
      ?.setAttribute("aria-expanded", "false");
  });

  document
    .querySelector(".user-dropdown-menu .dropdown-list")
    ?.classList.remove("show");

  document
    .querySelector(".menu-film-type.dropdown")
    ?.classList.remove("toggled");
}

export async function headerjs() {
  const { initTranslate } = await import("./Translate.js");
  await initTranslate();

  const menuToggle = document.querySelector(".menu-toggle");
  const searchGroup = document.querySelector(".search-group");
  const searchNav = document.querySelector(".search-toggle");
  const searchBox = document.querySelector(".search");
  const logo = document.querySelector(".header-logo");
  const dropdown = document.querySelector(".menu-film-type.dropdown");
  const dropdownBtn = document.querySelector(".dropdown-toggle");
  const languageSwitchers = document.querySelectorAll(".language-switcher");
  const userDropdownMenu = document.querySelector(".user-dropdown-menu");
  const dropdownList = userDropdownMenu?.querySelector(".dropdown-list");

  checkAuthStatus();
  applyLanguagePreference(languageSwitchers);

  menuToggle.addEventListener("click", () => {
    if (searchNav.classList.contains("toggled")) {
      searchNav.classList.remove("toggled");
      searchBox.classList.remove("toggled");
      logo.classList.remove("hidden");
      menuToggle.classList.remove("hidden");
      languageSwitchers.forEach((ls) => ls.classList.remove("hidden"));
    }
    menuToggle.classList.toggle("toggled");
    searchGroup.classList.toggle("toggled");
  });

  languageSwitchers.forEach((languageSwitch) => {
    const langBtn = languageSwitch.querySelector(".swap-language");
    const langOptions = languageSwitch.querySelectorAll(".lang-option");

    langBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const wasOpen = languageSwitch.classList.contains("open");

      closeAllDropdowns();

      if (!wasOpen) {
        languageSwitch.classList.add("open");
        langBtn.setAttribute("aria-expanded", "true");
      }
    });

    langOptions.forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const selectedLang = opt.getAttribute("data-lang");
        const selectedFlagSrc = opt.querySelector(".flag-icon").src;

        saveLanguagePreference(selectedLang);

        languageSwitchers.forEach((switcher) => {
          const allOptions = switcher.querySelectorAll(".lang-option");
          const currentFlag = switcher.querySelector(".current-flag");

          allOptions.forEach((o) => o.classList.remove("is-active"));

          const matchingOption = Array.from(allOptions).find(
            (o) => o.getAttribute("data-lang") === selectedLang
          );
          if (matchingOption) {
            matchingOption.classList.add("is-active");
          }

          if (currentFlag) {
            currentFlag.src = selectedFlagSrc;
            currentFlag.alt = selectedLang === "vi" ? "VN" : "UK";
            currentFlag.setAttribute("data-lang", selectedLang);
          }

          switcher.classList.remove("open");
          switcher
            .querySelector(".swap-language")
            .setAttribute("aria-expanded", "false");
        });
      });
    });
  });

  searchNav.addEventListener("click", () => {
    if (menuToggle.classList.contains("toggled")) {
      menuToggle.classList.remove("toggled");
      searchGroup.classList.remove("toggled");
    }
    searchNav.classList.toggle("toggled");
    searchBox.classList.toggle("toggled");
    logo.classList.toggle("hidden");
    menuToggle.classList.toggle("hidden");
    languageSwitchers.forEach((ls) => ls.classList.toggle("hidden"));
  });

  if (dropdownBtn) {
    dropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const wasOpen = dropdown.classList.contains("toggled");

      closeAllDropdowns();

      if (!wasOpen) {
        dropdown.classList.add("toggled");
      }
    });
  }

  if (userDropdownMenu && dropdownList) {
    userDropdownMenu.addEventListener("click", (e) => {
      e.stopPropagation();

      const wasOpen = dropdownList.classList.contains("show");

      closeAllDropdowns();

      if (!wasOpen) {
        dropdownList.classList.add("show");
      }
    });
  }

  document.addEventListener("click", (e) => {
    const isLanguageSwitcher = Array.from(languageSwitchers).some((ls) =>
      ls.contains(e.target)
    );
    const isUserDropdown = userDropdownMenu?.contains(e.target);
    const isCountryDropdown = dropdown?.contains(e.target);

    if (!isLanguageSwitcher && !isUserDropdown && !isCountryDropdown) {
      closeAllDropdowns();
    }
  });

  window.addEventListener("scroll", () => {
    const header = document.querySelector(".header");
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  const memberBtn = document.querySelector("#btn-member");
  if (memberBtn) {
    memberBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) return;

      let modal = document.querySelector(".modal");
      if (!modal) {
        const html = await (
          await fetch("../components/AuthModal.html")
        ).text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        document.body.appendChild(doc.querySelector(".modal"));

        doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
          const href = link.href;
          if (!document.querySelector(`link[href="${href}"]`)) {
            const newLink = Object.assign(document.createElement("link"), {
              rel: "stylesheet",
              href: href.startsWith("http")
                ? href
                : `/client${href.startsWith("/") ? "" : "/"}${href}`,
            });
            document.head.appendChild(newLink);
          }
        });

        const { initTranslate } = await import("./Translate.js");
        await initTranslate();

        const { Auth_Modaljs } = await import("./AuthModal.js");
        Auth_Modaljs();
        setTimeout(() => window.openLRFModal("login"), 50);
      } else {
        window.openLRFModal("login");
      }
    });
  }

  document.addEventListener("userLoggedIn", (e) => {
    checkAuthStatus();
  });

  const logOutBtn = document.querySelector("#Log-out-Btn");
  if (logOutBtn) {
    logOutBtn.addEventListener("click", (e) => {
      e.preventDefault();

      localStorage.removeItem("accessToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("refreshToken");

      checkAuthStatus();
      window.location.href = "HomePage.html";
    });
  }
}
