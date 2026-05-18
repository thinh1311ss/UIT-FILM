import { API_URL } from "../config.js";

let commentsData = [];
let currentRating = 0;
let currentFilmSlug = "";

function t(key) {
  if (window.translations?.[key]) return window.translations[key];
  const lang = localStorage.getItem("language") || "vi";
  const fb = {
    "comment.loginPrompt": { vi: "Vui lòng đăng nhập để bình luận", en: "Please login to comment" },
    "comment.deleteConfirm": { vi: "Xóa bình luận này?", en: "Delete this comment?" },
    "comment.deleteError": { vi: "Không thể xóa bình luận", en: "Cannot delete comment" },
    "comment.submitError": { vi: "Không thể gửi bình luận", en: "Cannot submit comment" },
    "comment.noReviews": { vi: "Chưa có đánh giá nào. Hãy là người đầu tiên!", en: "No reviews yet. Be the first!" },
    "comment.loginToReview": { vi: "Vui lòng đăng nhập để đánh giá...", en: "Please login to review..." },
    "comment.enterReview": { vi: "Nhập đánh giá của bạn...", en: "Enter your review..." },
    "comment.selectStars": { vi: "Vui lòng chọn số sao đánh giá!", en: "Please select star rating!" },
    "comment.thankYou": { vi: "Cảm ơn bạn đã đánh giá!", en: "Thank you for your review!" },
    "comment.deleteBtn": { vi: "Xóa", en: "Delete" },
    "comment.defaultUser": { vi: "Người dùng", en: "User" },
  };
  return fb[key]?.[lang] || fb[key]?.vi || key;
}

function getToken() {
  return localStorage.getItem("accessToken") || localStorage.getItem("token");
}

function getFilmSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get("slug") || params.get("id") || "";
}

function getDecodedToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function calculateAverage(comments) {
  const rated = comments.filter((c) => c.rating && c.rating > 0);
  if (rated.length === 0) return 0;
  const total = rated.reduce((sum, c) => sum + c.rating, 0);
  return (total / rated.length).toFixed(1);
}

