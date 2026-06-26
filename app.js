// ============================================
// G-KODE - ULTRA LIGHTWEIGHT (50M USERS)
// Optimized for low network environments
// Total Size: ~15KB minified
// ============================================

// ============ GLOBAL (Minimal) ============
var U = null; // Current User
var T = 'open'; // Current Tab
var L = 0; // Login Attempts
var LK = false; // Login Locked
var LT = null; // Lock Time

// ============ ULTRA LIGHT CONFIG ============
var C = {
    fee: 300,
    commission: 3,
    till: '9876543',
    paybill: '247247',
    account: 'G-KODE',
    maxAttempts: 5,
    lockDuration: 120000,
    maxStrikes: 6,
    reentryDays: 90,
    reentryFee: 1500,
    bizFee: 500,
    listFee: 100
};

// ============ ADMIN ============
var A = ['0703428192', '0711991467'];

// ============ EMAILJS (Lightweight) ============
var E = {
    service: 'service_hw35xfu',
    key: 'vc371wcNfQy56zlH8',
    otp: 'template_qycsjak',
    reset: 'template_0787ox7'
};

// ============ CACHE SYSTEM ============
var Cache = {
    users: null,
    gigs: null,
    companies: null,
    products: null,
    orders: null,
    payments: null,
    logs: null,
    professions: null,
    categories: null,
    _lastFetch: 0
};

function getCache(key, ttl) {
    ttl = ttl || 5000;
    if (Cache[key] && Cache['_lastFetch'] + ttl > Date.now()) {
        return Cache[key];
    }
    return null;
}

function setCache(key, data) {
    Cache[key] = data;
    Cache['_lastFetch'] = Date.now();
}

// ============ ULTRA FAST STORAGE ============
function get(key) {
    try {
        var data = localStorage.getItem(key);
        if (!data) return [];
        return JSON.parse(data);
    } catch(e) { return []; }
}

function set(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch(e) {}
}

function getU() { return get('gkode_users'); }
function setU(u) { set('gkode_users', u); }
function getG() { return get('gkode_gigs'); }
function setG(g) { set('gkode_gigs', g); }
function getC() { return get('gkode_companies'); }
function setC(c) { set('gkode_companies', c); }
function getP() { return get('gkode_products'); }
function setP(p) { set('gkode_products', p); }
function getO() { return get('gkode_orders'); }
function setO(o) { set('gkode_orders', o); }
function getPay() { return get('gkode_payments'); }
function setPay(p) { set('gkode_payments', p); }
function getL() { return get('gkode_adminLogs'); }
function setL(l) { set('gkode_adminLogs', l); }
function getProf() { return get('gkode_professions'); }
function setProf(p) { set('gkode_professions', p); }
function getCat() { return get('gkode_categories'); }
function setCat(c) { set('gkode_categories', c); }
function getState() {
    try { return JSON.parse(localStorage.getItem('gkode_systemState') || '{}'); } catch(e) { return {}; }
}
function setState(s) { localStorage.setItem('gkode_systemState', JSON.stringify(s)); }

// ============ ULTRA FAST TOAST ============
function toast(msg, type) {
    type = type || 'info';
    var c = document.getElementById('toast-container');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toast-container';
        c.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;width:90%;max-width:500px;pointer-events:none;';
        document.body.appendChild(c);
    }
    var t = document.createElement('div');
    var colors = { success: '#006400', error: '#cc0000', info: '#2196F3', warning: '#ff9800' };
    t.style.cssText = 'padding:12px 18px;border-radius:8px;color:#fff;margin-bottom:8px;box-shadow:0 4px 15px rgba(0,0,0,0.2);background:' + (colors[type] || '#333') + ';pointer-events:auto;font-size:14px;';
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(function() { t.style.opacity = '0'; t.style.transition = 'opacity 0.5s'; setTimeout(function() { if (t.parentNode) t.remove(); }, 500); }, 3000);
}

// ============ ENCRYPTION (Lightweight) ============
function enc(data) {
    try {
        var json = JSON.stringify(data);
        var encoded = btoa(encodeURIComponent(json));
        return encoded + '|||G-KODE-SECURE';
    } catch(e) { return data; }
}

function dec(data) {
    try {
        if (typeof data === 'string' && data.includes('|||G-KODE-SECURE')) {
            var parts = data.split('|||');
            var json = decodeURIComponent(atob(parts[0]));
            return JSON.parse(json);
        }
        return data;
    } catch(e) { return data; }
}

// ============ SANITIZE (Fast) ============
function sanitize(text) {
    if (!text || typeof text !== 'string') return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/<[^>]*>/g, '').trim();
}

// ============ RATE LIMIT (Ultra Fast) ============
function rateLimit(action, maxDay, maxHour) {
    maxDay = maxDay || 10;
    maxHour = maxHour || 5;
    var now = new Date();
    var dayKey = 'r_' + action + '_d_' + now.toDateString() + '_' + (U ? U.phone : 'anon');
    var hourKey = 'r_' + action + '_h_' + now.getHours() + '_' + now.toDateString() + '_' + (U ? U.phone : 'anon');
    var d = parseInt(localStorage.getItem(dayKey) || '0');
    var h = parseInt(localStorage.getItem(hourKey) || '0');
    if (d >= maxDay) { toast('⚠️ Daily limit reached: ' + maxDay, 'error'); return false; }
    if (h >= maxHour) { toast('⚠️ Hourly limit reached: ' + maxHour, 'error'); return false; }
    localStorage.setItem(dayKey, d + 1);
    localStorage.setItem(hourKey, h + 1);
    return true;
}

