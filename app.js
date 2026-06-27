// ============================================
// G-KODE - COMPLETE WORKING VERSION
// ALL FIXES INCLUDED
// ============================================

// ============ GLOBAL ============
var currentUser = null;
var currentTab = 'open';
var loginAttempts = 0;
var loginLocked = false;
var loginLockTime = null;

// ============ ADMIN ============
var ADMIN_PHONES = ['0703428192', '0711991467'];

// ============ EMAILJS ============
var EMAILJS_CONFIG = {
    serviceID: 'service_hw35xfu',
    publicKey: 'vc371wcNfQy56zlH8',
    otpTemplateID: 'template_qycsjak',
    resetTemplateID: 'template_0787ox7'
};

// ============ DATA ============
function getUsers() {
    try {
        return JSON.parse(localStorage.getItem('gkode_users') || '[]');
    } catch (e) {
        return [];
    }
}
function setUsers(users) { localStorage.setItem('gkode_users', JSON.stringify(users)); }
function getGigs() {
    try {
        return JSON.parse(localStorage.getItem('gkode_gigs') || '[]');
    } catch (e) {
        return [];
    }
}
function setGigs(gigs) { localStorage.setItem('gkode_gigs', JSON.stringify(gigs)); }
function getCompanies() {
    try {
        return JSON.parse(localStorage.getItem('gkode_companies') || '[]');
    } catch (e) {
        return [];
    }
}
function setCompanies(companies) { localStorage.setItem('gkode_companies', JSON.stringify(companies)); }
function getProducts() {
    try {
        return JSON.parse(localStorage.getItem('gkode_products') || '[]');
    } catch (e) {
        return [];
    }
}
function setProducts(products) { localStorage.setItem('gkode_products', JSON.stringify(products)); }
function getProfessions() {
    try {
        return JSON.parse(localStorage.getItem('gkode_professions') || '[]');
    } catch (e) {
        return [];
    }
}
function setProfessions(professions) { localStorage.setItem('gkode_professions', JSON.stringify(professions)); }
function getCategories() {
    try {
        return JSON.parse(localStorage.getItem('gkode_categories') || '[]');
    } catch (e) {
        return [];
    }
}
function setCategories(categories) { localStorage.setItem('gkode_categories', JSON.stringify(categories)); }

// ============ TOAST ============
function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;width:90%;max-width:500px;pointer-events:none;';
        document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    var colors = { success: '#006400', error: '#cc0000', info: '#2196F3', warning: '#ff9800' };
    toast.style.cssText = 'padding:12px 20px;border-radius:10px;color:#fff;margin-bottom:8px;box-shadow:0 4px 15px rgba(0,0,0,0.2);background:' + (colors[type] || '#333') + ';pointer-events:auto;font-size:14px;font-weight:500;animation:slideDown 0.3s ease;';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(function() {
            if (toast.parentNode) toast.remove();
        }, 500);
    }, 4000);
}

// Add animation style
(function() {
    var style = document.createElement('style');
    style.textContent = '@keyframes slideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }';
    document.head.appendChild(style);
})();

// ============ NAVIGATION ============
function showScreen(id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
        screens[i].classList.remove('active');
    }
    var s = document.getElementById(id);
    if (s) s.classList.add('active');

    var nav = document.getElementById('bottomNav');
    var allowed = ['home', 'postGig', 'profile', 'chat', 'marketplace', 'companyRegister', 'companyDashboard', 'addProduct'];
    if (currentUser && allowed.indexOf(id) !== -1) {
        nav.classList.remove('hidden');
    } else {
        nav.classList.add('hidden');
    }

    if (id === 'home') loadGigs();
    if (id === 'profile') loadProfile();
    if (id === 'marketplace') loadMarketplace();
    if (id === 'companyDashboard') loadCompanyDashboard();
}

function togglePassword(fieldId, icon) {
    var field = document.getElementById(fieldId);
    if (!field) return;
    if (field.type === 'password') {
        field.type = 'text';
        icon.textContent = '🙈';
    } else {
        field.type = 'password';
        icon.textContent = '👁️';
    }
}

// ============ PROFESSIONS ============
var defaultProfessions = [
    'Plumber', 'Electrician', 'Carpenter', 'Painter', 'Mechanic',
    'Hairdresser', 'Tailor', 'Chef', 'Driver', 'Teacher', 'Nurse',
    'Accountant', 'Architect', 'Baker', 'Barber', 'Builder',
    'Cleaner', 'Cook', 'Doctor', 'Engineer', 'Farmer', 'Gardener',
    'Lawyer', 'Mason', 'Photographer', 'Roofer', 'Security Guard',
    'Surveyor', 'Tiler', 'Tour Guide', 'Translator', 'Vet', 'Welder', 'Writer'
];