function showToast(message, type) {
  const existing = document.querySelector(".comment-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "comment-toast";
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; padding: 12px 20px;
    border-radius: 8px; color: #fff; font-weight: 500; z-index: 99999;
    transform: translateX(120%); opacity: 0;
    transition: all 0.3s ease; max-width: 320px;
    background: ${type === "success" ? "#2e7d32" : "#c62828"};
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  `;

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = "translateX(0)";
    toast.style.opacity = "1";
  });

  setTimeout(() => {
    toast.style.transform = "translateX(120%)";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function fetchComments() {
  try {
    const res = await fetch(`${API_URL}/api/comments/${currentFilmSlug}`);
    if (!res.ok) throw new Error("Failed to load comments");
    const data = await res.json();
    commentsData = data.comments || [];
    renderComments();
    updateStats();
  } catch (error) {
    console.error("Fetch comments error:", error);
  }
}

function renderComments() {
  const list = document.getElementById("comments-list");
  if (!list) return;

  list.innerHTML = "";

  if (commentsData.length === 0) {
    list.innerHTML = `<div class="comments-list__empty">${t("comment.noReviews")}</div>`;
    return;
  }

  const token = getToken();
  let currentUserId = "";
  let currentRole = "";
  if (token) {
    const decoded = getDecodedToken(token);
    currentUserId = decoded._id || "";
    currentRole = (decoded.role || "").toLowerCase();
  }

  const lang = localStorage.getItem("language") === "vi" ? "vi-VN" : "en-US";

  commentsData.forEach((comment) => {
    const date = new Date(comment.createdAt).toLocaleDateString(lang, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const avatarLetter = (comment.userName || "?")[0].toUpperCase();
    const commentUserId =
      typeof comment.userId === "object"
        ? comment.userId?._id || ""
        : comment.userId || "";
    const isOwner = commentUserId === currentUserId;
    const isAdmin = currentRole === "admin";
    const canDelete = isOwner || isAdmin;

    const stars =
      comment.rating && comment.rating > 0
        ? `<div class="comment-item__rating">${Array(5)
            .fill(0)
            .map(
              (_, i) =>
                i < comment.rating
                  ? '<i class="fas fa-star" style="color:#ffd875"></i>'
                  : '<i class="fas fa-star" style="color:#555"></i>'
            )
            .join("")}</div>`
        : "";

    const div = document.createElement("div");
    div.className = "comment-item";
    div.dataset.id = comment._id;

    div.innerHTML = `
      <div class="comment-item__header">
        <div class="comment-item__user">
          <div class="comment-item__avatar" style="background:#0891b2;color:#fff;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;flex-shrink:0;">
            ${avatarLetter}
          </div>
          <div class="comment-item__info">
            <div class="comment-item__name">${comment.userName || t("comment.defaultUser")}</div>
            <div class="comment-item__date">${date}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${stars}
          ${
            canDelete
              ? `<button class="comment-item__delete-btn" data-id="${comment._id}" title="${t("comment.deleteBtn")}"><i class="fas fa-trash"></i></button>`
              : ""
          }
        </div>
      </div>
      <div class="comment-item__text">${comment.content}</div>
    `;

    list.appendChild(div);

    const delBtn = div.querySelector(".comment-item__delete-btn");
    if (delBtn) {
      delBtn.addEventListener("click", () => deleteComment(comment._id));
    }
  });
}

function updateStats() {
  const avgEl = document.getElementById("avg-rating");
  const totalEl = document.getElementById("total-comments");
  if (avgEl) avgEl.textContent = calculateAverage(commentsData);
  if (totalEl) totalEl.textContent = commentsData.length;
}

async function deleteComment(commentId) {
  if (!confirm(t("comment.deleteConfirm"))) return;

  try {
    const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if (res.ok) {
      commentsData = commentsData.filter((c) => c._id !== commentId);
      renderComments();
      updateStats();
    } else {
      const data = await res.json();
      showToast(data.message || t("comment.deleteError"), "error");
    }
  } catch (error) {
    console.error("Delete comment error:", error);
    showToast(t("comment.deleteError"), "error");
  }
}

async function submitComment() {
  const textarea = document.getElementById("comment-text");
  const content = textarea?.value.trim();

  if (!content && currentRating === 0) {
    showToast(t("comment.selectStars"), "error");
    return;
  }

  const submitBtn = document.getElementById("submit-comment");
  if (submitBtn) submitBtn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/api/comments/${currentFilmSlug}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        content: content || "",
        rating: currentRating,
        filmTitle: document.title || "",
      }),
    });

    if (res.ok) {
      textarea.value = "";
      currentRating = 0;
      document.querySelectorAll("#star-rating i").forEach((s) => {
        s.classList.remove("active");
        s.style.color = "#555";
      });
      await fetchComments();
      showToast(t("comment.thankYou"), "success");
    } else {
      const data = await res.json();
      showToast(data.message || t("comment.submitError"), "error");
    }
  } catch (error) {
    console.error("Submit comment error:", error);
    showToast(t("comment.submitError"), "error");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

function initStarRating() {
  const stars = document.querySelectorAll("#star-rating i");
  if (!stars.length) return;

  stars.forEach((star, index) => {
    star.addEventListener("mouseenter", function () {
      if (currentRating === 0) {
        stars.forEach((s, i) => {
          s.style.color = i <= index ? "#ffd875" : "#555";
        });
      }
    });

    star.addEventListener("click", function () {
      const token = getToken();
      if (!token) {
        showToast(t("comment.loginPrompt"), "error");
        return;
      }

      currentRating = index + 1;
      stars.forEach((s, i) => {
        s.style.color = i < currentRating ? "#ffd875" : "#555";
        if (i < currentRating) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });
    });
  });

  const container = document.getElementById("star-rating");
  if (container) {
    container.addEventListener("mouseleave", function () {
      if (currentRating === 0) {
        stars.forEach((s) => (s.style.color = "#555"));
      } else {
        stars.forEach((s, i) => {
          s.style.color = i < currentRating ? "#ffd875" : "#555";
        });
      }
    });
  }
}

function initCommentForm() {
  const submitBtn = document.getElementById("submit-comment");
  const textarea = document.getElementById("comment-text");
  if (!submitBtn || !textarea) return;

  const token = getToken();

  if (!token) {
    textarea.disabled = true;
    textarea.placeholder = t("comment.loginToReview");
    submitBtn.disabled = true;

    textarea.addEventListener("focus", function () {
      this.blur();
      showToast(t("comment.loginPrompt"), "error");
    });

    return;
  }

  textarea.disabled = false;
  textarea.placeholder = t("comment.enterReview");
  submitBtn.disabled = false;

  submitBtn.addEventListener("click", submitComment);
}

export function initComments() {
  currentFilmSlug = getFilmSlug();
  if (!currentFilmSlug) return;

  fetchComments();
  initCommentForm();
  initStarRating();
}

document.addEventListener("DOMContentLoaded", () => {
  initComments();
});
