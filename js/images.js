/**
 * Fast image helpers: Cloudinary transforms + localStorage cache
 * so logos/hero show immediately on repeat visits.
 */
(function (global) {
  const CACHE_KEY = 'lisaf_img_cache_v2';

  function isCloudinary(url) {
    return typeof url === 'string' && url.includes('res.cloudinary.com') && url.includes('/upload/');
  }

  /** Inject f_auto,q_auto,w_* so browsers download a smaller optimized file */
  function optimizeImageUrl(url, opts) {
    if (!url || typeof url !== 'string') return url;
    opts = opts || {};
    const w = opts.w || 900;
    if (!isCloudinary(url)) return url;

    // Strip an existing transformation segment after /upload/ if present
    const uploadIdx = url.indexOf('/upload/');
    if (uploadIdx === -1) return url;
    const after = url.slice(uploadIdx + '/upload/'.length);
    const parts = after.split('/');
    // If first segment looks like transforms (contains _ or ,) drop it
    let pathStart = 0;
    if (parts[0] && (/[_ ,]/.test(parts[0]) || parts[0].startsWith('v') === false && parts[0].includes(','))) {
      // Cloudinary version is like v123456 — keep path from version or public id
      if (!/^v\d+/.test(parts[0])) pathStart = 1;
    }
    // Better: if first part has commas or f_/q_/w_ treat as transforms
    if (parts[0] && (parts[0].includes(',') || /(^|,)(f_|q_|w_|c_|h_)/.test(parts[0]))) {
      pathStart = 1;
    }
    const rest = parts.slice(pathStart).join('/');
    const transforms = ['f_auto', 'q_auto', 'c_limit', 'w_' + w];
    if (opts.h) transforms.push('h_' + opts.h);
    return url.slice(0, uploadIdx + '/upload/'.length) + transforms.join(',') + '/' + rest;
  }

  function readCache() {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function saveImageCache(partial) {
    try {
      const next = Object.assign({}, readCache(), partial, { ts: Date.now() });
      localStorage.setItem(CACHE_KEY, JSON.stringify(next));
    } catch (e) { /* quota / private mode */ }
  }

  function setSrc(el, url, opts) {
    if (!el || !url) return;
    const next = optimizeImageUrl(url, opts);
    if (el.getAttribute('src') === next) return;
    el.setAttribute('src', next);
  }

  function showImg(el) {
    if (!el) return;
    el.style.display = 'block';
    const ph = el.closest('.team-member-photo, .img-placeholder, #storyImgWrap')?.querySelector('.img-placeholder-inner');
    if (ph) ph.style.display = 'none';
  }

  /** Paint cached images before Firebase round-trip */
  function applyImageCache() {
    const c = readCache();
    if (!c || !c.ts) return;

    if (c.logoUrl) {
      document.querySelectorAll('.site-logo-img').forEach(function (el) {
        setSrc(el, c.logoUrl, { w: 128 });
      });
    }
    if (c.heroImageUrl) {
      const el = document.getElementById('heroImg');
      setSrc(el, c.heroImageUrl, { w: 760 });
    }
    if (c.teamImageUrl) {
      setSrc(document.getElementById('teamImg'), c.teamImageUrl, { w: 720 });
      setSrc(document.getElementById('teamImg2'), c.teamImageUrl, { w: 720 });
    }
    if (c.storyImageUrl) {
      const el = document.getElementById('storyImg');
      if (el) {
        setSrc(el, c.storyImageUrl, { w: 800 });
        showImg(el);
      }
    }
    for (let i = 1; i <= 3; i++) {
      const key = 'teamMemberImg' + i;
      if (c[key]) {
        const el = document.getElementById(key);
        if (el) {
          setSrc(el, c[key], { w: 240, h: 240 });
          showImg(el);
        }
      }
    }
    if (Array.isArray(c.galleryItems) && c.galleryItems.length && typeof global.renderGalleryItems === 'function') {
      global.renderGalleryItems(c.galleryItems);
    }
  }

  function applyHomepageImages(d) {
    if (!d) return;
    const cache = {};
    if (d.logoUrl) {
      cache.logoUrl = d.logoUrl;
      document.querySelectorAll('.site-logo-img').forEach(function (el) {
        setSrc(el, d.logoUrl, { w: 128 });
      });
    }
    if (d.heroImageUrl) {
      cache.heroImageUrl = d.heroImageUrl;
      setSrc(document.getElementById('heroImg'), d.heroImageUrl, { w: 760 });
    }
    if (d.teamImageUrl) {
      cache.teamImageUrl = d.teamImageUrl;
      setSrc(document.getElementById('teamImg'), d.teamImageUrl, { w: 720 });
      setSrc(document.getElementById('teamImg2'), d.teamImageUrl, { w: 720 });
    }
    if (d.storyImageUrl) {
      cache.storyImageUrl = d.storyImageUrl;
      const el = document.getElementById('storyImg');
      if (el) {
        setSrc(el, d.storyImageUrl, { w: 800 });
        showImg(el);
      }
    }
    for (let i = 1; i <= 3; i++) {
      const key = 'teamMemberImg' + i;
      if (d[key]) {
        cache[key] = d[key];
        const el = document.getElementById(key);
        if (el) {
          setSrc(el, d[key], { w: 240, h: 240 });
          showImg(el);
        }
      }
    }
    if (Array.isArray(d.galleryItems) && d.galleryItems.length) {
      cache.galleryItems = d.galleryItems;
    }
    saveImageCache(cache);
  }

  global.LISAF_IMAGES = {
    optimizeImageUrl: optimizeImageUrl,
    applyImageCache: applyImageCache,
    applyHomepageImages: applyHomepageImages,
    saveImageCache: saveImageCache,
    setSrc: setSrc
  };
})(window);


/* early-cache: paint as soon as DOM is ready (before Firebase module finishes) */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    try { window.LISAF_IMAGES.applyImageCache(); } catch (e) {}
  });
} else {
  try { window.LISAF_IMAGES.applyImageCache(); } catch (e) {}
}