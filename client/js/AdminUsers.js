import { API_URL } from "../config.js";

export async function AdminUsers_js() {
  // Import translation system
  const { initTranslate } = await import("./Translate.js");

  // Translation function
  const t = (key) => {
    if (window.translations?.[key]) return window.translations[key];
    const lang = localStorage.getItem("language") || "vi";
    const fb = {
      "comment.loginPrompt": { vi: "Vui lòng đăng nhập để bình luận", en: "Please login to comment" },
      "comment.deleteConfirm": { vi: "Xóa bình luận này?", en: "Delete this comment?" },
      "comment.deleteError": { vi: "Không thể xóa bình luận", en: "Cannot delete comment" },
      "comment.submitError": { vi: "Không thể gửi bình luận", en: "Cannot submit comment" },
      "comment.noReviews": { vi: "Chưa có đánh giá nào. Hãy là người đầu tiên!", en: "No reviews yet. Be the first!" },
    };
    return fb[key]?.[lang] || fb[key]?.vi || key;
  };

  const modalUser = document.querySelector(".modal--user");
  const addUserBtn = document.querySelector(".admin-content__add-btn");
  const backdrop = document.querySelector(".modal--user .modal__backdrop");
  const closeBtn = document.querySelector(".modal--user .modal__close");
  const userForm = document.querySelector(".form--user");
  const userFormEl = userForm.querySelector("form");
  const userCountHeading = document.querySelector(".data-table__title");
  const modalTitle = document.querySelector(".modal__title");
  const submitBtn = userFormEl.querySelector(".form__btn--primary");

  let currentEditRow = null;
  let isEditMode = false;

  const tableBody = document.querySelector(".data-table__body");

  const paginationLeft = document.querySelector(".pagination__arrow--left");
  const paginationRight = document.querySelector(".pagination__arrow--right");
  const currentPageSpan = document.querySelector(".pagination__current");
  const totalPagesSpan = document.querySelector(
    ".pagination__info span:last-child"
  );

  // Search and filter elements
  const searchInput = document.querySelector(".search-filter__input");
  const roleFilter = document.querySelector(
    ".search-filter__select:nth-child(1)"
  );
  const statusFilter = document.querySelector(
    ".search-filter__select:nth-child(2)"
  );

  let allUsers = [];

  // Password validation
  const pwdInput = userFormEl.querySelector('input[name="password"]');
  const cfPwdInput = userFormEl.querySelector('input[name="cf_password"]');
  const errorMessage = userFormEl.querySelector(".form__error");

  // API base URL
  const API_BASE = API_URL;

  // Get token
  const getToken = () => localStorage.getItem("accessToken");

  // Sign out functionality
  const signOutLink = document.querySelector(
    ".admin-menu__item:last-child .admin-menu__link"
  );
  if (signOutLink) {
    signOutLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("refreshToken");
      window.location.href = "HomePage.html";
    });
  }

  // Load users from API
  const getListUser = async () => {
    try {
      const token = getToken();
      console.log("Fetching users with token:", token);

      const response = await fetch(`${API_BASE}/auth/admin/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Loaded users:", data);

      allUsers = data;
      filteredUsers = [...allUsers];
      renderUsers();
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng:", error);
      alert("Không thể tải danh sách người dùng. Vui lòng đăng nhập lại.");
    }
  };

  // Update user via API
  const updateUserAPI = async (userId, userData) => {
    try {
      const token = getToken();
      console.log("Updating user:", userId, userData);

      const response = await fetch(`${API_BASE}/auth/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("User updated successfully:", result);
      return result;
    } catch (error) {
      console.error("Lỗi khi cập nhật user:", error);
      throw error;
    }
  };

  // Delete user via API
  const deleteUserAPI = async (userId) => {
    try {
      const token = getToken();
      console.log("Deleting user:", userId);

      const response = await fetch(`${API_BASE}/auth/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("User deleted successfully");
      return true;
    } catch (error) {
      console.error("Lỗi khi xóa user:", error);
      throw error;
    }
  };

  // Create user via API
  const createUserAPI = async (userData) => {
    try {
      const token = getToken();
      console.log("Creating user:", userData);

      const response = await fetch(`${API_BASE}/auth/admin/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("User created successfully:", result);
      return result;
    } catch (error) {
      console.error("Lỗi khi tạo user:", error);
      throw error;
    }
  };

  getListUser();

  let filteredUsers = [...allUsers];
  let currentPage = 1;
  const usersPerPage = 5;

  // Format date helper
  function formatDate(dateString) {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        const [year, month, day] = dateString.split("-");
        return `${day.slice(0, 2)}/${month}/${year}`;
      }

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  }

  // Pagination
  function getTotalPages() {
    return Math.ceil(filteredUsers.length / usersPerPage);
  }

  function getUsersForCurrentPage() {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }

  // Filter users
  function filterUsers() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const roleValue = roleFilter.value;
    const statusValue = statusFilter.value;

    filteredUsers = allUsers.filter((user) => {
      const userName = user.userName || user.name || "";
      const userEmail = user.email || "";
      const userId = user._id || user.id || "";

      const matchSearch =
        userName.toLowerCase().includes(searchTerm) ||
        userEmail.toLowerCase().includes(searchTerm) ||
        userId.toLowerCase().includes(searchTerm);

      const matchRole = roleValue === "all" || user.role === roleValue;
      const matchStatus = statusValue === "all" || user.status === statusValue;

      return matchSearch && matchRole && matchStatus;
    });

    const totalPages = getTotalPages();
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    } else if (totalPages === 0) {
      currentPage = 1;
    }

    renderUsers();
  }

  // Create user row
  function createUserRow(user, no) {
    const newRow = document.createElement("tr");
    newRow.dataset.userId = user._id || user.id;

    const noCell = document.createElement("td");
    noCell.classList.add("data-table__th");
    noCell.textContent = no;
    newRow.appendChild(noCell);

    const userName = user.userName || user.name || "No Name";

    const userCell = document.createElement("td");
    userCell.classList.add("data-table__th");
    userCell.innerHTML = `
      <div class="user-cell">
        <div class="user-cell__info">
          <span class="user-cell__name">${userName}</span><br>
          <span class="user-cell__email">${user.email}</span>
        </div>
      </div>
    `;
    newRow.appendChild(userCell);

    const roleCell = document.createElement("td");
    roleCell.classList.add("data-table__th");
    const roleText =
      user.role === "Admin"
        ? t("admin.users.role.admin")
        : t("admin.users.role.user");
    roleCell.textContent = roleText;
    newRow.appendChild(roleCell);

    const statusCell = document.createElement("td");
    statusCell.classList.add("data-table__th");
    const isActive = user.status === "active";
    const activeText = t("admin.users.status.active");
    const bannedText = t("admin.users.status.banned");

    statusCell.innerHTML = `
      <label class="status-toggle">
        <input type="checkbox" class="status-toggle__input" ${
          isActive ? "checked" : ""
        }>
        <span class="status-toggle__slider ${isActive ? "active" : "banned"}">
          <span class="status-toggle__text status-toggle__text--active">${activeText}</span>
          <span class="status-toggle__text status-toggle__text--banned">${bannedText}</span>
        </span>
      </label>
    `;
    newRow.appendChild(statusCell);

    const toggle = statusCell.querySelector(".status-toggle__input");
    const slider = statusCell.querySelector(".status-toggle__slider");
    toggle.addEventListener("change", async () => {
      const userId = user._id || user.id;
      const newStatus = toggle.checked ? "active" : "banned";

      try {
        await updateUserAPI(userId, { status: newStatus });

        const userIndex = allUsers.findIndex((u) => (u._id || u.id) === userId);
        if (userIndex !== -1) {
          allUsers[userIndex].status = newStatus;
          slider.classList.toggle("active", toggle.checked);
          slider.classList.toggle("banned", !toggle.checked);
        }

        alert(t("admin.users.updateSuccess") || "Cập nhật thành công!");
      } catch (error) {
        alert("Không thể cập nhật trạng thái user!");
        toggle.checked = !toggle.checked;
      }
    });

    const createDateCell = document.createElement("td");
    createDateCell.classList.add("data-table__th");
    createDateCell.textContent = formatDate(
      user.joinDate || user.createdDate || user.createdAt
    );
    newRow.appendChild(createDateCell);

    const editCell = document.createElement("td");
    editCell.classList.add("data-table__th");
    editCell.innerHTML = `<button class="data-table__btn data-table__btn--edit"><i class="fa-solid fa-user-pen"></i></button>`;
    newRow.appendChild(editCell);

    const detailCell = document.createElement("td");
    detailCell.classList.add("data-table__th");
    detailCell.innerHTML = `<a href="#" class="data-table__btn data-table__btn--detail"><i class="fa-solid fa-circle-info"></i></a>`;
    newRow.appendChild(detailCell);

    const deleteCell = document.createElement("td");
    deleteCell.classList.add("data-table__th");
    deleteCell.innerHTML = `<button class="data-table__btn data-table__btn--delete"><i class="fa-solid fa-trash"></i></button>`;
    newRow.appendChild(deleteCell);

    const editBtn = editCell.querySelector(".data-table__btn--edit");
    editBtn.addEventListener("click", () => {
      console.log("Edit button clicked for user:", user);
      openEditModal(newRow);
    });

    const detailBtn = detailCell.querySelector(".data-table__btn--detail");
    detailBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const roleDisplay =
        user.role === "admin"
          ? t("admin.users.role.admin")
          : t("admin.users.role.user");
      const statusDisplay =
        user.status === "active"
          ? t("admin.users.status.active")
          : t("admin.users.status.banned");

      alert(
        `User Details:\n\n` +
          `Name: ${userName}\n` +
          `Email: ${user.email}\n` +
          `Role: ${roleDisplay}\n` +
          `Status: ${statusDisplay}\n` +
          `Joined: ${formatDate(user.joinDate || user.createdDate)}`
      );
    });

    const deleteBtn = deleteCell.querySelector(".data-table__btn--delete");
    deleteBtn.addEventListener("click", async function () {
      const userName = user.userName || user.name;
      const confirmMsg = t("admin.users.modal.deleteConfirm")
        ? `${t("admin.users.modal.deleteConfirm")} "${userName}"?`
        : `Are you sure you want to delete "${userName}"?`;

      if (confirm(confirmMsg)) {
        try {
          const userId = user._id || user.id;
          await deleteUserAPI(userId);

          allUsers = allUsers.filter((u) => (u._id || u.id) !== userId);
          filterUsers();
          alert(t("admin.users.deleteSuccess") || "Xóa user thành công!");
        } catch (error) {
          alert("Không thể xóa user!");
        }
      }
    });

    return newRow;
  }

  // Render users
  function renderUsers() {
    tableBody.innerHTML = "";

    const usersToShow = getUsersForCurrentPage();
    const startNo = (currentPage - 1) * usersPerPage + 1;

    if (usersToShow.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: #717182;">
            ${t("admin.users.noUsers") || "No users found"}
          </td>
        </tr>
      `;
    } else {
      usersToShow.forEach((user, index) => {
        const newRow = createUserRow(user, startNo + index);
        tableBody.appendChild(newRow);
      });
    }

    updateUserCount();
    updatePaginationButtons();
  }

  function updateUserCount() {
    const countText = t("admin.users.count") || "Users";

    if (filteredUsers.length === allUsers.length) {
      userCountHeading.innerHTML = `<span data-i18n="admin.users.count">${countText}</span> (${allUsers.length})`;
    } else {
      userCountHeading.innerHTML = `<span data-i18n="admin.users.count">${countText}</span> (${filteredUsers.length} / ${allUsers.length})`;
    }
  }

  function updatePaginationButtons() {
    const totalPages = getTotalPages();

    currentPageSpan.textContent = currentPage;
    totalPagesSpan.textContent = `/ ${totalPages}`;

    if (currentPage === 1 || totalPages === 0) {
      paginationLeft.classList.add("disable");
      paginationLeft.disabled = true;
    } else {
      paginationLeft.classList.remove("disable");
      paginationLeft.disabled = false;
    }

    if (currentPage >= totalPages || totalPages === 0) {
      paginationRight.classList.add("disable");
      paginationRight.disabled = true;
    } else {
      paginationRight.classList.remove("disable");
      paginationRight.disabled = false;
    }
  }

  // Pagination events
  paginationLeft.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderUsers();
    }
  });

  paginationRight.addEventListener("click", () => {
    if (currentPage < getTotalPages()) {
      currentPage++;
      renderUsers();
    }
  });

  // Search and filter events
  searchInput.addEventListener("input", filterUsers);
  roleFilter.addEventListener("change", filterUsers);
  statusFilter.addEventListener("change", filterUsers);

  // Modal - Add user
  addUserBtn.addEventListener("click", () => {
    console.log("Add button clicked");

    isEditMode = false;
    modalTitle.textContent = t("admin.users.modal.add") || "Add User";
    submitBtn.textContent = t("admin.users.modal.create") || "Create";

    userFormEl.reset();

    const idDisplayGroup = userFormEl.querySelector(".form__id-display");
    const passwordGroup = userFormEl.querySelector(".form__group--password");
    const cfPasswordGroup = userFormEl.querySelector(
      ".form__group--confirm-password"
    );

    if (idDisplayGroup) idDisplayGroup.style.display = "none";
    if (passwordGroup) {
      passwordGroup.style.display = "block";
      pwdInput.setAttribute("required", "");
    }
    if (cfPasswordGroup) {
      cfPasswordGroup.style.display = "block";
      cfPwdInput.setAttribute("required", "");
    }

    errorMessage.style.display = "none";
    cfPwdInput.style.border = "";
    submitBtn.disabled = false;

    modalUser.classList.remove("hidden");
    userForm.classList.add("form--active");
  });

  // Modal - Edit user
  function openEditModal(row) {
    console.log("Opening edit modal");
    console.log("Row dataset:", row.dataset);

    isEditMode = true;
    currentEditRow = row;

    const userId = row.dataset.userId;
    const user = allUsers.find((u) => (u._id || u.id) === userId);

    console.log("Found user for edit:", user);

    if (!user) {
      console.error("User not found with ID:", userId);
      alert("Cannot find user data!");
      return;
    }

    modalTitle.textContent = t("admin.users.modal.edit") || "Edit User";
    submitBtn.textContent = t("admin.users.modal.save") || "Save";

    const idDisplayGroup = userFormEl.querySelector(".form__id-display");
    const idDisplayInput = userFormEl.querySelector('input[name="id-display"]');
    if (idDisplayGroup && idDisplayInput) {
      idDisplayGroup.style.display = "block";
      idDisplayInput.value = user._id || user.id;
    }

    const passwordGroup = userFormEl.querySelector(".form__group--password");
    const cfPasswordGroup = userFormEl.querySelector(
      ".form__group--confirm-password"
    );
    if (passwordGroup) {
      passwordGroup.style.display = "none";
      pwdInput.removeAttribute("required");
    }
    if (cfPasswordGroup) {
      cfPasswordGroup.style.display = "none";
      cfPwdInput.removeAttribute("required");
    }

    userFormEl.querySelector('input[name="id"]').value = user._id || user.id;
    userFormEl.querySelector('input[name="name"]').value =
      user.userName || user.name || "";
    userFormEl.querySelector('input[name="email"]').value = user.email;
    userFormEl.querySelector('select[name="role"]').value = user.role;

    console.log("Modal should be visible now");
    modalUser.classList.remove("hidden");
    userForm.classList.add("form--active");
  }

  // Modal - Close
  function closeModal() {
    modalUser.classList.add("hidden");
    userForm.classList.remove("form--active");
    userFormEl.reset();
    currentEditRow = null;
    isEditMode = false;
    errorMessage.style.display = "none";
    cfPwdInput.style.border = "";
    submitBtn.disabled = false;
  }

  backdrop.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalUser.classList.contains("hidden")) {
      closeModal();
    }
  });

  // Password validation
  function validatePasswords() {
    if (
      !isEditMode &&
      pwdInput.value &&
      cfPwdInput.value &&
      pwdInput.value !== cfPwdInput.value
    ) {
      errorMessage.style.display = "block";
      cfPwdInput.style.border = "1px solid red";
      submitBtn.disabled = true;
    } else {
      errorMessage.style.display = "none";
      cfPwdInput.style.border = "";
      submitBtn.disabled = false;
    }
  }

  pwdInput.addEventListener("input", validatePasswords);
  cfPwdInput.addEventListener("input", validatePasswords);

  // Form submit
  userFormEl.addEventListener("submit", async function (event) {
    event.preventDefault();

    console.log("Form submitted. Edit mode:", isEditMode);

    const name = userFormEl.querySelector('input[name="name"]').value.trim();
    const email = userFormEl.querySelector('input[name="email"]').value.trim();
    const role = userFormEl.querySelector('select[name="role"]').value;
    const password = pwdInput.value.trim();

    // Basic validation
    if (!name || !email || !role) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    if (!isEditMode && (!password || password.length < 6)) {
      alert("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    if (!isEditMode && password !== cfPwdInput.value.trim()) {
      alert(
        t("admin.users.modal.passwordMismatch") ||
          "Mật khẩu xác nhận không khớp!"
      );
      return;
    }

    try {
      if (isEditMode && currentEditRow) {
        console.log("Saving edited user");

        const userId = currentEditRow.dataset.userId;

        const updateData = {
          userName: name,
          email: email,
          role: role,
        };

        await updateUserAPI(userId, updateData);

        const userIndex = allUsers.findIndex((u) => (u._id || u.id) === userId);
        if (userIndex !== -1) {
          allUsers[userIndex] = {
            ...allUsers[userIndex],
            ...updateData,
          };
          console.log("Updated user:", allUsers[userIndex]);
        }

        alert(t("admin.users.updateSuccess") || "Cập nhật user thành công!");
        filterUsers();
      } else {
        console.log("Adding new user");

        const newUserData = {
          userName: name,
          email: email,
          password: password,
          role: role,
          status: "active",
        };

        const createdUser = await createUserAPI(newUserData);
        allUsers.push(createdUser);

        alert(t("admin.users.addSuccess") || "Tạo user thành công!");
        filterUsers();

        currentPage = getTotalPages();
        renderUsers();
      }

      closeModal();
    } catch (error) {
      alert("Lỗi khi lưu user: " + error.message);
    }
  });

  // Language change listener
  window.addEventListener("languagechange", async (e) => {
    console.log("Language change detected in AdminUsers");

    // Re-render everything with new language
    renderUsers();

    // Update modal if open
    if (!modalUser.classList.contains("hidden")) {
      modalTitle.textContent = isEditMode
        ? t("admin.users.modal.edit")
        : t("admin.users.modal.add");
      submitBtn.textContent = isEditMode
        ? t("admin.users.modal.save")
        : t("admin.users.modal.create");
    }
  });

  // ── Admin Comments Tab ──────────────────────────────────────────
  const adminLinks = document.querySelectorAll(".admin-menu__link");
  const userContent = document.querySelector(".main > .admin-content");
  const commentContent = document.getElementById("admin-comments-content");
  const commentBody = document.querySelector(".admin-comments__body");

  function switchAdminTab(type) {
    adminLinks.forEach((l) => l.classList.remove("admin-menu__link--active"));
    if (type === "users") {
      adminLinks[0].classList.add("admin-menu__link--active");
      if (userContent) userContent.style.display = "";
      if (commentContent) commentContent.style.display = "none";
    } else if (type === "comments") {
      adminLinks[1].classList.add("admin-menu__link--active");
      if (userContent) userContent.style.display = "none";
      if (commentContent) commentContent.style.display = "";
      loadAdminComments();
    }
  }

  if (adminLinks[1]) {
    adminLinks[1].addEventListener("click", (e) => {
      e.preventDefault();
      switchAdminTab("comments");
    });
  }
  if (adminLinks[0]) {
    adminLinks[0].addEventListener("click", (e) => {
      e.preventDefault();
      switchAdminTab("users");
    });
  }

  async function loadAdminComments() {
    if (!commentBody) return;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/api/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load comments");
      const data = await res.json();
      const comments = data.comments || [];
      const lang = localStorage.getItem("language") === "vi" ? "vi-VN" : "en-US";

      commentBody.innerHTML = "";
      if (comments.length === 0) {
        commentBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#717182;">${t("comment.noReviews")}</td></tr>`;
        return;
      }

      comments.forEach((c, i) => {
        const date = c.createdAt
          ? new Date(c.createdAt).toLocaleDateString(lang, {
              day: "2-digit", month: "2-digit", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })
          : "";
        const stars =
          c.rating && c.rating > 0
            ? Array(5)
                .fill(0)
                .map((_, si) =>
                  si < c.rating
                    ? '<i class="fas fa-star" style="color:#ffd875;font-size:12px"></i>'
                    : '<i class="fas fa-star" style="color:#555;font-size:12px"></i>'
                )
                .join("")
            : "-";
        const userName = c.userName || c.userId?.userName || "?";
        const filmTitle = c.filmTitle || c.filmId || "?";
        const content = c.content || "";

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="data-table__th">${i + 1}</td>
          <td class="data-table__th">${userName}</td>
          <td class="data-table__th" style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${filmTitle}</td>
          <td class="data-table__th">${stars}</td>
          <td class="data-table__th" style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${content}</td>
          <td class="data-table__th" style="white-space:nowrap;">${date}</td>
          <td class="data-table__th">
            <button class="data-table__btn data-table__btn--delete admin-comment-del" data-id="${c._id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        `;
        commentBody.appendChild(tr);
      });

      commentBody.querySelectorAll(".admin-comment-del").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!confirm(t("comment.deleteConfirm"))) return;
          try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_URL}/api/comments/${btn.dataset.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              loadAdminComments();
            } else {
              alert(t("comment.deleteError"));
            }
          } catch {
            alert(t("comment.deleteError"));
          }
        });
      });
    } catch (err) {
      console.error("Load admin comments error:", err);
      if (commentBody) {
        commentBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#c62828;">${t("comment.submitError")}</td></tr>`;
      }
    }
  }

  // Initial render
  renderUsers();
  console.log("AdminUsers initialized");
}