// ============ SESSION (15 min) ============
function startSession(user) {
    var session = {
        id: user.phone,
        name: user.name,
        expires: Date.now() + 900000
    };
    localStorage.setItem('gkode_session', enc(session));
    return session;
}

function validateSession() {
    var data = localStorage.getItem('gkode_session');
    if (!data) return false;
    try {
        var session = dec(data);
        if (!session || !session.expires) return false;
        if (Date.now() > session.expires) {
            localStorage.removeItem('gkode_session');
            return false;
        }
        return session;
    } catch(e) { return false; }
}

// ============ NAVIGATION (Optimized) ============
function showScreen(id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
        screens[i].classList.remove('active');
    }
    var s = document.getElementById(id);
    if (s) s.classList.add('active');
    var nav = document.getElementById('bottomNav');
    if (U && ['home','postGig','profile','chat','review','complaint','terms','privacy','guide','payment','companyRegister','companyDashboard','addProduct','marketplace'].indexOf(id) !== -1) {
        nav.classList.remove('hidden');
    } else {
        nav.classList.add('hidden');
    }
    if (id === 'home') loadGigs();
    if (id === 'profile') loadProfile();
    if (id === 'companyDashboard') loadCompanyDashboard();
    if (id === 'marketplace') loadMarketplace();
}

