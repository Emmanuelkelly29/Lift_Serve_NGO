/* ──────────────────────────────
   MULTI-PAGE NAVIGATION
────────────────────────────── */
const PAGE_URLS = {
  home: 'index.html',
  about: 'about.html',
  programs: 'programs.html',
  involved: 'involved.html',
  donate: 'donate.html',
  news: 'news.html',
  contact: 'contact.html',
  faqs: 'faqs.html'
};

function showPage(name) {
  const url = PAGE_URLS[name] || 'index.html';
  // Same page: scroll top; otherwise navigate
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (current === url.toLowerCase() || (name === 'home' && (current === '' || current === 'index.html'))) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeMenu();
    return;
  }
  window.location.href = url;
}
function toggleMenu() {
  document.getElementById('navMenu')?.classList.toggle('open');
}
function closeMenu() {
  document.getElementById('navMenu')?.classList.remove('open');
}

function setActiveNav() {
  const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const map = {
    'index.html': 'home', '': 'home',
    'about.html': 'about',
    'programs.html': 'programs',
    'involved.html': 'involved',
    'donate.html': 'donate',
    'news.html': 'news',
    'contact.html': 'contact',
    'faqs.html': 'faqs'
  };
  const page = map[file] || 'home';
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('data-page') === page);
  });
}

// Legacy hash URLs: #about → about.html
window.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  const hash = location.hash.replace('#', '');
  if (hash && PAGE_URLS[hash] && !(hash === 'home' && /index\.html?$/i.test(location.pathname + 'index.html'))) {
    const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const expected = PAGE_URLS[hash];
    if (file !== expected.toLowerCase() && !(hash === 'home' && (file === '' || file === 'index.html'))) {
      location.replace(expected);
    }
  }
});



