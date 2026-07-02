import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('school_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('school_token');
      localStorage.removeItem('school_user');
      window.location.href = '/login';
    }
    const message = error.response?.data?.message || error.message || 'Network Error';
    return Promise.reject(new Error(message));
  }
);

export default api;

// Students
export const studentAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  getProfile: (id) => api.get(`/students/${id}/profile`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`)
};

// Products
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getPurchases: (params) => api.get('/products/purchases', { params }),
  createPurchase: (data) => api.post('/products/purchases', data)
};

// Categories
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

// Student Inventory
export const inventoryAPI = {
  getAll: (params) => api.get('/student-inventory', { params }),
  getByStudent: (studentId) => api.get(`/student-inventory/student/${studentId}`),
  issue: (data) => api.post('/student-inventory/issue', data),
  returnItem: (id, data) => api.put(`/student-inventory/${id}/return`, data)
};

// Invoices
export const invoiceAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  recordPayment: (id, data) => api.post(`/invoices/${id}/payment`, data),
  sendWhatsApp: (id) => api.post(`/invoices/${id}/send-whatsapp`),
};

// Staff
export const staffAPI = {
  getAll: (params) => api.get('/staff', { params }),
  getById: (id) => api.get(`/staff/${id}`),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`)
};

// Fees
export const feeAPI = {
  getAll: (params) => api.get('/fees', { params }),
  getById: (id) => api.get(`/fees/${id}`),
  create: (data) => api.post('/fees', data),
  update: (id, data) => api.put(`/fees/${id}`, data),
  delete: (id) => api.delete(`/fees/${id}`),
  collect: (id, data) => api.post(`/fees/${id}/collect`, data),
  sendWhatsApp: (id) => api.post(`/fees/${id}/send-whatsapp`),
};

// Accounting
export const ledgerAPI = {
  getAll: (params) => api.get('/ledger', { params }),
  create: (data) => api.post('/ledger', data)
};

export const cashbookAPI = {
  getAll: (params) => api.get('/cashbook', { params }),
  create: (data) => api.post('/cashbook', data)
};

export const daybookAPI = {
  getAll: (params) => api.get('/daybook', { params }),
  create: (data) => api.post('/daybook', data)
};

export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params })
};

// Dashboard
export const dashboardAPI = {
  getData: () => api.get('/dashboard')
};

// Attendance
export const attendanceAPI = {
  getAllQRs:   (params) => api.get('/attendance/qr', { params }),
  getStudentQR:(id)     => api.get(`/attendance/qr/${id}`),
  scan:        (studentId) => api.post('/attendance/scan', { studentId }),
  getHistory:  (params) => api.get('/attendance', { params }),
  getSummary:  ()       => api.get('/attendance/summary'),
};

// WhatsApp
export const whatsappAPI = {
  getStatus:  ()             => api.get('/whatsapp/status'),
  connect:    ()             => api.post('/whatsapp/connect'),
  disconnect: ()             => api.post('/whatsapp/disconnect'),
  send:       (phone, message) => api.post('/whatsapp/send', { phone, message }),
};