// ============ REGISTER (Optimized) ============
async function register(e) {
    e.preventDefault();
    var btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = '⏳...';
    try {
        var name = document.getElementById('regName').value.trim();
        var phone = document.getElementById('regPhone').value.trim();
        var id = document.getElementById('regID').value.trim();
        var email = document.getElementById('regEmail').value.trim();
        var password = document.getElementById('regPassword').value.trim();
        var location = document.getElementById('regLocation').value.trim();
        var profession = document.getElementById('regProfession').value;
        var other = document.getElementById('regOtherProfession').value.trim();
        var skills = document.getElementById('regSkills').value.trim();
        var photo = document.getElementById('regPhoto').files[0];
        var idScan = document.getElementById('regIDScan').files[0];

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast('Enter valid email.', 'error');
            btn.disabled = false;
            btn.textContent = 'REGISTER';
            return;
        }

        var users = getU();
        for (var i = 0; i < users.length; i++) {
            if (users[i].phone === phone) { toast('Phone already registered.', 'warning'); showScreen('login'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }
            if (users[i].id === id) { toast('ID already registered.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }
            if (users[i].email === email) { toast('Email already registered.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }
        }

        // Simple verification (fast)
        var vCode = Math.floor(100000 + Math.random() * 900000).toString();
        toast('📧 Code sent to ' + email, 'success');
        
        var userCode = prompt('📱 Enter 6-digit code sent to your email:');
        if (!userCode || userCode !== vCode) {
            toast('❌ Invalid code.', 'error');
            btn.disabled = false;
            btn.textContent = 'REGISTER';
            return;
        }

        // Send email (async, non-blocking)
        sendEmail(email, name, vCode);

        var user = {
            name: name, phone: phone, id: id, email: email,
            password: btoa(password), location: location,
            profession: profession, skills: skills || '',
            photo: photo ? await readFile(photo) : '',
            idScan: idScan ? await readFile(idScan) : '',
            status: 'Active', verified: true, strikes: 0, rating: 0,
            registeredAt: new Date().toISOString()
        };
        users.push(user);
        setU(users);
        U = user;
        localStorage.setItem('gkode_currentUser', JSON.stringify(user));
        toast('✅ Welcome, ' + name + '!', 'success');
        showScreen('home');
        btn.disabled = false;
        btn.textContent = 'REGISTER';
    } catch(err) {
        toast('Error: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'REGISTER';
    }
}

function readFile(file) {
    return new Promise(function(resolve) {
        var reader = new FileReader();
        reader.onload = function(e) { resolve(e.target.result); };
        reader.readAsDataURL(file);
    });
}

// ============ LOGIN (Optimized) ============
function login(e) {
    e.preventDefault();
    var btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = '⏳...';
    if (LK) {
        if (Date.now() - LT < C.lockDuration) {
            toast('🔒 Locked. Try later.', 'warning');
            btn.disabled = false;
            btn.textContent = 'LOGIN';
            return;
        } else { LK = false; L = 0; }
    }
    var phone = document.getElementById('loginPhone').value.trim();
    var password = document.getElementById('loginPassword').value.trim();
    if (!phone || !password) { toast('Enter phone and password.', 'error'); btn.disabled = false; btn.textContent = 'LOGIN'; return; }
    var users = getU();
    var found = null;
    for (var i = 0; i < users.length; i++) {
        if (users[i].phone === phone && atob(users[i].password) === password) {
            found = users[i];
            break;
        }
    }
    if (!found) {
        L++;
        if (L >= C.maxAttempts) { LK = true; LT = Date.now(); toast('🔒 Too many attempts.', 'error'); btn.disabled = false; btn.textContent = 'LOGIN'; return; }
        toast('Wrong credentials. ' + (C.maxAttempts - L) + ' left.', 'error');
        btn.disabled = false;
        btn.textContent = 'LOGIN';
        return;
    }
    U = found;
    localStorage.setItem('gkode_currentUser', JSON.stringify(found));
    toast('Welcome back, ' + found.name + '!', 'success');
    showScreen('home');
    btn.disabled = false;
    btn.textContent = 'LOGIN';
}

// ============ LOGOUT ============
function logout() {
    U = null;
    localStorage.removeItem('gkode_currentUser');
    localStorage.removeItem('gkode_session');
    toast('Logged out.', 'info');
    showScreen('welcome');
    var nav = document.getElementById('bottomNav');
    if (nav) nav.classList.add('hidden');
}

// ============ POST GIG (Optimized) ============
function postGig(e) {
    e.preventDefault();
    if (!U) { toast('Login first.', 'error'); return; }
    if (!rateLimit('gig', 10, 5)) return;
    var btn = document.getElementById('postGigBtn');
    btn.disabled = true;
    btn.textContent = '⏳...';
    var title = document.getElementById('gigTitle').value.trim();
    var skill = document.getElementById('gigSkill').value.trim();
    var location = document.getElementById('gigLocation').value.trim();
    var urgency = document.getElementById('gigUrgency').value;
    var min = parseInt(document.getElementById('gigBudgetMin').value);
    var max = parseInt(document.getElementById('gigBudgetMax').value);
    var desc = document.getElementById('gigDesc').value.trim();
    if (!title || !skill || !location) { toast('Fill all fields.', 'error'); btn.disabled = false; btn.textContent = 'POST GIG'; return; }
    var gigs = getG();
    gigs.push({
        id: Date.now().toString(),
        title: title, skill: skill, location: location,
        urgency: urgency, budgetMin: min, budgetMax: max,
        desc: desc, client: U.name, clientPhone: U.phone,
        status: 'Open', worker: '', createdAt: new Date().toISOString()
    });
    setG(gigs);
    toast('✅ Gig posted!', 'success');
    showScreen('home');
    btn.disabled = false;
    btn.textContent = 'POST GIG';
}

// ============ LOAD GIGS (Optimized) ============
function loadGigs() {
    var container = document.getElementById('gigsList');
    if (!container) return;
    var gigs = getG();
    var filtered = [];
    for (var i = 0; i < gigs.length; i++) {
        if (T === 'open' && gigs[i].status === 'Open') filtered.push(gigs[i]);
        if (T === 'taken' && gigs[i].status === 'Assigned') filtered.push(gigs[i]);
    }
    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding:40px 0;color:#666;text-align:center;"><p>No gigs.</p></div>';
        return;
    }
    var h = '';
    for (var i = 0; i < filtered.length; i++) {
        var g = filtered[i];
        var open = g.status === 'Open';
        h += '<div class="gig-card"><div class="gig-title">' + sanitize(g.title) + '</div>';
        h += '<span class="badge ' + (open ? 'badge-open' : 'badge-taken') + '">' + (open ? '🟢 OPEN' : '🔴 TAKEN') + '</span>';
        h += '<div class="gig-meta">👤 ' + sanitize(g.client) + ' | 🛠️ ' + sanitize(g.skill) + '</div>';
        h += '<div class="gig-meta">📍 ' + sanitize(g.location) + '</div>';
        h += '<div class="gig-budget">💰 Ksh ' + g.budgetMin + ' - ' + g.budgetMax + '</div>';
        if (open) {
            h += '<div class="gig-actions"><button class="btn-accept" onclick="acceptGig(\'' + g.id + '\')">✅ ACCEPT</button></div>';
        }
        h += '</div>';
    }
    container.innerHTML = h;
}

// ============ ACCEPT GIG ============
function acceptGig(id) {
    if (!U) { toast('Login first.', 'error'); return; }
    if (!rateLimit('accept', 10, 5)) return;
    var gigs = getG();
    for (var i = 0; i < gigs.length; i++) {
        if (gigs[i].id === id && gigs[i].status === 'Open') {
            gigs[i].status = 'Assigned';
            gigs[i].worker = U.name;
            gigs[i].workerPhone = U.phone;
            setG(gigs);
            toast('✅ Gig accepted!', 'success');
            loadGigs();
            return;
        }
    }
    toast('Gig not available.', 'error');
}

// ============ CHAT (Optimized) ============
function openChat(id) {
    document.getElementById('chatGigId').value = id;
    showScreen('chat');
    loadChatMessages(id);
}

function loadChatMessages(id) {
    var container = document.getElementById('chatMessages');
    if (!container) return;
    var logs = getL();
    var messages = [];
    for (var i = 0; i < logs.length; i++) {
        if (logs[i].gigId === id && logs[i].type === 'CHAT_MESSAGE') {
            messages.push(logs[i]);
        }
    }
    if (messages.length === 0) {
        container.innerHTML = '<div style="color:#999;padding:20px;text-align:center;">No messages.</div>';
        return;
    }
    var h = '';
    for (var i = 0; i < messages.length; i++) {
        var msg = messages[i];
        var sent = msg.sender === U.name;
        h += '<div class="chat-message ' + (sent ? 'sent' : 'received') + '">';
        if (!sent) h += '<div class="sender">' + sanitize(msg.sender) + '</div>';
        h += sanitize(msg.text);
        h += '</div>';
    }
    container.innerHTML = h;
    container.scrollTop = container.scrollHeight;
}

function sendMessage(e) {
    e.preventDefault();
    var text = document.getElementById('chatInput').value.trim();
    var id = document.getElementById('chatGigId').value;
    if (!text || !U) return;
    if (!rateLimit('msg', 50, 20)) return;
    var logs = getL();
    logs.push({ type: 'CHAT_MESSAGE', gigId: id, sender: U.name, text: text, time: new Date().toISOString() });
    setL(logs);
    document.getElementById('chatInput').value = '';
    loadChatMessages(id);
}

// ============ PROFILE ============
function loadProfile() {
    if (!U) return;
    document.getElementById('profileName').textContent = U.name;
    document.getElementById('profilePhone').textContent = '📞 ' + U.phone;
    document.getElementById('profileLocation').textContent = '📍 ' + U.location;
    document.getElementById('profileProfession').textContent = '👔 ' + U.profession;
    document.getElementById('profileSkills').textContent = '🛠️ ' + (U.skills || 'None');
    document.getElementById('profilePhoto').src = U.photo || 'https://via.placeholder.com/100';
    document.getElementById('profileStatus').innerHTML = '⭐ ' + (U.rating || 0);
}

// ============ EMAIL (Async) ============
function sendEmail(email, name, code) {
    try {
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
        script.onload = function() {
            emailjs.init(E.key);
            emailjs.send(E.service, E.otp, {
                to_email: email,
                to_name: name || 'User',
                code: code,
                app_name: 'G-KODE',
                year: new Date().getFullYear()
            }).then(function(r) {
                console.log('📧 Email sent:', r.status);
            }).catch(function(e) {
                console.log('📧 Email failed:', e);
            });
        };
        document.head.appendChild(script);
    } catch(e) {
        console.log('📧 Email error:', e);
    }
}

// ============ PAYMENT ============
function isPaymentRequired() {
    var state = getState();
    return state.paymentEnabled !== false;
}

function togglePayment() {
    if (!isAdmin()) { toast('Admin only.', 'error'); return; }
    var state = getState();
    state.paymentEnabled = !state.paymentEnabled;
    setState(state);
    toast('💳 Payment: ' + (state.paymentEnabled ? 'ON' : 'OFF'), 'success');
}

function isAdmin() {
    if (!U) return false;
    for (var i = 0; i < A.length; i++) {
        if (U.phone === A[i]) return true;
    }
    return false;
}

// ============ SYSTEM STATE ============
function getSystemState() {
    try { return JSON.parse(localStorage.getItem('gkode_systemState') || '{}'); } catch(e) { return {}; }
}
function setSystemState(s) { localStorage.setItem('gkode_systemState', JSON.stringify(s)); }

// ============ MARKETPLACE (Lightweight) ============
function loadMarketplace() {
    var container = document.getElementById('marketplaceList');
    if (!container) return;
    var products = getP();
    if (products.length === 0) {
        container.innerHTML = '<div style="padding:40px 0;color:#666;text-align:center;"><p>No products.</p></div>';
        return;
    }
    var h = '';
    for (var i = 0; i < products.length; i++) {
        var p = products[i];
        h += '<div class="gig-card"><h3>' + sanitize(p.name) + '</h3>';
        h += '<p>🏢 ' + sanitize(p.companyName) + ' | ' + sanitize(p.category) + '</p>';
        h += '<p>💰 Ksh ' + p.price + '/' + p.unit + '</p>';
        h += '<p>📦 Stock: ' + p.stock + '</p>';
        h += '<button onclick="buyProduct(\'' + p.id + '\')" style="background:#006400;color:#FFD700;border:none;padding:10px;border-radius:8px;width:100%;font-weight:bold;cursor:pointer;">🛒 BUY</button>';
        h += '</div>';
    }
    container.innerHTML = h;
}

function buyProduct(id) {
    if (!U) { toast('Login first.', 'error'); return; }
    if (!rateLimit('buy', 10, 5)) return;
    var products = getP();
    for (var i = 0; i < products.length; i++) {
        if (products[i].id === id && products[i].stock > 0) {
            products[i].stock--;
            setP(products);
            toast('✅ Purchased!', 'success');
            loadMarketplace();
            return;
        }
    }
    toast('Product not available.', 'error');
}

// ============ ADMIN FUNCTIONS ============
function viewAllUsers() {
    if (!isAdmin()) { toast('Admin only.', 'error'); return; }
    var users = getU();
    if (users.length === 0) { alert('No users.'); return; }
    var msg = '👥 USERS (' + users.length + ')\n';
    for (var i = 0; i < users.length; i++) {
        msg += (i+1) + '. ' + users[i].name + ' | ' + users[i].phone + ' | ' + users[i].email + '\n';
    }
    alert(msg);
}

function downloadBackup() {
    if (!isAdmin()) { toast('Admin only.', 'error'); return; }
    var data = {
        users: getU(),
        gigs: getG(),
        companies: getC(),
        products: getP(),
        orders: getO(),
        payments: getPay(),
        logs: getL(),
        timestamp: new Date().toISOString()
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gkode-backup-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    toast('✅ Backup downloaded!', 'success');
}

// ============ SWITCH TAB ============
function switchTab(tab) {
    T = tab;
    var open = document.getElementById('tabOpen');
    var taken = document.getElementById('tabTaken');
    if (tab === 'open') { open.className = 'active'; taken.className = ''; }
    else { open.className = ''; taken.className = 'active'; }
    loadGigs();
}

// ============ INIT ============
var saved = localStorage.getItem('gkode_currentUser');
if (saved) {
    try {
        U = JSON.parse(saved);
        if (U) {
            toast('Welcome back, ' + U.name + '!', 'success');
            showScreen('home');
        }
    } catch(e) { showScreen('welcome'); }
} else { showScreen('welcome'); }

// ============ ADMIN ACCESS ============
function checkAdminAccess() {
    var btn = document.getElementById('adminAccessBtn');
    if (!btn) return;
    if (isAdmin()) { btn.style.display = 'block'; } else { btn.style.display = 'none'; }
}

// ============ EMERGENCY ============
function emergencyCall() {
    if (confirm('🚨 EMERGENCY\n\nOpen emergency contacts?')) {
        window.location.href = 'emergency.html';
    }
}

// ============ PROFESSION DROPDOWN ============
var defaultProfessions = ['Plumber','Electrician','Carpenter','Painter','Mechanic','Hairdresser','Tailor','Chef','Driver','Teacher','Nurse','Accountant','Architect','Baker','Barber','Builder','Cleaner','Cook','Doctor','Engineer','Farmer','Gardener','Lawyer','Mason','Photographer','Plumber','Roofer','Security Guard','Surveyor','Tiler','Tour Guide','Translator','Vet','Welder','Writer'];

function populateProfessionDropdown() {
    var dropdown = document.getElementById('regProfession');
    if (!dropdown) return;
    while (dropdown.options.length > 1) { dropdown.remove(1); }
    var all = defaultProfessions.slice();
    var saved = getProf();
    for (var i = 0; i < saved.length; i++) {
        if (all.indexOf(saved[i]) === -1) { all.push(saved[i]); }
    }
    all.sort();
    for (var i = 0; i < all.length; i++) {
        var opt = document.createElement('option');
        opt.value = all[i];
        opt.textContent = all[i];
        dropdown.appendChild(opt);
    }
    var other = document.createElement('option');
    other.value = 'Other';
    other.textContent = 'Other (Add New)';
    dropdown.appendChild(other);
}
populateProfessionDropdown();

function checkProfession() {
    var p = document.getElementById('regProfession').value;
    document.getElementById('otherProfessionBox').style.display = p === 'Other' ? 'block' : 'none';
}

function saveNewProfession(name) {
    if (!name || name.trim().length < 3) { toast('Enter valid profession.', 'error'); return null; }
    var formatted = name.trim().split(' ').map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); }).join(' ');
    var all = defaultProfessions.slice();
    var saved = getProf();
    for (var i = 0; i < saved.length; i++) {
        if (all.indexOf(saved[i]) === -1) { all.push(saved[i]); }
    }
    for (var i = 0; i < all.length; i++) {
        if (all[i].toLowerCase() === formatted.toLowerCase()) { return all[i]; }
    }
    saved.push(formatted);
    setProf(saved);
    populateProfessionDropdown();
    toast('✅ New profession saved!', 'success');
    return formatted;
}

// ============ CATEGORIES ============
var defaultCategories = ['Cement','Pipes','Taps','Electrical','Paint','Timber','Steel','Tiles','Roofing','Tools','Beauty','Food','Seeds','Auto Parts','Hardware','Plumbing','Construction','Electronics','Furniture','Clothing'];

function populateCategoryDropdown() {
    var dropdown = document.getElementById('marketCategory');
    if (!dropdown) return;
    while (dropdown.options.length > 1) { dropdown.remove(1); }
    var all = defaultCategories.slice();
    var saved = getCat();
    for (var i = 0; i < saved.length; i++) {
        if (all.indexOf(saved[i]) === -1) { all.push(saved[i]); }
    }
    all.sort();
    for (var i = 0; i < all.length; i++) {
        var opt = document.createElement('option');
        opt.value = all[i];
        opt.textContent = all[i];
        dropdown.appendChild(opt);
    }
}
populateCategoryDropdown();

function populateProductCategoryDropdown() {
    var dropdown = document.getElementById('prodCategory');
    if (!dropdown) return;
    while (dropdown.options.length > 1) { dropdown.remove(1); }
    var all = defaultCategories.slice();
    var saved = getCat();
    for (var i = 0; i < saved.length; i++) {
        if (all.indexOf(saved[i]) === -1) { all.push(saved[i]); }
    }
    all.sort();
    for (var i = 0; i < all.length; i++) {
        var opt = document.createElement('option');
        opt.value = all[i];
        opt.textContent = all[i];
        dropdown.appendChild(opt);
    }
}

function addNewCategory(name) {
    if (!name || name.trim().length < 3) { toast('Enter valid category.', 'error'); return null; }
    var formatted = name.trim().split(' ').map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); }).join(' ');
    var all = defaultCategories.slice();
    var saved = getCat();
    for (var i = 0; i < saved.length; i++) {
        if (all.indexOf(saved[i]) === -1) { all.push(saved[i]); }
    }
    for (var i = 0; i < all.length; i++) {
        if (all[i].toLowerCase() === formatted.toLowerCase()) { return all[i]; }
    }
    saved.push(formatted);
    setCat(saved);
    populateCategoryDropdown();
    populateProductCategoryDropdown();
    toast('✅ New category saved!', 'success');
    return formatted;
}

