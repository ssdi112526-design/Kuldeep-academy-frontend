import api from './api';

export const authService = {
  login: (payload) => api.post('/auth/login', payload),
  register: (payload) => api.post('/auth/register', payload),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  changePassword: (payload) => api.post('/auth/change-password', payload),
  verifyPassword: (payload) => api.post('/auth/controller-password/verify', payload),
  controllerPassword: {
    status: () => api.get('/auth/controller-password/status'),
    setup: (payload) => api.post('/auth/controller-password/setup', payload),
    verify: (payload) => api.post('/auth/controller-password/verify', payload),
    forgot: () => api.post('/auth/controller-password/forgot', {}),
    reset: (payload) => api.post('/auth/controller-password/reset', payload),
  },
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

const isBrowserFile = (value) =>
  typeof File !== 'undefined' && value instanceof File
    ? true
    : typeof Blob !== 'undefined' && value instanceof Blob;

/** Build multipart body only when a real file is present; otherwise send JSON (avoids Multer "Unexpected field"). */
const asForm = (data, fileField = 'image', file) => {
  const form = new FormData();
  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    // Never treat path strings / leftover File refs as duplicate upload fields
    if (key === fileField || key === 'image' || key === 'photo' || key === 'file' || key === 'profileImage') {
      return;
    }
    form.append(key, String(value));
  });
  if (isBrowserFile(file)) form.append(fileField, file);
  return form;
};

const withOptionalImage = (jsonRequest, formRequest, data, file) => {
  if (isBrowserFile(file)) return formRequest(asForm(data, 'image', file));
  return jsonRequest(data);
};

export const programService = {
  listPublic: () => api.get('/programs'),
  list: (params) => api.get('/admin/programs', { params }),
  create: (data, file) =>
    withOptionalImage(
      (body) => api.post('/admin/programs', body),
      (form) => api.post('/admin/programs', form),
      data,
      file
    ),
  update: (id, data, file) =>
    withOptionalImage(
      (body) => api.put(`/admin/programs/${id}`, body),
      (form) => api.put(`/admin/programs/${id}`, form),
      data,
      file
    ),
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
  update: (id, data, file) =>
    withOptionalImage(
      (body) => api.put(`/admin/gallery/${id}`, body),
      (form) => api.put(`/admin/gallery/${id}`, form),
      data,
      file
    ),
  remove: (id) => api.delete(`/admin/gallery/${id}`),
};

export const facilityService = {
  listPublic: () => api.get('/facilities'),
  list: (params) => api.get('/admin/facilities', { params }),
  create: (data, file) =>
    withOptionalImage(
      (body) => api.post('/admin/facilities', body),
      (form) => api.post('/admin/facilities', form),
      data,
      file
    ),
  update: (id, data, file) =>
    withOptionalImage(
      (body) => api.put(`/admin/facilities/${id}`, body),
      (form) => api.put(`/admin/facilities/${id}`, form),
      data,
      file
    ),
  remove: (id) => api.delete(`/admin/facilities/${id}`),
};

export const athleteService = {
  listPublic: () => api.get('/athletes'),
  list: (params) => api.get('/admin/athletes', { params }),
  create: (data, file) =>
    withOptionalImage(
      (body) => api.post('/admin/athletes', body),
      (form) => api.post('/admin/athletes', form),
      data,
      file
    ),
  update: (id, data, file) =>
    withOptionalImage(
      (body) => api.put(`/admin/athletes/${id}`, body),
      (form) => api.put(`/admin/athletes/${id}`, form),
      data,
      file
    ),
  remove: (id) => api.delete(`/admin/athletes/${id}`),
};