function getAllProfessions() {
    var saved = getProfessions();
    var all = defaultProfessions.slice();
    for (var i = 0; i < saved.length; i++) {
        if (all.indexOf(saved[i]) === -1) {
            all.push(saved[i]);
        }
    }
    all.sort();
    return all;
}

function populateProfessionDropdown() {
    var dropdown = document.getElementById('regProfession');
    if (!dropdown) return;
    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }
    var all = getAllProfessions();
    for (var i = 0; i < all.length; i++) {
        var opt = document.createElement('option');
        opt.value = all[i];
        opt.textContent = all[i];
        dropdown.appendChild(opt);
    }
    var otherOpt = document.createElement('option');
    otherOpt.value = 'Other';
    otherOpt.textContent = 'Other (Add New)';
    dropdown.appendChild(otherOpt);
}

function checkProfession() {
    var profession = document.getElementById('regProfession').value;
    document.getElementById('otherProfessionBox').style.display = profession === 'Other' ? 'block' : 'none';
}

function saveNewProfession(professionName) {
    if (!professionName || professionName.trim().length < 3) {
        showToast('Enter a valid profession name.', 'error');
        return null;
    }
    var words = professionName.trim().split(' ');
    var formatted = '';
    for (var i = 0; i < words.length; i++) {
        if (words[i].length > 0) {
            formatted += words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase() + ' ';
        }
    }
    formatted = formatted.trim();
    var all = getAllProfessions();
    for (var i = 0; i < all.length; i++) {
        if (all[i].toLowerCase() === formatted.toLowerCase()) {
            return all[i];
        }
    }
    var saved = getProfessions();
    saved.push(formatted);
    setProfessions(saved);
    populateProfessionDropdown();
    showToast('✅ New profession "' + formatted + '" saved!', 'success');
    return formatted;
}

// ============ CATEGORIES ============
var defaultCategories = [
    'Cement', 'Pipes', 'Taps', 'Electrical', 'Paint',
    'Timber', 'Steel', 'Tiles', 'Roofing', 'Tools',
    'Beauty', 'Food', 'Seeds', 'Auto Parts', 'Hardware'
];

function getAllCategories() {
    var saved = getCategories();
    var all = defaultCategories.slice();
    for (var i = 0; i < saved.length; i++) {
        if (all.indexOf(saved[i]) === -1) {
            all.push(saved[i]);
        }
    }
    all.sort();
    return all;
}

function populateCategoryDropdown() {
    var dropdown = document.getElementById('marketCategory');
    if (!dropdown) return;
    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }
    var all = getAllCategories();
    for (var i = 0; i < all.length; i++) {
        var opt = document.createElement('option');
        opt.value = all[i];
        opt.textContent = all[i];
        dropdown.appendChild(opt);
    }
}

// ============ CAMERA ============
function openCamera(inputId) {
    var input = document.getElementById(inputId);
    if (!input) {
        showToast('Error: Input not found.', 'error');
        return;
    }
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        input.setAttribute('capture', 'environment');
        input.click();
    } else {
        input.removeAttribute('capture');
        input.click();
    }
}

// ============ REGISTER ============
async function register(e) {
    e.preventDefault();
    var btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = '⏳ REGISTERING...';

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

        if (!name || !phone || !id || !email || !password || !location || !profession) {
            showToast('Please fill all required fields.', 'error');
            btn.disabled = false;
            btn.textContent = 'REGISTER';
            return;
        }

        if (!photoFile) {
            showToast('Please take or select a profile photo.', 'error');
            btn.disabled = false;
            btn.textContent = 'REGISTER';
            return;
        }

        if (!idScanFile) {
            showToast('Please take or select an ID scan.', 'error');
            btn.disabled = false;
            btn.textContent = 'REGISTER';
            return;
        }

        if (profession === 'Other') {
            if (!otherProfession) {
                showToast('Please specify your profession.', 'error');
                btn.disabled = false;
                btn.textContent = 'REGISTER';
                return;
            }
            profession = saveNewProfession(otherProfession);
            if (!profession) {
                btn.disabled = false;
                btn.textContent = 'REGISTER';
                return;
            }
        }

        var users = getUsers();
        for (var i = 0; i < users.length; i++) {
            if (users[i].phone === phone) {
                showToast('Phone already registered. Please login.', 'warning');
                showScreen('login');
                btn.disabled = false;
                btn.textContent = 'REGISTER';
                return;
            }
            if (users[i].id === id) {
                showToast('ID already registered.', 'error');
                btn.disabled = false;
                btn.textContent = 'REGISTER';
                return;
            }
            if (users[i].email === email) {
                showToast('Email already registered.', 'error');
                btn.disabled = false;
                btn.textContent = 'REGISTER';
                return;
            }
        }

        showToast('📸 Processing images...', 'info');
        btn.textContent = '⏳ PROCESSING IMAGES...';

        var photoReader = new FileReader();
        var idReader = new FileReader();
        var photoData = null;
        var idData = null;
        var filesProcessed = 0;

        function checkFilesDone() {
            filesProcessed++;
            if (filesProcessed === 2) {
                completeRegistration(name, phone, id, email, password, location, profession, skills, photoData, idData, btn);
            }
        }

        photoReader.onload = function(e) {
            photoData = e.target.result;
            checkFilesDone();
        };
        photoReader.onerror = function() {
            showToast('Error reading photo. Please try again.', 'error');
            btn.disabled = false;
            btn.textContent = 'REGISTER';
        };
        photoReader.readAsDataURL(photoFile);

        idReader.onload = function(e) {
            idData = e.target.result;
            checkFilesDone();
        };
        idReader.onerror = function() {
            showToast('Error reading ID scan. Please try again.', 'error');
            btn.disabled = false;
            btn.textContent = 'REGISTER';
        };
        idReader.readAsDataURL(idScanFile);

    } catch (err) {
        showToast('Registration error: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'REGISTER';
        console.error('Registration error:', err);
    }
}

