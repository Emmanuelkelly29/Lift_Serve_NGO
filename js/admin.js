/* Admin auth — password comes from js/config.js */
const ADMIN_PASSWORD = window.LISAF_CONFIG?.adminPassword || "";

/* AUTH */
function doLogin() {
  const pw = document.getElementById('pwInput').value;
  if (pw === ADMIN_PASSWORD) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display  = 'block';
    initAdmin();
  } else {
    document.getElementById('loginErr').style.display = 'block';
    document.getElementById('pwInput').value = '';
  }
}
function doLogout() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminPanel').style.display  = 'none';
  document.getElementById('pwInput').value = '';
}
document.getElementById('pwInput').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });

/* â”€â”€ PANEL NAV â”€â”€ */
function showPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
  document.getElementById('panel-'+name)?.classList.add('active');
  document.querySelectorAll('.sidebar-item').forEach(s => {
    const text = s.textContent.toLowerCase();
    const key = name === 'homepage' ? 'home' : name;
    if (key === 'communications' ? text.includes('messages') : text.includes(key.substring(0,5))) s.classList.add('active');
  });
  if (name==='news')       loadNewsList();
  if (name==='communications') loadCommunications();
  if (name==='partners')   loadPartnersList();
  if (name==='homepage')   loadHomepageData();
  if (name==='about')      { loadHomepageData(); }
  if (name==='stats')      loadStatsData();
  if (name==='gallery')    buildGalleryCards();
  if (name==='team')       buildTeamCards();
  if (name==='media')      loadMediaLibrary();
  if (name==='donations')  loadDonations();
  if (name==='dashboard')  loadDashCounts();
}

/* â”€â”€ TOAST â”€â”€ */
function toast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent=msg; t.className='toast '+type+' show';
  setTimeout(()=>t.className='toast',3000);
}

/* â”€â”€ CLOUDINARY CONFIG â”€â”€ */
function saveCloudinary() {
  localStorage.setItem('lisaf_cloud',  document.getElementById('cfg_cloud').value.trim());
  localStorage.setItem('lisaf_preset', document.getElementById('cfg_preset').value.trim());
  toast('Cloudinary config saved âœ“','ok');
}
function loadCloudinary() {
  // Real Cloudinary credentials â€” pre-filled
  const cloud  = localStorage.getItem('lisaf_cloud')  || window.LISAF_CONFIG?.cloudinary?.cloudName || '';
  const preset = localStorage.getItem('lisaf_preset') || window.LISAF_CONFIG?.cloudinary?.uploadPreset || '';
  localStorage.setItem('lisaf_cloud',  cloud);
  localStorage.setItem('lisaf_preset', preset);
  document.getElementById('cfg_cloud').value  = cloud;
  document.getElementById('cfg_preset').value = preset;
}

