import { jwtDecode } from "https://cdn.jsdelivr.net/npm/jwt-decode@4.0.0/+esm";
import { initTranslate } from "./Translate.js";
import { API_URL } from "../config.js";

// Helper function to get translation
function t(key) {
  return window.translations?.[key] || key;
}

// Function to initialize all event listeners and functionalities
export async function initUserDetail() {
  // Load translations first
  await initTranslate();
  
  // Load user detail and favorites
  setTimeout(() => {
    getUserDetail();
    fetchUserDetail(); // Load favorites
  }, 500);

  // Toast functionality
  const toast = document.querySelector(".user-detail__toast");
  const toastButton = document.querySelector(".user-detail__toast-btn");

  if (toastButton) {
    toastButton.addEventListener("click", function () {
      toast.classList.remove("user-detail__toast--show");
    });
  }

  // Handle Save Personal Info button
  const savePersonalInfoBtn = document.querySelector(".save-personal-info");
  if (savePersonalInfoBtn) {
    console.log(t("userdetail.console.foundSaveBtn"));
    savePersonalInfoBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (validateForm()) {
        updateInformation();
      }
    });
  } else {
    console.log(t("userdetail.console.notFoundSaveBtn"));
  }

  // Handle Update Password button
  const updatePasswordBtn = document.querySelector(".update-password");
  if (updatePasswordBtn) {
    console.log(t("userdetail.console.foundPasswordBtn"));
    updatePasswordBtn.addEventListener("click", function (e) {
      e.preventDefault();
      updatePassword();
    });
  } else {
    console.log(t("userdetail.console.notFoundPasswordBtn"));
  }

  // Modal functionality
  const modal = document.querySelector(".user-detail__modal-backdrop");
  const cancelButtons = document.querySelectorAll(".user-detail__btn--secondary");

  cancelButtons.forEach((button) => {
    if (!button.closest(".user-detail__modal")) {
      button.addEventListener("click", function () {
        showModal();
      });
    }
  });

  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        hideModal();
      }
    });

    // Close modal with cancel button in modal
    const modalCancel = modal.querySelector(".user-detail__btn--secondary");
    if (modalCancel) {
      modalCancel.addEventListener("click", function () {
        hideModal();
      });
    }

    // Confirm action in modal
    const modalConfirm = modal.querySelector(
      ".user-detail__btn:not(.user-detail__btn--secondary)"
    );
    if (modalConfirm) {
      modalConfirm.addEventListener("click", function () {
        hideModal();
        showToast(t("userdetail.actionConfirmed"));
      });
    }
  }

  // Navigation functionality - Handle tab switching
  const navButtons = document.querySelectorAll(".user-detail__nav-btn");
  console.log(t("userdetail.console.foundNavButtons").replace("{{count}}", navButtons.length));
  
  navButtons.forEach((button) => {
    button.addEventListener("click", function () {
      navButtons.forEach((btn) =>
        btn.classList.remove("user-detail__nav-btn--active")
      );
      this.classList.add("user-detail__nav-btn--active");

      const sectionId = this.getAttribute("data-section");
      handleNavigation(sectionId);

      // Scroll up when opening Personal Info
      if (sectionId === "personal-info") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      // Scroll down when opening Favorites
      if (sectionId === "favorites") {
        setTimeout(() => {
          requestAnimationFrame(() => {
            const favSection = document.getElementById("favorites-section");
            if (favSection) {
              favSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          });
        }, 350);
      }
    });
  });

  // Form validation for password fields
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  passwordInputs.forEach((input) => {
    input.addEventListener("blur", function () {
      validatePasswordField(this);
    });
  });

  // Logout functionality
  const logoutButton = document.querySelector(".user-detail__logout");
  if (logoutButton) {
    console.log(t("userdetail.console.foundLogoutBtn"));
    logoutButton.addEventListener("click", function (e) {
      e.preventDefault();

      if (confirm(t("userdetail.logoutConfirm"))) {
        // Xóa tất cả thông tin user khỏi localStorage
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("refreshToken");

        showToast(t("userdetail.logoutSuccess"));
        
        setTimeout(() => {
          window.location.href = "HomePage.html";
        }, 1000);
      }
    });
  }

  console.log(t("userdetail.console.initialized"));
}