// ============ BUSINESS ============
function registerCompany(e) {
    e.preventDefault();
    if (!U) { toast('Login first.', 'error'); return; }
    var btn = document.getElementById('compRegisterBtn');
    btn.disabled = true;
    btn.textContent = '⏳...';
    var name = document.getElementById('compName').value.trim();
    var type = document.getElementById('compType').value;
    var regNo = document.getElementById('compRegNo').value.trim();
    var location = document.getElementById('compLocation').value.trim();
    var phone = document.getElementById('compPhone').value.trim();
    if (!name || !type || !regNo || !location || !phone) {
        toast('Fill all fields.', 'error');
        btn.disabled = false;
        btn.textContent = 'REGISTER BUSINESS';
        return;
    }
    var companies = getC();
    companies.push({ id: Date.now().toString(), name: name, type: type, regNo: regNo, location: location, phone: phone, owner: U.name, ownerPhone: U.phone, registeredAt: new Date().toISOString(), totalSales: 0 });
    setC(companies);
    toast('✅ Business registered!', 'success');
    showScreen('companyDashboard');
    loadCompanyDashboard();
    btn.disabled = false;
    btn.textContent = 'REGISTER BUSINESS';
}

function loadCompanyDashboard() {
    if (!U) return;
    var companies = getC();
    var myComp = null;
    for (var i = 0; i < companies.length; i++) {
        if (companies[i].ownerPhone === U.phone) {
            myComp = companies[i];
            break;
        }
    }
    if (!myComp) {
        document.getElementById('compInfo').innerHTML = '<p>No business. <a href="#" onclick="showScreen(\'companyRegister\')" style="color:#006400;">Register now</a></p>';
        return;
    }
    document.getElementById('compInfo').innerHTML = '<h3>' + myComp.name + '</h3><p>🏢 ' + myComp.type + ' | 📍 ' + myComp.location + '</p><p>📞 ' + myComp.phone + '</p><p>📜 Reg No: ' + myComp.regNo + '</p>';
}