/* â”€â”€ CLOUDINARY UPLOAD â”€â”€ */
async function uploadImg(input, key, hiddenId) {
  const file = input.files[0]; if (!file) return;
  const cloud  = localStorage.getItem('lisaf_cloud')  || '';
  const preset = localStorage.getItem('lisaf_preset') || '';
  if (!cloud || !preset) {
    toast('âš  Set Cloudinary config in Settings first!','err');
    showPanel('settings'); return;
  }

  // Instant local preview
  const prev = document.getElementById('prev-'+key);
  if (prev) { const r=new FileReader(); r.onload=e=>{prev.src=e.target.result;prev.style.display='block';}; r.readAsDataURL(file); }

  const prog = document.getElementById('prog-'+key);
  const pb   = document.getElementById('pb-'+key);
  const stat = document.getElementById('status-'+key);
  if (prog) prog.style.display='block';
  if (stat) stat.textContent='Uploading…';

  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', preset);
  fd.append('folder', 'lisaf_foundation');

  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloud}/image/upload`);
    xhr.upload.onprogress = e => { if(pb) pb.style.width=Math.round(e.loaded/e.total*100)+'%'; };
    const res = await new Promise((ok,fail) => { xhr.onload=()=>ok(JSON.parse(xhr.responseText)); xhr.onerror=fail; xhr.send(fd); });

    const url = res.secure_url;
    // Prefer a reasonably sized delivery URL so the public site loads faster
    const displayUrl = (window.LISAF_IMAGES && window.LISAF_IMAGES.optimizeImageUrl)
      ? window.LISAF_IMAGES.optimizeImageUrl(url, { w: 1600 })
      : url;
    if (prog) prog.style.display='none';
    if (prev) prev.src = displayUrl;
    const utxt = document.getElementById('urltxt-'+key);
    if (utxt) { utxt.textContent=url; utxt.style.display='block'; }
    const hiddenInput = document.getElementById(hiddenId);
    if (hiddenInput) hiddenInput.value = url;
    const textInput = document.getElementById(hiddenId + '-text');
    if (textInput) textInput.value = url;
    if (stat) { stat.textContent='âœ“ Uploaded successfully!'; stat.className='upload-status ok'; }
    toast('Image uploaded âœ“','ok');
  } catch(e) {
    if (prog) prog.style.display='none';
    if (stat) { stat.textContent='âœ— Upload failed. Check Cloudinary config.'; stat.className='upload-status err'; }
    toast('Upload failed â€” check Cloudinary config','err');
  }
}

/* helper: show existing image in upload zone */
function showExisting(key, hiddenId, url) {
  const prev = document.getElementById('prev-'+key);
  if (prev) { prev.src=url; prev.style.display='block'; }
  const utxt = document.getElementById('urltxt-'+key);
  if (utxt) { utxt.textContent=url; utxt.style.display='block'; }
  const inp = document.getElementById(hiddenId);
  if (inp) inp.value=url;
}

/* â”€â”€ GALLERY CARDS (dynamic build) â”€â”€ */
function createGalleryItemId() { return 'galleryItem-'+Math.random().toString(36).slice(2,10); }
function buildGalleryCards(items=[]) {
  const wrap = document.getElementById('galleryCards'); if (!wrap) return;
  wrap.innerHTML = '';
  if (!items.length) items = [{ type:'image', url:'', caption:'' }];
  items.forEach(item => addGalleryItem(item));
}
function addGalleryItem(item={type:'image',url:'',caption:''}) {
  const wrap = document.getElementById('galleryCards'); if (!wrap) return;
  const id = item.id || createGalleryItemId();
  const card = document.createElement('div');
  card.className = 'card gallery-item-card';
  card.dataset.itemId = id;
  card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1rem;">
      <h3 style="margin:0;font-size:1rem;">Gallery Item</h3>
      <button class="btn btn-danger btn-sm" type="button" onclick="removeGalleryItem(this)"><i class="fas fa-trash"></i> Remove</button>
    </div>
    <div class="form-row">
      <div>
        <label>Type</label>
        <select id="galleryType-${id}" onchange="onGalleryTypeChange('${id}', this.value)">
          <option value="image"${item.type==='image'?' selected':''}>Image</option>
          <option value="video"${item.type==='video'?' selected':''}>Video</option>
        </select>
      </div>
      <div>
        <label>Caption</label>
        <input type="text" id="galleryCaption-${id}" value="${(item.caption||'').replace(/"/g,'&quot;')}" placeholder="Optional caption">
      </div>
    </div>
    <div class="gallery-fields" id="galleryFields-${id}"></div>
    <div class="gallery-preview" id="galleryPreview-${id}"></div>`;
  wrap.appendChild(card);
  renderGalleryFields(id,item);
}
function renderGalleryFields(id,item={type:'image',url:''}) {
  const fields = document.getElementById(`galleryFields-${id}`); if (!fields) return;
  const type = item.type || 'image';
  const url = item.url || '';
  fields.innerHTML = `
    <label>Media URL</label>
    <input type="url" class="gallery-url-input" id="galleryItemUrlText-${id}" value="${(url||'').replace(/"/g,'&quot;')}" placeholder="${type==='video'?'Enter video URL (mp4 or YouTube)':'Enter image URL or upload file'}">
    <input type="hidden" class="gallery-hidden-url" id="galleryItemUrl-${id}" value="${type==='image'?url:''}">
    <div class="upload-zone" id="galleryUploadZone-${id}" style="display:${type==='image'?'block':'none'};">
      <input type="file" accept="image/*" onchange="uploadImg(this,'galleryItem-${id}','galleryItemUrl-${id}')">
      <div class="upload-icon"><i class="fas fa-camera"></i></div>
      <p>Upload image file from your device</p>
      <div class="prog-bar-wrap" id="prog-galleryItem-${id}"><div class="prog-bar" id="pb-galleryItem-${id}"></div></div>
      <img class="preview-img" id="prev-galleryItem-${id}" alt="">
      <p class="img-url-txt" id="urltxt-galleryItem-${id}"></p>
      <p class="upload-status" id="status-galleryItem-${id}"></p>
    </div>`;
  const urlInput = document.getElementById(`galleryItemUrlText-${id}`);
  urlInput?.addEventListener('input', () => updateGalleryPreview(id));
  updateGalleryPreview(id);
}
function onGalleryTypeChange(id,type) {
  const zone = document.getElementById(`galleryUploadZone-${id}`);
  if (zone) zone.style.display = type==='image' ? 'block' : 'none';
  updateGalleryPreview(id);
}
function updateGalleryPreview(id) {
  const preview = document.getElementById(`galleryPreview-${id}`); if (!preview) return;
  const type = document.getElementById(`galleryType-${id}`)?.value || 'image';
  const url = document.getElementById(`galleryItemUrlText-${id}`)?.value.trim() || '';
  preview.innerHTML = '';
  if (!url) return;
  if (type === 'image') {
    preview.innerHTML = `<div class="gallery-item-preview"><img src="${url}" alt=""></div>`;
  } else {
    const youtubeId = getYoutubeId(url);
    if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) {
      preview.innerHTML = `<div class="gallery-item-preview"><video controls src="${url}"></video></div>`;
    } else if (youtubeId) {
      preview.innerHTML = `<div class="gallery-item-preview"><iframe src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen></iframe></div>`;
    } else {
      preview.innerHTML = `<div class="gallery-item-preview" style="padding:1rem;"><a href="${url}" target="_blank" style="color:var(--navy);text-decoration:underline;">Open media</a></div>`;
    }
  }
}
function getYoutubeId(url) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}
function removeGalleryItem(btn) { btn.closest('.gallery-item-card')?.remove(); }
async function saveGallery() {
  if (!window._db) { toast('Firebase not ready','err'); return; }
  const data = { updatedAt: window._serverTimestamp() };
  const items = [];
  document.querySelectorAll('.gallery-item-card').forEach(card => {
    const id = card.dataset.itemId;
    const type = document.getElementById(`galleryType-${id}`)?.value || 'image';
    const caption = document.getElementById(`galleryCaption-${id}`)?.value.trim() || '';
    let url = document.getElementById(`galleryItemUrlText-${id}`)?.value.trim() || '';
    const hidden = document.getElementById(`galleryItemUrl-${id}`)?.value.trim();
    if (type==='image' && hidden) url = hidden;
    if (!url) return;
    items.push({ type, url, caption });
  });
  data.galleryItems = items;
  try { await window._setDoc(window._doc(window._db,'siteContent','homepage'), data, { merge:true }); toast('Gallery saved âœ“','ok'); }
  catch(e) { toast('Save failed','err'); }
}

