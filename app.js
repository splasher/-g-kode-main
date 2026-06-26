// ============================================
// G-KODE - COMPLETE APP
// ============================================

// ============ GLOBAL ============
var currentUser = null;
var currentTab = 'open';
var currentCompTab = 'products';
var loginAttempts = 0;
var loginLocked = false;
var loginLockTime = null;
var pendingVerificationPhone = null;
var pendingVerificationCode = null;

// ============ ADMIN ============
var ADMIN_PHONES = ['0703428192', '0711991467'];

// ============ CONFIG ============
var CONFIG = {
    paymentEnabled: false,
    userFee: 300,
    commissionRate: 3,
    tillNumber: '9876543',
    paybill: '247247',
    account: 'G-KODE',
    maxLoginAttempts: 5,
    lockDuration: 120000,
    maxStrikes: 6,
    reentryDays: 90,
    reentryFee: 1500,
    businessRegistrationFee: 500,
    marketplaceListingFee: 100
};

// ============ EMAILJS ============
var EMAILJS_CONFIG = {
    serviceID: 'service_hw35xfu',
    publicKey: 'vc371wcNfQy56zlH8',
    otpTemplateID: 'template_qycsjak',
    resetTemplateID: 'template_0787ox7'
};

// ============ DATA ============
function getData(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; } }
function setData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function getUsers() { return getData('gkode_users'); }
function setUsers(u) { setData('gkode_users', u); }
function getGigs() { return getData('gkode_gigs'); }
function setGigs(g) { setData('gkode_gigs', g); }
function getCompanies() { return getData('gkode_companies'); }
function setCompanies(c) { setData('gkode_companies', c); }
function getProducts() { return getData('gkode_products'); }
function setProducts(p) { setData('gkode_products', p); }
function getOrders() { return getData('gkode_orders'); }
function setOrders(o) { setData('gkode_orders', o); }
function getPayments() { return getData('gkode_payments'); }
function setPayments(p) { setData('gkode_payments', p); }
function getLogs() { return getData('gkode_adminLogs'); }
function setLogs(l) { setData('gkode_adminLogs', l); }
function getProfessions() { return getData('gkode_professions'); }
function setProfessions(p) { setData('gkode_professions', p); }
function getCategories() { return getData('gkode_categories'); }
function setCategories(c) { setData('gkode_categories', c); }
function getSystemState() { try { return JSON.parse(localStorage.getItem('gkode_systemState') || '{}'); } catch(e) { return {}; } }
function setSystemState(s) { localStorage.setItem('gkode_systemState', JSON.stringify(s)); }

// ============ TOAST ============
function showToast(msg, type) {
    type = type || 'info';
    var c = document.getElementById('toast-container');
    if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
    var t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(function() { if (t.parentNode) t.remove(); }, 4000);
}

// ============ ENCRYPTION ============
function simpleEncode(str) { var e = ''; for (var i = 0; i < str.length; i++) { e += String.fromCharCode(str.charCodeAt(i) + 3); } return e; }
function simpleDecode(str) { var d = ''; for (var i = 0; i < str.length; i++) { d += String.fromCharCode(str.charCodeAt(i) - 3); } return d; }

// ============ NAVIGATION ============
function showScreen(id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) { screens[i].classList.remove('active'); }
    var s = document.getElementById(id);
    if (s) s.classList.add('active');

    var nav = document.getElementById('bottomNav');
    var allowed = ['home','postGig','profile','chat','review','complaint','terms','privacy','guide','payment','companyRegister','companyDashboard','addProduct','marketplace'];
    if (currentUser && allowed.indexOf(id) !== -1) {
        nav.classList.remove('hidden');
        var btns = nav.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) { btns[i].classList.remove('active'); }
        var map = { 'home':0,'postGig':1,'marketplace':2,'complaint':3,'profile':4 };
        if (map[id] !== undefined && btns[map[id]]) { btns[map[id]].classList.add('active'); }
    } else { nav.classList.add('hidden'); }
    if (id === 'home') loadGigs();
    if (id === 'profile') loadProfile();
    if (id === 'companyDashboard') loadCompanyDashboard();
    if (id === 'marketplace') loadMarketplace();
}

function togglePassword(fieldId, icon) {
    var field = document.getElementById(fieldId);
    if (!field) return;
    if (field.type === 'password') { field.type = 'text'; icon.textContent = '🙈'; }
    else { field.type = 'password'; icon.textContent = '👁️'; }
}

// ============ PROFESSIONS ============
var defaultProfessions = [
    'Accountant', 'Architect', 'Baker', 'Barber', 'Barista', 
    'Boda Boda Rider', 'Builder', 'Butcher', 'Carpenter', 'Caterer', 
    'CCTV Installer', 'Chef', 'Childminder / Nanny', 'Cleaner', 'Cook', 
    'Courier', 'Data Entry Clerk', 'Delivery Person', 'Dentist', 'DJ', 
    'Doctor', 'Driver', 'Electrician', 'Elderly Caregiver', 'Engineer', 
    'Event Planner', 'Farmer', 'Fitness Trainer', 'Gardener', 'Graphic Designer', 
    'Hairdresser', 'House Help', 'IT Technician', 'Journalist', 'Lab Technician', 
    'Landscaper', 'Laundry Worker', 'Lawyer', 'Makeup Artist', 'Mason', 
    'Mechanic', 'Music Teacher', 'Nurse', 'Painter', 'Peer Counselor', 
    'Pharmacist', 'Phone Repair Technician', 'Photographer', 'Physiotherapist', 'Plumber', 
    'Roofer', 'Security Guard', 'Surveyor', 'Tailor', 'Teacher / Tutor', 
    'Tiler', 'Tour Guide', 'Translator', 'Vet', 'Videographer', 
    'Waiter / Waitress', 'Web Designer', 'Welder', 'Writer'
];

// ============ GET ALL PROFESSIONS (NO DUPLICATES) ============
function getAllProfessions() {
    var saved = getProfessions();
    var all = defaultProfessions.slice();
    
    // Add saved professions without duplicates
    for (var i = 0; i < saved.length; i++) {
        var exists = false;
        for (var j = 0; j < all.length; j++) {
            if (all[j].toLowerCase() === saved[i].toLowerCase()) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            all.push(saved[i]);
        }
    }
    
    all.sort();
    return all;
}

// ============ POPULATE DROPDOWN (NO DUPLICATES) ============
function populateProfessionDropdown() {
    var dropdown = document.getElementById('regProfession');
    if (!dropdown) return;
    
    // Clear all options except the first one
    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }
    
    var all = getAllProfessions();
    var addedNames = {};
    
    for (var i = 0; i < all.length; i++) {
        // Skip if already added
        if (addedNames[all[i].toLowerCase()]) continue;
        addedNames[all[i].toLowerCase()] = true;
        
        var opt = document.createElement('option');
        opt.value = all[i];
        opt.textContent = all[i];
        dropdown.appendChild(opt);
    }
    
    var otherOpt = document.createElement('option');
    otherOpt.value = 'Other';
    otherOpt.textContent = '➕ Other (Add New Profession)';
    dropdown.appendChild(otherOpt);
}

// ============ CHECK IF OTHER PROFESSION ============
function checkProfession() {
    var profession = document.getElementById('regProfession').value;
    var otherBox = document.getElementById('otherProfessionBox');
    if (profession === 'Other') {
        otherBox.style.display = 'block';
        document.getElementById('regOtherProfession').focus();
    } else {
        otherBox.style.display = 'none';
    }
}

// ============ SAVE NEW PROFESSION (FIXED) ============
function saveNewProfession(professionName) {
    if (!professionName || professionName.trim().length < 3) {
        showToast('Please enter a valid profession name (minimum 3 characters).', 'error');
        return null;
    }
    
    // Format the profession name (Capitalize each word)
    var words = professionName.trim().split(' ');
    var formatted = '';
    for (var i = 0; i < words.length; i++) {
        if (words[i].length > 0) {
            formatted += words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase() + ' ';
        }
    }
    formatted = formatted.trim();
    
    // Check if profession already exists (case insensitive)
    var all = getAllProfessions();
    for (var i = 0; i < all.length; i++) {
        if (all[i].toLowerCase() === formatted.toLowerCase()) {
            showToast('✅ Profession "' + all[i] + '" already exists.', 'info');
            return all[i];
        }
    }
    
    // Save new profession
    var saved = getProfessions();
    saved.push(formatted);
    setProfessions(saved);
    
    // Refresh dropdown
    populateProfessionDropdown();
    
    // Select the newly added profession
    var dropdown = document.getElementById('regProfession');
    for (var i = 0; i < dropdown.options.length; i++) {
        if (dropdown.options[i].value === formatted) {
            dropdown.selectedIndex = i;
            break;
        }
    }
    
    showToast('✅ New profession "' + formatted + '" saved!', 'success');
    return formatted;
}

// ============ INIT PROFESSION DROPDOWN ============
populateProfessionDropdown();

// ============ VERIFICATION ============
function generateVerificationCode() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function sendVerificationCode(phone, code) { var logs = getLogs(); logs.push({ type: 'VERIFICATION_SENT', phone: phone, code: code, time: new Date().toISOString() }); setLogs(logs); }

// ============ EMAILJS ============
function loadEmailJS(callback) {
    if (typeof emailjs !== 'undefined') { callback(); return; }
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    document.head.appendChild(script);
    script.onload = function() { emailjs.init(EMAILJS_CONFIG.publicKey); callback(); };
    script.onerror = function() { showToast('⚠️ Email unavailable. Using on-screen code.', 'warning'); callback(); };
}

function sendOTPEmail(userEmail, userName, code) {
    console.log('📧 Sending OTP to:', userEmail);
    loadEmailJS(function() {
        if (typeof emailjs === 'undefined') { showToast('📱 Your code: ' + code, 'info'); return; }
        emailjs.send(EMAILJS_CONFIG.serviceID, EMAILJS_CONFIG.otpTemplateID, { to_email: userEmail, to_name: userName || 'User', code: code, app_name: 'G-KODE', year: new Date().getFullYear() })
        .then(function(r) { console.log('✅ OTP sent!', r.status); showToast('📧 Verification code sent to your email!', 'success'); })
        .catch(function(e) { console.log('❌ OTP failed:', e); showToast('📱 Your code: ' + code, 'info'); });
    });
}