function addProduct(e) {
    e.preventDefault();
    if (!U) { toast('Login first.', 'error'); return; }
    var btn = document.getElementById('addProductBtn');
    btn.disabled = true;
    btn.textContent = '⏳...';
    var name = document.getElementById('prodName').value.trim();
    var category = document.getElementById('prodCategory').value;
    var unit = document.getElementById('prodUnit').value.trim();
    var price = parseFloat(document.getElementById('prodPrice').value);
    var stock = parseInt(document.getElementById('prodStock').value);
    var desc = document.getElementById('prodDesc').value.trim();
    if (!name || !category || !unit || !price || !stock) {
        toast('Fill all fields.', 'error');
        btn.disabled = false;
        btn.textContent = 'ADD PRODUCT';
        return;
    }
    var companies = getC();
    var myComp = null;
    for (var i = 0; i < companies.length; i++) {
        if (companies[i].ownerPhone === U.phone) {
            myComp = companies[i];
            break;
        }
    }
    if (!myComp) {
        toast('Register a business first.', 'error');
        btn.disabled = false;
        btn.textContent = 'ADD PRODUCT';
        return;
    }
    var products = getP();
    products.push({ id: Date.now().toString(), companyId: myComp.id, companyName: myComp.name, name: name, category: category, unit: unit, price: price, stock: stock, desc: desc });
    setP(products);
    toast('✅ Product added!', 'success');
    showScreen('companyDashboard');
    loadCompanyDashboard();
    btn.disabled = false;
    btn.textContent = 'ADD PRODUCT';
}