/* TEAM PHOTO CARDS */
const teamMembers = [
  'Margaret Kelikume (Children Advocacy Lead)',
  'Emmanuel C. Kelly (Managing Trustee)',
  'Michael Egunjobi (Director)'
];
function buildTeamCards() {
  const wrap = document.getElementById('teamPhotoCards'); if (!wrap) return;
  wrap.innerHTML = '';
  for (let i=1;i<=3;i++) {
    wrap.innerHTML += `
      <div class="card" style="margin:0;">
        <h3>${teamMembers[i-1]}</h3>
        <p style="font-size:.75rem;color:var(--muted);margin:0 0 .6rem;">Saves as teamMemberImg${i} on the About page</p>
        <div class="upload-zone">
          <input type="file" accept="image/*" onchange="uploadImg(this,'tm${i}','hp_tm${i}Url')">
          <div class="upload-icon"><i class="fas fa-user-circle"></i></div>
          <p>Tap to upload member photo</p>
          <div class="prog-bar-wrap" id="prog-tm${i}"><div class="prog-bar" id="pb-tm${i}"></div></div>
          <img class="preview-img" id="prev-tm${i}" alt="" style="border-radius:50%;max-height:120px;width:120px;object-fit:cover;">
          <p class="img-url-txt" id="urltxt-tm${i}"></p>
          <p class="upload-status" id="status-tm${i}"></p>
        </div>
        <input type="hidden" id="hp_tm${i}Url">
      </div>`;
  }
  // Reload existing URLs after rebuild
  loadTeamPhotoUrls();
}
async function loadTeamPhotoUrls() {
  if (!window._db) return;
  try {
    const snap = await window._getDoc(window._doc(window._db,'siteContent','homepage'));
    if (!snap.exists()) return;
    const d = snap.data();
    for (let i=1;i<=3;i++) {
      if (d['teamMemberImg'+i]) showExisting('tm'+i, 'hp_tm'+i+'Url', d['teamMemberImg'+i]);
    }
  } catch (e) { console.warn(e); }
}
async function saveTeamPhotos() {
  if (!window._db) { toast('Firebase not ready','err'); return; }
  const data = { updatedAt: window._serverTimestamp() };
  for (let i=1;i<=3;i++) { const v=document.getElementById(`hp_tm${i}Url`)?.value; if(v) data['teamMemberImg'+i]=v; }
  try { await window._setDoc(window._doc(window._db,'siteContent','homepage'),data,{merge:true}); toast('Team photos saved ✓','ok'); }
  catch(e) { toast('Save failed','err'); }
}

async function saveAboutPage() {
  if (!window._db) { toast('Firebase not ready','err'); return; }
  const data = {
    teamImageUrl:  document.getElementById('hp_teamImgUrl')?.value || null,
    storyImageUrl: document.getElementById('hp_storyImgUrl')?.value || null,
    updatedAt: window._serverTimestamp()
  };
  try {
    await window._setDoc(window._doc(window._db,'siteContent','homepage'), data, { merge:true });
    toast('About page images saved ✓ — refresh about.html to see them','ok');
  } catch(e) {
    console.error(e);
    toast('Save failed','err');
  }
}