export const legacyMemberService = {
  listPublic: () => api.get('/legacy-members'),
  list: (params) => api.get('/admin/legacy-members', { params }),
  getOne: (id) => api.get(`/admin/legacy-members/${id}`),
  create: (data, file) =>
    withOptionalImage(
      (body) => api.post('/admin/legacy-members', body),
      (form) => api.post('/admin/legacy-members', form),
      data,
      file
    ),
  update: (id, data, file) =>
    withOptionalImage(
      (body) => api.put(`/admin/legacy-members/${id}`, body),
      (form) => api.put(`/admin/legacy-members/${id}`, form),
      data,
      file
    ),
  remove: (id) => api.delete(`/admin/legacy-members/${id}`),
};

export const globalSearchService = {
  search: (q, { signal } = {}) =>
    api.get('/admin/global-search', { params: { q }, signal }),
};

export const featureService = {
  listPublic: () => api.get('/features'),
  list: (params) => api.get('/admin/features', { params }),
  create: (data, file) =>
    withOptionalImage(
      (body) => api.post('/admin/features', body),
      (form) => api.post('/admin/features', form),
      data,
      file
    ),
  update: (id, data, file) =>
    withOptionalImage(
      (body) => api.put(`/admin/features/${id}`, body),
      (form) => api.put(`/admin/features/${id}`, form),
      data,
      file
    ),
  remove: (id) => api.delete(`/admin/features/${id}`),
};

export const membershipService = {
  listPublic: () => api.get('/membership-plans'),
  list: (params) => api.get('/admin/membership-plans', { params }),
  create: (data, file) =>
    withOptionalImage(
      (body) => api.post('/admin/membership-plans', body),
      (form) => api.post('/admin/membership-plans', form),
      data,
      file
    ),
  update: (id, data, file) =>
    withOptionalImage(
      (body) => api.put(`/admin/membership-plans/${id}`, body),
      (form) => api.put(`/admin/membership-plans/${id}`, form),
      data,
      file
    ),
  remove: (id) => api.delete(`/admin/membership-plans/${id}`),
};

export const siteSettingsService = {
  getPublic: () => api.get('/site-settings'),
  getAdmin: () => api.get('/admin/site-settings'),
  update: (data, { heroImage, aboutImage } = {}) => {
    const form = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      form.append(key, typeof value === 'string' ? value : JSON.stringify(value));
    });
    if (heroImage) form.append('heroImage', heroImage);
    if (aboutImage) form.append('aboutImage', aboutImage);
    return api.put('/admin/site-settings', form);
  },
};