// Load user detail from basic endpoint
async function getUserDetail() {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setTimeout(() => {
        window.location.href = "../../Pages/Login.html";
      }, 1500);
      return;
    }

    const payloadDecoded = jwtDecode(token);
    const userId = payloadDecoded._id;

    const response = await fetch(
      `${API_URL}/api/authUser/userDetail/${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(t("userdetail.errors.cannotLoadUser"));
    }

    const userData = await response.json();
    displayUserInformation(userData);
  } catch (error) {
    console.error("Error loading user info:", error);
    showToast(t("userdetail.loadError"));
  }
}

function displayUserInformation(userData) {
  const nameField = document.getElementById("name");
  const emailField = document.getElementById("email");
  const joinDateField = document.getElementById("joinDate");
  const userName = document.querySelector(".user-detail__name");

  const user = userData.user || userData;

  if (nameField && user.userName) nameField.value = user.userName;
  if (emailField && user.email) emailField.value = user.email;

  if (joinDateField && user.joinDate) {
    try {
      const joinYear = user.joinDate.split("-")[0];
      const joinMonth = user.joinDate.split("-")[1];
      const joinDay = user.joinDate.split("-")[2].substring(0, 2);
      const joinDate = joinDay + "/" + joinMonth + "/" + joinYear;
      joinDateField.value = joinDate;
      joinDateField.setAttribute("readonly", true);
      joinDateField.style.cursor = "not-allowed";
    } catch (error) {
      console.warn("Invalid joinDate format:", user.joinDate);
    }
  }
  if (userName && user.userName) userName.textContent = user.userName;
}

async function updateInformation() {
  try {
    const token = localStorage.getItem("accessToken");
    const payloadDecoded = jwtDecode(token);
    const userId = payloadDecoded._id;

    const nameField = document.getElementById("name");
    const emailField = document.getElementById("email");

    const updatedData = {
      name: nameField ? nameField.value.trim() : "",
      email: emailField ? emailField.value.trim() : "",
    };

    const response = await fetch(
      `${API_URL}/api/authUser/updateInfo/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      }
    );

    if (response.status !== 200) {
      throw new Error(t("userdetail.errors.cannotUpdateInfo"));
    }

    const result = await response.json();
    showToast(t("userdetail.changesSaved"));
    
    if (result.userName) {
      const userName = document.querySelector(".user-detail__name");
      if (userName) userName.textContent = result.userName;
    }
  } catch (error) {
    console.error("Error saving user info:", error);
    showToast(t("userdetail.saveError"));
  }
}