function completeRegistration(name, phone, id, email, password, location, profession, skills, photoData, idData, btn) {
    try {
        var users = getUsers();
        var vCode = Math.floor(100000 + Math.random() * 900000).toString();
        sendOTPEmail(email, name, vCode);
        var userCode = prompt('📱 Enter the 6-digit verification code sent to your email:\n\n(Check your spam folder if not received)');

        if (!userCode || userCode !== vCode) {
            showToast('❌ Invalid verification code.', 'error');
            btn.disabled = false;
            btn.textContent = 'REGISTER';
            return;
        }

        var user = {
            name: name,
            phone: phone,
            id: id,
            email: email,
            password: password,
            location: location,
            profession: profession,
            skills: skills || '',
            photo: photoData,
            idScan: idData,
            status: 'Active',
            verified: true,
            strikes: 0,
            rating: 0,
            reviewCount: 0,
            registeredAt: new Date().toISOString()
        };

        users.push(user);
        setUsers(users);
        currentUser = user;
        localStorage.setItem('gkode_currentUser', JSON.stringify(user));

        showToast('✅ Welcome, ' + name + '! Account created successfully!', 'success');
        showScreen('home');
        btn.disabled = false;
        btn.textContent = 'REGISTER';

    } catch (err) {
        showToast('Registration error: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'REGISTER';
        console.error('Completion error:', err);
    }
}

// ============ LOGIN ============
function login(e) {
    e.preventDefault();
    var btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = '⏳ LOGGING IN...';

    try {
        var phone = document.getElementById('loginPhone').value.trim();
        var password = document.getElementById('loginPassword').value.trim();

        if (!phone || !password) {
            showToast('Enter phone and password.', 'error');
            btn.disabled = false;
            btn.textContent = 'LOGIN';
            return;
        }

        var users = getUsers();

        if (users.length === 0) {
            showToast('No users registered. Please register first.', 'warning');
            showScreen('register');
            btn.disabled = false;
            btn.textContent = 'LOGIN';
            return;
        }

        var found = null;

        for (var i = 0; i < users.length; i++) {
            if (users[i].phone === phone) {
                var stored = users[i].password;
                // Check plain text
                if (stored === password) {
                    found = users[i];
                    break;
                }
                // Check base64
                try {
                    if (atob(stored) === password) {
                        found = users[i];
                        break;
                    }
                } catch(e) {}
            }
        }

        if (!found) {
            showToast('Wrong phone or password.', 'error');
            btn.disabled = false;
            btn.textContent = 'LOGIN';
            return;
        }

        currentUser = found;
        localStorage.setItem('gkode_currentUser', JSON.stringify(found));
        showToast('Welcome back, ' + found.name + '!', 'success');
        showScreen('home');
        btn.disabled = false;
        btn.textContent = 'LOGIN';

    } catch (err) {
        showToast('Login error: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'LOGIN';
        console.error('Login error:', err);
    }
}

// ============ LOGOUT ============
function logout() {
    currentUser = null;
    localStorage.removeItem('gkode_currentUser');
    showToast('Logged out.', 'info');
    showScreen('welcome');
    var nav = document.getElementById('bottomNav');
    if (nav) nav.classList.add('hidden');
}

// ============ EMAILJS ============
function loadEmailJS(callback) {
    if (typeof emailjs !== 'undefined') {
        callback();
        return;
    }
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    document.head.appendChild(script);
    script.onload = function() {
        emailjs.init(EMAILJS_CONFIG.publicKey);
        callback();
    };
    script.onerror = function() {
        showToast('⚠️ Email service unavailable. Using on-screen code.', 'warning');
        callback();
    };
}

function sendOTPEmail(userEmail, userName, code) {
    loadEmailJS(function() {
        if (typeof emailjs === 'undefined') {
            showToast('📱 Your code: ' + code, 'info');
            return;
        }
        var templateParams = {
            to_email: userEmail,
            to_name: userName || 'User',
            code: code,
            app_name: 'G-KODE',
            year: new Date().getFullYear()
        };
        emailjs.send(EMAILJS_CONFIG.serviceID, EMAILJS_CONFIG.otpTemplateID, templateParams)
            .then(function(response) {
                console.log('✅ OTP email sent!', response.status);
                showToast('📧 Verification code sent to your email!', 'success');
            })
            .catch(function(error) {
                console.log('❌ OTP email failed:', error);
                showToast('📱 Your code: ' + code, 'info');
            });
    });
}

// ============ PASSWORD RESET - WORKING (No Email Required) ============
function sendPasswordReset() {
    var email = document.getElementById('resetEmail').value.trim();

    if (!email) {
        showToast('Please enter your email address.', 'error');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
    }

    var users = getUsers();
    var found = null;
    for (var i = 0; i < users.length; i++) {
        if (users[i].email === email) {
            found = users[i];
            break;
        }
    }

    if (!found) {
        showToast('No account found with that email.', 'error');
        return;
    }

    // Generate reset code
    var resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // ===== SHOW CODE ON SCREEN =====
    var msg = '🔑 PASSWORD RESET CODE\n\n' +
              'User: ' + found.name + '\n' +
              'Phone: ' + found.phone + '\n\n' +
              'Your reset code is: ' + resetCode + '\n\n' +
              'Enter this code to reset your password.';

    var userCode = prompt(msg);

    if (!userCode || userCode !== resetCode) {
        showToast('❌ Invalid reset code.', 'error');
        return;
    }

    // ===== SET NEW PASSWORD =====
    var newPassword = prompt('📝 Enter your new password (minimum 8 characters):');
    if (!newPassword || newPassword.length < 8) {
        showToast('Password must be at least 8 characters.', 'error');
        return;
    }

    // Update user password
    for (var i = 0; i < users.length; i++) {
        if (users[i].email === email) {
            users[i].password = newPassword;
            break;
        }
    }
    setUsers(users);

    showToast('✅ Password reset successful! Login with your new password.', 'success');
    showScreen('login');
}

// ============ GIGS ============
function postGig(e) {
    e.preventDefault();
    if (!currentUser) {
        showToast('Please login first.', 'error');
        return;
    }

    var btn = document.getElementById('postGigBtn');
    btn.disabled = true;
    btn.textContent = '⏳ POSTING...';

    try {
        var title = document.getElementById('gigTitle').value.trim();
        var skill = document.getElementById('gigSkill').value.trim();
        var location = document.getElementById('gigLocation').value.trim();
        var urgency = document.getElementById('gigUrgency').value;
        var budgetMin = parseInt(document.getElementById('gigBudgetMin').value) || 0;
        var budgetMax = parseInt(document.getElementById('gigBudgetMax').value) || 0;
        var desc = document.getElementById('gigDesc').value.trim();

        if (!title || !skill || !location) {
            showToast('Fill Title, Skill, and Location.', 'error');
            btn.disabled = false;
            btn.textContent = 'POST GIG';
            return;
        }

        if (budgetMin < 1 || budgetMax < 1) {
            showToast('Enter valid budget amounts.', 'error');
            btn.disabled = false;
            btn.textContent = 'POST GIG';
            return;
        }

        if (budgetMin > budgetMax) {
            showToast('Min budget cannot be greater than Max.', 'error');
            btn.disabled = false;
            btn.textContent = 'POST GIG';
            return;
        }

        var gigs = getGigs();
        gigs.push({
            id: Date.now().toString(),
            title: title,
            skill: skill,
            location: location,
            urgency: urgency,
            budgetMin: budgetMin,
            budgetMax: budgetMax,
            desc: desc,
            client: currentUser.name,
            clientPhone: currentUser.phone,
            status: 'Open',
            worker: '',
            workerPhone: '',
            createdAt: new Date().toISOString()
        });
        setGigs(gigs);

        showToast('✅ Gig posted successfully!', 'success');
        showScreen('home');
        btn.disabled = false;
        btn.textContent = 'POST GIG';

    } catch (err) {
        showToast('Error: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'POST GIG';
        console.error('Post gig error:', err);
    }
}

function captureGigLocation() {
    if (!navigator.geolocation) {
        showToast('GPS not supported.', 'error');
        return;
    }
    showToast('📍 Capturing location...', 'info');
    navigator.geolocation.getCurrentPosition(
        function(pos) {
            document.getElementById('gigGPSLat').value = pos.coords.latitude;
            document.getElementById('gigGPSLon').value = pos.coords.longitude;
            document.getElementById('gigLocationStatus').textContent = '✅ Location captured!';
            document.getElementById('gigLocationStatus').style.color = '#006400';
            showToast('✅ Location captured!', 'success');
        },
        function() {
            showToast('❌ Enable GPS.', 'error');
        }
    );
}

function switchTab(tab) {
    currentTab = tab;
    var openBtn = document.getElementById('tabOpen');
    var takenBtn = document.getElementById('tabTaken');
    if (tab === 'open') {
        openBtn.className = 'active';
        takenBtn.className = '';
    } else {
        openBtn.className = '';
        takenBtn.className = 'active';
    }
    loadGigs();
}

function loadGigs() {
    var container = document.getElementById('gigsList');
    if (!container) return;

    var gigs = getGigs();
    var filtered = [];

    for (var i = 0; i < gigs.length; i++) {
        var g = gigs[i];
        if (currentTab === 'open' && g.status === 'Open') {
            filtered.push(g);
        } else if (currentTab === 'taken' && g.status === 'Assigned') {
            filtered.push(g);
        }
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding:40px 0;text-align:center;color:#666;"><p>No gigs found.</p></div>';
        return;
    }

    var h = '';
    for (var i = 0; i < filtered.length; i++) {
        var g = filtered[i];
        var open = g.status === 'Open';
        var budgetText = 'Ksh ' + g.budgetMin + ' - ' + g.budgetMax;

        h += '<div class="gig-card">';
        h += '<div class="gig-title">' + g.title + '</div>';
        h += '<span class="badge ' + (open ? 'badge-open' : 'badge-taken') + '">' + (open ? '🟢 OPEN' : '🔴 TAKEN') + '</span>';
        h += '<div class="gig-meta">👤 ' + g.client + ' | 🛠️ ' + g.skill + '</div>';
        h += '<div class="gig-meta">📍 ' + g.location + '</div>';
        h += '<div class="gig-budget">💰 ' + budgetText + '</div>';
        if (open) {
            h += '<div class="gig-actions"><button class="btn-accept" onclick="acceptGig(\'' + g.id + '\')">✅ ACCEPT</button></div>';
        }
        h += '</div>';
    }

    container.innerHTML = h;
}

function acceptGig(id) {
    if (!currentUser) {
        showToast('Please login first.', 'error');
        return;
    }

    var gigs = getGigs();
    var found = false;

    for (var i = 0; i < gigs.length; i++) {
        if (gigs[i].id === id) {
            if (gigs[i].status === 'Open') {
                if (gigs[i].client === currentUser.name) {
                    showToast('You cannot accept your own gig.', 'warning');
                    return;
                }
                gigs[i].status = 'Assigned';
                gigs[i].worker = currentUser.name;
                gigs[i].workerPhone = currentUser.phone;
                found = true;
                break;
            }
        }
    }

    if (!found) {
        showToast('Gig not available or already taken.', 'error');
        return;
    }

    setGigs(gigs);
    showToast('✅ Gig accepted!', 'success');
    loadGigs();
}

// ============ CHAT ============
function openChat(id) {
    document.getElementById('chatGigId').value = id;
    showScreen('chat');
    loadChatMessages(id);
}

function loadChatMessages(id) {
    var container = document.getElementById('chatMessages');
    if (!container) return;

    var logs = JSON.parse(localStorage.getItem('gkode_chat_' + id) || '[]');

    if (logs.length === 0) {
        container.innerHTML = '<div style="color:#999;padding:20px;text-align:center;">No messages yet.</div>';
        return;
    }

    var h = '';
    for (var i = 0; i < logs.length; i++) {
        var msg = logs[i];
        var isSent = msg.sender === currentUser.name;
        h += '<div class="chat-message ' + (isSent ? 'sent' : 'received') + '">';
        if (!isSent) {
            h += '<div class="sender">' + msg.sender + '</div>';
        }
        h += msg.text;
        h += '</div>';
    }

    container.innerHTML = h;
    container.scrollTop = container.scrollHeight;
}

function sendMessage(e) {
    e.preventDefault();
    var text = document.getElementById('chatInput').value.trim();
    var id = document.getElementById('chatGigId').value;

    if (!text || !currentUser) return;

    var logs = JSON.parse(localStorage.getItem('gkode_chat_' + id) || '[]');
    logs.push({
        sender: currentUser.name,
        text: text,
        time: new Date().toISOString()
    });
    localStorage.setItem('gkode_chat_' + id, JSON.stringify(logs));
    document.getElementById('chatInput').value = '';
    loadChatMessages(id);
}

// ============ SHARE LOCATION ============
function shareLiveLocation() {
    if (!currentUser) {
        showToast('Please login first.', 'error');
        return;
    }

    if (!navigator.geolocation) {
        showToast('GPS not supported on this device.', 'error');
        return;
    }

    showToast('📍 Getting your location...', 'info');

    navigator.geolocation.getCurrentPosition(
        function(pos) {
            var lat = pos.coords.latitude;
            var lon = pos.coords.longitude;
            var url = 'https://www.google.com/maps?q=' + lat + ',' + lon;

            var id = document.getElementById('chatGigId').value;
            var logs = JSON.parse(localStorage.getItem('gkode_chat_' + id) || '[]');
            logs.push({
                sender: currentUser.name,
                text: '📍 My location: ' + url,
                time: new Date().toISOString()
            });
            localStorage.setItem('gkode_chat_' + id, JSON.stringify(logs));

            window.open(url, '_blank');
            loadChatMessages(id);
            showToast('✅ Location shared!', 'success');
        },
        function(err) {
            showToast('❌ Could not get location. Please enable GPS.', 'error');
        }, { enableHighAccuracy: true, timeout: 10000 }
    );
}

// ============ PROFILE ============
function loadProfile() {
    if (!currentUser) return;

    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profilePhone').textContent = '📞 ' + currentUser.phone;
    document.getElementById('profileLocation').textContent = '📍 ' + currentUser.location;
    document.getElementById('profileProfession').textContent = '👔 ' + currentUser.profession;
    document.getElementById('profileSkills').textContent = '🛠️ ' + (currentUser.skills || 'None');

    if (currentUser.photo) {
        document.getElementById('profilePhoto').src = currentUser.photo;
    }

    var statusText = currentUser.verified ? '✅ Verified' : '🟡 Pending';
    statusText += ' | ⭐ ' + (currentUser.rating || 0) + ' (' + (currentUser.reviewCount || 0) + ' reviews)';
    document.getElementById('profileStatus').innerHTML = statusText;

    var gigs = getGigs();
    var myGigs = [];
    for (var i = 0; i < gigs.length; i++) {
        if (gigs[i].client === currentUser.name || gigs[i].worker === currentUser.name) {
            myGigs.push(gigs[i]);
        }
    }

    var container = document.getElementById('myGigsList');
    if (myGigs.length === 0) {
        container.innerHTML = '<p style="color:#666;">No gigs yet.</p>';
    } else {
        var h = '';
        for (var i = 0; i < myGigs.length; i++) {
            h += '<div style="background:#f5f5f5;padding:10px;border-radius:8px;margin-bottom:8px;">';
            h += '<strong>' + myGigs[i].title + '</strong> — ' + myGigs[i].status;
            if (myGigs[i].status === 'Assigned' && myGigs[i].worker === currentUser.name) {
                h += ' <button onclick="openChat(\'' + myGigs[i].id + '\')" style="background:#2196F3;color:#fff;border:none;padding:5px 10px;border-radius:5px;font-size:12px;cursor:pointer;">💬 Chat</button>';
            }
            h += '</div>';
        }
        container.innerHTML = h;
    }

    checkAdminAccess();
}

// ============ ADMIN ============
function isAdmin() {
    if (!currentUser) return false;
    for (var i = 0; i < ADMIN_PHONES.length; i++) {
        if (currentUser.phone === ADMIN_PHONES[i]) {
            return true;
        }
    }
    return false;
}

function checkAdminAccess() {
    var btn = document.getElementById('adminAccessBtn');
    if (!btn) return;
    if (isAdmin()) {
        btn.style.display = 'block';
    } else {
        btn.style.display = 'none';
    }
}

function openAdminPanel() {
    window.open('admin.html', '_blank');
}

// ============ MARKETPLACE ============
function loadMarketplace() {
    var container = document.getElementById('marketplaceList');
    if (!container) return;

    var products = getProducts();
    if (products.length === 0) {
        container.innerHTML = '<div style="padding:40px 0;text-align:center;color:#666;"><p>No products available.</p></div>';
        return;
    }

    var h = '';
    for (var i = 0; i < products.length; i++) {
        var p = products[i];
        h += '<div class="gig-card">';
        h += '<h3>' + p.name + '</h3>';
        h += '<p>🏢 ' + p.companyName + ' | ' + p.category + '</p>';
        h += '<p>💰 Ksh ' + p.price + '/' + p.unit + '</p>';
        h += '<p>📦 Stock: ' + p.stock + '</p>';
        h += '<button onclick="buyProduct(\'' + p.id + '\')" style="background:#006400;color:#FFD700;border:none;padding:10px;border-radius:8px;width:100%;font-weight:bold;cursor:pointer;margin-top:5px;">🛒 BUY</button>';
        h += '</div>';
    }
    container.innerHTML = h;
}

function buyProduct(id) {
    if (!currentUser) {
        showToast('Please login first.', 'error');
        return;
    }

    var products = getProducts();
    for (var i = 0; i < products.length; i++) {
        if (products[i].id === id) {
            if (products[i].stock > 0) {
                products[i].stock--;
                setProducts(products);
                showToast('✅ Purchased!', 'success');
                loadMarketplace();
                return;
            } else {
                showToast('❌ Out of stock.', 'error');
                return;
            }
        }
    }
    showToast('❌ Product not found.', 'error');
}

// ============ COMPANY ============
function registerCompany(e) {
    e.preventDefault();
    if (!currentUser) {
        showToast('Please login first.', 'error');
        return;
    }

    var btn = document.getElementById('compRegisterBtn');
    btn.disabled = true;
    btn.textContent = '⏳ REGISTERING...';

    try {
        var name = document.getElementById('compName').value.trim();
        var type = document.getElementById('compType').value;
        var regNo = document.getElementById('compRegNo').value.trim();
        var location = document.getElementById('compLocation').value.trim();
        var phone = document.getElementById('compPhone').value.trim();
        var email = document.getElementById('compEmail').value.trim();
        var desc = document.getElementById('compDesc').value.trim();

        if (!name || !type || !regNo || !location || !phone) {
            showToast('Fill all required fields.', 'error');
            btn.disabled = false;
            btn.textContent = 'REGISTER BUSINESS';
            return;
        }

        var companies = getCompanies();
        for (var i = 0; i < companies.length; i++) {
            if (companies[i].name === name) {
                showToast('Business name already registered.', 'error');
                btn.disabled = false;
                btn.textContent = 'REGISTER BUSINESS';
                return;
            }
        }

        companies.push({
            id: Date.now().toString(),
            name: name,
            type: type,
            regNo: regNo,
            location: location,
            phone: phone,
            email: email,
            desc: desc,
            owner: currentUser.name,
            ownerPhone: currentUser.phone,
            registeredAt: new Date().toISOString(),
            totalSales: 0,
            totalCommission: 0
        });
        setCompanies(companies);

        showToast('✅ ' + name + ' registered successfully!', 'success');
        showScreen('companyDashboard');
        loadCompanyDashboard();
        btn.disabled = false;
        btn.textContent = 'REGISTER BUSINESS';

    } catch (err) {
        showToast('Error: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'REGISTER BUSINESS';
    }
}

function loadCompanyDashboard() {
    if (!currentUser) return;

    var companies = getCompanies();
    var myComp = null;
    for (var i = 0; i < companies.length; i++) {
        if (companies[i].ownerPhone === currentUser.phone) {
            myComp = companies[i];
            break;
        }
    }

    if (!myComp) {
        document.getElementById('compInfo').innerHTML = '<p>No business registered.</p>';
        return;
    }

    document.getElementById('compInfo').innerHTML =
        '<h3>' + myComp.name + '</h3>' +
        '<p>🏢 ' + myComp.type + ' | 📍 ' + myComp.location + '</p>' +
        '<p>📞 ' + myComp.phone + '</p>' +
        '<p>📜 Reg No: ' + myComp.regNo + '</p>';

    showCompTab('products');
}

function showCompTab(tab) {
    var content = document.getElementById('compTabContent');
    var products = getProducts();
    var companies = getCompanies();
    var myComp = null;

    for (var i = 0; i < companies.length; i++) {
        if (companies[i].ownerPhone === currentUser.phone) {
            myComp = companies[i];
            break;
        }
    }

    if (!myComp) return;

    var myProducts = [];
    for (var i = 0; i < products.length; i++) {
        if (products[i].companyId === myComp.id) {
            myProducts.push(products[i]);
        }
    }

    if (tab === 'products') {
        if (myProducts.length === 0) {
            content.innerHTML = '<p>No products yet.</p>';
        } else {
            var h = '';
            for (var i = 0; i < myProducts.length; i++) {
                var p = myProducts[i];
                h += '<div class="gig-card">';
                h += '<h3>' + p.name + '</h3>';
                h += '<p>' + p.category + ' | Ksh ' + p.price + '/' + p.unit + ' | Stock: ' + p.stock + '</p>';
                h += '<button onclick="deleteProduct(\'' + p.id + '\')" style="background:#cc0000;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">🗑️ Delete</button>';
                h += '</div>';
            }
            content.innerHTML = h;
        }
    } else {
        content.innerHTML = '<p>Coming soon...</p>';
    }
}

function addProduct(e) {
    e.preventDefault();
    if (!currentUser) {
        showToast('Please login first.', 'error');
        return;
    }

    var btn = document.getElementById('addProductBtn');
    btn.disabled = true;
    btn.textContent = '⏳ ADDING...';

    try {
        var name = document.getElementById('prodName').value.trim();
        var category = document.getElementById('prodCategory').value;
        var unit = document.getElementById('prodUnit').value.trim();
        var price = parseFloat(document.getElementById('prodPrice').value);
        var stock = parseInt(document.getElementById('prodStock').value);
        var desc = document.getElementById('prodDesc').value.trim();

        if (!name || !category || !unit || !price || !stock) {
            showToast('Fill all fields.', 'error');
            btn.disabled = false;
            btn.textContent = 'ADD PRODUCT';
            return;
        }

        var companies = getCompanies();
        var myComp = null;
        for (var i = 0; i < companies.length; i++) {
            if (companies[i].ownerPhone === currentUser.phone) {
                myComp = companies[i];
                break;
            }
        }

        if (!myComp) {
            showToast('Register a business first.', 'error');
            btn.disabled = false;
            btn.textContent = 'ADD PRODUCT';
            return;
        }

        var products = getProducts();
        products.push({
            id: Date.now().toString(),
            companyId: myComp.id,
            companyName: myComp.name,
            name: name,
            category: category,
            unit: unit,
            price: price,
            stock: stock,
            desc: desc,
            createdAt: new Date().toISOString()
        });
        setProducts(products);

        showToast('✅ ' + name + ' added!', 'success');
        showScreen('companyDashboard');
        loadCompanyDashboard();
        btn.disabled = false;
        btn.textContent = 'ADD PRODUCT';

    } catch (err) {
        showToast('Error: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'ADD PRODUCT';
    }
}

function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    var products = getProducts();
    var newProducts = [];
    for (var i = 0; i < products.length; i++) {
        if (products[i].id !== id) {
            newProducts.push(products[i]);
        }
    }
    setProducts(newProducts);
    showToast('Product deleted.', 'info');
    loadCompanyDashboard();
}

// ============ EMERGENCY ============
function emergencyCall() {
    if (confirm('🚨 EMERGENCY\n\nTap OK to open emergency contacts.')) {
        window.location.href = 'emergency.html';
    }
}

// ============ LEGAL ============
function showLegalNotice(type) {
    var notices = {
        'privacy': '🔒 PRIVACY NOTICE\n\nWe collect: Name, phone, ID, email, location, photo, ID scan.\n\nYour rights: Access, correct, delete anytime.',
        'terms': '📜 TERMS OF SERVICE\n\n1. G-KODE is a connector\n2. Users responsible for actions\n3. Kenyan law applies',
        'disclaimer': '⚠️ DISCLAIMER\n\n1. G-KODE provides platform connection\n2. We do not guarantee gig completion\n3. Use at your own risk'
    };
    alert(notices[type] || 'Notice not found.');
}

function exportUserData() {
    if (!currentUser) {
        showToast('Please login first.', 'error');
        return;
    }
    var data = {
        exportedAt: new Date().toISOString(),
        user: currentUser,
        userGigs: [],
        userOrders: [],
        userPayments: []
    };
    var gigs = getGigs();
    for (var i = 0; i < gigs.length; i++) {
        if (gigs[i].client === currentUser.name || gigs[i].worker === currentUser.name) {
            data.userGigs.push(gigs[i]);
        }
    }
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gkode-my-data-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('✅ Your data has been exported.', 'success');
}

function deleteAccount() {
    if (!currentUser) {
        showToast('Please login first.', 'error');
        return;
    }
    if (!confirm('⚠️ ACCOUNT DELETION\n\nThis CANNOT be undone!')) {
        return;
    }
    if (!confirm('FINAL WARNING: Continue?')) {
        return;
    }
    var users = getUsers();
    var newUsers = [];
    for (var i = 0; i < users.length; i++) {
        if (users[i].phone !== currentUser.phone) {
            newUsers.push(users[i]);
        }
    }
    setUsers(newUsers);
    var gigs = getGigs();
    var newGigs = [];
    for (var i = 0; i < gigs.length; i++) {
        if (gigs[i].client !== currentUser.name && gigs[i].worker !== currentUser.name) {
            newGigs.push(gigs[i]);
        }
    }
    setGigs(newGigs);
    currentUser = null;
    localStorage.removeItem('gkode_currentUser');
    showToast('✅ Account deleted successfully.', 'success');
    showScreen('welcome');
}

function showPaymentScreen() {
    showToast('💳 Payment coming soon!', 'info');
}

// ============ INIT ============
populateProfessionDropdown();
populateCategoryDropdown();

var saved = localStorage.getItem('gkode_currentUser');
if (saved) {
    try {
        currentUser = JSON.parse(saved);
        if (currentUser) {
            showToast('Welcome back, ' + currentUser.name + '!', 'success');
            showScreen('home');
        }
    } catch (e) {
        showScreen('welcome');
    }
} else {
    showScreen('welcome');
}

console.log('🚀 G-KODE loaded successfully!');
console.log('📊 Data stored in localStorage.');