export const videoService = {
  listPublic: (params) => api.get('/videos', { params }),
  getBySlug: (slug) => api.get(`/videos/${slug}`),
  list: (params) => api.get('/admin/videos', { params }),
  stats: () => api.get('/admin/videos/stats'),
  create: async (data, { video, onUploadProgress } = {}) => {
    const { default: uploadApi, wakeUploadBackend } = await import('./uploadApi');
    if (video) await wakeUploadBackend();
    const form = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      // File-upload only flow — never send URL fields from admin
      if (key === 'youtubeUrl' || key === 'vimeoUrl') return;
      form.append(key, String(value));
    });
    if (video) form.append('video', video);
    // Direct to Render — avoids Vercel 120s proxy timeout ("Network Error" on live)
    return uploadApi.post('/admin/videos', form, {
      onUploadProgress,
      timeout: 15 * 60 * 1000,
    });
  },
  update: async (id, data, { video, onUploadProgress } = {}) => {
    const { default: uploadApi, wakeUploadBackend } = await import('./uploadApi');
    if (video) await wakeUploadBackend();
    const form = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === 'youtubeUrl' || key === 'vimeoUrl') return;
      form.append(key, String(value));
    });
    if (video) form.append('video', video);
    return uploadApi.put(`/admin/videos/${id}`, form, {
      onUploadProgress,
      timeout: 15 * 60 * 1000,
    });
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
    create: async (data, { photo, parentPhoto, aadhaarFront, aadhaarBack, panCard } = {}) => {
      const hasFiles = [photo, parentPhoto, aadhaarFront, aadhaarBack, panCard].some(isBrowserFile);
      if (!hasFiles) return api.post('/admin/students', data);

      const { default: uploadApi, wakeUploadBackend } = await import('./uploadApi');
      await wakeUploadBackend();
      const form = new FormData();
      Object.entries(data || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (['photo', 'parentPhoto', 'aadhaarFront', 'aadhaarBack', 'panCard', 'image', 'file', 'profileImage'].includes(key)) {
          return;
        }
        form.append(key, String(value));
      });
      if (isBrowserFile(photo)) form.append('photo', photo);
      if (isBrowserFile(parentPhoto)) form.append('parentPhoto', parentPhoto);
      if (isBrowserFile(aadhaarFront)) form.append('aadhaarFront', aadhaarFront);
      if (isBrowserFile(aadhaarBack)) form.append('aadhaarBack', aadhaarBack);
      if (isBrowserFile(panCard)) form.append('panCard', panCard);
      // Direct to Render — Vercel rewrite can corrupt multipart field names ("Unexpected field")
      return uploadApi.post('/admin/students', form, { timeout: 5 * 60 * 1000 });
    },
    update: async (id, data, { photo, parentPhoto, aadhaarFront, aadhaarBack, panCard } = {}) => {
      const hasFiles = [photo, parentPhoto, aadhaarFront, aadhaarBack, panCard].some(isBrowserFile);
      if (!hasFiles) return api.put(`/admin/students/${id}`, data);

      const { default: uploadApi, wakeUploadBackend } = await import('./uploadApi');
      await wakeUploadBackend();
      const form = new FormData();
      Object.entries(data || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (['photo', 'parentPhoto', 'aadhaarFront', 'aadhaarBack', 'panCard', 'image', 'file', 'profileImage'].includes(key)) {
          return;
        }
        form.append(key, String(value));
      });
      if (isBrowserFile(photo)) form.append('photo', photo);
      if (isBrowserFile(parentPhoto)) form.append('parentPhoto', parentPhoto);
      if (isBrowserFile(aadhaarFront)) form.append('aadhaarFront', aadhaarFront);
      if (isBrowserFile(aadhaarBack)) form.append('aadhaarBack', aadhaarBack);
      if (isBrowserFile(panCard)) form.append('panCard', panCard);
      return uploadApi.put(`/admin/students/${id}`, form, { timeout: 5 * 60 * 1000 });
    },
    remove: (id) => api.delete(`/admin/students/${id}`),
    resetPassword: (id, payload) => api.post(`/admin/students/${id}/reset-password`, payload),
  },
  coaches: {
    listPublic: () => api.get('/coaches'),
    list: (params) => api.get('/admin/coaches', { params }),
    stats: () => api.get('/admin/coaches/stats'),
    getOne: (id) => api.get(`/admin/coaches/${id}`),
    exportRecords: ({ format = 'xlsx', search = '', status } = {}) =>
      api.post(
        '/admin/coaches/export',
        { format, search, status },
        { responseType: 'blob' }
      ),
    create: async (data, { photo, aadhaarFront, aadhaarBack, panCard, certificates } = {}) => {
      const certList = Array.isArray(certificates) ? certificates : certificates ? [certificates] : [];
      const hasFiles =
        [photo, aadhaarFront, aadhaarBack, panCard].some(isBrowserFile) || certList.some(isBrowserFile);
      if (!hasFiles) return api.post('/admin/coaches', data);

      const { default: uploadApi, wakeUploadBackend } = await import('./uploadApi');
      await wakeUploadBackend();
      const form = new FormData();
      Object.entries(data || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (['photo', 'aadhaarFront', 'aadhaarBack', 'panCard', 'certificates', 'image', 'file', 'profileImage'].includes(key)) {
          return;
        }
        form.append(key, String(value));
      });
      if (isBrowserFile(photo)) form.append('photo', photo);
      if (isBrowserFile(aadhaarFront)) form.append('aadhaarFront', aadhaarFront);
      if (isBrowserFile(aadhaarBack)) form.append('aadhaarBack', aadhaarBack);
      if (isBrowserFile(panCard)) form.append('panCard', panCard);
      certList.filter(isBrowserFile).forEach((f) => form.append('certificates', f));
      return uploadApi.post('/admin/coaches', form, { timeout: 5 * 60 * 1000 });
    },
    update: async (id, data, { photo, aadhaarFront, aadhaarBack, panCard, certificates } = {}) => {
      const certList = Array.isArray(certificates) ? certificates : certificates ? [certificates] : [];
      const hasFiles =
        [photo, aadhaarFront, aadhaarBack, panCard].some(isBrowserFile) || certList.some(isBrowserFile);
      if (!hasFiles) return api.put(`/admin/coaches/${id}`, data);

      const { default: uploadApi, wakeUploadBackend } = await import('./uploadApi');
      await wakeUploadBackend();
      const form = new FormData();
      Object.entries(data || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (['photo', 'aadhaarFront', 'aadhaarBack', 'panCard', 'certificates', 'image', 'file', 'profileImage'].includes(key)) {
          return;
        }
        form.append(key, String(value));
      });
      if (isBrowserFile(photo)) form.append('photo', photo);
      if (isBrowserFile(aadhaarFront)) form.append('aadhaarFront', aadhaarFront);
      if (isBrowserFile(aadhaarBack)) form.append('aadhaarBack', aadhaarBack);
      if (isBrowserFile(panCard)) form.append('panCard', panCard);
      certList.filter(isBrowserFile).forEach((f) => form.append('certificates', f));
      return uploadApi.put(`/admin/coaches/${id}`, form, { timeout: 5 * 60 * 1000 });
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