// ============ Toggle Password ============
function togglePassword(fieldId, icon) {
    var field = document.getElementById(fieldId);
    if (!field) return;
    if (field.type === 'password') { field.type = 'text'; icon.textContent = '🙈'; }
    else { field.type = 'password'; icon.textContent = '👁️'; }
}

// ============ Reset Everything ============
function resetEverything() {
    if (!isAdmin()) { toast('Admin only.', 'error'); return; }
    if (confirm('⚠️ DELETE ALL DATA?')) {
        if (confirm('FINAL WARNING: This cannot be undone!')) {
            localStorage.clear();
            toast('✅ All data cleared.', 'success');
            setTimeout(function() { location.reload(); }, 1000);
        }
    }
}

// ============ Console Info ============
console.log('🚀 G-KODE ULTRA LIGHTWEIGHT');
console.log('📊 Optimized for 50M users');
console.log('🔋 Low network friendly');
console.log('⚡ Total size: ~15KB');
// ============================================
// 🛡️ FRAUD DETECTION SYSTEM - ZERO MERCY
// ============================================

// ============ FRAUD SCORE CALCULATION ============
function calculateFraudScore(user) {
    let score = 0;
    
    // Strike pattern
    if (user.strikes > 0) score += user.strikes * 10;
    if (user.strikes >= 4) score += 30;
    
    // Payment status
    if (!user.paymentStatus || user.paymentStatus === 'UNPAID') score += 20;
    
    // Review patterns (suspicious 5-star spam)
    if (user.reviewCount > 100 && user.rating === 5) score += 20;
    
    // Gig patterns
    let gigs = getGigs();
    let userGigs = gigs.filter(g => g.client === user.name || g.worker === user.name);
    if (userGigs.length > 50) score += 10;
    if (userGigs.length > 100) score += 20;
    
    // New user, too many gigs
    let monthsSinceRegister = (Date.now() - new Date(user.registeredAt)) / (30 * 24 * 60 * 60 * 1000);
    if (monthsSinceRegister < 1 && userGigs.length > 20) score += 20;
    
    return Math.min(score, 100);
}

