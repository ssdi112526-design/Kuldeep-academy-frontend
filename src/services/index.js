import api from './api';

export const authService = {
  login: (payload) => api.post('/auth/login', payload),
  register: (payload) => api.post('/auth/register', payload),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  changePassword: (payload) => api.post('/auth/change-password', payload),
};

export const contactService = {
  create: (payload) => api.post('/contacts', payload),
  list: (params) => api.get('/contacts', { params }),
  getOne: (id) => api.get(`/contacts/${id}`),
  updateStatus: (id, status) => api.patch(`/contacts/${id}/status`, { status }),
  remove: (id) => api.delete(`/contacts/${id}`),
  bulkDelete: (ids) => api.post('/contacts/bulk-delete', { ids }),
  exportRecords: ({ ids, format }) =>
    api.post('/contacts/export', { ids, format }, { responseType: 'blob' }),
  stats: () => api.get('/contacts/stats'),
};

export const contentService = {
  getAll: () => api.get('/content'),
};

const asForm = (data, fileField = 'image', file) => {
  const form = new FormData();
  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.append(key, String(value));
  });
  if (file) form.append(fileField, file);
  return form;
};

export const programService = {
  listPublic: () => api.get('/programs'),
  list: (params) => api.get('/admin/programs', { params }),
  create: (data, file) => api.post('/admin/programs', asForm(data, 'image', file)),
  update: (id, data, file) => api.put(`/admin/programs/${id}`, asForm(data, 'image', file)),
  remove: (id) => api.delete(`/admin/programs/${id}`),
};

export const galleryService = {
  listPublic: () => api.get('/gallery'),
  list: (params) => api.get('/admin/gallery', { params }),
  create: (data, files) => {
    const form = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      form.append(key, String(value));
    });
    const list = Array.isArray(files) ? files : files ? [files] : [];
    list.forEach((f) => form.append('images', f));
    return api.post('/admin/gallery', form);
  },
  update: (id, data, file) => api.put(`/admin/gallery/${id}`, asForm(data, 'image', file)),
  remove: (id) => api.delete(`/admin/gallery/${id}`),
};

export const facilityService = {
  listPublic: () => api.get('/facilities'),
  list: (params) => api.get('/admin/facilities', { params }),
  create: (data, file) => api.post('/admin/facilities', asForm(data, 'image', file)),
  update: (id, data, file) => api.put(`/admin/facilities/${id}`, asForm(data, 'image', file)),
  remove: (id) => api.delete(`/admin/facilities/${id}`),
};

export const videoService = {
  listPublic: (params) => api.get('/videos', { params }),
  getBySlug: (slug) => api.get(`/videos/${slug}`),
  list: (params) => api.get('/admin/videos', { params }),
  stats: () => api.get('/admin/videos/stats'),
  create: (data, { video } = {}) => {
    const form = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      form.append(key, String(value));
    });
    if (video) form.append('video', video);
    return api.post('/admin/videos', form);
  },
  update: (id, data, { video } = {}) => {
    const form = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      form.append(key, String(value));
    });
    if (video) form.append('video', video);
    return api.put(`/admin/videos/${id}`, form);
  },
  remove: (id) => api.delete(`/admin/videos/${id}`),
};

export const cmsStatsService = {
  get: () => api.get('/admin/stats'),
};