/* MEDIA LIBRARY */
async function loadMediaLibrary() {
  const grid = document.getElementById('mediaLibraryGrid'); if (!grid) return;
  if (!window._db) { grid.innerHTML='<p style="color:var(--muted)">Firebase not connected</p>'; return; }
  grid.innerHTML = '<p style="color:var(--muted);font-size:.85rem;">Loading…</p>';
  try {
    const snap = await window._getDoc(window._doc(window._db,'siteContent','homepage'));
    if (!snap.exists()) { grid.innerHTML='<p style="color:var(--muted)">No images found</p>'; return; }
    const d = snap.data();
    const images = [];
    // Single images
    if (d.logoUrl) images.push({ url: d.logoUrl, field: 'logoUrl', label: 'Site Logo' });
    if (d.heroImageUrl) images.push({ url: d.heroImageUrl, field: 'heroImageUrl', label: 'Hero Image' });
    if (d.teamImageUrl) images.push({ url: d.teamImageUrl, field: 'teamImageUrl', label: 'Team Section Image' });
    if (d.storyImageUrl) images.push({ url: d.storyImageUrl, field: 'storyImageUrl', label: 'Our Story Image' });
    for (let i=1;i<=3;i++) {
      if (d['teamMemberImg'+i]) images.push({ url: d['teamMemberImg'+i], field: 'teamMemberImg'+i, label: 'Team Member ' + i });
    }
    // Gallery images
    if (Array.isArray(d.galleryItems)) {
      d.galleryItems.forEach((item, idx) => {
        if (item.type === 'image' && item.url) {
          images.push({ url: item.url, field: 'gallery', index: idx, label: item.caption || 'Gallery Image ' + (idx+1) });
        }
      });
    }
    // Legacy gallery
    for (let i=1;i<=6;i++) {
      if (d['galleryImg'+i]) images.push({ url: d['galleryImg'+i], field: 'galleryImg'+i, label: 'Legacy Gallery ' + i });
    }
    if (!images.length) { grid.innerHTML='<p style="color:var(--muted)">No images found. Upload images in Homepage, Gallery, or Team Photos, then Save.</p>'; return; }
    grid.innerHTML = images.map((img, i) => `
      <div class="card" style="text-align:left;">
        <img src="${img.url}" alt="${img.label}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:.5rem;background:#f0f2f7;">
        <p style="font-size:.85rem;font-weight:600;color:var(--navy);margin:0 0 .4rem;">${img.label}</p>
        <label style="font-size:.72rem;color:var(--muted);display:block;margin-bottom:.25rem;">Image URL</label>
        <input type="text" readonly id="mediaUrl-${i}" value="${(img.url||'').replace(/"/g,'&quot;')}"
          style="width:100%;font-size:.72rem;padding:8px;margin-bottom:.6rem;word-break:break-all;"
          onclick="this.select()">
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
          <button type="button" class="btn btn-outline btn-sm" onclick="copyMediaUrl(${i})"><i class="fas fa-copy"></i> Copy URL</button>
          <a class="btn btn-outline btn-sm" href="${img.url}" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> Open</a>
          <button type="button" class="btn btn-danger btn-sm" onclick="deleteImage('${img.field}', ${img.index !== undefined ? img.index : 'null'})"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>`).join('');
  } catch(e) {
    console.error('Load media library failed', e);
    grid.innerHTML='<p style="color:var(--danger)">Error loading images</p>';
  }
}
function copyMediaUrl(i) {
  const inp = document.getElementById('mediaUrl-' + i);
  if (!inp) return;
  inp.select();
  navigator.clipboard?.writeText(inp.value).then(() => toast('URL copied ✓','ok'))
    .catch(() => { try { document.execCommand('copy'); toast('URL copied ✓','ok'); } catch(e) { toast('Select and copy manually','err'); } });
}
async function deleteImage(field, index) {
  if (!window._db) { toast('Firebase not ready','err'); return; }
  if (!confirm('Are you sure you want to delete this image? It will be removed from the website.')) return;
  try {
    const docRef = window._doc(window._db,'siteContent','homepage');
    if (field === 'gallery') {
      // Remove from galleryItems array
      const snap = await window._getDoc(docRef);
      if (snap.exists()) {
        const d = snap.data();
        if (Array.isArray(d.galleryItems) && d.galleryItems[index]) {
          d.galleryItems.splice(index, 1);
          await window._setDoc(docRef, { galleryItems: d.galleryItems, updatedAt: window._serverTimestamp() }, { merge: true });
        }
      }
    } else {
      // Set field to null
      await window._updateDoc(docRef, { [field]: null, updatedAt: window._serverTimestamp() });
    }
    toast('Image deleted âœ“','ok');
    loadMediaLibrary(); // Refresh
  } catch(e) {
    console.error('Delete image failed', e);
    toast('Delete failed','err');
  }
}

