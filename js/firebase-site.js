import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, addDoc, collection, getDocs, query, orderBy, limit, serverTimestamp, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

if (!window.LISAF_CONFIG?.firebase) {
  console.error("Missing js/config.js - copy js/config.example.js to js/config.js");
}
const firebaseConfig = window.LISAF_CONFIG.firebase;

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const img = () => window.LISAF_IMAGES;

function applyHomepageDoc(d) {
  if (!d) return;
  img()?.applyHomepageImages(d);

  if (d.heroTitle)    { const el=document.getElementById('heroTitle'); if(el) el.textContent=d.heroTitle; }
  if (d.heroSubtitle) { const el=document.getElementById('heroSubtitle'); if(el) el.textContent=d.heroSubtitle; }
  if (d.aboutText1)   { const el=document.getElementById('aboutText1'); if(el) el.textContent=d.aboutText1; }
  if (d.aboutText2)   { const el=document.getElementById('aboutText2'); if(el) el.textContent=d.aboutText2; }

  if (Array.isArray(d.galleryItems) && d.galleryItems.length) {
    renderGalleryItems(d.galleryItems);
  } else {
    const fallback = [];
    for (let i = 1; i <= 6; i++) {
      if (d['galleryImg' + i]) fallback.push({ type: 'image', url: d['galleryImg' + i], caption: '' });
    }
    if (fallback.length) renderGalleryItems(fallback);
  }
}

function applyStats(s) {
  if (!s) return;
  ['children','communities','partners','schools','books','mentored'].forEach(k => {
    if (s[k]) document.querySelectorAll('[data-stat="'+k+'"]').forEach(el => { el.textContent = s[k]; });
  });
}

function opt(url, w) {
  return img()?.optimizeImageUrl?.(url, { w }) || url;
}

async function loadSiteContent() {
  // Instant paint from last visit
  img()?.applyImageCache();

  try {
    // Fetch in parallel — don't wait for news/partners before showing hero images
    const homeRef = doc(db, 'siteContent', 'homepage');
    const statsRef = doc(db, 'siteContent', 'stats');
    const newsQ = query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(6));
    const partnersCol = collection(db, 'partners');

    const homePromise = getDoc(homeRef).then(snap => {
      if (snap.exists()) applyHomepageDoc(snap.data());
    });

    const statsPromise = getDoc(statsRef).then(snap => {
      if (snap.exists()) applyStats(snap.data());
    });

    const newsPromise = getDocs(newsQ).then(snap => {
      if (!snap.empty) renderNewsSnapshot(snap);
    });

    const partnersPromise = getDocs(partnersCol).then(snap => {
      if (snap.empty) return;
      const grid = document.getElementById('partnersLogoGrid');
      if (!grid) return;
      grid.innerHTML = '';
      snap.forEach(p => {
        const d = p.data();
        grid.innerHTML += d.logoUrl
          ? `<div class="partner-logo-item"><img loading="lazy" decoding="async" src="${opt(d.logoUrl, 280)}" alt="${d.name||''}"></div>`
          : `<div class="partner-logo-item partner-name-only">${d.name||''}</div>`;
      });
    });

    await Promise.all([homePromise, statsPromise, newsPromise, partnersPromise]);
  } catch (e) {
    console.warn('Firebase content load error:', e);
  }
}

function renderNewsSnapshot(snap) {
  const grid = document.getElementById('newsGrid') || document.getElementById('newsGridFull');
  const featuredWrap = document.getElementById('featuredArticle') || document.getElementById('featuredArticleFull');
  if (!grid && !featuredWrap) return;
  if (grid) grid.innerHTML = '';
  let first = true;
  snap.forEach(n => {
    const d = n.data();
    const dateStr = d.date || (d.createdAt ? new Date(d.createdAt.toDate()).toLocaleDateString('en-GB',{year:'numeric',month:'long',day:'numeric'}) : '');
    const imgUrl = d.imageUrl ? opt(d.imageUrl, first && featuredWrap ? 900 : 480) : '';
    if (first && featuredWrap) {
      featuredWrap.innerHTML = `
        <div class="featured-card">
          ${imgUrl?`<img src="${imgUrl}" alt="${d.title}" class="featured-img" decoding="async" fetchpriority="low">`:`<div class="img-placeholder-inner"><i class="fas fa-graduation-cap"></i><p>Featured</p></div>`}
          <div class="featured-text">
            <div class="blog-meta">${dateStr} &bull; ${d.category||'News'}</div>
            <h3>${d.title}</h3>
            <p>${d.excerpt||''}</p>
          </div>
        </div>`;
      first = false;
      return;
    }
    if (grid) {
      grid.innerHTML += `
        <div class="blog-card">
          ${imgUrl?`<img src="${imgUrl}" alt="${d.title}" class="blog-card-img" loading="lazy" decoding="async">`:`<div class="blog-card-img img-placeholder-inner" style="height:190px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-newspaper" style="font-size:2rem;opacity:.3"></i></div>`}
          <div class="blog-card-content">
            <div class="blog-meta">${dateStr} &bull; ${d.category||'News'}</div>
            <h3>${d.title}</h3>
            <p>${(d.excerpt||'').slice(0,120)}…</p>
          </div>
        </div>`;
    }
  });
}