export const entryService = {
  students: {
    list: (params) => api.get('/admin/students', { params }),
    stats: () => api.get('/admin/students/stats'),
    getOne: (id) => api.get(`/admin/students/${id}`),
    exportRecords: ({ format = 'xlsx', search = '' } = {}) =>
      api.post(
        '/admin/students/export',
        { format, search },
        { responseType: 'blob' }
      ),
    create: (data, { photo, aadhaarFront, aadhaarBack, panCard } = {}) => {
      const form = new FormData();
      Object.entries(data || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        form.append(key, String(value));
      });
      if (photo) form.append('photo', photo);
      if (aadhaarFront) form.append('aadhaarFront', aadhaarFront);
      if (aadhaarBack) form.append('aadhaarBack', aadhaarBack);
      if (panCard) form.append('panCard', panCard);
      return api.post('/admin/students', form);
    },
    update: (id, data, { photo, aadhaarFront, aadhaarBack, panCard } = {}) => {
      const form = new FormData();
      Object.entries(data || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        form.append(key, String(value));
      });
      if (photo) form.append('photo', photo);
      if (aadhaarFront) form.append('aadhaarFront', aadhaarFront);
      if (aadhaarBack) form.append('aadhaarBack', aadhaarBack);
      if (panCard) form.append('panCard', panCard);
      return api.put(`/admin/students/${id}`, form);
    },
    remove: (id) => api.delete(`/admin/students/${id}`),
    resetPassword: (id, payload) => api.post(`/admin/students/${id}/reset-password`, payload),
  },
  coaches: {
    list: (params) => api.get('/admin/coaches', { params }),
    stats: () => api.get('/admin/coaches/stats'),
    getOne: (id) => api.get(`/admin/coaches/${id}`),
    exportRecords: ({ format = 'xlsx', search = '', status } = {}) =>
      api.post(
        '/admin/coaches/export',
        { format, search, status },
        { responseType: 'blob' }
      ),
    create: (data, { photo, aadhaarFront, aadhaarBack, panCard, certificates } = {}) => {
      const form = new FormData();
      Object.entries(data || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        form.append(key, String(value));
      });
      if (photo) form.append('photo', photo);
      if (aadhaarFront) form.append('aadhaarFront', aadhaarFront);
      if (aadhaarBack) form.append('aadhaarBack', aadhaarBack);
      if (panCard) form.append('panCard', panCard);
      if (Array.isArray(certificates)) certificates.forEach((f) => form.append('certificates', f));
      else if (certificates) form.append('certificates', certificates);
      return api.post('/admin/coaches', form);
    },
    update: (id, data, { photo, aadhaarFront, aadhaarBack, panCard, certificates } = {}) => {
      const form = new FormData();
      Object.entries(data || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        form.append(key, String(value));
      });
      if (photo) form.append('photo', photo);
      if (aadhaarFront) form.append('aadhaarFront', aadhaarFront);
      if (aadhaarBack) form.append('aadhaarBack', aadhaarBack);
      if (panCard) form.append('panCard', panCard);
      if (Array.isArray(certificates)) certificates.forEach((f) => form.append('certificates', f));
      else if (certificates) form.append('certificates', certificates);
      return api.put(`/admin/coaches/${id}`, form);
    },
    remove: (id) => api.delete(`/admin/coaches/${id}`),
    resetPassword: (id, payload) => api.post(`/admin/coaches/${id}/reset-password`, payload),
  },
  equipment: {
    list: (params) => api.get('/admin/equipment', { params }),
    stats: () => api.get('/admin/equipment/stats'),
    getOne: (id) => api.get(`/admin/equipment/${id}`),
    exportRecords: ({ format = 'xlsx', search = '', category, status, condition } = {}) =>
      api.post(
        '/admin/equipment/export',
        { format, search, category, status, condition },
        { responseType: 'blob' }
      ),
    create: (data, { image } = {}) => {
      const form = new FormData();
      Object.entries(data || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        form.append(key, String(value));
      });
      if (image) form.append('image', image);
      return api.post('/admin/equipment', form);
    },
    update: (id, data, { image } = {}) => {
      const form = new FormData();
      Object.entries(data || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        form.append(key, String(value));
      });
      if (image) form.append('image', image);
      return api.put(`/admin/equipment/${id}`, form);
    },
    remove: (id) => api.delete(`/admin/equipment/${id}`),
  },
};

export const achievementService = {
  listPublic: () => api.get('/achievements'),
  list: (params) => api.get('/admin/achievements', { params }),
  create: (payload) => api.post('/admin/achievements', payload),
  update: (id, payload) => api.put(`/admin/achievements/${id}`, payload),
  remove: (id) => api.delete(`/admin/achievements/${id}`),
};