/* â”€â”€ HOMEPAGE SAVE / LOAD â”€â”€ */
async function saveHomepage() {
  if (!window._db) { toast('Firebase not ready','err'); return; }
  const data = {
    heroTitle:    document.getElementById('hp_heroTitle').value.trim()||null,
    heroSubtitle: document.getElementById('hp_heroSubtitle').value.trim()||null,
    aboutText1:   document.getElementById('hp_aboutText1').value.trim()||null,
    aboutText2:   document.getElementById('hp_aboutText2').value.trim()||null,
    logoUrl:      document.getElementById('hp_logoUrl').value||null,
    heroImageUrl: document.getElementById('hp_heroImgUrl').value||null,
    teamImageUrl: document.getElementById('hp_teamImgUrl').value||null,
    storyImageUrl:document.getElementById('hp_storyImgUrl').value||null,
    updatedAt:    window._serverTimestamp()
  };
  Object.keys(data).forEach(k => { if(data[k]===null||data[k]==='') delete data[k]; });
  try {
    await window._setDoc(window._doc(window._db,'siteContent','homepage'),data,{merge:true});
    toast('Homepage saved âœ“','ok');
  } catch(e) { toast('Save failed','err'); console.error(e); }
}
async function loadHomepageData() {
  if (!window._db) return;
  try {
    const snap = await window._getDoc(window._doc(window._db,'siteContent','homepage'));
    if (!snap.exists()) return;
    const d = snap.data();
    if(d.heroTitle)     document.getElementById('hp_heroTitle').value    = d.heroTitle;
    if(d.heroSubtitle)  document.getElementById('hp_heroSubtitle').value = d.heroSubtitle;
    if(d.aboutText1)    document.getElementById('hp_aboutText1').value   = d.aboutText1;
    if(d.aboutText2)    document.getElementById('hp_aboutText2').value   = d.aboutText2;
    if(d.logoUrl)       showExisting('logo',    'hp_logoUrl',     d.logoUrl);
    if(d.heroImageUrl)  showExisting('heroImg', 'hp_heroImgUrl',  d.heroImageUrl);
    if(d.teamImageUrl)  showExisting('teamImg', 'hp_teamImgUrl',  d.teamImageUrl);
    if(d.storyImageUrl) showExisting('storyImg','hp_storyImgUrl', d.storyImageUrl);
    // Gallery & team on re-build
    if (Array.isArray(d.galleryItems) && d.galleryItems.length) {
      buildGalleryCards(d.galleryItems);
    } else {
      const fallback = [];
      for(let i=1;i<=6;i++) { if(d['galleryImg'+i]) fallback.push({type:'image',url:d['galleryImg'+i],caption:''}); }
      buildGalleryCards(fallback);
    }
    for(let i=1;i<=3;i++) { if(d['teamMemberImg'+i]) { buildTeamCards(); setTimeout(()=>showExisting('tm'+i,'hp_tm'+i+'Url',d['teamMemberImg'+i]),100); break; } }
  } catch(e) { console.error(e); }
}

/* â”€â”€ STATS â”€â”€ */
async function loadStatsData() {
  if (!window._db) return;
  try {
    const snap = await window._getDoc(window._doc(window._db,'siteContent','stats'));
    if (!snap.exists()) return;
    const d = snap.data();
    ['children','communities','partners','schools','books','mentored'].forEach(k => {
      if(d[k]) document.getElementById('s_'+k).value = d[k];
    });
  } catch(e) {}
}
async function saveStats() {
  if (!window._db) return;
  try {
    const data = {};
    ['children','communities','partners','schools','books','mentored'].forEach(k => {
      const v = document.getElementById('s_'+k).value.trim();
      if(v) data[k]=v;
    });
    data.updatedAt = window._serverTimestamp();
    await window._setDoc(window._doc(window._db,'siteContent','stats'),data,{merge:true});
    toast('Stats saved âœ“','ok');
  } catch(e) { toast('Save failed','err'); }
}

/* â”€â”€ NEWS â”€â”€ */
async function loadNewsList() {
  const list = document.getElementById('newsList');
  if (!window._db) { list.innerHTML='<p style="color:var(--muted)">Firebase not connected</p>'; return; }
  list.innerHTML='<p style="color:var(--muted);font-size:.85rem;">Loading…</p>';
  try {
    const q = window._query(window._collection(window._db,'news'), window._orderBy('createdAt','desc'));
    const snap = await window._getDocs(q);
    if (snap.empty) { list.innerHTML='<p style="color:var(--muted);font-size:.85rem;">No articles yet.</p>'; return; }
    list.innerHTML='';
    snap.forEach(d => {
      const a = d.data();
      list.innerHTML += `
        <div class="list-item">
          ${a.imageUrl?`<img src="${a.imageUrl}" alt="">`:`<div style="width:70px;height:52px;background:#e5e7eb;border-radius:6px;flex-shrink:0;"></div>`}
          <div class="list-item-body"><h4>${a.title||'Untitled'}</h4><span>${a.category||''} &bull; ${a.date||''}</span><p style="font-size:.78rem;color:var(--muted);margin:.2rem 0 0;">${(a.excerpt||'').slice(0,90)}…</p></div>
          <div class="list-item-actions">
            <button class="btn btn-outline btn-sm" onclick="editArticle('${d.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn btn-danger btn-sm"  onclick="deleteArticle('${d.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>`;
    });
  } catch(e) { list.innerHTML='<p style="color:var(--danger)">Error loading articles</p>'; }
}
async function saveArticle() {
  if (!window._db) return;
  const title = document.getElementById('n_title').value.trim();
  if (!title) { toast('Title is required','err'); return; }
  const data = {
    title, category: document.getElementById('n_category').value,
    date:     document.getElementById('n_date').value,
    excerpt:  document.getElementById('n_excerpt').value.trim(),
    body:     document.getElementById('n_body').value.trim(),
    imageUrl: document.getElementById('n_imgUrl').value||null,
    updatedAt: window._serverTimestamp()
  };
  Object.keys(data).forEach(k => { if(data[k]===null||data[k]==='') delete data[k]; });
  const editId = document.getElementById('editNewsId').value;
  try {
    if (editId) {
      await window._updateDoc(window._doc(window._db,'news',editId),data);
      toast('Article updated âœ“','ok');
    } else {
      data.createdAt = window._serverTimestamp();
      await window._addDoc(window._collection(window._db,'news'),data);
      toast('Article published âœ“','ok');
    }
    clearNewsForm(); loadNewsList();
    if (document.getElementById('notifySubscribers')?.checked) {
      await sendNewsNotifications(data);
    }
  } catch(e) { toast('Save failed','err'); console.error(e); }
}

