import { API_URL } from "../config.js";

class FavoritesManager {
  constructor() {
    this.isInitialized = false;
    this.currentFilm = null;
    this.API_BASE_URL = API_URL;
    this.translations = {};
    this.loadTranslations();
  }

  // Download translations
  async loadTranslations() {
    const lang = localStorage.getItem("language") || document.documentElement.lang || "vi";
    try {
      const res = await fetch(`../../public/locales/${lang}.json`);
      this.translations = await res.json();
    } catch (err) {
      console.error("Load translations error:", err);
    }
  }

  // Translation function
  t(key) {
    return this.translations[key] || key;
  }

  // Initialize manager
  init() {
    if (this.isInitialized) return;

    this.setupEventListeners();
    this.isInitialized = true;
  }

  // Setup event listeners
  setupEventListeners() {
    document.addEventListener("click", (e) => {
      const favoriteBtn = e.target.closest(
        ".movie-banner__button--like, .favorite-btn, .favorite"
      );
      if (favoriteBtn) {
        e.preventDefault();
        this.handleFavoriteClick(favoriteBtn);
      }
    });

    document.addEventListener("filmLoaded", (e) => {
      this.currentFilm = e.detail;
      this.updateFavoriteButtonState();
    });

    document.addEventListener("userLoggedIn", () => {
      this.updateFavoriteButtonState();
    });
  }

  // Method to get token from multiple sources
  getToken() {
    return localStorage.getItem("accessToken") || localStorage.getItem("token");
  }

  // Check if token is valid
  isValidToken(token) {
    if (!token) return false;

    try {
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) {
        this.clearInvalidToken();
        return false;
      }

      // JWT uses base64url - convert to standard base64 before atob
      const base64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      const now = Date.now() / 1000;

      if (payload.exp < now) {
        this.clearInvalidToken();
        return false;
      }

      return true;
    } catch (error) {
      this.clearInvalidToken();
      return false;
    }
  }

  // Clear invalid token
  clearInvalidToken() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
  }

  // Handle favorite button click
  async handleFavoriteClick(button, filmData = null) {
    const token = this.getToken();
    if (!token || !this.isValidToken(token)) {
      this.showLoginPrompt();
      return;
    }

    // Use filmData if provided, otherwise use currentFilm
    const film = filmData || this.currentFilm;

    if (!film) {
      return;
    }

    try {
      this.setButtonLoading(button, true);

      const response = await fetch(
        `${this.API_BASE_URL}/api/favorites/toggle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: film.id.toString(),
            type: film.type || "Movie",
            title: film.title,
            originalName: film.englishTitle || film.originalName,
            posterPath: film.thumbnailImage || film.posterPath,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        this.updateButtonAppearance(button, data.action === "added");
        
        // Use translations for notifications
        const message = data.action === "added" 
          ? this.t("favorite.addSuccess") 
          : this.t("favorite.removeSuccess");
        
        this.showNotification(
          message,
          data.action === "added" ? "success" : "info"
        );

        if (this.currentFilm && this.currentFilm.id === film.id) {
          this.currentFilm.isFavorite = data.action === "added";
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      const errorMessage = this.t("favorite.error") + ": " + error.message;
      this.showNotification(errorMessage, "error");
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  // Update favorite button state
  async updateFavoriteButtonState() {
    if (!this.currentFilm) return;

    const favoriteBtn = document.querySelector(".favorite, .favorite-btn");
    if (favoriteBtn) {
      const isFavorite = await this.checkFavoriteStatus(this.currentFilm.id);
      this.updateButtonAppearance(favoriteBtn, isFavorite);
    }
  }

  // Update button appearance
  updateButtonAppearance(button, isFavorite) {
    const svg = button.querySelector("svg");
    const path = svg?.querySelector("path");

    if (path) {
      if (isFavorite) {
        path.style.fill = "#ff4444";
        button.setAttribute("aria-label", this.t("userdetail.removeSuccess"));
        button.classList.add("active");
      } else {
        path.style.fill = "#fff";
        button.setAttribute("aria-label", this.t("detail.likeAria"));
        button.classList.remove("active");
      }
    }
  }

  // Set loading state for button
  setButtonLoading(button, isLoading) {
    if (isLoading) {
      button.classList.add("loading");
      button.disabled = true;
    } else {
      button.classList.remove("loading");
      button.disabled = false;
    }
  }

  // Show login prompt
  showLoginPrompt() {
    this.showNotification(
      this.t("favorite.loginRequired"),
      "info"
    );
  }

  // Show notification
  showNotification(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s ease;
      max-width: 300px;
    `;

    if (type === "success") {
      toast.style.backgroundColor = "#4CAF50";
    } else if (type === "error") {
      toast.style.backgroundColor = "#f44336";
    } else {
      toast.style.backgroundColor = "#2196F3";
    }

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";
    }, 100);

    setTimeout(() => {
      toast.style.transform = "translateX(100%)";
      toast.style.opacity = "0";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // Check favorite status of a film
  async checkFavoriteStatus(filmId) {
    const token = this.getToken();
    if (!token || !this.isValidToken(token)) {
      return false;
    }

    try {
      const response = await fetch(
        `${this.API_BASE_URL}/api/favorites/check/${filmId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data.success ? data.isFavorite : false;
    } catch (error) {
      return false;
    }
  }
}

// Initialize global instance
const favoritesManager = new FavoritesManager();

// Export for module
export { favoritesManager };