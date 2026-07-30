import api from './api';

export const authService = {
  login: (payload) => api.post('/auth/login', payload),
  register: (payload) => api.post('/auth/register', payload),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
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
