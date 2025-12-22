import {
  api_updateProfile,
  api_updatePassword,
  api_deleteAccount,
} from "../core/api.js";

import { showToast, showConfirm } from "../core/helpers.js";
import { logoutUser } from "../core/auth.js";

/* ===================== DOM ===================== */

const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const profileForm = document.getElementById("profileForm");

const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");

/* ===================== EDIT PROFILE ===================== */

editBtn?.addEventListener("click", () => {
  nameInput.disabled = false;
  phoneInput.disabled = false;

  editBtn.classList.add("hidden");
  saveBtn.classList.remove("hidden");
});

profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    await api_updateProfile({
      name: nameInput.value,
      phone: phoneInput.value,
    });

    nameInput.disabled = true;
    phoneInput.disabled = true;

    editBtn.classList.remove("hidden");
    saveBtn.classList.add("hidden");

    showToast("Profile updated successfully", "success");
  } catch (err) {
    showToast("Failed to update profile", "error");
  }
});

/* ===================== PASSWORD UPDATE ===================== */

const passwordForm = document.getElementById("passwordForm");

passwordForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const currentPassword =
    document.getElementById("currentPassword").value;
  const newPassword =
    document.getElementById("newPassword").value;
  const confirmPassword =
    document.getElementById("confirmPassword").value;

  if (newPassword !== confirmPassword) {
    showToast("Passwords do not match", "error");
    return;
  }

  try {
    await api_updatePassword({ currentPassword, newPassword });

    passwordForm.reset();
    showToast("Password updated successfully", "success");
  } catch (err) {
    showToast("Password update failed", "error");
  }
});

/* ===================== DELETE ACCOUNT ===================== */

const deleteBtn = document.getElementById("showDeleteModalBtn");

deleteBtn?.addEventListener("click", async () => {
  const confirmed = await showConfirm(
    "This will permanently disable your account. Continue?"
  );

  if (!confirmed) return;

  try {
    await api_deleteAccount();
    showToast("Account deleted", "success", 2000);

    setTimeout(() => logoutUser(), 1500);
  } catch (err) {
    showToast("Account deletion failed", "error");
  }
});
