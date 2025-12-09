document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetPasswordForm");
  const messageEl = document.getElementById("message");
  const errorEl = document.getElementById("error");

  // Get token from URL
  const pathParts = window.location.pathname.split("/");
  const token = pathParts[pathParts.length - 1];

  if (!token) {
    errorEl.textContent = "Invalid or missing reset token.";
    form.style.display = "none";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newPassword = form.newPassword.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();

    // Clear old messages
    messageEl.textContent = "";
    errorEl.textContent = "";

    if (!newPassword || !confirmPassword) {
      errorEl.textContent = "Please enter and confirm your new password.";
      return;
    }

    if (newPassword !== confirmPassword) {
      errorEl.textContent = "Passwords do not match.";
      return;
    }

    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/reset-password/${token}`,
        { newPassword, confirmPassword }
      );

      if (res.data.success) {
        messageEl.textContent = res.data.message;
        form.reset();
        showNotification("Your password has been successfully updated!", false);
        return;
      }

      // If backend returned success:false
      errorEl.textContent = res.data.error || "Password reset failed.";

    } catch (err) {
      errorEl.textContent =
        err.response?.data?.error || "Something went wrong. Try again.";
    }
  });
});