function loadEmailConfig() {
  document.getElementById('cfg_email_service').value = localStorage.getItem('lisaf_email_service') || '';
  document.getElementById('cfg_email_template').value = localStorage.getItem('lisaf_email_template') || '';
  document.getElementById('cfg_email_user').value = localStorage.getItem('lisaf_email_user') || '';
  document.getElementById('cfg_email_from').value = localStorage.getItem('lisaf_email_from') || 'Lift and Serve All Foundation';
  document.getElementById('cfg_email_from_address').value = localStorage.getItem('lisaf_email_from_address') || 'info@liftandservefoundation.com';
}

function saveEmailConfig() {
  localStorage.setItem('lisaf_email_service',  document.getElementById('cfg_email_service').value.trim());
  localStorage.setItem('lisaf_email_template', document.getElementById('cfg_email_template').value.trim());
  localStorage.setItem('lisaf_email_user',     document.getElementById('cfg_email_user').value.trim());
  localStorage.setItem('lisaf_email_from',     document.getElementById('cfg_email_from').value.trim());
  localStorage.setItem('lisaf_email_from_address', document.getElementById('cfg_email_from_address').value.trim());
  toast('Email config saved âœ“','ok');
  initEmailJs();
}

function initEmailJs() {
  const userId = localStorage.getItem('lisaf_email_user') || document.getElementById('cfg_email_user')?.value.trim();
  if (window.emailjs && userId) {
    try { window.emailjs.init(userId); } catch(e) { console.warn('EmailJS init failed', e); }
  }
}

async function sendNewsNotifications(article) {
  if (!window.emailjs) { toast('EmailJS not loaded','err'); return; }
  const serviceId  = localStorage.getItem('lisaf_email_service')  || document.getElementById('cfg_email_service')?.value.trim();
  const templateId = localStorage.getItem('lisaf_email_template') || document.getElementById('cfg_email_template')?.value.trim();
  const fromName   = localStorage.getItem('lisaf_email_from') || document.getElementById('cfg_email_from')?.value.trim();
  const fromEmail  = localStorage.getItem('lisaf_email_from_address') || document.getElementById('cfg_email_from_address')?.value.trim();
  if (!serviceId || !templateId) { toast('Set EmailJS service/template in Settings','err'); return; }

  try {
    const subsSnap = await window._getDocs(window._collection(window._db,'newsletterSubscribers'));
    if (subsSnap.empty) { toast('No subscribers to notify','err'); return; }
    const emails = [];
    subsSnap.forEach(doc => { const d = doc.data(); if (d.email) emails.push(d.email); });
    if (!emails.length) { toast('subscriber list is empty','err'); return; }

    const templateParams = {
      subject: `New news from Lift and Serve: ${article.title}`,
      title: article.title,
      excerpt: article.excerpt || '',
      body: article.body || '',
      date: article.date || '',
      category: article.category || '',
      from_name: fromName || 'Lift and Serve All Foundation',
      from_email: fromEmail || 'info@liftandservefoundation.com'
    };

    toast(`Sending email notifications to ${emails.length} subscribers…`,'ok');
    for (const email of emails) {
      await window.emailjs.send(serviceId, templateId, { ...templateParams, subscriber_email: email, to_email: email });
    }
    toast('Subscriber notifications sent âœ“','ok');
  } catch(e) {
    console.error('Notification send failed', e);
    toast('Failed to send subscriber emails','err');
  }
}