async function updatePassword() {
  try {
    const token = localStorage.getItem("accessToken");
    const payloadDecoded = jwtDecode(token);
    const userId = payloadDecoded._id;

    const currentPasswordField = document.getElementById("current-password");
    const newPasswordField = document.getElementById("new-password");
    const confirmPasswordField = document.getElementById("confirm-password");

    if (
      !currentPasswordField.value.trim() ||
      !newPasswordField.value.trim() ||
      !confirmPasswordField.value.trim()
    ) {
      showToast(t("userdetail.fillAllFields"));
      return;
    }

    if (newPasswordField.value !== confirmPasswordField.value) {
      showToast(t("userdetail.passwordMismatch"));
      return;
    }

    if (newPasswordField.value.length < 6) {
      showToast(t("userdetail.passwordMinLength"));
      return;
    }

    const updatedData = {
      currentPassword: currentPasswordField.value.trim(),
      newPassword: newPasswordField.value.trim(),
    };

    const response = await fetch(
      `${API_URL}/api/authUser/updatePassword/${userId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      }
    );

    const result = await response.json();

    if (response.status === 200) {
      showToast(result.message || t("userdetail.passwordChangeSuccess"));

      // Reset input fields
      currentPasswordField.value = "";
      newPasswordField.value = "";
      confirmPasswordField.value = "";
    } else {
      showToast(result.message || t("userdetail.passwordChangeFailed"));
    }
  } catch (error) {
    console.error("Error updating password:", error);
    showToast(t("userdetail.passwordError"));
  }
}

// Function to show toast message
function showToast(message) {
  const toast = document.querySelector(".user-detail__toast");
  const toastText = toast.querySelector("span");

  if (toastText) {
    toastText.textContent = message;
  } else {
    toast.childNodes[0].textContent = message + " ";
  }

  toast.classList.add("user-detail__toast--show");

  // Auto hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove("user-detail__toast--show");
  }, 3000);
}

function showModal() {
  const modal = document.querySelector(".user-detail__modal-backdrop");
  if (modal) modal.style.display = "flex";
}

function hideModal() {
  const modal = document.querySelector(".user-detail__modal-backdrop");
  if (modal) modal.style.display = "none";
}

function validateForm() {
  let isValid = true;

  const requiredFields = document.querySelectorAll("input[required]");
  requiredFields.forEach((field) => {
    if (!field.value.trim()) {
      showError(field, t("userdetail.errors.fieldRequired"));
      isValid = false;
    } else {
      clearError(field);
    }
  });

  const emailField = document.getElementById("email");
  if (emailField && emailField.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailField.value)) {
      showError(emailField, t("userdetail.errors.invalidEmail"));
      isValid = false;
    }
  }

  const newPassword = document.getElementById("new-password");
  const confirmPassword = document.getElementById("confirm-password");

  if (
    newPassword &&
    confirmPassword &&
    newPassword.value &&
    confirmPassword.value
  ) {
    if (newPassword.value !== confirmPassword.value) {
      showError(confirmPassword, t("userdetail.errors.passwordNotMatch"));
      isValid = false;
    }
  }

  return isValid;
}

function validatePasswordField(field) {
  if (field.value && field.value.length < 6) {
    showError(field, t("userdetail.errors.passwordTooShort"));
    return false;
  } else {
    clearError(field);
    return true;
  }
}

function showError(field, message) {
  field.classList.add("user-detail__input--invalid");

  const existingError = field.parentNode.querySelector(".user-detail__error");
  if (existingError) existingError.remove();

  const errorElement = document.createElement("div");
  errorElement.className = "user-detail__error";
  errorElement.textContent = message;
  errorElement.style.display = "block";

  field.parentNode.appendChild(errorElement);
}

function clearError(field) {
  field.classList.remove("user-detail__input--invalid");
  const errorElement = field.parentNode.querySelector(".user-detail__error");
  if (errorElement) errorElement.remove();
}

function handleNavigation(sectionId) {
  // Hide all sections
  const allSections = document.querySelectorAll(".user-detail__section");
  allSections.forEach((section) => {
    section.classList.remove("user-detail__section--active");
  });

  // Show selected section
  const targetSection = document.getElementById(`${sectionId}-section`);
  if (targetSection) {
    targetSection.classList.add("user-detail__section--active");
  } else {
    console.log(t("userdetail.console.unknownSection"), sectionId);
  }
}

// Fetch user detail from server (including favorites)
async function fetchUserDetail() {
  try {
    const res = await fetch(`${API_URL}/api/authUser/getUser`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    if (!res.ok) throw new Error(t("userdetail.errors.loadUserFailed"));

    const data = await res.json();

    // If there is a list of favorites
    if (data.user.favoriteFilm) {
      renderFavorites(data.user.favoriteFilm);
    }
  } catch (err) {
    console.error("Fetch user detail error:", err);
  }
}

// Render favorite movies list
function renderFavorites(favorites) {
  const container = document.querySelector(".favorites-list");
  if (!container) {
    console.error("Favorites container not found");
    return;
  }

  container.innerHTML = "";

  if (!favorites || favorites.length === 0) {
    container.innerHTML = `
      <div class="empty-favorites">
        <i class="bx bx-heart"></i>
        <p data-i18n="userdetail.emptyFavorites">${t("userdetail.emptyFavorites")}</p>
        <a href="../pages/HomePage.html" class="btn browse-movies-btn" data-i18n="userdetail.browseMovies">${t("userdetail.browseMovies")}</a>
      </div>
    `;
    return;
  }

  const uniqueFavorites = favorites.filter(
    (film, index, self) =>
      index ===
      self.findIndex(
        (f) =>
          f._id === film._id ||
          f.id === film.id ||
          (f.title === film.title && f.originalName === film.originalName)
      )
  );

  if (uniqueFavorites.length === 0) {
    container.innerHTML = `
      <div class="empty-favorites">
        <i class="bx bx-heart"></i>
        <p data-i18n="userdetail.emptyFavorites">${t("userdetail.emptyFavorites")}</p>
        <a href="../pages/HomePage.html" class="btn browse-movies-btn" data-i18n="userdetail.browseMovies">${t("userdetail.browseMovies")}</a>
      </div>
    `;
    return;
  }

  const grid = document.createElement("div");
  grid.className = "favorites-grid";

  uniqueFavorites.forEach((film) => {
    const filmId = film.id;
    if (!filmId) return;

    const filmCard = document.createElement("div");
    filmCard.className = "favorite-card";
    filmCard.setAttribute("data-film-id", filmId);

    // Check type properly
    const typeStr = String(film.type || "").toLowerCase().trim();
    const isTV = typeStr === "tv" || typeStr === "tvshow" || typeStr === "series";

    const typeBadge = isTV
      ? `<div class="favorite-card__episode-badge">${t("badge.tvshow")}</div>`
      : `<div class="favorite-card__episode-badge">${t("badge.movie")}</div>`;

    const detailHref = isTV
      ? `../pages/DetailPage.html`
      : `../pages/DetailPage.html`;

    filmCard.innerHTML = `
      <div class="favorite-card__container">
        <img
          src="${film.posterPath || "/images/default-poster.jpg"}"
          alt="${film.title || film.originalName || t("common.unknown")}"
          class="favorite-card__poster"
          onerror="this.src='/images/default-poster.jpg'"
        />
        <div class="favorite-card__info-top">
          ${typeBadge}
        </div>
        <button class="favorite-card__remove-btn" title="${t("userdetail.removeFromFavorites")}">
          <i class="bx bx-trash"></i>
        </button>
      </div>
      <div class="favorite-card__info">
        <div class="favorite-card__vietnamese-title">
          <span>${film.title || film.originalName || t("common.unknown")}</span>
        </div>
        <div class="favorite-card__original-title">
          <span>${film.originalName || ""}</span>
        </div>
      </div>
    `;

    const poster = filmCard.querySelector(".favorite-card__poster");
    if (poster) {
      poster.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const url = `${detailHref}?id=${filmId}${isTV ? "&type=tv" : ""}`;
        window.location.href = url;
      });
    }

    const removeBtn = filmCard.querySelector(".favorite-card__remove-btn");
    if (removeBtn) {
      removeBtn.addEventListener("click", async function (e) {
        e.preventDefault();
        e.stopPropagation();
        await removeFromFavorites(
          filmId,
          film.title || film.originalName,
          isTV ? "TV" : "Movie"
        );
      });
    }

    grid.appendChild(filmCard);
  });

  container.appendChild(grid);
}

// Function to remove a movie from the favorites list
async function removeFromFavorites(filmId, filmTitle, type = "Movie") {
  const confirmMsg = t("userdetail.removeConfirm").replace("{title}", filmTitle);
  
  if (!confirm(confirmMsg)) {
    return;
  }

  try {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${API_URL}/api/favorites/toggle`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: filmId.toString(),
        type: type,
      }),
    });

    if (response.ok) {
      showToast(t("userdetail.removeSuccess"));
      // Reload favorite movies list
      fetchUserDetail();
    } else {
      throw new Error("Lỗi khi xóa phim yêu thích");
    }
  } catch (error) {
    console.error("Remove from favorites error:", error);
    showToast(t("userdetail.removeError"));
  }
}

// Auto-init when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUserDetail);
} else {
  initUserDetail();
}