const appendForm = (data, file) => asForm(data, 'image', file);

export const playerAchievementService = {
  list: (params) => api.get('/admin/player-achievements', { params }),
  create: (data, file) =>
    withOptionalImage(
      (body) => api.post('/admin/player-achievements', body),
      (form) => api.post('/admin/player-achievements', form),
      data,
      file
    ),
  update: (id, data, file) =>
    withOptionalImage(
      (body) => api.put(`/admin/player-achievements/${id}`, body),
      (form) => api.put(`/admin/player-achievements/${id}`, form),
      data,
      file
    ),
  remove: (id) => api.delete(`/admin/player-achievements/${id}`),
};

export const playerAchievementPublicService = {
  listPublic: (params) => api.get('/public/achievements', { params }),
};

export const equipmentPublicService = {
  listPublic: () => api.get('/public/equipment'),
};

export const tournamentService = {
  list: (params) => api.get('/admin/tournaments', { params }),
  create: (data, file) =>
    withOptionalImage(
      (body) => api.post('/admin/tournaments', body),
      (form) => api.post('/admin/tournaments', form),
      data,
      file
    ),
  update: (id, data, file) =>
    withOptionalImage(
      (body) => api.put(`/admin/tournaments/${id}`, body),
      (form) => api.put(`/admin/tournaments/${id}`, form),
      data,
      file
    ),
  remove: (id) => api.delete(`/admin/tournaments/${id}`),
  upsertResult: (id, data, file) =>
    withOptionalImage(
      (body) => api.post(`/admin/tournaments/${id}/results`, body),
      (form) => api.post(`/admin/tournaments/${id}/results`, form),
      data,
      file
    ),
  removeResult: (id, resultId) => api.delete(`/admin/tournaments/${id}/results/${resultId}`),
};

export const parentAdminService = {
  list: () => api.get('/admin/parents'),
  create: (data, file) => {
    const form = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === 'studentIds' && Array.isArray(value)) {
        value.forEach((id) => form.append('studentIds', String(id)));
        return;
      }
      form.append(key, String(value));
    });
    if (isBrowserFile(file)) form.append('image', file);
    return api.post('/admin/parents', form);
  },
  update: (id, data, file) => {
    const form = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === 'studentIds' && Array.isArray(value)) {
        value.forEach((sid) => form.append('studentIds', String(sid)));
        return;
      }
      if (key === 'password' && !String(value).trim()) return;
      form.append(key, String(value));
    });
    if (isBrowserFile(file)) form.append('image', file);
    return api.put(`/admin/parents/${id}`, form);
  },
  remove: (id) => api.delete(`/admin/parents/${id}`),
};