window.renderGalleryItems = function renderGalleryItems(items) {
  const grid = document.getElementById('galleryGrid'); if (!grid) return;
  if (!Array.isArray(items) || !items.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:2rem 1rem;">No gallery items yet.</div>';
    return;
  }
  grid.innerHTML = items.map(item => {
    const raw = item.url || '';
    const url = (item.type === 'video' ? raw : opt(raw, 600)).replace(/"/g, '&quot;');
    const captionText = (item.caption || '').replace(/"/g, '&quot;');
    const caption = captionText ? `<div class="gallery-caption">${captionText}</div>` : '';
    if (item.type === 'video') {
      if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) {
        return `<div class="gallery-item"><video controls playsinline preload="metadata" src="${url}"></video>${caption}</div>`;
      }
      const youtubeId = getYoutubeId(url);
      if (youtubeId) {
        return `<div class="gallery-item"><iframe loading="lazy" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen></iframe>${caption}</div>`;
      }
      return `<div class="gallery-item"><div class="img-placeholder-inner" style="padding:1rem;text-align:center;"><a href="${url}" target="_blank" style="color:var(--navy);text-decoration:underline;">Open video</a></div>${caption}</div>`;
    }
    return `<div class="gallery-item"><img loading="lazy" decoding="async" src="${url}" alt="${captionText||'Gallery image'}">${caption}</div>`;
  }).join('');
};

function getYoutubeId(url) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

function startRealtimeListeners() {
  onSnapshot(doc(db, 'siteContent', 'homepage'), snap => {
    if (!snap.exists()) return;
    applyHomepageDoc(snap.data());
  });

  onSnapshot(doc(db, 'siteContent', 'stats'), snap => {
    if (!snap.exists()) return;
    applyStats(snap.data());
  });

  onSnapshot(query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(6)), snap => {
    renderNewsSnapshot(snap);
  });

  onSnapshot(collection(db, 'partners'), snap => {
    const grid = document.getElementById('partnersLogoGrid');
    if (!grid) return;
    grid.innerHTML = '';
    snap.forEach(p => {
      const d = p.data();
      grid.innerHTML += d.logoUrl
        ? `<div class="partner-logo-item" style="display:flex;align-items:center;justify-content:center;"><img loading="lazy" decoding="async" src="${opt(d.logoUrl, 280)}" alt="${d.name||''}" style="max-height:60px;max-width:140px;object-fit:contain;"></div>`
        : `<div class="partner-logo-item" style="font-weight:700;color:var(--navy);font-size:.9rem;">${d.name||''}</div>`;
    });
  });
}

window.saveDonationRecord = async function(provider, donor, result) {
  try {
    await addDoc(collection(db, 'donations'), {
      provider,
      name: donor.name,
      email: donor.email,
      phone: donor.phone || '',
      amount: donor.amount,
      currency: 'USD',
      status: 'successful',
      transactionId: String(result.transaction_id || result.reference || ''),
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Donation record was not saved', err);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  img()?.applyImageCache();
  loadSiteContent();
  startRealtimeListeners();
});

window.subscribeNewsletter = async function(e) {
  e.preventDefault();
  const emailEl = document.getElementById('newsletterEmail') || document.getElementById('newsletterEmailNews');
  const email = emailEl?.value?.trim();
  if (!email) return;
  try {
    await addDoc(collection(db,'newsletterSubscribers'), { email, subscribedAt: serverTimestamp() });
    const msg = document.getElementById('newsletterMsg');
    if (msg) { msg.style.display='block'; }
    if (emailEl) emailEl.value = '';
  } catch(err) { alert('Subscription failed. Please try again.'); }
};

window.submitContactForm = async function(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.contactName.value.trim(),
    email: form.contactEmail.value.trim(),
    phone: form.contactPhone?.value?.trim()||'',
    subject: form.contactSubject.value,
    message: form.contactMessage.value.trim(),
    submittedAt: serverTimestamp()
  };
  try {
    await addDoc(collection(db,'contactMessages'), data);
    document.getElementById('contactSuccess').style.display='block';
    form.reset();
    setTimeout(()=>document.getElementById('contactSuccess').style.display='none',5000);
  } catch(err) { alert('Failed to send. Please email us directly.'); }
};

window.submitVolunteerForm = async function(e) {
  e.preventDefault();
  const form = e.target;
  try {
    await addDoc(collection(db,'volunteerApplications'), {
      name: form.vName.value.trim(), email: form.vEmail.value.trim(),
      phone: form.vPhone?.value?.trim()||'', skills: form.vSkills?.value?.trim()||'',
      availability: form.vAvailability?.value||'', submittedAt: serverTimestamp()
    });
    document.getElementById('volunteerSuccess').style.display='block';
    form.reset();
    setTimeout(()=>document.getElementById('volunteerSuccess').style.display='none',5000);
  } catch(err) { alert('Submission failed. Please try again.'); }
};
