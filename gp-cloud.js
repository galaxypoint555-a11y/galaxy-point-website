/* Shared Galaxy Point Firebase + Cloudinary client for Website Editor and Boss Dashboard. */
window.GPCloud = (() => {
  const cfg = window.GP_CONFIG || {}, storageKey = 'gp_fb_staff_session_v1';
  let session = null, user = null, role = null;

  const fb = () => cfg.firebase || {};
  const cld = () => cfg.cloudinary || {};
  const configured = () => Boolean(fb().apiKey && fb().projectId && cld().cloudName && cld().uploadPreset);

  function requireConfig() {
    if (!configured()) throw Error('Firebase or Cloudinary is not configured in gp-config.js.');
  }

  const fsBase = () => `https://firestore.googleapis.com/v1/projects/${fb().projectId}/databases/(default)/documents`;

  function toFsVal(v) {
    if (v === null || v === undefined) return { nullValue: null };
    if (typeof v === 'boolean') return { booleanValue: v };
    if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    if (typeof v === 'string') return { stringValue: v };
    if (Array.isArray(v)) return { arrayValue: { values: v.map(toFsVal) } };
    if (typeof v === 'object') {
      const fields = {};
      for (const [k, val] of Object.entries(v)) {
        if (val !== undefined) fields[k] = toFsVal(val);
      }
      return { mapValue: { fields } };
    }
    return { stringValue: String(v) };
  }

  function fromFsVal(v) {
    if (!v || typeof v !== 'object') return null;
    if ('nullValue' in v) return null;
    if ('booleanValue' in v) return v.booleanValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return Number(v.doubleValue);
    if ('stringValue' in v) return v.stringValue;
    if ('timestampValue' in v) return v.timestampValue;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromFsVal);
    if ('mapValue' in v) {
      const obj = {};
      for (const [k, val] of Object.entries(v.mapValue.fields || {})) obj[k] = fromFsVal(val);
      return obj;
    }
    return null;
  }

  function fromDoc(doc) {
    const id = doc.name.split('/').pop();
    const data = fromFsVal({ mapValue: { fields: doc.fields || {} } }) || {};
    return { id, ...data, created_at: data.created_at || doc.createTime || new Date().toISOString() };
  }

  function saveSession(s) {
    session = s;
    if (s) sessionStorage.setItem(storageKey, JSON.stringify(s));
    else sessionStorage.removeItem(storageKey);
  }

  async function renewSession() {
    if (!session?.refreshToken) throw Error('Session expired. Please sign in again.');
    const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${fb().apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: session.refreshToken })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.id_token) throw Error('Session expired. Please sign in again.');
    saveSession({
      idToken: data.id_token,
      refreshToken: data.refresh_token,
      email: session.email,
      uid: data.user_id,
      expiresAt: Date.now() + (Number(data.expires_in || 3600) * 1000)
    });
  }

  async function getToken() {
    if (!session) {
      try { session = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch {}
    }
    if (!session?.idToken) return null;
    if (session.expiresAt && session.expiresAt <= Date.now() + 90000) {
      await renewSession();
    }
    return session.idToken;
  }

  async function fsReq(path, { method = 'GET', body, auth = true } = {}) {
    requireConfig();
    const token = auth ? await getToken() : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    const res = await fetch(fsBase() + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Error(data?.error?.message || 'Database request failed (' + res.status + ')');
    return data;
  }

  async function ensureSession() {
    const token = await getToken();
    if (!token) return null;
    user = { id: session.uid, email: session.email };
    const bossList = (cfg.bossEmails || ['jagdish@gmail.com']).map(e => e.toLowerCase());
    role = bossList.includes(String(session.email || '').toLowerCase()) ? 'boss' : 'staff';
    return { user, role };
  }

  async function signIn(email, password) {
    requireConfig();
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${fb().apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(email).trim(), password, returnSecureToken: true })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.idToken) {
      const msg = data?.error?.message || 'Invalid email or password';
      throw Error(msg.replace(/_/g, ' '));
    }
    saveSession({
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      email: data.email,
      uid: data.localId,
      expiresAt: Date.now() + (Number(data.expiresIn || 3600) * 1000)
    });
    return ensureSession();
  }

  async function signOut() {
    saveSession(null);
    user = null;
    role = null;
  }

  function active() { return Boolean(session?.idToken && user && role); }
  function guard() { if (!active()) throw Error('Sign in with an authorized staff account first.'); }

  async function listCollection(col, auth = true) {
    const data = await fsReq(`/${col}?pageSize=500`, { auth });
    const docs = (data.documents || []).map(fromDoc);
    return docs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  async function productById(id) {
    guard();
    const doc = await fsReq(`/products/${encodeURIComponent(id)}`);
    return [fromDoc(doc)];
  }

  async function products() {
    guard();
    const rows = await listCollection('products');
    return rows.map(p => ({
      ...p,
      name: p.title,
      price: p.price_inr,
      condition: p.condition || 'Pre-Owned',
      is_published: p.is_published ?? p.active ?? false
    }));
  }

  async function settings() {
    const data = await fsReq('/website_settings?pageSize=200', { auth: false });
    const out = {};
    for (const doc of (data.documents || [])) {
      const d = fromDoc(doc);
      out[d.id] = d.value;
    }
    return out;
  }

  async function saveSettings(fields) {
    guard();
    for (const [key, value] of Object.entries(fields)) {
      await fsReq(`/website_settings/${encodeURIComponent(key)}`, {
        method: 'PATCH',
        body: { fields: { value: toFsVal(value), updated_at: toFsVal(new Date().toISOString()) } }
      });
    }
  }

  async function upsertProduct(fields, id) {
    guard();
    const category = String(fields.category || '').toLowerCase();
    const title = String(fields.title || '').toLowerCase();
    const brand = fields.brand || (
      /iphone|ipad|macbook|apple watch/.test(category + ' ' + title) ? 'Apple' :
      /samsung|galaxy/.test(category + ' ' + title) ? 'Samsung' :
      /oneplus/.test(category + ' ' + title) ? 'OnePlus' :
      /pixel|google/.test(category + ' ' + title) ? 'Google' :
      /nothing/.test(category + ' ' + title) ? 'Nothing' :
      /motorola|moto/.test(category + ' ' + title) ? 'Motorola' :
      /vivo/.test(category + ' ' + title) ? 'Vivo' :
      /oppo/.test(category + ' ' + title) ? 'Oppo' : 'Galaxy Point'
    );

    const docId = id || ('prod_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6));
    const payload = {
      title: fields.title,
      brand,
      category: fields.category,
      variant: fields.variant || '',
      description: fields.description || '',
      price_inr: Number(fields.price_inr || 0),
      stock: Number(fields.stock || 0),
      variant_options: fields.variant_options || [],
      image_url: fields.image_url || null,
      is_published: Boolean(fields.active),
      active: Boolean(fields.active),
      condition: fields.condition || 'Pre-Owned',
      created_at: fields.created_at || new Date().toISOString()
    };

    const fsFields = {};
    for (const [k, v] of Object.entries(payload)) fsFields[k] = toFsVal(v);
    const saved = await fsReq(`/products/${encodeURIComponent(docId)}`, {
      method: 'PATCH',
      body: { fields: fsFields }
    });
    return [fromDoc(saved)];
  }

  async function removeProduct(id) {
    guard();
    return fsReq(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async function compressImage(file) {
    if (!file.type.startsWith('image/')) return file;
    return new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const max = 1400;
        let { width, height } = img;
        if (width > max || height > max) {
          if (width > height) { height = Math.round(height * max / width); width = max; }
          else { width = Math.round(width * max / height); height = max; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => resolve(blob || file), 'image/webp', 0.84);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  async function upload(file, folder = 'catalog') {
    guard();
    if (!file || !file.size) throw Error('Choose an image or video first.');
    if (!['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].includes(file.type)) {
      throw Error('Upload JPG, PNG, WebP, MP4 or WebM only.');
    }
    const isVideo = file.type.startsWith('video/');
    const uploadBlob = isVideo ? file : await compressImage(file);
    const formData = new FormData();
    formData.append('file', uploadBlob);
    formData.append('upload_preset', cld().uploadPreset);
    formData.append('folder', 'galaxy_point/' + folder);

    const endpoint = `https://api.cloudinary.com/v1_1/${cld().cloudName}/${isVideo ? 'video' : 'image'}/upload`;
    const res = await fetch(endpoint, { method: 'POST', body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.secure_url) {
      throw Error(data?.error?.message || 'Cloudinary upload failed. Check preset "galaxy_point" is Unsigned.');
    }
    return data.secure_url;
  }

  async function listPublic(col) { return listCollection(col, false); }
  async function addPublicDoc(col, obj) {
    const id = 'doc_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const fsFields = {};
    for (const [k, v] of Object.entries({ ...obj, created_at: new Date().toISOString() })) {
      fsFields[k] = toFsVal(v);
    }
    return fsReq(`/${col}/${id}`, { method: 'PATCH', body: { fields: fsFields }, auth: false });
  }
  async function deleteDoc(col, id) {
    guard();
    return fsReq(`/${col}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
  async function patchDoc(col, id, fields) {
    guard();
    const fsFields = {};
    for (const [k, v] of Object.entries(fields)) fsFields[k] = toFsVal(v);
    const keys = Object.keys(fields).map(k => 'updateMask.fieldPaths=' + encodeURIComponent(k)).join('&');
    return fsReq(`/${col}/${encodeURIComponent(id)}?${keys}`, { method: 'PATCH', body: { fields: fsFields } });
  }

  function money(n) { return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }); }
  function clean(v) { return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  return {
    cfg, configured, ensureSession, signIn, signOut, active,
    products, productById, settings, saveSettings, upsertProduct, removeProduct,
    upload, listCollection, listPublic, addPublicDoc, deleteDoc, patchDoc,
    money, clean, get user() { return user; }, get role() { return role; }
  };
})();