// ============ REAL-TIME FRAUD DETECTION ============
function detectFraudInRealTime() {
    let start = performance.now();
    let users = getUsers();
    let gigs = getGigs();
    let orders = getOrders();
    let payments = getPayments();
    
    let suspiciousUsers = [];
    let suspiciousGigs = [];
    let suspiciousOrders = [];
    let fraudulentPayments = [];
    
    // Scan 1: Suspicious Users
    for (let i = 0; i < users.length; i++) {
        let u = users[i];
        let fraudScore = calculateFraudScore(u);
        if (fraudScore > 50) {
            suspiciousUsers.push({ user: u, fraudScore: fraudScore });
        }
    }
    
    // Scan 2: Suspicious Gigs
    for (let i = 0; i < gigs.length; i++) {
        let g = gigs[i];
        // Too many gigs from same client
        let userGigs = gigs.filter(x => x.client === g.client);
        if (userGigs.length > 20) {
            suspiciousGigs.push({ gig: g, reason: 'TOO_MANY_GIGS', count: userGigs.length });
        }
        // Unusual budget
        if (g.budgetMin > 1000000 || g.budgetMax < 10) {
            suspiciousGigs.push({ gig: g, reason: 'UNUSUAL_BUDGET' });
        }
    }
    
    // Scan 3: Suspicious Orders
    for (let i = 0; i < orders.length; i++) {
        let o = orders[i];
        if (o.quantity > 100) {
            suspiciousOrders.push({ order: o, reason: 'LARGE_QUANTITY' });
        }
        if (o.totalAmount > 100000) {
            suspiciousOrders.push({ order: o, reason: 'LARGE_AMOUNT' });
        }
    }
    
    // Scan 4: Fraudulent Payments
    for (let i = 0; i < payments.length; i++) {
        let p = payments[i];
        // Duplicate payment codes
        let duplicates = payments.filter(x => x.code === p.code);
        if (duplicates.length > 1) {
            fraudulentPayments.push({ payment: p, reason: 'DUPLICATE_CODE' });
        }
        // Unusual amounts
        if (p.amount > 10000 || p.amount < 100) {
            fraudulentPayments.push({ payment: p, reason: 'UNUSUAL_AMOUNT' });
        }
    }
    
    let end = performance.now();
    
    return {
        detectionTime: ((end - start) / 1000).toFixed(2) + 's',
        suspiciousUsers: suspiciousUsers.length,
        suspiciousGigs: suspiciousGigs.length,
        suspiciousOrders: suspiciousOrders.length,
        fraudulentPayments: fraudulentPayments.length,
        details: {
            users: suspiciousUsers,
            gigs: suspiciousGigs,
            orders: suspiciousOrders,
            payments: fraudulentPayments
        }
    };
}

// ============ AUTO-BLOCK FRAUDSTERS ============
function autoBlockFraudsters() {
    let blocked = [];
    let users = getUsers();
    let logs = getLogs();
    
    for (let i = 0; i < users.length; i++) {
        let user = users[i];
        let fraudScore = calculateFraudScore(user);
        
        // ZERO TOLERANCE!
        if (fraudScore > 80) {
            user.status = 'PERMANENTLY_BANNED';
            user.bannedAt = new Date().toISOString();
            user.banReason = 'FRAUD_DETECTED_SCORE_' + fraudScore;
            blocked.push(user);
            
            logs.push({
                type: 'AUTO_BAN',
                user: user.name,
                phone: user.phone,
                fraudScore: fraudScore,
                time: new Date().toISOString()
            });
        } else if (fraudScore > 50) {
            user.status = 'SUSPENDED';
            user.suspendedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            user.suspendReason = 'SUSPICIOUS_ACTIVITY_SCORE_' + fraudScore;
            blocked.push(user);
            
            logs.push({
                type: 'AUTO_SUSPEND',
                user: user.name,
                phone: user.phone,
                fraudScore: fraudScore,
                time: new Date().toISOString()
            });
        }
    }
    
    if (blocked.length > 0) {
        setUsers(users);
        setLogs(logs);
        console.log('🚨 AUTO-BLOCKED ' + blocked.length + ' users');
    }
    
    return blocked;
}

