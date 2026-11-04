import api from "./api";

export const login = async (email, password) => {
  const { data } = await api.post("/auth/login/", { email, password });
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data.user;
};

export const fetchMe = async () => {
  const { data } = await api.get("/auth/me/");
  return data;
};

export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};

export const getStoredUser = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => !!localStorage.getItem("access_token");