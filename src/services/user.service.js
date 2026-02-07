import api from "../config/api";

export async function login(user_kode, password) {
  const res = await api.post("/admin/login", {
    user_kode,
    password,
  });

  return res.data;
}

export async function changePassword(user_kode, old_password, new_password) {
  const res = await api.put("/admin/change-password", {
    user_kode,
    old_password,
    new_password,
  });
  return res.data;
}