export const scheduleService = {
  listPublic: () => api.get('/schedule'),
  listSessions: (params) => api.get('/admin/schedule/sessions', { params }),
  createSession: (payload) => api.post('/admin/schedule/sessions', payload),
  updateSession: (id, payload) => api.put(`/admin/schedule/sessions/${id}`, payload),
  removeSession: (id) => api.delete(`/admin/schedule/sessions/${id}`),
  listDays: (params) => api.get('/admin/schedule/days', { params }),
  createDay: (payload) => api.post('/admin/schedule/days', payload),
  updateDay: (id, payload) => api.put(`/admin/schedule/days/${id}`, payload),
  removeDay: (id) => api.delete(`/admin/schedule/days/${id}`),
};

export const attendanceService = {
  stats: (params) => api.get('/admin/attendance/stats', { params }),
  months: () => api.get('/admin/attendance/months'),
  records: (params) => api.get('/admin/attendance/records', { params }),
  roster: (params) => api.get('/admin/attendance/roster', { params }),
  studentSummary: (params) => api.get('/admin/attendance/summary/students', { params }),
  studentHistory: (studentId, params) =>
    api.get(`/admin/attendance/students/${studentId}/history`, { params }),
  record: (id) => api.get(`/admin/attendance/records/${id}`),
  sessions: (params) => api.get('/admin/attendance/sessions', { params }),
  activeQr: () => api.get('/admin/attendance/qr/active'),
  generateQr: (payload) => api.post('/admin/attendance/qr/generate', payload || {}),
  closeQr: (id) =>
    id ? api.post(`/admin/attendance/qr/${id}/close`) : api.post('/admin/attendance/qr/close'),
  exportRecords: (payload) =>
    api.post('/admin/attendance/export', payload, { responseType: 'blob' }),
  myProfile: () => api.get('/student/profile'),
  myAttendance: () => api.get('/student/attendance'),
  scan: (payload) => api.post('/student/attendance/scan', payload),
};

export const attendanceSettingsService = {
  get: () => api.get('/admin/attendance/settings'),
  update: (payload) => api.put('/admin/attendance/settings', payload),
  test: (payload) => api.post('/admin/attendance/settings/test', payload),
  distance: (params) => api.get('/admin/attendance/settings/distance', { params }),
  getPublicLocation: () => api.get('/public/akhada-location'),
};

export const biometricService = {
  listDevices: () => api.get('/admin/biometric/devices'),
  getDevice: (id) => api.get(`/admin/biometric/devices/${id}`),
  createDevice: (payload) => api.post('/admin/biometric/devices', payload),
  updateDevice: (id, payload) => api.put(`/admin/biometric/devices/${id}`, payload),
  deleteDevice: (id) => api.delete(`/admin/biometric/devices/${id}`),
  testDevice: (id) => api.post(`/admin/biometric/devices/${id}/test`),
  syncDevice: (id) => api.post(`/admin/biometric/devices/${id}/sync`),
  deviceLogs: (id, params) => api.get(`/admin/biometric/devices/${id}/logs`, { params }),
  unknownLogs: (params) => api.get('/admin/biometric/unknown-logs', { params }),
  setStudentBiometric: (id, biometricUserId) =>
    api.put(`/admin/students/${id}/biometric`, { biometricUserId }),
  setCoachBiometric: (id, biometricUserId) =>
    api.put(`/admin/coaches/${id}/biometric`, { biometricUserId }),
};

export const coachPortalService = {
  myProfile: () => api.get('/coach/profile'),
  myAttendance: () => api.get('/coach/attendance'),
  scan: (payload) => api.post('/coach/attendance/scan', payload),
};

