import { jwtDecode } from "https://cdn.jsdelivr.net/npm/jwt-decode@4.0.0/+esm";
import { API_URL } from "../config.js";

function t(key) {
  return window.translations?.[key] || key;
}

export async function authPagejs() {
  const switchLinks = document.querySelectorAll(".switch-form");

  const loginForm = document.querySelector(".form-wrapper.login");
  const registerForm = document.querySelector(".form-wrapper.register");
  const forgotForm = document.querySelector(".form-wrapper.forgot");
  const resetForm = document.querySelector(".form-wrapper.reset");
  const verifyForm = document.querySelector(".form-wrapper.verify");

  const loginFormEl = loginForm.querySelector("form");
  const registerFormEl = registerForm.querySelector("form");
  const resetFormEl = resetForm.querySelector("form");
  const forgotFormEl = forgotForm.querySelector("form");
  const verifyFormEl = verifyForm.querySelector("form");

  let forgotPasswordEmail = "";
  let resendTimer = null;
  let resendCountdown = 0;

  function showErrorMessage(formWrapper, message, isSuccess = false) {
    const errorDiv = formWrapper.querySelector(".auth-error-message");
    const errorText = errorDiv?.querySelector(".error-text");
    const icon = errorDiv?.querySelector("i");

    if (!errorDiv || !errorText) return;

    errorText.textContent = message;

    if (isSuccess) {
      errorDiv.style.background = "#d4edda";
      errorDiv.style.color = "#155724";
      errorDiv.style.borderColor = "#c3e6cb";
      icon.className = "fa-solid fa-check-circle";
    } else {
      errorDiv.style.background = "#fff3cd";
      errorDiv.style.color = "#856404";
      errorDiv.style.borderColor = "#ffc107";
      icon.className = "fa-solid fa-exclamation-triangle";
    }

    errorDiv.style.display = "flex";
    setTimeout(() => errorDiv.classList.add("show"), 10);

    setTimeout(() => {
      errorDiv.classList.remove("show");
      setTimeout(() => (errorDiv.style.display = "none"), 300);
    }, 5000);
  }

  function hideErrorMessage(formWrapper) {
    const errorDiv = formWrapper.querySelector(".auth-error-message");
    if (errorDiv) {
      errorDiv.classList.remove("show");
      setTimeout(() => (errorDiv.style.display = "none"), 300);
    }
  }

  function startResendTimer() {
    resendCountdown = 300;
    const resendLink = verifyForm.querySelector(".switch-form");

    if (!resendLink) return;

    function updateTimer() {
      const m = Math.floor(resendCountdown / 60);
      const s = (resendCountdown % 60).toString().padStart(2, "0");
      resendLink.textContent = t("auth.verify.resend_timer").replace("{time}", `${m}:${s}`);
      resendLink.style.color = "#ffffff80";
      resendLink.style.cursor = "not-allowed";
      resendLink.style.pointerEvents = "none";
    }

    updateTimer();

    resendTimer = setInterval(() => {
      resendCountdown--;
      if (resendCountdown <= 0) {
        clearInterval(resendTimer);
        resendLink.textContent = t("auth.verify.resend");
        resendLink.style.color = "#ffd875";
        resendLink.style.cursor = "pointer";
        resendLink.style.pointerEvents = "auto";
      } else {
        updateTimer();
      }
    }, 1000);
  }

  function stopResendTimer() {
    if (resendTimer) {
      clearInterval(resendTimer);
      resendTimer = null;
    }
  }

  function switchForm(target = "login") {
    [loginForm, registerForm, forgotForm, resetForm, verifyForm].forEach((f) =>
      f.classList.remove("active")
    );

    if (target === "register") registerForm.classList.add("active");
    else if (target === "forgot") forgotForm.classList.add("active");
    else if (target === "reset") resetForm.classList.add("active");
    else if (target === "verify") {
      verifyForm.classList.add("active");
      startResendTimer();
    } else loginForm.classList.add("active");
  }

  function redirectAfterLogin() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect") || "../../view/pages/HomePage.html";
    window.location.href = redirect;
  }

  switchLinks.forEach((link) => {
    link.addEventListener("click", () => {
      [loginForm, registerForm, forgotForm, resetForm, verifyForm].forEach(
        hideErrorMessage
      );

      const key = link.getAttribute("data-i18n") || "";

      if (key === "auth.login.register_now") switchForm("register");
      else if (
        key === "auth.register.login_now" ||
        key.includes("back_to_login")
      )
        switchForm("login");
      else if (key === "auth.login.forgot") switchForm("forgot");
      else if (key === "auth.verify.back_to_login")
        switchForm("login");
      else if (
        key === "auth.verify.resend" &&
        resendCountdown <= 0 &&
        forgotPasswordEmail
      ) {
        resendOTP();
      }
    });
  });

  async function resendOTP() {
    try {
      const res = await fetch(
        `${API_URL}/api/auth/forgotPassword`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotPasswordEmail }),
        }
      );

      if (res.ok) {
        showErrorMessage(verifyForm, t("auth.messages.otp_resent"), true);
        startResendTimer();
      } else {
        showErrorMessage(verifyForm, t("auth.messages.otp_resend_failed"));
      }
    } catch (err) {
      showErrorMessage(verifyForm, t("auth.messages.connection_error"));
    }
  }

  const pwdInput = registerFormEl.querySelector('input[name="password"]');
  const cfPwdInput = registerFormEl.querySelector('input[name="cf_password"]');
  const regSubmitBtn = registerFormEl.querySelector(".btn.btn-primary");
  const regErrorMsg = registerFormEl.querySelector(".non-same-pw");

  const newPwdInput = resetFormEl.querySelector('input[name="new_password"]');
  const cfNewPwdInput = resetFormEl.querySelector(
    'input[name="cf_new_password"]'
  );
  const resetSubmitBtn = resetFormEl.querySelector(".btn.btn-primary");
  const resetErrorMsg = resetFormEl.querySelector(".non-same-pw");

  function validatePasswords(pwd, cfPwd, errorEl, btn) {
    if (pwd.value && cfPwd.value && pwd.value !== cfPwd.value) {
      errorEl.style.display = "block";
      cfPwd.style.border = "1px solid red";
      btn.disabled = true;
    } else {
      errorEl.style.display = "none";
      cfPwd.style.border = "";
      btn.disabled = false;
    }
  }

  pwdInput.addEventListener("input", () =>
    validatePasswords(pwdInput, cfPwdInput, regErrorMsg, regSubmitBtn)
  );
  cfPwdInput.addEventListener("input", () =>
    validatePasswords(pwdInput, cfPwdInput, regErrorMsg, regSubmitBtn)
  );
  newPwdInput.addEventListener("input", () =>
    validatePasswords(newPwdInput, cfNewPwdInput, resetErrorMsg, resetSubmitBtn)
  );
  cfNewPwdInput.addEventListener("input", () =>
    validatePasswords(newPwdInput, cfNewPwdInput, resetErrorMsg, resetSubmitBtn)
  );

  loginFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!loginFormEl.checkValidity()) return;

    const email = loginFormEl
      .querySelector('input[name="email"]')
      .value.trim();
    const password = loginFormEl
      .querySelector('input[name="password"]')
      .value.trim();

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const token = data.accessToken;

        localStorage.setItem("accessToken", token);
        document.dispatchEvent(new CustomEvent("userLoggedIn"));

        redirectAfterLogin();
      } else {
        const text = await res.text();
        const message =
          text && text !== "OK"
            ? text
            : t("auth.messages.login_failed");
        showErrorMessage(loginForm, message);
      }
    } catch (err) {
      showErrorMessage(loginForm, t("auth.messages.connection_error"));
    }
  });

  registerFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!registerFormEl.checkValidity() || regSubmitBtn.disabled) return;

    const userName = registerFormEl
      .querySelector('input[name="name"]')
      .value.trim();
    const email = registerFormEl
      .querySelector('input[name="email"]')
      .value.trim();
    const password = registerFormEl
      .querySelector('input[name="password"]')
      .value.trim();

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, email, password }),
      });

      if (res.ok) {
        registerFormEl.reset();
        switchForm("login");
        showErrorMessage(
          loginForm,
          t("auth.messages.register_success"),
          true
        );
      } else {
        const data = await res.json();
        showErrorMessage(registerForm, data.message || t("auth.messages.register_failed"));
      }
    } catch (err) {
      showErrorMessage(registerForm, t("auth.messages.connection_error"));
    } finally {
      regSubmitBtn.disabled = false;
    }
  });

  forgotFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!forgotFormEl.checkValidity()) return;

    const email = forgotFormEl
      .querySelector('input[name="email"]')
      .value.trim();

    try {
      const res = await fetch(`${API_URL}/api/auth/forgotPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        forgotPasswordEmail = email;
        forgotFormEl.reset();
        switchForm("verify");
        showErrorMessage(
          verifyForm,
          t("auth.messages.otp_sent"),
          true
        );
      } else {
        const text = await res.text();
        showErrorMessage(forgotForm, text || t("auth.messages.request_failed"));
      }
    } catch (err) {
      showErrorMessage(forgotForm, t("auth.messages.connection_error"));
    }
  });

  verifyFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!verifyFormEl.checkValidity()) return;

    const otp = verifyFormEl
      .querySelector('input[name="otp"]')
      .value.trim();

    try {
      const res = await fetch(`${API_URL}/api/auth/verifyOTP`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail, otp }),
      });

      if (res.ok) {
        verifyFormEl.reset();
        stopResendTimer();
        switchForm("reset");
        showErrorMessage(
          resetForm,
          t("auth.messages.verify_success"),
          true
        );
      } else {
        const text = await res.text();
        showErrorMessage(verifyForm, text || t("auth.messages.otp_incorrect"));
      }
    } catch (err) {
      showErrorMessage(verifyForm, t("auth.messages.connection_error"));
    }
  });

  resetFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!resetFormEl.checkValidity() || resetSubmitBtn.disabled) return;

    const newPassword = resetFormEl
      .querySelector('input[name="new_password"]')
      .value.trim();

    try {
      const res = await fetch(`${API_URL}/api/auth/resetPassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail, newPassword }),
      });

      if (res.ok) {
        forgotPasswordEmail = "";
        resetFormEl.reset();
        switchForm("login");
        showErrorMessage(
          loginForm,
          t("auth.messages.reset_success"),
          true
        );
      } else {
        showErrorMessage(resetForm, t("auth.messages.reset_failed"));
      }
    } catch (err) {
      showErrorMessage(resetForm, t("auth.messages.connection_error"));
    } finally {
      resetSubmitBtn.disabled = false;
    }
  });
}