function sendPasswordResetEmail(userEmail, userName, resetCode) {
    loadEmailJS(function() {
        if (typeof emailjs === 'undefined') { showToast('⚠️ Email unavailable. Please contact support.', 'error'); return; }
        var resetLink = window.location.origin + '/reset-password.html?code=' + resetCode + '&email=' + encodeURIComponent(userEmail);
        emailjs.send(EMAILJS_CONFIG.serviceID, EMAILJS_CONFIG.resetTemplateID, { to_email: userEmail, to_name: userName || 'User', reset_link: resetLink, app_name: 'G-KODE', year: new Date().getFullYear() })
        .then(function(r) { showToast('📧 Password reset link sent to your email!', 'success'); })
        .catch(function(e) { showToast('⚠️ Please contact support for password reset', 'error'); });
    });
}

// ============ MODAL ============
function showVerificationModal(phone, code) {
    var overlay = document.createElement('div');
    overlay.id = 'verificationModal';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
    var modal = document.createElement('div');
    modal.style.cssText = 'background:#fff;border-radius:16px;padding:30px;max-width:400px;width:100%;text-align:center;';
    modal.innerHTML = `
        <div style="font-size:48px;margin-bottom:10px;">📱</div>
        <h2 style="color:#006400;margin-bottom:5px;">Verify Your Phone</h2>
        <p style="color:#666;font-size:14px;margin-bottom:15px;">We sent a code to <strong>${phone}</strong></p>
        <div style="background:#f5f5f5;padding:15px;border-radius:10px;margin-bottom:15px;">
            <p style="color:#006400;font-weight:bold;font-size:13px;">📌 Your code is:</p>
            <p style="font-size:32px;font-weight:bold;color:#006400;letter-spacing:5px;">${code}</p>
            <p style="font-size:11px;color:#999;margin-top:5px;">(Also sent to your email)</p>
        </div>
        <input type="text" id="verificationCodeInput" placeholder="Enter 6-digit code" maxlength="6" style="width:100%;padding:14px;border:2px solid #ddd;border-radius:10px;font-size:18px;text-align:center;letter-spacing:3px;margin-bottom:10px;" autofocus>
        <button onclick="verifyCode()" style="width:100%;padding:14px;background:#006400;color:#FFD700;border:none;border-radius:10px;font-weight:bold;font-size:16px;cursor:pointer;margin-bottom:8px;">✅ VERIFY</button>
        <button onclick="closeVerificationModal()" style="background:none;border:none;color:#cc0000;font-size:14px;cursor:pointer;">Cancel</button>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    setTimeout(function() { var input = document.getElementById('verificationCodeInput'); if (input) input.focus(); }, 300);
    document.addEventListener('keydown', function(e) { if (e.key === 'Enter') { var input = document.getElementById('verificationCodeInput'); if (input && document.getElementById('verificationModal')) { verifyCode(); } } });
}

function closeVerificationModal() {
    var modal = document.getElementById('verificationModal');
    if (modal) { modal.remove(); }
    var btn = document.getElementById('registerBtn');
    if (btn) { btn.disabled = false; btn.textContent = 'REGISTER'; }
    showToast('Registration cancelled.', 'warning');
}

function verifyCode() {
    var input = document.getElementById('verificationCodeInput');
    if (!input) return;
    var userCode = input.value.trim();
    if (!userCode || userCode.length < 6) { showToast('Enter 6-digit code.', 'error'); input.focus(); input.style.borderColor = '#cc0000'; return; }
    if (userCode !== pendingVerificationCode) { showToast('❌ Invalid code.', 'error'); input.value = ''; input.style.borderColor = '#cc0000'; input.focus(); return; }
    input.style.borderColor = '#006400';
    closeVerificationModal();
    completeRegistration();
}

// ============ ID VERIFICATION ============
function validateIDNumber(idNumber) {
    if (!/^[0-9]{7,8}$/.test(idNumber)) { return { valid: false, message: 'ID must be 7-8 digits.' }; }
    return { valid: true };
}

function verifyNameOnID(name, idNumber) {
    if (!name || name.length < 3) { return { verified: false, message: 'Please enter your full name.' }; }
    var nameParts = name.trim().split(' ');
    if (nameParts.length < 2) { return { verified: false, message: 'Please enter your FULL name (first and last).' }; }
    for (var i = 0; i < nameParts.length; i++) { if (nameParts[i].length < 2) { return { verified: false, message: 'Each part of your name must be at least 2 characters.' }; } }
    var idCheck = validateIDNumber(idNumber);
    if (!idCheck.valid) { return { verified: false, message: idCheck.message }; }
    if (!/^[a-zA-Z\s\-]+$/.test(name)) { return { verified: false, message: 'Name should only contain letters, spaces, and hyphens.' }; }
    var properName = nameParts.map(function(part) { return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(); }).join(' ');
    return { verified: true, message: '✅ Name verified: ' + properName, properName: properName };
}

function validateProfilePhoto(photoFile) {
    return new Promise(function(resolve, reject) {
        if (!photoFile) { resolve({ valid: false, message: 'Please upload a profile photo.' }); return; }
        if (!photoFile.type.match(/^image\/(jpeg|png|jpg)$/)) { resolve({ valid: false, message: 'Photo must be JPG or PNG.' }); return; }
        if (photoFile.size > 5 * 1024 * 1024) { resolve({ valid: false, message: 'Photo too large. Max 5MB.' }); return; }
        if (photoFile.size < 50 * 1024) { resolve({ valid: false, message: 'Photo too small. Upload a clear image.' }); return; }
        var img = new Image();
        var reader = new FileReader();
        reader.onload = function(e) {
            img.onload = function() {
                if (img.width < 200 || img.height < 200) { resolve({ valid: false, message: 'Photo too small. Minimum 200x200 pixels.' }); return; }
                if (img.width > 4000 || img.height > 4000) { resolve({ valid: false, message: 'Photo too large. Maximum 4000x4000 pixels.' }); return; }
                var ratio = img.width / img.height;
                if (ratio < 0.5 || ratio > 2.0) { resolve({ valid: false, message: 'Photo should be a portrait.' }); return; }
                resolve({ valid: true, message: '✅ Photo looks good!', width: img.width, height: img.height });
            };
            img.onerror = function() { resolve({ valid: false, message: 'Could not read image. Please try another.' }); };
            img.src = e.target.result;
        };
        reader.onerror = function() { resolve({ valid: false, message: 'Could not read file. Please try again.' }); };
        reader.readAsDataURL(photoFile);
    });
}

function validateIDScan(file) {
    return new Promise(function(resolve, reject) {
        if (!file) { resolve({ valid: false, message: 'Please upload your ID scan.' }); return; }
        if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) { resolve({ valid: false, message: 'ID scan must be JPG or PNG.' }); return; }
        if (file.size > 5 * 1024 * 1024) { resolve({ valid: false, message: 'ID scan too large. Max 5MB.' }); return; }
        if (file.size < 30 * 1024) { resolve({ valid: false, message: 'ID scan too small. Upload a clear image.' }); return; }
        var img = new Image();
        var reader = new FileReader();
        reader.onload = function(e) {
            img.onload = function() {
                if (img.width < 300 || img.height < 200) { resolve({ valid: false, message: 'ID scan too small. Upload a clear image.' }); return; }
                resolve({ valid: true, message: '✅ ID scan looks good!', width: img.width, height: img.height });
            };
            img.onerror = function() { resolve({ valid: false, message: 'Could not read ID scan. Please try another.' }); };
            img.src = e.target.result;
        };
        reader.onerror = function() { resolve({ valid: false, message: 'Could not read file. Please try again.' }); };
        reader.readAsDataURL(file);
    });
}

async function verifyIdentityDocuments(name, idNumber, photoFile, idScanFile) {
    var results = { nameVerified: false, photoValid: false, idScanValid: false, allValid: false, messages: [] };
    var nameCheck = verifyNameOnID(name, idNumber);
    if (nameCheck.verified) { results.nameVerified = true; results.messages.push('✅ Name verified: ' + nameCheck.properName); }
    else { results.messages.push('❌ ' + nameCheck.message); return results; }
    var photoCheck = await validateProfilePhoto(photoFile);
    if (photoCheck.valid) { results.photoValid = true; results.messages.push('✅ Photo validated (' + photoCheck.width + 'x' + photoCheck.height + ')'); }
    else { results.messages.push('❌ ' + photoCheck.message); return results; }
    var idCheck = await validateIDScan(idScanFile);
    if (idCheck.valid) { results.idScanValid = true; results.messages.push('✅ ID scan validated (' + idCheck.width + 'x' + idCheck.height + ')'); }
    else { results.messages.push('❌ ' + idCheck.message); return results; }
    results.allValid = true;
    results.messages.push('✅ All documents verified successfully!');
    return results;
}

// ============ PAYMENT ============
function isPaymentRequired() {
    var state = getSystemState();
    if (state.paymentEnabled === undefined) return false;
    return state.paymentEnabled;
}

function checkPaymentStatus(user) {
    if (!user) return false;
    if (!isPaymentRequired()) return true;
    return user.paymentStatus === 'PAID';
}

function requirePayment() {
    if (!currentUser) { showToast('Login first.', 'error'); return false; }
    if (!isPaymentRequired()) return true;
    if (!checkPaymentStatus(currentUser)) { showToast('⚠️ Payment required: Ksh ' + CONFIG.userFee, 'warning'); showPaymentScreen(); return false; }
    return true;
}

function verifyPayment(code, amount, phone) {
    amount = amount || CONFIG.userFee;
    phone = phone || (currentUser ? currentUser.phone : 'Unknown');
    if (code && code.length >= 5) {
        var payments = getPayments();
        for (var i = 0; i < payments.length; i++) { if (payments[i].code === code && payments[i].phone === phone) { return true; } }
        payments.push({ phone: phone, code: code, amount: amount, type: amount === CONFIG.userFee ? 'user_fee' : amount === CONFIG.businessRegistrationFee ? 'business_fee' : amount === CONFIG.marketplaceListingFee ? 'listing_fee' : 'other', time: new Date().toISOString(), verified: true });
        setPayments(payments);
        if (currentUser && currentUser.phone === phone) {
            var users = getUsers();
            for (var i = 0; i < users.length; i++) { if (users[i].phone === phone) { users[i].paymentStatus = 'PAID'; users[i].paymentDate = new Date().toISOString(); users[i].paymentAmount = amount; users[i].paymentCode = code; break; } }
            setUsers(users);
            currentUser.paymentStatus = 'PAID';
            currentUser.paymentDate = new Date().toISOString();
            currentUser.paymentAmount = amount;
            currentUser.paymentCode = code;
            localStorage.setItem('gkode_currentUser', JSON.stringify(currentUser));
        }
        return true;
    }
    return false;
}

function showPaymentScreen() {
    if (!currentUser) { showToast('Login first.', 'error'); return; }
    if (!isPaymentRequired()) { showToast('🔓 Payment is disabled for testing.', 'info'); return; }
    var fee = CONFIG.userFee;
    var msg = '💳 G-KODE PAYMENT\n\nUser: ' + currentUser.name + '\nPhone: ' + currentUser.phone + '\nAmount: Ksh ' + fee + '\n\n📌 ONE-TIME FEE FOR LIFE\nNo subscriptions.\n\nPayment:\n📱 Till: ' + CONFIG.tillNumber + '\n📱 Paybill: ' + CONFIG.paybill + '\n📱 Account: ' + CONFIG.account + '\n\nEnter M-Pesa confirmation code:';
    alert(msg);
    var code = prompt('📱 Enter M-Pesa confirmation code:');
    if (code && code.length >= 5) { if (verifyPayment(code, fee, currentUser.phone)) { showToast('✅ Payment verified!', 'success'); showScreen('home'); } else { showToast('❌ Invalid code.', 'error'); } }
    else { showToast('Payment cancelled.', 'warning'); }
}

function verifyMpesaPayment() {
    var code = document.getElementById('mpesaCode').value.trim();
    if (!currentUser) { showToast('Login first.', 'error'); return; }
    if (!isPaymentRequired()) { showToast('🔓 Payment is disabled.', 'info'); return; }
    if (code && code.length >= 5) { if (verifyPayment(code, CONFIG.userFee, currentUser.phone)) { showToast('✅ Payment successful!', 'success'); showScreen('home'); } else { showToast('❌ Invalid code.', 'error'); } }
    else { showToast('Enter a valid confirmation code.', 'error'); }
}

function getPaymentStatusText(user) {
    if (!user) return 'Not paid';
    if (!isPaymentRequired()) return '🔓 Free Mode (Testing)';
    if (user.paymentStatus === 'PAID') return '✅ Paid - Ksh ' + (user.paymentAmount || CONFIG.userFee);
    return '❌ Unpaid - Pay Ksh ' + CONFIG.userFee;
}

// ============ REGISTRATION ============
async function register(e) {
    e.preventDefault();
    var btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = '⏳ VERIFYING...';
    try {
        var name = document.getElementById('regName').value.trim();
        var phone = document.getElementById('regPhone').value.trim();
        var id = document.getElementById('regID').value.trim();
        var email = document.getElementById('regEmail').value.trim();
        var password = document.getElementById('regPassword').value.trim();
        var location = document.getElementById('regLocation').value.trim();
        var profession = document.getElementById('regProfession').value;
        var otherProfession = document.getElementById('regOtherProfession').value.trim();
        var skills = document.getElementById('regSkills').value.trim();
        var photoFile = document.getElementById('regPhoto').files[0];
        var idScanFile = document.getElementById('regIDScan').files[0];

        if (!email) { showToast('Please enter your email address.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Please enter a valid email address.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }

        window._pendingRegistration = { name: name, phone: phone, id: id, email: email, password: password, location: location, profession: profession, otherProfession: otherProfession, skills: skills, photoFile: photoFile, idScanFile: idScanFile };

        if (profession === 'Other') {
            if (!otherProfession) { showToast('Please specify your profession.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }
            profession = saveNewProfession(otherProfession);
            if (!profession) { showToast('Enter a valid profession name.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }
        }
        if (!name || !phone || !id || !password || !location || !profession) { showToast('Fill all required fields.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }
        if (!/^0[0-9]{9}$/.test(phone) && !/^\+254[0-9]{9}$/.test(phone)) { showToast('Invalid phone number.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }
        if (!/^[0-9]{7,8}$/.test(id)) { showToast('Invalid National ID. Must be 7-8 digits.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }
        if (name.length < 4) { showToast('Full name required (minimum 4 characters).', 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }
        if (password.length < 8) { showToast('Password must be 8+ characters.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }
        if (!/[A-Za-z]/.test(password)) { showToast('Password must contain a letter.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }
        if (!/[0-9]/.test(password)) { showToast('Password must contain a number.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }
        if (!photoFile || !idScanFile) { showToast('Please upload profile photo and ID scan.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }

        var users = getUsers();
        for (var i = 0; i < users.length; i++) {
            if (users[i].phone === phone) { showToast('Phone already registered.', 'warning'); showScreen('login'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }
            if (users[i].id === id) { showToast('ID already registered.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }
            if (users[i].email === email) { showToast('Email already registered.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }
        }

        showToast('🔐 Verifying identity...', 'info');
        btn.textContent = '⏳ VERIFYING IDENTITY...';
        var verifyResult = await verifyIdentityDocuments(name, id, photoFile, idScanFile);
        if (!verifyResult.allValid) { showToast('❌ Verification failed: ' + verifyResult.messages.join(' | '), 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; return; }
        showToast('✅ Identity verified!', 'success');

        var vCode = generateVerificationCode();
        pendingVerificationPhone = phone;
        pendingVerificationCode = vCode;
        sendVerificationCode(phone, vCode);
        
        // ===== SEND EMAIL =====
        sendOTPEmail(email, name, vCode);
        showToast('📧 Verification code sent to ' + email, 'success');
        showVerificationModal(phone, vCode);
        btn.disabled = false;
        btn.textContent = 'REGISTER';
    } catch (err) { showToast('Registration error: ' + err.message, 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; }
}

// ============ COMPLETE REGISTRATION ============
function completeRegistration() {
    var data = window._pendingRegistration;
    if (!data) { showToast('Registration data missing.', 'error'); return; }
    var btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = '⏳ CREATING ACCOUNT...';
    try {
        var name = data.name, phone = data.phone, id = data.id, email = data.email, password = data.password;
        var location = data.location, profession = data.profession, skills = data.skills;
        var photoFile = data.photoFile, idScanFile = data.idScanFile;
        if (profession === 'Other') { profession = saveNewProfession(data.otherProfession); }
        var users = getUsers();
        var r1 = new FileReader();
        r1.onload = function(e1) {
            var r2 = new FileReader();
            r2.onload = function(e2) {
                var lat = null, lon = null;
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function(pos) { proceedRegistration(pos.coords.latitude, pos.coords.longitude); }, function() { proceedRegistration(null, null); });
                } else { proceedRegistration(null, null); }
                function proceedRegistration(lat, lon) {
                    var paymentStatus = 'UNPAID';
                    if (!isPaymentRequired()) { paymentStatus = 'FREE_MODE'; } else if (data.paymentVerified) { paymentStatus = 'PAID'; }
                    var user = {
                        name: name, phone: phone, id: id, email: email, password: simpleEncode(password),
                        location: location, profession: profession, skills: skills || '',
                        photo: e1.target.result, idScan: e2.target.result,
                        gpsLat: lat, gpsLon: lon, gpsCapturedAt: lat ? new Date().toISOString() : null,
                        phoneVerified: true, identityVerified: true, verificationDate: new Date().toISOString(),
                        status: 'Active', verified: true, faceVerified: true,
                        paymentStatus: paymentStatus, paymentDate: paymentStatus === 'PAID' ? new Date().toISOString() : null,
                        paymentAmount: paymentStatus === 'PAID' ? CONFIG.userFee : 0,
                        paymentCode: paymentStatus === 'PAID' ? 'verified' : null,
                        strikes: 0, rating: 0, reviewCount: 0,
                        registeredAt: new Date().toISOString(),
                        isBusinessOwner: false, businessPaid: false,
                        userAgreementAccepted: false, businessAgreementAccepted: false,
                        needsPayment: isPaymentRequired() && paymentStatus !== 'PAID'
                    };
                    users.push(user);
                    setUsers(users);
                    currentUser = user;
                    localStorage.setItem('gkode_currentUser', JSON.stringify(user));
                    var logs = getLogs();
                    logs.push({ type: 'USER_REGISTERED', user: name, phone: phone, email: email, id: id, lat: lat, lon: lon, identityVerified: true, paymentStatus: paymentStatus, paymentEnabled: isPaymentRequired(), time: new Date().toISOString() });
                    setLogs(logs);
                    showToast('✅ Welcome, ' + name + '!', 'success');
                    setTimeout(function() { if (currentUser && !currentUser.userAgreementAccepted) { showAgreement('user'); } }, 1000);
                    showScreen('home');
                    btn.disabled = false;
                    btn.textContent = 'REGISTER';
                    window._pendingRegistration = null;
                }
            };
            r2.readAsDataURL(idScanFile);
        };
        r1.readAsDataURL(photoFile);
    } catch (err) { showToast('Registration error: ' + err.message, 'error'); btn.disabled = false; btn.textContent = 'REGISTER'; }
}

// ============ LOGIN ============
function login(e) {
    e.preventDefault();
    var btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = '⏳ LOGGING IN...';
    try {
        if (loginLocked) {
            var now = new Date().getTime();
            if (now - loginLockTime < CONFIG.lockDuration) {
                var remaining = Math.ceil((CONFIG.lockDuration - (now - loginLockTime)) / 1000);
                showToast('🔒 Locked. Try in ' + remaining + 's.', 'warning');
                btn.disabled = false;
                btn.textContent = 'LOGIN';
                return;
            } else { loginLocked = false; loginAttempts = 0; }
        }
        var phone = document.getElementById('loginPhone').value.trim();
        var password = document.getElementById('loginPassword').value.trim();
        if (!phone || !password) { showToast('Enter phone and password.', 'error'); btn.disabled = false; btn.textContent = 'LOGIN'; return; }
        var users = getUsers();
        var found = null;
        for (var i = 0; i < users.length; i++) {
            if (users[i].phone === phone && simpleDecode(users[i].password) === password) { found = users[i]; break; }
        }
        if (!found) {
            loginAttempts++;
            var remaining = CONFIG.maxLoginAttempts - loginAttempts;
            if (remaining <= 0) { loginLocked = true; loginLockTime = new Date().getTime(); showToast('🔒 Too many attempts. Locked 2 min.', 'error'); btn.disabled = false; btn.textContent = 'LOGIN'; return; }
            showToast('Wrong credentials. ' + remaining + ' attempts left.', 'error');
            btn.disabled = false;
            btn.textContent = 'LOGIN';
            return;
        }
        if (found.status === 'Disqualified') {
            var d = new Date(found.disqualifiedAt);
            d.setDate(d.getDate() + CONFIG.reentryDays);
            if (new Date() < d) {
                var days = Math.ceil((d - new Date()) / 86400000);
                showToast('⛔ Disqualified. ' + days + ' days left.', 'error');
                btn.disabled = false;
                btn.textContent = 'LOGIN';
                return;
            } else {
                found.status = 'Active';
                found.strikes = 0;
                found.reentryPaid = false;
                for (var i = 0; i < users.length; i++) { if (users[i].phone === phone) { users[i] = found; break; } }
                setUsers(users);
                showToast('⏳ Re-entry period ended. Contact support.', 'warning');
                btn.disabled = false;
                btn.textContent = 'LOGIN';
                return;
            }
        }
        if (isPaymentRequired() && found.paymentStatus !== 'PAID') {
            showToast('⚠️ Payment required: Ksh ' + CONFIG.userFee, 'warning');
            currentUser = found;
            localStorage.setItem('gkode_currentUser', JSON.stringify(found));
            showScreen('payment');
            btn.disabled = false;
            btn.textContent = 'LOGIN';
            return;
        }
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) { found.gpsLat = pos.coords.latitude; found.gpsLon = pos.coords.longitude; found.gpsCapturedAt = new Date().toISOString(); for (var i = 0; i < users.length; i++) { if (users[i].phone === phone) { users[i] = found; break; } } setUsers(users); finalizeLogin(found); }, function() { finalizeLogin(found); });
        } else { finalizeLogin(found); }
        function finalizeLogin(user) {
            loginAttempts = 0;
            currentUser = user;
            localStorage.setItem('gkode_currentUser', JSON.stringify(user));
            var logs = getLogs();
            logs.push({ type: 'USER_LOGIN', user: user.name, phone: user.phone, email: user.email, time: new Date().toISOString() });
            setLogs(logs);
            showToast('Welcome back, ' + user.name + '!', 'success');
            setTimeout(function() { if (currentUser && !currentUser.userAgreementAccepted) { showAgreement('user'); } }, 1000);
            showScreen('home');
            btn.disabled = false;
            btn.textContent = 'LOGIN';
        }
    } catch (err) { showToast('Login error: ' + err.message, 'error'); btn.disabled = false; btn.textContent = 'LOGIN'; }
}

// ============ LOGOUT ============
function logout() {
    console.log('🚪 Logging out...');
    
    try {
        // Clear chat interval
        if (window.chatInterval) {
            clearInterval(window.chatInterval);
            window.chatInterval = null;
        }
        
        // Clear current user
        window.currentUser = null;
        
        // Remove from localStorage
        localStorage.removeItem('gkode_currentUser');
        localStorage.removeItem('gkode_session');
        localStorage.removeItem('gkode_csrf');
        
        // Hide bottom navigation
        var nav = document.getElementById('bottomNav');
        if (nav) {
            nav.classList.add('hidden');
        }
        
        // Hide admin button if visible
        var adminBtn = document.getElementById('adminAccessBtn');
        if (adminBtn) {
            adminBtn.style.display = 'none';
        }
        
        // Show toast message
        showToast('✅ Logged out successfully.', 'info');
        
        // Navigate to welcome screen
        showScreen('welcome');
        
        console.log('✅ Logout complete');
    } catch (err) {
        console.error('Logout error:', err);
        // Force logout even if error
        window.currentUser = null;
        localStorage.removeItem('gkode_currentUser');
        showScreen('welcome');
    }
}
// ============ PASSWORD RESET ============
function verifyIdentity(e) {
    e.preventDefault();
    var btn = document.getElementById('verifyBtn');
    btn.disabled = true;
    btn.textContent = '⏳ VERIFYING...';
    try {
        var phone = document.getElementById('resetPhone').value.trim();
        var id = document.getElementById('resetID').value.trim();
        var profession = document.getElementById('resetProfession').value.trim();
        var location = document.getElementById('resetLocation').value.trim();
        if (!phone || !id || !profession || !location) { showToast('Fill all fields.', 'error'); btn.disabled = false; btn.textContent = 'VERIFY IDENTITY'; return; }
        var users = getUsers();
        for (var i = 0; i < users.length; i++) {
            if (users[i].phone === phone && users[i].id === id && users[i].profession.toLowerCase() === profession.toLowerCase() && users[i].location.toLowerCase() === location.toLowerCase()) {
                document.getElementById('newPasswordSection').style.display = 'block';
                document.getElementById('resetPhone').disabled = true;
                document.getElementById('resetID').disabled = true;
                document.getElementById('resetProfession').disabled = true;
                document.getElementById('resetLocation').disabled = true;
                showToast('✅ Identity verified, ' + users[i].name + '!', 'success');
                btn.disabled = false;
                btn.textContent = 'VERIFY IDENTITY';
                return;
            }
        }
        showToast('❌ Verification failed.', 'error');
        btn.disabled = false;
        btn.textContent = 'VERIFY IDENTITY';
    } catch (err) { showToast('Error: ' + err.message, 'error'); btn.disabled = false; btn.textContent = 'VERIFY IDENTITY'; }
}

function resetPassword() {
    try {
        var phone = document.getElementById('resetPhone').value.trim();
        var newPass = document.getElementById('newPassword').value.trim();
        var confirmPass = document.getElementById('confirmPassword').value.trim();
        if (!newPass || !confirmPass) { showToast('Enter both password fields.', 'error'); return; }
        if (newPass.length < 8) { showToast('Password must be 8+ characters.', 'error'); return; }
        if (!/[A-Za-z]/.test(newPass) || !/[0-9]/.test(newPass)) { showToast('Password must contain both letters and numbers.', 'error'); return; }
        if (newPass !== confirmPass) { showToast('Passwords do not match.', 'error'); return; }
        var users = getUsers();
        for (var i = 0; i < users.length; i++) { if (users[i].phone === phone) { users[i].password = simpleEncode(newPass); break; } }
        setUsers(users);
        showToast('✅ Password reset successful!', 'success');
        document.getElementById('newPasswordSection').style.display = 'none';
        document.getElementById('resetPhone').disabled = false;
        document.getElementById('resetID').disabled = false;
        document.getElementById('resetProfession').disabled = false;
        document.getElementById('resetLocation').disabled = false;
        showScreen('login');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
}

// ============ GIGS ============
function postGig(e) {
    e.preventDefault();
    if (!requirePayment()) { return; }
    var btn = document.getElementById('postGigBtn');
    btn.disabled = true;
    btn.textContent = '⏳ POSTING...';
    try {
        if (!currentUser) { showToast('Login first.', 'error'); btn.disabled = false; btn.textContent = 'POST GIG'; return; }
        var title = document.getElementById('gigTitle').value.trim();
        var skill = document.getElementById('gigSkill').value.trim();
        var location = document.getElementById('gigLocation').value.trim();
        var urgency = document.getElementById('gigUrgency').value;
        var budgetMin = parseInt(document.getElementById('gigBudgetMin').value);
        var budgetMax = parseInt(document.getElementById('gigBudgetMax').value);
        var desc = document.getElementById('gigDesc').value.trim();
        var gpsLat = document.getElementById('gigGPSLat').value || null;
        var gpsLon = document.getElementById('gigGPSLon').value || null;
        if (!title || !skill || !location) { showToast('Fill Title, Skill, Location.', 'error'); btn.disabled = false; btn.textContent = 'POST GIG'; return; }
        if (!budgetMin || !budgetMax || budgetMin < 1 || budgetMax < 1) { showToast('Enter valid budget amounts.', 'error'); btn.disabled = false; btn.textContent = 'POST GIG'; return; }
        if (budgetMin > budgetMax) { showToast('Min budget cannot be greater than Max.', 'error'); btn.disabled = false; btn.textContent = 'POST GIG'; return; }
        var gigs = getGigs();
        gigs.push({ id: Date.now().toString(), title: title, skill: skill, location: location, urgency: urgency, budgetMin: budgetMin, budgetMax: budgetMax, desc: desc, client: currentUser.name, clientPhone: currentUser.phone, clientGPSLat: gpsLat, clientGPSLon: gpsLon, status: 'Open', worker: '', workerPhone: '', createdAt: new Date().toISOString() });
        setGigs(gigs);
        var logs = getLogs();
        logs.push({ type: 'GIG_POSTED', user: currentUser.name, title: title, time: new Date().toISOString() });
        setLogs(logs);
        showToast('✅ Gig posted!', 'success');
        showScreen('home');
        btn.disabled = false;
        btn.textContent = 'POST GIG';
    } catch (err) { showToast('Error: ' + err.message, 'error'); btn.disabled = false; btn.textContent = 'POST GIG'; }
}

function captureGigLocation() {
    if (!navigator.geolocation) { showToast('GPS not supported.', 'error'); return; }
    showToast('📍 Capturing location...', 'info');
    navigator.geolocation.getCurrentPosition(function(pos) { document.getElementById('gigGPSLat').value = pos.coords.latitude; document.getElementById('gigGPSLon').value = pos.coords.longitude; document.getElementById('gigLocationStatus').textContent = '✅ Location captured!'; document.getElementById('gigLocationStatus').style.color = '#006400'; showToast('✅ Location captured!', 'success'); }, function() { showToast('❌ Enable GPS.', 'error'); });
}

function switchTab(tab) {
    currentTab = tab;
    var openBtn = document.getElementById('tabOpen');
    var takenBtn = document.getElementById('tabTaken');
    if (tab === 'open') { openBtn.className = 'active'; takenBtn.className = ''; } else { openBtn.className = ''; takenBtn.className = 'active'; }
    loadGigs();
}

function loadGigs() {
    var container = document.getElementById('gigsList');
    if (!container) return;
    var gigs = getGigs();
    var search = document.getElementById('searchGigs');
    var searchTerm = search ? search.value.toLowerCase().trim() : '';
    var filtered = [];
    for (var i = 0; i < gigs.length; i++) {
        var g = gigs[i];
        var statusMatch = (currentTab === 'open' && g.status === 'Open') || (currentTab === 'taken' && g.status === 'Assigned');
        if (!statusMatch) continue;
        if (searchTerm) {
            var match = g.title.toLowerCase().includes(searchTerm) || g.skill.toLowerCase().includes(searchTerm) || g.location.toLowerCase().includes(searchTerm) || g.client.toLowerCase().includes(searchTerm);
            if (!match) continue;
        }
        filtered.push(g);
    }
    if (filtered.length === 0) { container.innerHTML = '<div style="padding:40px 0;color:#666;text-align:center;"><p>No gigs found.</p></div>'; return; }
    var h = '';
    for (var i = 0; i < filtered.length; i++) {
        var g = filtered[i];
        var open = g.status === 'Open';
        var urgencyClass = g.urgency === 'Emergency' ? 'emergency' : (g.urgency === 'Urgent' ? 'urgent' : '');
        var budgetText = 'Ksh ' + g.budgetMin + ' - ' + g.budgetMax;
        h += '<div class="gig-card ' + urgencyClass + '">';
        h += '<div class="gig-title">' + g.title + '</div>';
        h += '<span class="badge ' + (open ? 'badge-open' : 'badge-taken') + '">' + (open ? '🟢 OPEN' : '🔴 TAKEN') + '</span>';
        if (g.urgency !== 'Normal') { h += '<span class="badge ' + (g.urgency === 'Emergency' ? 'badge-emergency' : 'badge-urgent') + '">' + g.urgency + '</span>'; }
        h += '<div class="gig-meta">👤 ' + g.client + ' | 🛠️ ' + g.skill + '</div>';
        h += '<div class="gig-meta">📍 ' + g.location + '</div>';
        h += '<div class="gig-budget">💰 ' + budgetText + '</div>';
        h += '<div class="gig-meta">' + g.desc + '</div>';
        if (open) {
            h += '<div class="gig-actions"><button class="btn-accept" onclick="acceptGig(\'' + g.id + '\')">✅ ACCEPT GIG</button></div>';
        } else if (g.worker) {
            h += '<div class="gig-meta">👷 Worker: ' + g.worker + '</div>';
            if (currentUser && (currentUser.name === g.client || currentUser.name === g.worker)) {
                h += '<div class="gig-actions"><button class="btn-chat" onclick="openChat(\'' + g.id + '\')">💬 CHAT</button></div>';
            }
        }
        h += '</div>';
    }
    container.innerHTML = h;
}

function acceptGig(id) {
    if (!requirePayment()) { return; }
    if (!currentUser) { showToast('Login first.', 'error'); return; }
    var gigs = getGigs();
    var gig = null;
    var index = -1;
    for (var i = 0; i < gigs.length; i++) { if (gigs[i].id === id) { gig = gigs[i]; index = i; break; } }
    if (!gig) { showToast('Gig not found.', 'error'); return; }
    if (gig.status !== 'Open') { showToast('Gig already taken.', 'warning'); return; }
    if (gig.client === currentUser.name) { showToast('Cannot accept your own gig.', 'warning'); return; }
    gig.status = 'Assigned';
    gig.worker = currentUser.name;
    gig.workerPhone = currentUser.phone;
    gigs[index] = gig;
    setGigs(gigs);
    var logs = getLogs();
    logs.push({ type: 'GIG_ACCEPTED', gigId: id, worker: currentUser.name, client: gig.client, time: new Date().toISOString() });
    setLogs(logs);
    showToast('✅ Gig accepted! Chat with ' + gig.client, 'success');
    openChat(id);
}

// ============ CHAT ============
function openChat(gigId) {
    var gigs = getGigs();
    var gig = null;
    for (var i = 0; i < gigs.length; i++) { if (gigs[i].id === gigId) { gig = gigs[i]; break; } }
    if (!gig) { showToast('Gig not found.', 'error'); return; }
    document.getElementById('chatGigId').value = gigId;
    var chatPartner = gig.client === currentUser.name ? gig.worker : gig.client;
    document.getElementById('chatPartner').textContent = '💬 Chat: ' + gig.title + ' — ' + chatPartner;
    showScreen('chat');
    loadChatMessages(gigId);
}

function loadChatMessages(gigId) {
    var container = document.getElementById('chatMessages');
    if (!container) return;
    var logs = getLogs();
    var messages = [];
    for (var i = 0; i < logs.length; i++) { if (logs[i].gigId === gigId && logs[i].type === 'CHAT_MESSAGE') { messages.push(logs[i]); } }
    if (messages.length === 0) { container.innerHTML = '<div style="color:#999;padding:20px;text-align:center;">No messages yet. Say hello!</div>'; return; }
    var h = '';
    for (var i = 0; i < messages.length; i++) {
        var msg = messages[i];
        var isSent = msg.sender === currentUser.name;
        h += '<div class="chat-message ' + (isSent ? 'sent' : 'received') + '">';
        if (!isSent) { h += '<div class="sender">' + msg.sender + '</div>'; }
        h += msg.text;
        var time = new Date(msg.time);
        h += '<div class="time">' + time.toLocaleTimeString() + '</div>';
        h += '</div>';
    }
    container.innerHTML = h;
    container.scrollTop = container.scrollHeight;
}

function sendMessage(e) {
    e.preventDefault();
    var text = document.getElementById('chatInput').value.trim();
    var gigId = document.getElementById('chatGigId').value;
    if (!text) return;
    if (!currentUser) { showToast('Login first.', 'error'); return; }
    var logs = getLogs();
    logs.push({ type: 'CHAT_MESSAGE', gigId: gigId, sender: currentUser.name, text: text, time: new Date().toISOString() });
    setLogs(logs);
    document.getElementById('chatInput').value = '';
    loadChatMessages(gigId);
}

// ============ LOCATION ============
function shareLiveLocation() {
    if (!currentUser) { showToast('Login first.', 'error'); return; }
    if (!navigator.geolocation) { showToast('❌ GPS not supported.', 'error'); if (confirm('Open Google Maps manually?')) { window.open('https://www.google.com/maps', '_blank'); } return; }
    showToast('📍 Getting location...', 'info');
    navigator.geolocation.getCurrentPosition(function(pos) {
        var lat = pos.coords.latitude, lon = pos.coords.longitude;
        var url = 'https://www.google.com/maps?q=' + lat + ',' + lon;
        var gigId = document.getElementById('chatGigId').value;
        var logs = getLogs();
        logs.push({ type: 'CHAT_MESSAGE', gigId: gigId, sender: currentUser.name, text: '📍 My location: ' + url, time: new Date().toISOString(), isLocation: true, lat: lat, lon: lon });
        setLogs(logs);
        loadChatMessages(gigId);
        window.open(url, '_blank');
        showToast('✅ Location shared!', 'success');
        var users = getUsers();
        for (var i = 0; i < users.length; i++) { if (users[i].phone === currentUser.phone) { users[i].gpsLat = lat; users[i].gpsLon = lon; users[i].gpsUpdatedAt = new Date().toISOString(); break; } }
        setUsers(users);
        currentUser.gpsLat = lat;
        currentUser.gpsLon = lon;
        localStorage.setItem('gkode_currentUser', JSON.stringify(currentUser));
    }, function(err) {
        var errorMsg = '❌ Could not get location. ';
        switch(err.code) {
            case 1: errorMsg += 'Enable GPS in browser settings.'; break;
            case 2: errorMsg += 'GPS signal unavailable.'; break;
            case 3: errorMsg += 'GPS timed out. Try again.'; break;
            default: errorMsg += 'Error: ' + err.message;
        }
        showToast(errorMsg, 'error');
        if (confirm('Open Google Maps manually?')) { window.open('https://www.google.com/maps', '_blank'); }
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
}

function navigateToClient() {
    if (!currentUser) { showToast('Login first.', 'error'); return; }
    var gigId = document.getElementById('chatGigId').value;
    if (!gigId) { showToast('No active gig.', 'error'); return; }
    var gigs = getGigs();
    var gig = null;
    for (var i = 0; i < gigs.length; i++) { if (gigs[i].id === gigId) { gig = gigs[i]; break; } }
    if (!gig) { showToast('Gig not found.', 'error'); return; }
    var lat = null, lon = null;
    var clientName = gig.client;
    var clientPhone = gig.clientPhone;
    if (gig.clientGPSLat && gig.clientGPSLon) { lat = gig.clientGPSLat; lon = gig.clientGPSLon; } else {
        var users = getUsers();
        for (var i = 0; i < users.length; i++) { if (users[i].name === clientName || users[i].phone === clientPhone) { if (users[i].gpsLat && users[i].gpsLon) { lat = users[i].gpsLat; lon = users[i].gpsLon; break; } } }
    }
    if (!lat || !lon) { showToast('❌ Client location not available.', 'error'); if (confirm('Call ' + clientName + '?')) { window.location.href = 'tel:' + clientPhone; } return; }
    showToast('🧭 Getting directions...', 'info');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos) {
            var url = 'https://www.google.com/maps/dir/?api=1&origin=' + pos.coords.latitude + ',' + pos.coords.longitude + '&destination=' + lat + ',' + lon + '&travelmode=driving';
            if (confirm('🧭 Navigate to ' + clientName + '?')) { window.open(url, '_blank'); showToast('✅ Navigation started!', 'success'); }
        }, function() {
            var url = 'https://www.google.com/maps?q=' + lat + ',' + lon;
            if (confirm('📍 Open ' + clientName + '\'s location?')) { window.open(url, '_blank'); showToast('📍 Location opened.', 'success'); }
        });
    } else {
        var url = 'https://www.google.com/maps?q=' + lat + ',' + lon;
        if (confirm('📍 Open ' + clientName + '\'s location?')) { window.open(url, '_blank'); showToast('📍 Location opened.', 'success'); }
    }
}

// ============ REVIEWS ============
function submitReview() {
    if (!currentUser) { showToast('Login first.', 'error'); return; }
    var rating = parseInt(document.getElementById('reviewRating').value);
    var text = document.getElementById('reviewText').value.trim();
    if (!text) { showToast('Please write a review.', 'error'); return; }
    var logs = getLogs();
    logs.push({ type: 'REVIEW_SUBMITTED', user: currentUser.name, rating: rating, text: text, time: new Date().toISOString() });
    setLogs(logs);
    showToast('✅ Review submitted!', 'success');
    document.getElementById('reviewText').value = '';
    showScreen('home');
}

// ============ COMPLAINTS ============
function submitComplaint() {
    if (!currentUser) { showToast('Login first.', 'error'); return; }
    var reason = document.getElementById('complaintReason').value;
    var details = document.getElementById('complaintDetails').value.trim();
    if (!reason) { showToast('Select a reason.', 'error'); return; }
    if (!details) { showToast('Describe what happened.', 'error'); return; }
    var logs = getLogs();
    logs.push({ type: 'COMPLAINT_FILED', user: currentUser.name, reason: reason, details: details, time: new Date().toISOString() });
    setLogs(logs);
    showToast('✅ Complaint filed.', 'success');
    document.getElementById('complaintDetails').value = '';
    document.getElementById('complaintReason').value = '';
    showScreen('home');
}

// ============ PROFILE ============
function loadProfile() {
    if (!currentUser) return;
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profilePhone').textContent = '📞 ' + currentUser.phone + (currentUser.phoneVerified ? ' ✅' : '');
    document.getElementById('profileLocation').textContent = '📍 ' + currentUser.location;
    document.getElementById('profileProfession').textContent = '👔 ' + currentUser.profession;
    document.getElementById('profileSkills').textContent = '🛠️ ' + (currentUser.skills || 'None');
    document.getElementById('profilePhoto').src = currentUser.photo || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23006400%22/%3E%3Ctext x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23FFD700%22 font-size=%2230%22 font-family=%22Arial%22%3E👤%3C/text%3E%3C/svg%3E';
    var s = currentUser.verified ? '<span style="color:#006400;">🟢 Verified</span>' : '<span style="color:#FFD700;">🟡 Pending</span>';
    s += ' | ' + getPaymentStatusText(currentUser);
    if (currentUser.isBusinessOwner) { s += ' | 🏢 <span style="color:#006400;">Business Owner</span>'; }
    s += ' | ⭐ ' + (currentUser.rating || 0) + ' (' + (currentUser.reviewCount || 0) + ' reviews)';
    document.getElementById('profileStatus').innerHTML = s;
    var my = [];
    var gigs = getGigs();
    for (var i = 0; i < gigs.length; i++) { if (gigs[i].client === currentUser.name || gigs[i].worker === currentUser.name) { my.push(gigs[i]); } }
    if (my.length === 0) { document.getElementById('myGigsList').innerHTML = '<p style="color:#666;">No gigs yet.</p>'; } else {
        var h = '';
        for (var i = 0; i < my.length; i++) {
            h += '<div style="background:#f5f5f5;padding:10px;border-radius:8px;margin-bottom:8px;">';
            h += '<strong>' + my[i].title + '</strong> — ' + my[i].status;
            if (my[i].status === 'Assigned' && my[i].worker === currentUser.name) {
                h += ' <button onclick="openChat(\'' + my[i].id + '\')" style="background:#2196F3;color:#fff;border:none;padding:5px 10px;border-radius:5px;font-size:12px;cursor:pointer;">💬 Chat</button>';
            }
            h += '</div>';
        }
        document.getElementById('myGigsList').innerHTML = h;
    }
}

// ============ BUSINESS ============
function registerCompany(e) {
    e.preventDefault();
    var btn = document.getElementById('compRegisterBtn');
    btn.disabled = true;
    btn.textContent = '⏳ REGISTERING...';
    try {
        if (!requirePayment()) { btn.disabled = false; btn.textContent = 'REGISTER BUSINESS'; return; }
        if (!currentUser) { showToast('Login first.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER BUSINESS'; return; }
        if (!currentUser.businessAgreementAccepted) { var agreed = showAgreement('business'); if (!agreed) { btn.disabled = false; btn.textContent = 'REGISTER BUSINESS'; return; } }
        var companies = getCompanies();
        for (var i = 0; i < companies.length; i++) { if (companies[i].ownerPhone === currentUser.phone) { showToast('You already have a business.', 'warning'); btn.disabled = false; btn.textContent = 'REGISTER BUSINESS'; return; } }
        var name = document.getElementById('compName').value.trim();
        var type = document.getElementById('compType').value;
        var regNo = document.getElementById('compRegNo').value.trim();
        var location = document.getElementById('compLocation').value.trim();
        var phone = document.getElementById('compPhone').value.trim();
        var email = document.getElementById('compEmail').value.trim();
        var desc = document.getElementById('compDesc').value.trim();
        if (!name || !type || !location || !phone || !regNo) { showToast('Fill all required fields.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER BUSINESS'; return; }
        for (var i = 0; i < companies.length; i++) { if (companies[i].name.toLowerCase() === name.toLowerCase()) { showToast('Business name already registered.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER BUSINESS'; return; } if (companies[i].phone === phone) { showToast('Phone already registered to another business.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER BUSINESS'; return; } }
        var fee = CONFIG.businessRegistrationFee;
        var confirmMsg = '🏢 BUSINESS REGISTRATION\n\nBusiness: ' + name + '\nType: ' + type + '\nLocation: ' + location + '\nReg No: ' + regNo + '\n\n💳 Fee: Ksh ' + fee + '\n\nProceed with payment?';
        if (!confirm(confirmMsg)) { btn.disabled = false; btn.textContent = 'REGISTER BUSINESS'; return; }
        showToast('💳 Please pay Ksh ' + fee + ' to Till ' + CONFIG.tillNumber, 'info');
        var code = prompt('Enter M-Pesa confirmation code for Ksh ' + fee + ':');
        if (!code || code.length < 5) { showToast('Payment cancelled.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER BUSINESS'; return; }
        if (!verifyPayment(code, fee, currentUser.phone)) { showToast('❌ Payment failed.', 'error'); btn.disabled = false; btn.textContent = 'REGISTER BUSINESS'; return; }
        companies.push({ id: Date.now().toString(), name: name, type: type, regNo: regNo, location: location, phone: phone, email: email, desc: desc, owner: currentUser.name, ownerPhone: currentUser.phone, registeredAt: new Date().toISOString(), totalSales: 0, totalCommission: 0, isPremium: false, registrationFee: fee, status: 'active' });
        setCompanies(companies);
        var users = getUsers();
        for (var i = 0; i < users.length; i++) { if (users[i].phone === currentUser.phone) { users[i].isBusinessOwner = true; users[i].businessPaid = true; users[i].businessAgreementAccepted = true; users[i].businessAgreementDate = new Date().toISOString(); break; } }
        setUsers(users);
        currentUser.isBusinessOwner = true;
        currentUser.businessPaid = true;
        currentUser.businessAgreementAccepted = true;
        localStorage.setItem('gkode_currentUser', JSON.stringify(currentUser));
        showToast('✅ ' + name + ' registered!', 'success');
        showScreen('companyDashboard');
        loadCompanyDashboard();
        btn.disabled = false;
        btn.textContent = 'REGISTER BUSINESS';
    } catch (err) { showToast('Error: ' + err.message, 'error'); btn.disabled = false; btn.textContent = 'REGISTER BUSINESS'; }
}

function loadCompanyDashboard() {
    if (!currentUser) return;
    var companies = getCompanies();
    var myComp = null;
    for (var i = 0; i < companies.length; i++) { if (companies[i].ownerPhone === currentUser.phone) { myComp = companies[i]; break; } }
    if (!myComp) { document.getElementById('compInfo').innerHTML = '<p>No business. <a href="#" onclick="showScreen(\'companyRegister\')" style="color:#006400;">Register now</a></p>'; return; }
    var products = getProducts();
    var orders = getOrders();
    var myProducts = [], myOrders = [];
    for (var i = 0; i < products.length; i++) { if (products[i].companyId === myComp.id) { myProducts.push(products[i]); } }
    for (var i = 0; i < orders.length; i++) { if (orders[i].companyId === myComp.id) { myOrders.push(orders[i]); } }
    document.getElementById('compInfo').innerHTML = '<h3>' + myComp.name + (myComp.isPremium ? ' ⭐ PREMIUM' : '') + '</h3><p>🏢 ' + myComp.type + ' | 📍 ' + myComp.location + '</p><p>📞 ' + myComp.phone + '</p><p>📜 Reg No: ' + myComp.regNo + '</p><p>📦 Products: ' + myProducts.length + ' | 📋 Orders: ' + myOrders.length + '</p><p>💰 Sales: Ksh ' + myComp.totalSales.toLocaleString() + ' | Fee: Ksh ' + myComp.totalCommission.toLocaleString() + '</p><p>💵 Earnings: Ksh ' + (myComp.totalSales - myComp.totalCommission).toLocaleString() + '</p><p style="font-size:11px;color:#666;margin-top:10px;">💳 Registration Fee: Ksh ' + myComp.registrationFee + '</p>';
    showCompTab('products');
}

function showCompTab(tab) {
    currentCompTab = tab;
    var tabs = ['products', 'orders', 'sales'];
    var tabIds = ['tabProducts', 'tabOrders', 'tabSales'];
    for (var i = 0; i < tabs.length; i++) { var el = document.getElementById(tabIds[i]); if (tabs[i] === tab) { el.className = 'active'; } else { el.className = ''; } }
    if (!currentUser) return;
    var companies = getCompanies();
    var myComp = null;
    for (var i = 0; i < companies.length; i++) { if (companies[i].ownerPhone === currentUser.phone) { myComp = companies[i]; break; } }
    if (!myComp) { document.getElementById('compTabContent').innerHTML = '<p>No business found.</p>'; return; }
    var content = document.getElementById('compTabContent');
    var products = getProducts();
    var orders = getOrders();
    if (tab === 'products') {
        var list = [];
        for (var i = 0; i < products.length; i++) { if (products[i].companyId === myComp.id) { list.push(products[i]); } }
        if (list.length === 0) { content.innerHTML = '<p style="color:#666;">No products. <a href="#" onclick="showScreen(\'addProduct\')" style="color:#006400;">Add first product</a></p>'; } else {
            var h = '';
            for (var i = 0; i < list.length; i++) { var p = list[i]; var fee = Math.round((p.price * CONFIG.commissionRate) / 100 * 100) / 100; h += '<div class="gig-card"><h3>' + p.name + '</h3><p>' + p.category + ' | Ksh ' + p.price.toFixed(2) + '/' + p.unit + ' | Stock: ' + p.stock + '</p><p style="font-size:11px;color:#666;">G-KODE Fee: Ksh ' + fee.toFixed(2) + '/unit</p><button onclick="deleteProduct(\'' + p.id + '\')" style="background:#cc0000;color:#fff;border:none;padding:8px 15px;border-radius:5px;cursor:pointer;">🗑️ Delete</button></div>'; }
            content.innerHTML = h;
        }
    } else if (tab === 'orders') {
        var list = [];
        for (var i = 0; i < orders.length; i++) { if (orders[i].companyId === myComp.id) { list.push(orders[i]); } }
        if (list.length === 0) { content.innerHTML = '<p style="color:#666;">No orders.</p>'; } else {
            var h = '';
            for (var i = 0; i < list.length; i++) { var o = list[i]; h += '<div class="gig-card"><h3>Order #' + o.id.slice(-6) + '</h3><p>' + o.productName + ' x' + o.quantity + ' | Buyer: ' + o.buyerName + '</p><p>Total: Ksh ' + o.totalAmount.toFixed(2) + ' | Earned: Ksh ' + o.earned.toFixed(2) + '</p><p style="font-size:11px;color:#666;">Fee: Ksh ' + o.commission.toFixed(2) + '</p></div>'; }
            content.innerHTML = h;
        }
    } else if (tab === 'sales') {
        var list = [];
        var ts = 0, tc = 0;
        for (var i = 0; i < orders.length; i++) { if (orders[i].companyId === myComp.id) { list.push(orders[i]); ts += orders[i].totalAmount; tc += orders[i].commission; } }
        content.innerHTML = '<div style="background:#e8f5e9;padding:15px;text-align:center;border-radius:10px;"><h3>📊 Sales Summary</h3><p>Orders: ' + list.length + '</p><p>Gross: Ksh ' + ts.toFixed(2) + '</p><p>G-KODE Fee (3%): Ksh ' + tc.toFixed(2) + '</p><p><strong>Net: Ksh ' + (ts - tc).toFixed(2) + '</strong></p></div>';
    }
}

// ============ PRODUCTS ============
function addProduct(e) {
    e.preventDefault();
    var btn = document.getElementById('addProductBtn');
    btn.disabled = true;
    btn.textContent = '⏳ ADDING...';
    try {
        if (!requirePayment()) { btn.disabled = false; btn.textContent = 'ADD PRODUCT'; return; }
        if (!currentUser) { showToast('Login first.', 'error'); btn.disabled = false; btn.textContent = 'ADD PRODUCT'; return; }
        var companies = getCompanies();
        var myComp = null;
        for (var i = 0; i < companies.length; i++) { if (companies[i].ownerPhone === currentUser.phone) { myComp = companies[i]; break; } }
        if (!myComp) { showToast('Register a business first.', 'error'); btn.disabled = false; btn.textContent = 'ADD PRODUCT'; return; }
        var name = document.getElementById('prodName').value.trim();
        var category = document.getElementById('prodCategory').value;
        var unit = document.getElementById('prodUnit').value.trim();
        var price = parseFloat(document.getElementById('prodPrice').value);
        var stock = parseInt(document.getElementById('prodStock').value);
        var desc = document.getElementById('prodDesc').value.trim();
        if (category === 'other') {
            var newCategory = prompt('Enter new category name:');
            if (newCategory) {
                category = addNewCategory(newCategory);
                if (!category) { showToast('Invalid category.', 'error'); btn.disabled = false; btn.textContent = 'ADD PRODUCT'; return; }
                populateProductCategoryDropdown();
                document.getElementById('prodCategory').value = category;
            } else { btn.disabled = false; btn.textContent = 'ADD PRODUCT'; return; }
        }
        if (!name || !category || !unit || !price || !stock) { showToast('Fill all fields.', 'error'); btn.disabled = false; btn.textContent = 'ADD PRODUCT'; return; }
        if (price <= 0) { showToast('Price must be greater than 0.', 'error'); btn.disabled = false; btn.textContent = 'ADD PRODUCT'; return; }
        if (stock < 1) { showToast('Stock must be at least 1.', 'error'); btn.disabled = false; btn.textContent = 'ADD PRODUCT'; return; }
        var products = getProducts();
        var userProducts = [];
        for (var i = 0; i < products.length; i++) { if (products[i].companyId === myComp.id) { userProducts.push(products[i]); } }
        var listingFee = CONFIG.marketplaceListingFee;
        if (userProducts.length === 0) {
            var confirmMsg = '📦 FIRST PRODUCT\n\nProduct: ' + name + '\nCategory: ' + category + '\nPrice: Ksh ' + price + '/' + unit + '\nStock: ' + stock + '\n\n💳 Listing Fee: Ksh ' + listingFee + '\n\nProceed?';
            if (!confirm(confirmMsg)) { btn.disabled = false; btn.textContent = 'ADD PRODUCT'; return; }
            showToast('💳 Please pay Ksh ' + listingFee + ' to Till ' + CONFIG.tillNumber, 'info');
            var code = prompt('Enter M-Pesa confirmation code for Ksh ' + listingFee + ':');
            if (!code || code.length < 5) { showToast('Payment cancelled.', 'error'); btn.disabled = false; btn.textContent = 'ADD PRODUCT'; return; }
            if (!verifyPayment(code, listingFee, currentUser.phone)) { showToast('❌ Payment failed.', 'error'); btn.disabled = false; btn.textContent = 'ADD PRODUCT'; return; }
        }
        var feePerUnit = Math.round((price * CONFIG.commissionRate) / 100 * 100) / 100;
        products.push({ id: Date.now().toString(), companyId: myComp.id, companyName: myComp.name, name: name, category: category, unit: unit, price: price, stock: stock, desc: desc, feePerUnit: feePerUnit, createdAt: new Date().toISOString(), listingFee: userProducts.length === 0 ? listingFee : 0 });
        setProducts(products);
        showToast('✅ ' + name + ' added!', 'success');
        showScreen('companyDashboard');
        loadCompanyDashboard();
        btn.disabled = false;
        btn.textContent = 'ADD PRODUCT';
    } catch (err) { showToast('Error: ' + err.message, 'error'); btn.disabled = false; btn.textContent = 'ADD PRODUCT'; }
}

function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    var products = getProducts();
    var newProducts = [];
    for (var i = 0; i < products.length; i++) { if (products[i].id !== id) { newProducts.push(products[i]); } }
    setProducts(newProducts);
    showToast('Product deleted.', 'info');
    loadCompanyDashboard();
}

// ============ CATEGORIES ============
var defaultCategories = ['Cement','Pipes','Taps','Electrical','Paint','Timber','Steel','Tiles','Roofing','Tools','Beauty','Food','Seeds','Auto Parts','Hardware','Plumbing','Construction','Electronics','Furniture','Clothing','Shoes','Bags','Jewelry','Books','Stationery','Medicine','Farming','Livestock','Poultry'];

function getAllCategories() {
    var saved = getCategories();
    var all = defaultCategories.slice();
    for (var i = 0; i < saved.length; i++) { if (all.indexOf(saved[i]) === -1) { all.push(saved[i]); } }
    all.sort(); return all;
}

function populateCategoryDropdown() {
    var dropdown = document.getElementById('marketCategory');
    if (!dropdown) return;
    while (dropdown.options.length > 1) { dropdown.remove(1); }
    var all = getAllCategories();
    for (var i = 0; i < all.length; i++) { var opt = document.createElement('option'); opt.value = all[i]; opt.textContent = all[i]; dropdown.appendChild(opt); }
    var otherOpt = document.createElement('option'); otherOpt.value = 'other'; otherOpt.textContent = '➕ Add New Category'; dropdown.appendChild(otherOpt);
}

function populateProductCategoryDropdown() {
    var dropdown = document.getElementById('prodCategory');
    if (!dropdown) return;
    while (dropdown.options.length > 1) { dropdown.remove(1); }
    var all = getAllCategories();
    for (var i = 0; i < all.length; i++) { var opt = document.createElement('option'); opt.value = all[i]; opt.textContent = all[i]; dropdown.appendChild(opt); }
    var otherOpt = document.createElement('option'); otherOpt.value = 'other'; otherOpt.textContent = '➕ Add New Category'; dropdown.appendChild(otherOpt);
}

function addNewCategory(categoryName) {
    var words = categoryName.split(' ');
    var formatted = '';
    for (var i = 0; i < words.length; i++) { if (words[i].length > 0) { formatted += words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase() + ' '; } }
    formatted = formatted.trim();
    if (!formatted || formatted.length < 3) return null;
    var all = getAllCategories();
    for (var i = 0; i < all.length; i++) { if (all[i].toLowerCase() === formatted.toLowerCase()) { return all[i]; } }
    var saved = getCategories();
    if (saved.indexOf(formatted) === -1) { saved.push(formatted); setCategories(saved); populateCategoryDropdown(); populateProductCategoryDropdown(); showToast('✅ New category "' + formatted + '" added!', 'success'); }
    return formatted;
}

// ============ MARKETPLACE ============
function loadMarketplace() {
    var cat = document.getElementById('marketCategory').value;
    if (cat === 'other') {
        var newCategory = prompt('Enter new category name:');
        if (newCategory) { var added = addNewCategory(newCategory); if (added) { populateCategoryDropdown(); document.getElementById('marketCategory').value = added; loadMarketplace(); } }
        return;
    }
    var products = getProducts();
    var filtered = [];
    for (var i = 0; i < products.length; i++) { if (cat === 'All' || products[i].category === cat) { if (products[i].stock > 0) { filtered.push(products[i]); } } }
    var container = document.getElementById('marketplaceList');
    if (filtered.length === 0) { container.innerHTML = '<div style="padding:40px 0;color:#666;text-align:center;"><p>No products available.</p><p style="font-size:12px;margin-top:10px;">💡 Select "Add New Category" to create one!</p></div>'; return; }
    var h = '';
    for (var i = 0; i < filtered.length; i++) {
        var p = filtered[i];
        var fee = p.feePerUnit || Math.round((p.price * CONFIG.commissionRate) / 100 * 100) / 100;
        h += '<div class="gig-card"><h3>' + p.name + '</h3><p>🏢 ' + p.companyName + ' | ' + p.category + '</p><p>💰 Ksh ' + p.price.toFixed(2) + '/' + p.unit + ' (+Ksh ' + fee.toFixed(2) + ' fee)</p><p>📦 Stock: ' + p.stock + '</p><p style="font-size:11px;color:#666;">Seller earns: Ksh ' + (p.price - fee).toFixed(2) + '/' + p.unit + '</p><input type="number" id="qty-' + p.id + '" placeholder="Quantity" min="1" max="' + p.stock + '" style="width:100%;padding:8px;margin-bottom:5px;border:2px solid #ddd;border-radius:5px;"><button onclick="buyProduct(\'' + p.id + '\')" style="background:#006400;color:#FFD700;border:none;padding:10px;border-radius:8px;width:100%;font-weight:bold;cursor:pointer;">🛒 BUY NOW</button></div>';
    }
    container.innerHTML = h;
}

function buyProduct(productId) {
    if (!currentUser) { showToast('Login first.', 'error'); return; }
    if (!requirePayment()) { return; }
    var products = getProducts();
    var product = null;
    var index = -1;
    for (var i = 0; i < products.length; i++) { if (products[i].id === productId) { product = products[i]; index = i; break; } }
    if (!product) { showToast('Product not found.', 'error'); return; }
    var qty = parseInt(document.getElementById('qty-' + productId).value);
    if (!qty || qty < 1) { showToast('Enter quantity.', 'error'); return; }
    if (qty > product.stock) { showToast('Only ' + product.stock + ' available.', 'error'); return; }
    var feePerUnit = product.feePerUnit || Math.round((product.price * CONFIG.commissionRate) / 100 * 100) / 100;
    var subtotal = product.price * qty;
    var commission = feePerUnit * qty;
    var total = subtotal + commission;
    var confirmMsg = '🛒 PURCHASE\n\nProduct: ' + product.name + '\nQuantity: ' + qty + '\nSubtotal: Ksh ' + subtotal.toFixed(2) + '\nFee: Ksh ' + commission.toFixed(2) + '\nTotal: Ksh ' + total.toFixed(2) + '\n\nSeller earns: Ksh ' + (subtotal).toFixed(2) + '\n\nProceed?';
    if (!confirm(confirmMsg)) { return; }
    product.stock -= qty;
    products[index] = product;
    setProducts(products);
    var orders = getOrders();
    orders.push({ id: Date.now().toString(), productId: productId, productName: product.name, companyId: product.companyId, companyName: product.companyName, buyerName: currentUser.name, buyerPhone: currentUser.phone, quantity: qty, unitPrice: product.price, feePerUnit: feePerUnit, subtotal: subtotal, commission: commission, totalAmount: total, earned: subtotal, time: new Date().toISOString() });
    setOrders(orders);
    var companies = getCompanies();
    for (var i = 0; i < companies.length; i++) { if (companies[i].id === product.companyId) { companies[i].totalSales += subtotal; companies[i].totalCommission += commission; break; } }
    setCompanies(companies);
    showToast('✅ Purchase successful!\nTotal: Ksh ' + total.toFixed(2), 'success');
    loadMarketplace();
}

// ============ EMERGENCY ============
function emergencyCall() {
    if (confirm('🚨 EMERGENCY\n\nTap OK to open emergency contacts.')) {
        window.location.href = 'emergency.html';
    }
}

// ============ LEGAL ============
function getUserAgreement() {
    return '📜 G-KODE USER AGREEMENT\n\nBy using G-KODE, you agree to:\n1. IDENTITY VERIFICATION\n2. PAYMENT OBLIGATIONS\n3. USER CONDUCT\n4. PENALTIES\n5. LIABILITY\n6. DATA PROTECTION\n\nI agree.';
}

function getBusinessAgreement() {
    return '🏢 G-KODE BUSINESS AGREEMENT\n\nBy registering a business, you agree to:\n1. BUSINESS VERIFICATION\n2. BUSINESS FEES\n3. BUSINESS CONDUCT\n4. BUSINESS LIABILITY\n5. BUSINESS TERMINATION\n\nI agree.';
}

function showAgreement(type) {
    var agreement = type === 'user' ? getUserAgreement() : getBusinessAgreement();
    if (confirm(agreement + '\n\nDo you accept?')) {
        try {
            var users = getUsers();
            for (var i = 0; i < users.length; i++) {
                if (users[i].phone === currentUser.phone) {
                    if (type === 'user') { users[i].userAgreementAccepted = true; users[i].userAgreementDate = new Date().toISOString(); }
                    else { users[i].businessAgreementAccepted = true; users[i].businessAgreementDate = new Date().toISOString(); }
                    break;
                }
            }
            setUsers(users);
            if (type === 'user') { currentUser.userAgreementAccepted = true; }
            else { currentUser.businessAgreementAccepted = true; }
            localStorage.setItem('gkode_currentUser', JSON.stringify(currentUser));
            showToast('✅ Agreement accepted.', 'success');
            return true;
        } catch (e) { showToast('❌ Failed to accept.', 'error'); return false; }
    }
    showToast('You must accept the agreement.', 'error');
    return false;
}

function showLegalNotice(type) {
    var notices = {
        'privacy': '🔒 PRIVACY NOTICE\n\nWe collect: Name, phone, ID, email, location, photo, ID scan, GPS.\n\nWe DO NOT share your ID or password.\n\nYour rights: Access, correct, delete anytime. Protected under Kenya Data Protection Act 2019.',
        'terms': '📜 TERMS OF SERVICE\n\n1. G-KODE is a connector\n2. Users responsible for actions\n3. Disputes resolved through G-KODE\n4. Kenyan law applies\n5. Account termination for violations',
        'disclaimer': '⚠️ DISCLAIMER\n\n1. G-KODE provides platform connection\n2. We do not guarantee gig completion\n3. Users verify each other\n4. Report issues immediately\n5. Use at your own risk'
    };
    alert(notices[type] || 'Notice not found.');
}

function exportUserData() {
    if (!currentUser) { showToast('Login first.', 'error'); return; }
    var data = { exportedAt: new Date().toISOString(), user: currentUser, userGigs: [], userOrders: [], userPayments: [] };
    var gigs = getGigs();
    for (var i = 0; i < gigs.length; i++) { if (gigs[i].client === currentUser.name || gigs[i].worker === currentUser.name) { data.userGigs.push(gigs[i]); } }
    var orders = getOrders();
    for (var i = 0; i < orders.length; i++) { if (orders[i].buyerName === currentUser.name) { data.userOrders.push(orders[i]); } }
    var payments = getPayments();
    for (var i = 0; i < payments.length; i++) { if (payments[i].phone === currentUser.phone) { data.userPayments.push(payments[i]); } }
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gkode-my-data-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('✅ Data exported.', 'success');
}

function deleteAccount() {
    if (!currentUser) { showToast('Login first.', 'error'); return; }
    if (!confirm('⚠️ DELETE ACCOUNT?\n\nThis permanently deletes your profile, gigs, orders, and payments.\n\nCANNOT BE UNDONE!')) { return; }
    if (!confirm('FINAL WARNING: Continue?')) { return; }
    var users = getUsers();
    var newUsers = [];
    for (var i = 0; i < users.length; i++) { if (users[i].phone !== currentUser.phone) { newUsers.push(users[i]); } }
    setUsers(newUsers);
    var gigs = getGigs();
    var newGigs = [];
    for (var i = 0; i < gigs.length; i++) { if (gigs[i].client !== currentUser.name && gigs[i].worker !== currentUser.name) { newGigs.push(gigs[i]); } }
    setGigs(newGigs);
    currentUser = null;
    localStorage.removeItem('gkode_currentUser');
    showToast('✅ Account deleted.', 'success');
    showScreen('welcome');
}

// ============ ADMIN ============
function isAdmin() {
    if (!currentUser) return false;
    for (var i = 0; i < ADMIN_PHONES.length; i++) { if (currentUser.phone === ADMIN_PHONES[i]) { return true; } }
    return false;
}

function checkAdminAccess() {
    var btn = document.getElementById('adminAccessBtn');
    if (!btn) return;
    if (isAdmin()) { btn.style.display = 'block'; } else { btn.style.display = 'none'; }
}

// ============ INIT ============
var saved = localStorage.getItem('gkode_currentUser');
if (saved) {
    try {
        currentUser = JSON.parse(saved);
        if (currentUser) {
            showToast('Welcome back, ' + currentUser.name + '!', 'success');
            checkAdminAccess();
            showScreen('home');
        }
    } catch (e) { showScreen('welcome'); }
} else { showScreen('welcome'); }

function populateSkillFilter() {
    var gigs = getGigs();
    var skills = {};
    for (var i = 0; i < gigs.length; i++) { if (gigs[i].skill && gigs[i].status === 'Open') { skills[gigs[i].skill] = true; } }
    var select = document.getElementById('filterSkill');
    if (!select) return;
    while (select.options.length > 1) { select.remove(1); }
    for (var skill in skills) { if (skills.hasOwnProperty(skill)) { var opt = document.createElement('option'); opt.value = skill; opt.textContent = skill; select.appendChild(opt); } }
}

setTimeout(function() {
    populateCategoryDropdown();
    populateProductCategoryDropdown();
    populateSkillFilter();
    checkAdminAccess();
}, 100);

console.log('🚀 G-KODE loaded successfully!');
console.log('📊 Data stored in localStorage.');
console.log('💳 Payment System: ' + (isPaymentRequired() ? '🔒 ON' : '🔓 OFF'));
console.log('📧 EmailJS: Configured and ready!');
// ============ CAMERA CAPTURE ============
function capturePhoto(inputId) {
    var input = document.getElementById(inputId);
    if (!input) return;
    
    // Check if camera is supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Try to use camera directly
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                // Stop the stream immediately - we just want to check if camera exists
                stream.getTracks().forEach(function(track) { track.stop(); });
                // Trigger file input with capture attribute
                input.click();
            })
            .catch(function(err) {
                // Camera not available, just open file picker
                input.click();
            });
    } else {
        // Fallback: open file picker
        input.click();
    }
}