async function loadCommunications() {
  const subList = document.getElementById('subscriberList');
  const contactList = document.getElementById('contactList');
  if (!window._db) {
    if (subList) subList.innerHTML='<p style="color:var(--muted)">Firebase not connected</p>';
    if (contactList) contactList.innerHTML='<p style="color:var(--muted)">Firebase not connected</p>';
    return;
  }
  if (subList) subList.innerHTML='<p style="color:var(--muted);font-size:.85rem;">Loading…</p>';
  if (contactList) contactList.innerHTML='<p style="color:var(--muted);font-size:.85rem;">Loading…</p>';
  try {
    const [subsSnap, messagesSnap] = await Promise.all([
      window._getDocs(window._collection(window._db,'newsletterSubscribers')),
      window._getDocs(window._collection(window._db,'contactMessages'))
    ]);

    if (subList) {
      if (subsSnap.empty) {
        subList.innerHTML='<p style="color:var(--muted);font-size:.85rem;">No subscribers yet.</p>';
      } else {
        const emails = [];
        subList.innerHTML = '';
        subsSnap.forEach(doc => {
          const d = doc.data();
          if (!d.email) return;
          emails.push(d.email);
          subList.innerHTML += `
            <div class="message-card">
              <h4>${d.email}</h4>
              <div class="message-metadata">
                <span>${d.subscribedAt?new Date(d.subscribedAt.seconds*1000).toLocaleString():'Added'}</span>
              </div>
            </div>`;
        });
        subList.dataset.emails = emails.join(', ');
      }
    }

    if (contactList) {
      if (messagesSnap.empty) {
        contactList.innerHTML='<p style="color:var(--muted);font-size:.85rem;">No messages yet.</p>';
      } else {
        contactList.innerHTML = '';
        messagesSnap.forEach(doc => {
          const d = doc.data();
          contactList.innerHTML += `
            <div class="message-card">
              <h4>${d.subject || 'Contact Message'}</h4>
              <p>${d.message || 'No message text provided.'}</p>
              <div class="message-metadata">
                <span>${d.name || 'Anonymous'}</span>
                <span>${d.email || 'No email'}</span>
                <span>${d.phone || 'No phone'}</span>
                <span>${d.submittedAt?new Date(d.submittedAt.seconds*1000).toLocaleString():'No date'}</span>
              </div>
            </div>`;
        });
      }
    }
  } catch(e) {
    console.error('Load communications failed', e);
    if (subList) subList.innerHTML='<p style="color:var(--danger)">Error loading subscribers</p>';
    if (contactList) contactList.innerHTML='<p style="color:var(--danger)">Error loading messages</p>';
  }
}

function copySubscribers() {
  const subList = document.getElementById('subscriberList');
  const text = subList?.dataset?.emails || '';
  if (!text) { toast('No subscriber emails available','err'); return; }
  navigator.clipboard.writeText(text).then(() => toast('Subscriber emails copied âœ“','ok'))
    .catch(() => toast('Copy failed','err'));
}

