import axios from "axios";

// ══════════════════════════════════════════════════════════════
// AXIOS INSTANCE + INTERCEPTORS
// ══════════════════════════════════════════════════════════════

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh expired access token once, then retry
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const res = await axios.post(
            `${api.defaults.baseURL}/auth/refresh/`,
            { refresh }
          );
          localStorage.setItem("access_token", res.data.access);
          original.headers.Authorization = `Bearer ${res.data.access}`;
          return api(original);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ══════════════════════════════════════════════════════════════
// DEPARTMENTS
// ══════════════════════════════════════════════════════════════

export const listDepartments = async () => {
  const { data } = await api.get("/departments/");
  return data;
};

// ══════════════════════════════════════════════════════════════
// EMPLOYEES
// ══════════════════════════════════════════════════════════════

export const listEmployees = async ({ search, department } = {}) => {
  const params = {};
  if (search) params.search = search;
  if (department) params.department = department;
  const { data } = await api.get("/employees/", { params });
  return data;
};

export const getEmployee = async (id) => {
  const { data } = await api.get(`/employees/${id}/`);
  return data;
};

export const createEmployee = async (payload) => {
  const { data } = await api.post("/employees/", payload);
  return data;
};

export const updateEmployee = async (id, payload) => {
  const { data } = await api.put(`/employees/${id}/`, payload);
  return data;
};

export const deleteEmployee = async (id) => {
  await api.delete(`/employees/${id}/`);
};



// ══════════════════════════════════════════════════════════════
// PROFILE (self-service)
// ══════════════════════════════════════════════════════════════

export const getProfile = async () => {
  const { data } = await api.get("/profile/");
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await api.patch("/profile/", payload);
  return data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const { data } = await api.post("/profile/change-password/", {
    currentPassword,
    newPassword,
  });
  return data;
};



// ══════════════════════════════════════════════════════════════
// ATTENDANCE
// ══════════════════════════════════════════════════════════════

export const getTodayAttendance = async () => {
  const { data } = await api.get("/attendance/today/");
  return data; // { record: {...} | null, hasEmployee: bool }
};

export const getMyAttendance = async ({ month, year } = {}) => {
  const params = {};
  if (month) params.month = month;
  if (year) params.year = year;
  const { data } = await api.get("/attendance/my/", { params });
  return data; // { results: [...], hasEmployee: bool }
};

export const checkIn = async () => {
  const { data } = await api.post("/attendance/check-in/");
  return data;
};

export const checkOut = async () => {
  const { data } = await api.post("/attendance/check-out/");
  return data;
};


// ══════════════════════════════════════════════════════════════
// ATTENDANCE — ADMIN
// ══════════════════════════════════════════════════════════════

export const listAllAttendance = async (params = {}) => {
  const { data } = await api.get("/attendance/", { params });
  return data; // { count, next, previous, results: [...] }
};


// ══════════════════════════════════════════════════════════════
// LEAVES
// ══════════════════════════════════════════════════════════════

export const listLeaves = async (params = {}) => {
  const { data } = await api.get("/leaves/", { params });
  return data; // { count, results: [...] }
};

export const applyLeave = async (payload) => {
  const { data } = await api.post("/leaves/", payload);
  return data;
};

export const approveLeave = async (id, reviewComment = "") => {
  const { data } = await api.post(`/leaves/${id}/approve/`, {
    review_comment: reviewComment,
  });
  return data;
};

export const rejectLeave = async (id, reviewComment = "") => {
  const { data } = await api.post(`/leaves/${id}/reject/`, {
    review_comment: reviewComment,
  });
  return data;
};

export const cancelLeave = async (id) => {
  const { data } = await api.post(`/leaves/${id}/cancel/`);
  return data;
};

export const getLeaveBalance = async (year) => {
  const params = year ? { year } : {};
  const { data } = await api.get("/leaves/balance/", { params });
  return data; // { results: [...], hasEmployee, year }
};

// ══════════════════════════════════════════════════════════════
// PAYSLIPS
// ══════════════════════════════════════════════════════════════

export const listPayslips = async (params = {}) => {
  const { data } = await api.get("/payslips/", { params });
  return data;
};

export const getPayslip = async (id) => {
  const { data } = await api.get(`/payslips/${id}/`);
  return data;
};

export const generatePayslip = async (payload) => {
  const { data } = await api.post("/payslips/", payload);
  return data;
};


// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════

export const getAdminDashboard = async () => {
  const { data } = await api.get("/dashboard/admin/");
  return data;
};

export const getEmployeeDashboard = async () => {
  const { data } = await api.get("/dashboard/employee/");
  return data;
};


// ══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════

export const listNotifications = async () => {
  const { data } = await api.get("/notifications/");
  return data;
};

export const getUnreadCount = async () => {
  const { data } = await api.get("/notifications/unread-count/");
  return data.count;
};

export const markNotificationRead = async (id) => {
  const { data } = await api.post(`/notifications/${id}/read/`);
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.post("/notifications/read-all/");
  return data;
};