export const coachAttendanceService = {
  stats: (params) => api.get('/admin/coach-attendance/stats', { params }),
  months: () => api.get('/admin/coach-attendance/months'),
  records: (params) => api.get('/admin/coach-attendance/records', { params }),
  coachSummary: (params) => api.get('/admin/coach-attendance/summary/coaches', { params }),
  coachHistory: (coachId, params) =>
    api.get(`/admin/coach-attendance/coaches/${coachId}/history`, { params }),
  activeQr: () => api.get('/admin/coach-attendance/qr/active'),
  generateQr: (payload) => api.post('/admin/coach-attendance/qr/generate', payload || {}),
  closeQr: (id) =>
    id
      ? api.post(`/admin/coach-attendance/qr/${id}/close`)
      : api.post('/admin/coach-attendance/qr/close'),
  exportRecords: (payload) =>
    api.post('/admin/coach-attendance/export', payload, { responseType: 'blob' }),
};


export const userAdminService = {
  list: (params) => api.get('/admin/users', { params }),
  getOne: (id) => api.get(`/admin/users/${id}`),
  create: (data, profileImage) => {
    const form = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      form.append(key, String(value));
    });
    if (profileImage) form.append('profileImage', profileImage);
    return api.post('/admin/users', form);
  },
  update: (id, data, profileImage) => {
    const form = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      form.append(key, String(value));
    });
    if (profileImage) form.append('profileImage', profileImage);
    return api.put(`/admin/users/${id}`, form);
  },
  remove: (id) => api.delete(`/admin/users/${id}`),
  setStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  resetPassword: (id, payload) => api.post(`/admin/users/${id}/reset-password`, payload),
  generatePassword: () => api.get('/admin/users/generate-password'),
};

export const roleAdminService = {
  list: (params) => api.get('/admin/roles', { params }),
  getOne: (id) => api.get(`/admin/roles/${id}`),
  create: (payload) => api.post('/admin/roles', payload),
  update: (id, payload) => api.put(`/admin/roles/${id}`, payload),
  remove: (id) => api.delete(`/admin/roles/${id}`),
  clone: (id, payload) => api.post(`/admin/roles/${id}/clone`, payload || {}),
  permissionsCatalog: () => api.get('/admin/permissions'),
};

export const financeService = {
  dashboard: () => api.get('/admin/finance/dashboard'),
  report: (params) => api.get('/admin/finance/report', { params }),
  listStudents: (params) => api.get('/admin/finance/students', { params }),
  updateStudentDefaults: (studentId, payload) =>
    api.patch(`/admin/finance/students/${studentId}/defaults`, payload),
  searchStudents: (q) => api.get('/admin/finance/students/search', { params: { q } }),
  collectPreview: (params) => api.get('/admin/finance/collect/preview', { params }),
  collect: (payload) => api.post('/admin/finance/collect', payload),
  generateMonthly: (payload) => api.post('/admin/finance/generate-monthly', payload),
  listPending: (params) => api.get('/admin/finance/pending', { params }),
  studentHistory: (studentId, params) =>
    api.get(`/admin/finance/students/${studentId}/history`, { params }),
  listPayments: (params) => api.get('/admin/finance/payments', { params }),
  getReceipt: (id) => api.get(`/admin/finance/payments/${id}`),
  updatePayment: (id, payload) => api.put(`/admin/finance/payments/${id}`, payload),
  deletePayment: (id) => api.delete(`/admin/finance/payments/${id}`),
  listCoachPayments: (params) => api.get('/admin/finance/coach-payments', { params }),
  makeCoachPayment: (payload) => api.post('/admin/finance/coach-payments', payload),
  updateCoachPayment: (id, payload) => api.put(`/admin/finance/coach-payments/${id}`, payload),
  deleteCoachPayment: (id) => api.delete(`/admin/finance/coach-payments/${id}`),
  exportPayments: (payload) =>
    api.post('/admin/finance/export/payments', payload, { responseType: 'blob' }),
  exportCoachPayments: (payload) =>
    api.post('/admin/finance/export/coach-payments', payload, { responseType: 'blob' }),
  exportPending: (payload) =>
    api.post('/admin/finance/export/pending', payload, { responseType: 'blob' }),
};
