let commentsData = [];
let currentRating = 0;

// Helper function to get translation
function t(key) {
  return window.translations?.[key] || key;
}

// average rating calculation
function calculateAverage(comments) {
  if (comments.length === 0) return 0;
  const total = comments.reduce((sum, comment) => sum + comment.rating, 0);
  return (total / comments.length).toFixed(1);
}

// Update statistics
function updateStats() {
  const avgRating = calculateAverage(commentsData);
  const totalComments = commentsData.length;

  document.getElementById("avg-rating").textContent = avgRating;
  document.getElementById("total-comments").textContent = totalComments;
}

// Check login status
function checkLoginStatus() {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  return !!token;
}

// Show simple notification
function showSimpleNotification(message, type = "info") {
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

// Create comment
function createComment(comment) {
  const stars = Array(5)
    .fill(0)
    .map((_, i) =>
      i < comment.rating
        ? '<i class="fas fa-star"></i>'
        : '<i class="fas fa-star empty"></i>'
    )
    .join("");

  const avatarUrl = "../../public/assets/image/vn_flag.svg";

  const date = new Date(comment.date).toLocaleDateString(
    localStorage.getItem("language") === "vi" ? "vi-VN" : "en-US",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return `
    <div class="comment-item" data-id="${comment.id}">
      <div class="comment-item__header">
        <div class="comment-item__user">
          <div class="comment-item__avatar">
            <img src="${avatarUrl}" alt="${comment.userName}" />
          </div>
          <div class="comment-item__info">
            <div class="comment-item__name">${comment.userName}</div>
            <div class="comment-item__date">${date}</div>
          </div>
        </div>
        <div class="comment-item__rating">${stars}</div>
      </div>
      <div class="comment-item__text">${comment.text}</div>
      <div class="comment-item__actions">
        <button class="comment-item__action-btn" data-id="${comment.id}">
          <i class="fas fa-thumbs-up"></i>
          <span>${t("comment.helpful")} (${comment.likes || 0})</span>
        </button>
      </div>
    </div>
  `;
}

// Render list of comments
function renderComments() {
  const commentsList = document.getElementById("comments-list");

  if (commentsData.length === 0) {
    commentsList.innerHTML = `<div class="comments-list__empty">${t(
      "comment.noReviews"
    )}</div>`;
    return;
  }

  // Sort by newest date
  const sortedComments = [...commentsData].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  commentsList.innerHTML = sortedComments.map(createComment).join("");

  // Add event listeners for like buttons
  commentsList.querySelectorAll(".comment-item__action-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const commentId = this.getAttribute("data-id");
      handleLike(commentId);
    });
  });
}

// Handle like
function handleLike(commentId) {
  // Check login before liking
  if (!checkLoginStatus()) {
    showSimpleNotification(t("comment.loginToLike"), "info");
    return;
  }

  const comment = commentsData.find((c) => c.id === commentId);

  if (comment) {
    if (comment.likedByUser) {
      comment.likes = (comment.likes || 1) - 1;
      comment.likedByUser = false;
    } else {
      comment.likes = (comment.likes || 0) + 1;
      comment.likedByUser = true;
    }

    renderComments();
  }
}

// Handle star rating
function initStarRating() {
  const stars = document.querySelectorAll("#star-rating i");

  stars.forEach((star, index) => {
    // Hover effect
    star.addEventListener("mouseenter", function () {
      stars.forEach((s, i) => {
        if (i <= index) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });
    });

    star.addEventListener("click", function () {
      // Check login when selecting stars
      if (!checkLoginStatus()) {
        showSimpleNotification(t("comment.loginToRate"), "info");
        return;
      }

      currentRating = index + 1;
      stars.forEach((s, i) => {
        if (i < currentRating) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });
    });
  });

  const starRating = document.getElementById("star-rating");
  starRating.addEventListener("mouseleave", function () {
    stars.forEach((s, i) => {
      if (i < currentRating) {
        s.classList.add("active");
      } else {
        s.classList.remove("active");
      }
    });
  });
}

// Handle comment form
function initCommentForm() {
  const submitBtn = document.getElementById("submit-comment");
  const commentText = document.getElementById("comment-text");

  // Check and disable form if not logged in
  function updateFormState() {
    const isLoggedIn = checkLoginStatus();

    if (!isLoggedIn) {
      if (commentText) {
        commentText.disabled = true;
        commentText.placeholder = t("comment.loginToReview");
      }
      if (submitBtn) {
        submitBtn.disabled = true;
      }
    } else {
      if (commentText) {
        commentText.disabled = false;
        commentText.placeholder = t("comment.enterReview");
      }
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  }

  // Update form state on load
  updateFormState();

  // Check again when focusing on textarea
  if (commentText) {
    commentText.addEventListener("focus", function () {
      if (!checkLoginStatus()) {
        showSimpleNotification(t("comment.loginToRate"), "info");
        this.blur();
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", function () {
      // Check login first
      if (!checkLoginStatus()) {
        showSimpleNotification(t("comment.loginToRate"), "info");
        return;
      }

      const text = commentText.value.trim();

      // Validate
      if (currentRating === 0) {
        showSimpleNotification(t("comment.selectStars"), "error");
        return;
      }

      if (text === "") {
        showSimpleNotification(t("comment.enterContent"), "error");
        return;
      }

      if (text.length < 10) {
        showSimpleNotification(t("comment.minLength"), "error");
        return;
      }

      // Create new comment
      const newComment = {
        id: Date.now().toString(),
        userName: localStorage.getItem("userName") || t("comment.defaultUser"),
        rating: currentRating,
        text: text,
        date: new Date().toISOString(),
        likes: 0,
        likedByUser: false,
      };

      commentsData.push(newComment);

      renderComments();
      updateStats();

      // Reset form
      commentText.value = "";
      currentRating = 0;
      document.querySelectorAll("#star-rating i").forEach((s) => {
        s.classList.remove("active");
      });

      showSimpleNotification(t("comment.thankYou"), "success");

      setTimeout(() => {
        const commentsList = document.getElementById("comments-list");
        commentsList.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });
  }

  // Listen for login state changes
  window.addEventListener("storage", (e) => {
    if (e.key === "accessToken" || e.key === "token") {
      updateFormState();
    }
  });
}

// Initialize comments
export function initComments() {
  initStarRating();
  initCommentForm();
  updateStats();
}

document.addEventListener("DOMContentLoaded", () => {
  initComments();
});