export const parentPortalService = {
  me: () => api.get('/parent/me'),
  childAttendance: (studentId, params) =>
    api.get(`/parent/children/${studentId}/attendance`, { params }),
  childAchievements: (studentId) => api.get(`/parent/children/${studentId}/achievements`),
  childTournaments: (studentId) => api.get(`/parent/children/${studentId}/tournaments`),
};

export const playerPortalService = {
  myAchievements: () => api.get('/student/my-achievements'),
  myTournaments: () => api.get('/student/my-tournaments'),
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
  markStatus: (payload) => api.post('/admin/attendance/mark', payload),
  myProfile: () => api.get('/student/profile'),
  myAttendance: (params) => api.get('/student/attendance', { params }),
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
    if (isBrowserFile(profileImage)) form.append('profileImage', profileImage);
    return api.post('/admin/users', form);
  },
  update: (id, data, profileImage) => {
    if (!isBrowserFile(profileImage)) {
      return api.put(`/admin/users/${id}`, data);
    }
    const form = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === 'profileImage' || key === 'image' || key === 'photo' || key === 'file') return;
      form.append(key, String(value));
    });
    form.append('profileImage', profileImage);
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

export const reportsService = {
  dashboard: () => api.get('/admin/reports/dashboard'),
  players: (params) => api.get('/admin/reports/players', { params }),
  kheloIndia: (params) => api.get('/admin/reports/khelo-india', { params }),
  attendanceDashboard: (params) => api.get('/admin/reports/attendance/dashboard', { params }),
  monthlyAttendance: (params) => api.get('/admin/reports/attendance/monthly', { params }),
  employeeAttendance: (params) => api.get('/admin/reports/attendance/employees', { params }),
  ageCategories: (params) => api.get('/admin/reports/categories/age', { params }),
  playerCategories: (params) => api.get('/admin/reports/categories/player', { params }),
  weightCategories: (params) => api.get('/admin/reports/categories/weight', { params }),
  tournaments: (params) => api.get('/admin/reports/tournaments', { params }),
  medals: (params) => api.get('/admin/reports/medals', { params }),
  pendingFees: (params) => api.get('/admin/reports/fees/pending', { params }),
  salary: (params) => api.get('/admin/reports/salary', { params }),
  sponsorships: (params) => api.get('/admin/reports/sponsorships', { params }),
  export: (reportKey, payload) =>
    api.post(`/admin/reports/export/${reportKey}`, payload, { responseType: 'blob' }),
};

export const sponsorshipService = {
  list: (params) => api.get('/admin/sponsorships', { params }),
  getOne: (id) => api.get(`/admin/sponsorships/${id}`),
  create: (data, file) => {
    const form = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      form.append(key, String(value));
    });
    if (isBrowserFile(file)) form.append('document', file);
    return api.post('/admin/sponsorships', form);
  },
  update: (id, data, file) => {
    if (!isBrowserFile(file)) {
      return api.put(`/admin/sponsorships/${id}`, data);
    }
    const form = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === 'document' || key === 'image' || key === 'file') return;
      form.append(key, String(value));
    });
    form.append('document', file);
    return api.put(`/admin/sponsorships/${id}`, form);
  },
  remove: (id) => api.delete(`/admin/sponsorships/${id}`),
  downloadDocument: (id) =>
    api.get(`/admin/sponsorships/${id}/document`, { responseType: 'blob' }),
  export: (payload) =>
    api.post('/admin/sponsorships/export', payload, { responseType: 'blob' }),
};