/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   HAMBURGER
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
document.addEventListener('click', e => {
  const menu = document.getElementById('navMenu');
  const ham = document.getElementById('hamburger');
  if (menu.classList.contains('open') && !menu.contains(e.target) && !ham.contains(e.target)) closeMenu();
});

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   FAQ ACCORDION
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function toggleFaq(q) {
  const answer = q.nextElementSibling;
  const isOpen = answer.classList.contains('open');
  // close all
  document.querySelectorAll('.faq-answer.open').forEach(a => a.classList.remove('open'));
  document.querySelectorAll('.faq-question.open').forEach(qq => qq.classList.remove('open'));
  if (!isOpen) { answer.classList.add('open'); q.classList.add('open'); }
}
function filterFaqs(term) {
  const t = term.toLowerCase();
  document.querySelectorAll('.faq-item').forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(t) ? 'block' : 'none';
  });
  document.querySelectorAll('.faq-category').forEach(cat => {
    const visible = [...cat.querySelectorAll('.faq-item')].some(i => i.style.display !== 'none');
    cat.style.display = visible ? 'block' : 'none';
  });
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   CHATBOT
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const chatResponses = {
  hello:'Hello! How can I help you today?', hi:'Hi there! How can I assist you?',
  donate:'You can donate via Flutterwave on our Donate page. We also accept bank transfers.',
  volunteer:'Visit our Get Involved page to apply as a volunteer!',
  programs:'We offer Scholarship Support, School Supplies, Community Learning Centers, and Mentorship programs.',
  contact:'Call us at +2348031114594 (Nigeria) or +1 (208) 992-6233 (USA). Or email michael@liftandservefoundation.com.',
  about:'Lift and Serve All Foundation is a non-profit transforming children\'s lives through education in underserved communities.',
  scholarship:'We provide full and partial scholarships covering tuition, supplies, and transportation.',
  help:'I can help with donations, volunteering, programs, and contact details. What do you need?',
  thanks:'You\'re welcome! Is there anything else I can help with?'
};
function getBotReply(msg) {
  const m = msg.toLowerCase();
  for (const [k,v] of Object.entries(chatResponses)) { if (m.includes(k)) return v; }
  return 'Thank you for your message! For more info, please visit our pages or email michael@liftandservefoundation.com.';
}
function addChatMsg(text, isUser) {
  const wrap = document.getElementById('chatbotMessages');
  const div = document.createElement('div');
  div.className = 'chatbot-message ' + (isUser ? 'user-message' : 'bot-message');
  div.innerHTML = `<p>${text}</p>`;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
}
function sendChatMsg() {
  const inp = document.getElementById('chatbotInput');
  const msg = inp.value.trim(); if (!msg) return;
  addChatMsg(msg, true); inp.value = '';
  setTimeout(() => addChatMsg(getBotReply(msg), false), 450);
}
document.getElementById('chatbotToggle')?.addEventListener('click', () => document.getElementById('chatbotWindow').classList.toggle('active'));
document.getElementById('chatbotClose')?.addEventListener('click',  () => document.getElementById('chatbotWindow').classList.remove('active'));
document.getElementById('chatbotSend')?.addEventListener('click', sendChatMsg);
document.getElementById('chatbotInput')?.addEventListener('keypress', e => { if(e.key==='Enter') sendChatMsg(); });

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   PAYMENT â€” page donate section
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let donateAmount = 0;
function selectAmount(n, btn) {
  donateAmount = n;
  document.getElementById('donateCustomAmount').value = '';
  document.querySelectorAll('.donation-form-wrap .amount-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}
function getDonateData() {
  const amt = donateAmount || parseFloat(document.getElementById('donateCustomAmount')?.value) || 0;
  const first = document.getElementById('donorFirst')?.value?.trim();
  const last  = document.getElementById('donorLast')?.value?.trim();
  const email = document.getElementById('donorEmail')?.value?.trim();
  const phone = document.getElementById('donorPhone')?.value?.trim();
  if (!first||!email) { alert('Please fill in your name and email.'); return null; }
  if (amt < 1) { alert('Please select or enter a donation amount.'); return null; }
  return { name: first+' '+last, email, phone, amount: amt };
}
function triggerDonateFlutterwave() { const d=getDonateData(); if(!d) return; runFlutterwave(d); }

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   PAYMENT â€” modal
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let modalDonateAmt = 0;
function openDonateModal() { document.getElementById('donateModalOverlay').classList.add('active'); }
function closeDonateModal(){ document.getElementById('donateModalOverlay').classList.remove('active'); }
document.getElementById('donateModalOverlay')?.addEventListener('click', e => { if(e.target===e.currentTarget) closeDonateModal(); });
function setModalAmount(n, btn) {
  modalDonateAmt = n;
  document.getElementById('modalCustomAmt').value = '';
  document.querySelectorAll('#donateModalOverlay .amount-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  updateModalDisplay();
}
function updateModalDisplay() { document.getElementById('modalAmtDisplay').textContent = '$'+(modalDonateAmt||0); }
function getModalData() {
  const name  = document.getElementById('modalName').value.trim();
  const email = document.getElementById('modalEmail').value.trim();
  const phone = document.getElementById('modalPhone').value.trim();
  const amt   = modalDonateAmt || parseFloat(document.getElementById('modalCustomAmt').value) || 0;
  if (!name||!email) { alert('Please enter your name and email.'); return null; }
  if (amt < 1) { alert('Please select or enter a donation amount.'); return null; }
  return { name, email, phone, amount: amt };
}
function modalPayFlutterwave() { const d=getModalData(); if(!d) return; closeDonateModal(); runFlutterwave(d); }

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
/* ──────────────────────────────
   FLUTTERWAVE
   ⚠  Replace the public key in config.js with your real key
   Flutterwave: https://dashboard.flutterwave.com â†’ Settings â†’ API Keys
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/* Payment SDKs */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="' + src + '"]');
    if (existing) {
      if (typeof FlutterwaveCheckout === 'function') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load ' + src)), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
}

async function ensureFlutterwave() {
  if (typeof FlutterwaveCheckout === 'function') return;
  await loadScript('https://checkout.flutterwave.com/v3.js');
}


async function runFlutterwave(d) {
  try {
    await ensureFlutterwave();
  } catch (e) {
    alert('Unable to load Flutterwave checkout. Please disable any ad blocker/privacy blocker for this site, refresh, and try again.');
    return;
  }
  FlutterwaveCheckout({
    public_key: (window.LISAF_CONFIG?.flutterwavePublicKey || ""),
    tx_ref:     "LISAF-FLW-" + Date.now(),
    amount:     d.amount,
    currency:   "USD",
    payment_options: "card,mobilemoneyghana,ussd,banktransfer",
    customer: { email: d.email, phone_number: d.phone, name: d.name },
    customizations: { title:"Lift and Serve All Foundation", description:"Donation to support children's education", logo:"logo.png" },
    callback: function(res) {
      if (res.status === "successful") {
        window.saveDonationRecord?.('flutterwave', d, res);
        alert("Thank you, "+d.name+"! Donation of $"+d.amount+" received.\nTransaction ID: "+res.transaction_id);
      }
    },
    onclose: function(){}
  });
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   DONATE PAGE AMOUNT BUTTONS
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
// Newsletter form on news page feeds the same Firebase function
document.getElementById('newsletterEmailNews')?.addEventListener('change', () => {});