function downloadSubscribers() {
  const subList = document.getElementById('subscriberList');
  const text = subList?.dataset?.emails || '';
  if (!text) { toast('No subscriber emails available','err'); return; }
  const rows = text.split(', ').map(email => `"${email}"`).join('\n');
  const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'subscribers.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

async function editArticle(id) {
  const snap = await window._getDoc(window._doc(window._db,'news',id));
  const d = snap.data();
  document.getElementById('editNewsId').value = id;
  document.getElementById('n_title').value    = d.title    || '';
  document.getElementById('n_category').value = d.category || 'News';
  document.getElementById('n_date').value     = d.date     || '';
  document.getElementById('n_excerpt').value  = d.excerpt  || '';
  document.getElementById('n_body').value     = d.body     || '';
  if (d.imageUrl) showExisting('newsImg','n_imgUrl',d.imageUrl);
  document.getElementById('newsFormTitle').textContent = 'Edit Article';
  document.getElementById('panel-news').scrollIntoView({behavior:'smooth'});
}
async function deleteArticle(id) {
  if (!confirm('Delete this article? This cannot be undone.')) return;
  await window._deleteDoc(window._doc(window._db,'news',id));
  toast('Article deleted','');
  loadNewsList();
}
function clearNewsForm() {
  ['n_title','n_excerpt','n_body','n_date','editNewsId','n_imgUrl'].forEach(id => {
    const el=document.getElementById(id); if(el) el.value='';
  });
  const prev=document.getElementById('prev-newsImg'); if(prev) prev.style.display='none';
  const utxt=document.getElementById('urltxt-newsImg'); if(utxt) utxt.style.display='none';
  document.getElementById('newsFormTitle').textContent='Add New Article';
}

/* â”€â”€ PARTNERS â”€â”€ */
async function loadPartnersList() {
  const list = document.getElementById('partnersList');
  if (!window._db) { list.innerHTML='<p style="color:var(--muted)">Firebase not connected</p>'; return; }
  list.innerHTML='<p style="color:var(--muted);font-size:.85rem;">Loading…</p>';
  try {
    const snap = await window._getDocs(window._collection(window._db,'partners'));
    if (snap.empty) { list.innerHTML='<p style="color:var(--muted);font-size:.85rem;">No partners yet.</p>'; return; }
    list.innerHTML='';
    snap.forEach(d => {
      const a = d.data();
      list.innerHTML += `
        <div class="list-item">
          ${a.logoUrl?`<img src="${a.logoUrl}" alt="${a.name||''}" style="object-fit:contain;background:#f9f9f9;">`:`<div style="width:70px;height:52px;background:#e5e7eb;border-radius:6px;flex-shrink:0;"></div>`}
          <div class="list-item-body"><h4>${a.name||'Unnamed'}</h4><span>${a.website||''}</span></div>
          <div class="list-item-actions">
            <button class="btn btn-outline btn-sm" onclick="editPartner('${d.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn btn-danger btn-sm"  onclick="deletePartner('${d.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>`;
    });
  } catch(e) { list.innerHTML='<p style="color:var(--danger)">Error loading partners</p>'; }
}
async function savePartner() {
  if (!window._db) return;
  const name = document.getElementById('p_name').value.trim();
  if (!name) { toast('Partner name required','err'); return; }
  const data = {
    name,
    website: document.getElementById('p_website').value.trim()||null,
    logoUrl: document.getElementById('p_logoUrl').value||null,
    order:   Date.now()
  };
  Object.keys(data).forEach(k => { if(data[k]===null||data[k]==='') delete data[k]; });
  const editId = document.getElementById('editPartnerId').value;
  try {
    if (editId) { await window._updateDoc(window._doc(window._db,'partners',editId),data); toast('Partner updated âœ“','ok'); }
    else { await window._addDoc(window._collection(window._db,'partners'),data); toast('Partner added âœ“','ok'); }
    clearPartnerForm(); loadPartnersList();
  } catch(e) { toast('Save failed','err'); }
}
async function editPartner(id) {
  const snap = await window._getDoc(window._doc(window._db,'partners',id));
  const d = snap.data();
  document.getElementById('editPartnerId').value = id;
  document.getElementById('p_name').value    = d.name    || '';
  document.getElementById('p_website').value = d.website || '';
  if (d.logoUrl) showExisting('partnerLogo','p_logoUrl',d.logoUrl);
  document.getElementById('partnerFormTitle').textContent = 'Edit Partner';
}
async function deletePartner(id) {
  if (!confirm('Remove this partner?')) return;
  await window._deleteDoc(window._doc(window._db,'partners',id));
  toast('Partner removed',''); loadPartnersList();
}
function clearPartnerForm() {
  ['p_name','p_website','editPartnerId','p_logoUrl'].forEach(id => {
    const el=document.getElementById(id); if(el) el.value='';
  });
  const prev=document.getElementById('prev-partnerLogo'); if(prev) prev.style.display='none';
  const utxt=document.getElementById('urltxt-partnerLogo'); if(utxt) utxt.style.display='none';
  document.getElementById('partnerFormTitle').textContent='Add Partner';
}

async function loadDonations() {
  const list = document.getElementById('donationsList');
  if (!list) return;
  if (!window._db) { list.innerHTML = '<p style="color:var(--muted)">Firestore is not connected</p>'; return; }
  list.innerHTML = '<p style="color:var(--muted);font-size:.85rem;">Loading…</p>';
  try {
    const snap = await window._getDocs(window._query(window._collection(window._db,'donations'), window._orderBy('createdAt','desc')));
    if (snap.empty) { list.innerHTML = '<p style="color:var(--muted);font-size:.85rem;">No donations recorded yet.</p>'; return; }
    list.innerHTML = '';
    snap.forEach(item => {
      const donation = item.data();
      const when = donation.createdAt ? new Date(donation.createdAt.seconds * 1000).toLocaleString() : '';
      list.innerHTML += `
        <div class="message-card">
          <h4>$${donation.amount || 0} ${donation.currency || 'USD'}</h4>
          <p>${donation.name || 'Anonymous'} · ${donation.email || ''}</p>
          <div class="message-metadata">
            <span>${donation.provider || 'payment'}</span>
            <span>${donation.transactionId || ''}</span>
            <span>${when}</span>
          </div>
        </div>`;
    });
  } catch (e) {
    list.innerHTML = '<p style="color:var(--danger)">Could not load donations. In Firestore, create a single-field index on donations.createdAt if the console asks for one.</p>';
  }
}

/* â”€â”€ DASHBOARD COUNTS â”€â”€ */
async function loadDashCounts() {
  if (!window._db) return;
  try {
    const [n,p,s,c,d] = await Promise.all([
      window._getDocs(window._collection(window._db,'news')),
      window._getDocs(window._collection(window._db,'partners')),
      window._getDocs(window._collection(window._db,'newsletterSubscribers')),
      window._getDocs(window._collection(window._db,'contactMessages')),
      window._getDocs(window._collection(window._db,'donations'))
    ]);
    document.getElementById('db-news').textContent     = n.size;
    document.getElementById('db-partners').textContent = p.size;
    document.getElementById('db-subs').textContent     = s.size;
    document.getElementById('db-contacts').textContent = c.size;
    const donationsEl = document.getElementById('db-donations');
    if (donationsEl) donationsEl.textContent = d.size;
  } catch(e) {}
}

/* â”€â”€ PASSWORD HINT â”€â”€ */
function showPwHint() {
  const p1=document.getElementById('newPw1').value;
  const p2=document.getElementById('newPw2').value;
  if (!p1||p1!==p2) { toast('Passwords do not match','err'); return; }
  document.getElementById('pwHintVal').textContent = p1;
  document.getElementById('pwHint').style.display = 'block';
}

/* â”€â”€ INIT â”€â”€ */
function initAdmin() {
  loadCloudinary();
  loadEmailConfig();
  initEmailJs();
  loadDashCounts();
}

/* â”€â”€ Wait for Firebase module to expose globals â”€â”€ */
window.addEventListener('firebaseReady', initAdmin);