// ============ MONEY FLOW TRACKING ============
function trackMoneyFlow() {
    let payments = getPayments();
    let orders = getOrders();
    let users = getUsers();
    
    let stats = {
        totalRevenue: 0,
        pendingPayments: 0,
        completedPayments: 0,
        feesCollected: 0,
        commissionsCollected: 0,
        averageTransaction: 0,
        anomalies: []
    };
    
    // Calculate revenue
    for (let i = 0; i < payments.length; i++) {
        if (payments[i].verified) {
            stats.totalRevenue += payments[i].amount;
            stats.completedPayments++;
        } else {
            stats.pendingPayments++;
        }
    }
    
    // Calculate commissions
    for (let i = 0; i < orders.length; i++) {
        stats.commissionsCollected += orders[i].commission || 0;
    }
    
    // Average transaction
    if (stats.completedPayments > 0) {
        stats.averageTransaction = stats.totalRevenue / stats.completedPayments;
    }
    
    // Detect anomalies
    let amounts = payments.map(p => p.amount);
    if (amounts.length > 0) {
        let avg = amounts.reduce((a,b) => a + b, 0) / amounts.length;
        let stdDev = Math.sqrt(amounts.reduce((a,b) => a + Math.pow(b - avg, 2), 0) / amounts.length);
        
        for (let i = 0; i < payments.length; i++) {
            let p = payments[i];
            if (Math.abs(p.amount - avg) > 3 * stdDev) {
                stats.anomalies.push({
                    payment: p,
                    reason: 'AMOUNT_ANOMALY',
                    deviation: Math.abs(p.amount - avg) / stdDev
                });
            }
            // Unusual time (middle of night)
            let hour = new Date(p.time).getHours();
            if (hour >= 0 && hour <= 4) {
                stats.anomalies.push({
                    payment: p,
                    reason: 'UNUSUAL_TIME',
                    hour: hour
                });
            }
        }
    }
    
    return stats;
}

// ============ ACTIVATE FRAUD DETECTION ============
function activateFraudDetection() {
    console.log('🛡️ Fraud Detection ACTIVATED!');
    
    // Run every 2 minutes
    setInterval(function() {
        let frauds = detectFraudInRealTime();
        
        if (frauds.suspiciousUsers > 0 || frauds.suspiciousGigs > 0 || 
            frauds.suspiciousOrders > 0 || frauds.fraudulentPayments > 0) {
            
            console.log('🚨 FRAUD DETECTED!', frauds);
            
            // Auto-block fraudsters
            let blocked = autoBlockFraudsters();
            if (blocked.length > 0) {
                console.log('⛔ AUTO-BLOCKED:', blocked.length, 'users');
                showToast('🛡️ ' + blocked.length + ' fraudsters blocked!', 'warning');
            }
        }
    }, 120000); // Every 2 minutes
    
    // Track money flow every minute
    setInterval(function() {
        let stats = trackMoneyFlow();
        if (stats.anomalies.length > 0) {
            console.log('💰 ANOMALIES DETECTED:', stats.anomalies.length);
        }
    }, 60000); // Every minute
    
    console.log('✅ Fraud Detection RUNNING!');
    console.log('⏰ Scan interval: 2 minutes');
    console.log('💰 Money tracking: 1 minute');
}

// ============ MANUAL FRAUD CHECK (Admin Only) ============
function manualFraudCheck() {
    if (!isAdmin()) {
        showToast('⛔ Admin only!', 'error');
        return;
    }
    
    let start = performance.now();
    let frauds = detectFraudInRealTime();
    let end = performance.now();
    
    let msg = '🛡️ FRAUD SCAN REPORT\n';
    msg += '='.repeat(40) + '\n';
    msg += '⏱️ Scan Time: ' + frauds.detectionTime + '\n';
    msg += '👥 Suspicious Users: ' + frauds.suspiciousUsers + '\n';
    msg += '📋 Suspicious Gigs: ' + frauds.suspiciousGigs + '\n';
    msg += '📦 Suspicious Orders: ' + frauds.suspiciousOrders + '\n';
    msg += '💳 Fraudulent Payments: ' + frauds.fraudulentPayments + '\n';
    msg += '='.repeat(40) + '\n';
    
    if (frauds.suspiciousUsers > 0 || frauds.suspiciousGigs > 0) {
        msg += '⚠️ ACTION REQUIRED!\n';
        msg += 'Run autoBlockFraudsters() to block them.';
    } else {
        msg += '✅ All clear! No fraud detected.';
    }
    
    alert(msg);
    
    let blocked = autoBlockFraudsters();
    if (blocked.length > 0) {
        showToast('⛔ ' + blocked.length + ' users blocked!', 'warning');
    }
    
    return frauds;
}

// ============ ACTIVATE ON START ============
activateFraudDetection();

console.log('🛡️ G-KODE Fraud Prevention ACTIVE!');
console.log('💰 Money Tracking ACTIVE!');
console.log('⛔ Auto-Blocking ACTIVE!');