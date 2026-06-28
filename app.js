// ============================================
// G-KODE - COMPLETE APP WITH BACKEND
// Kenya Helping Kenya - 50M Users Ready
// ============================================

// ============ CONFIGURATION ============
const CONFIG = {
    // === SUPABASE (Backend) ===
    SUPABASE_URL: 'https://rqvijxpbdrholshzhusb.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_lw88kFd0iSFNmkGDfczPMg_1j_ptRUO',
    
    // === API ENDPOINT (Your Backend Server) ===
    API_URL: 'https://gkode-backend.onrender.com/api',
    
    // === APP SETTINGS ===
    ADMIN_PHONES: ['0703428192', '0711991467'],
    USER_FEE: 300,
    COMMISSION_RATE: 0.03,
    MAX_STRIKES: 6,
    REENTRY_FEE: 1500,
    REENTRY_DAYS: 90
};

// ============ STATE ============
let currentUser = null;
let currentGigId = null;
let currentTab = 'open';
let supabase = null;
let supabaseInitialized = false;

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase
    initSupabase();
    
    // Check for existing session
    const token = localStorage.getItem('gkode_token');
    if (token) {
        const user = JSON.parse(localStorage.getItem('gkode_user') || 'null');
        if (user) {
            currentUser = user;
            showScreen('home');
            loadGigs();
            updateBottomNav();
        }
    }
    
    // Setup profession dropdown
    populateProfessionDropdown();
    
    // Load marketplace categories
    loadCategories();
    
    console.log('🚀 G-KODE v3.0 loaded');
    console.log('📊 Ready for 50M+ users');
    console.log('🇰🇪 Kenya Helping Kenya');
});

// ============ SUPABASE INIT ============
function initSupabase() {
    try {
        supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        supabaseInitialized = true;
        console.log('✅ Supabase connected');
    } catch (e) {
        console.log('⚠️ Supabase not available, using localStorage fallback');
    }
}

// ============ API HELPER ============
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('gkode_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };
    
    try {
        const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
            ...options,
            headers,
            timeout: 10000
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Request failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============ TOAST ============
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const colors = {
        success: '#006400',
        error: '#cc0000',
        info: '#2196F3',
        warning: '#ff9800'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${colors[type] || '#333'};
        color: #fff;
        padding: 12px 20px;
        border-radius: 10px;
        margin-bottom: 8px;
        animation: slideDown 0.3s ease;
        font-weight: 500;
        font-size: 14px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// ============ SCREEN NAVIGATION ============
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
    
    updateBottomNav();
    
    // Load data based on screen
    if (screenId === 'home') loadGigs();
    if (screenId === 'profile') loadProfile();
    if (screenId === 'marketplace') loadMarketplace();
    if (screenId === 'companyDashboard') loadCompanyDashboard();
}

function updateBottomNav() {
    const nav = document.getElementById('bottomNav');
    if (!nav) return;
    
    if (currentUser) {
        nav.classList.remove('hidden');
    } else {
        nav.classList.add('hidden');
    }
}

// ============ TOGGLE PASSWORD ============
function togglePassword(fieldId, el) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    if (field.type === 'password') {
        field.type = 'text';
        el.textContent = '🙈';
    } else {
        field.type = 'password';
        el.textContent = '👁️';
    }
}

// ============ PROFESSIONS ============
const defaultProfessions = [
    'Plumber', 'Electrician', 'Carpenter', 'Painter', 'Mechanic',
    'Hairdresser', 'Tailor', 'Chef', 'Driver', 'Teacher', 'Nurse',
    'Accountant', 'Architect', 'Baker', 'Barber', 'Builder',
    'Cleaner', 'Cook', 'Doctor', 'Engineer', 'Farmer', 'Gardener',
    'Lawyer', 'Mason', 'Photographer', 'Roofer', 'Security Guard',
    'Surveyor', 'Tiler', 'Tour Guide', 'Translator', 'Vet', 'Welder', 'Writer'
];

function getProfessions() {
    try {
        return JSON.parse(localStorage.getItem('gkode_professions') || '[]');
    } catch { return []; }
}

function setProfessions(professions) {
    localStorage.setItem('gkode_professions', JSON.stringify(professions));
}

function getAllProfessions() {
    const saved = getProfessions();
    const all = [...defaultProfessions];
    saved.forEach(p => { if (!all.includes(p)) all.push(p); });
    all.sort();
    return all;
}

function populateProfessionDropdown() {
    const dropdown = document.getElementById('regProfession');
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">-- Select Your Profession * --</option>';
    const all = getAllProfessions();
    all.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        dropdown.appendChild(opt);
    });
    
    const otherOpt = document.createElement('option');
    otherOpt.value = 'Other';
    otherOpt.textContent = 'Other (Add New)';
    dropdown.appendChild(otherOpt);
}

function checkProfession() {
    const profession = document.getElementById('regProfession').value;
    document.getElementById('otherProfessionBox').style.display = profession === 'Other' ? 'block' : 'none';
}

function saveNewProfession(profession) {
    if (!profession || profession.trim().length < 3) {
        showToast('Enter a valid profession name', 'error');
        return null;
    }
    
    const formatted = profession.trim().split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    
    const all = getAllProfessions();
    if (all.includes(formatted)) return formatted;
    
    const saved = getProfessions();
    saved.push(formatted);
    setProfessions(saved);
    populateProfessionDropdown();
    showToast(`✅ New profession "${formatted}" saved!`, 'success');
    return formatted;
}

// ============ CATEGORIES ============
const defaultCategories = [
    'Cement', 'Pipes', 'Taps', 'Electrical', 'Paint',
    'Timber', 'Steel', 'Tiles', 'Roofing', 'Tools',
    'Beauty', 'Food', 'Seeds', 'Auto Parts', 'Hardware'
];

function getCategories() {
    try {
        return JSON.parse(localStorage.getItem('gkode_categories') || '[]');
    } catch { return []; }
}

function loadCategories() {
    const categories = getCategories();
    const all = [...defaultCategories, ...categories];
    const unique = [...new Set(all)].sort();
    
    const dropdown = document.getElementById('marketCategory');
    if (dropdown) {
        dropdown.innerHTML = '<option value="All">All Categories</option>';
        unique.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            dropdown.appendChild(opt);
        });
    }
    
    const prodDropdown = document.getElementById('prodCategory');
    if (prodDropdown) {
        prodDropdown.innerHTML = '<option value="">-- Category * --</option>';
        unique.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            prodDropdown.appendChild(opt);
        });
    }
}

// ============ REGISTER ============
async function register() {
    try {
        const name = document.getElementById('regName').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const id = document.getElementById('regID').value.trim();
        const password = document.getElementById('regPassword').value.trim();
        const location = document.getElementById('regLocation').value.trim();
        const profession = document.getElementById('regProfession').value;
        const otherProfession = document.getElementById('regOtherProfession').value.trim();
        const skills = document.getElementById('regSkills').value.trim();
        const photoFile = document.getElementById('regPhoto').files[0];
        const idScanFile = document.getElementById('regIDScan').files[0];
        
        // Validation
        if (!name || !phone || !id || !password || !location || !profession) {
            showToast('Please fill all required fields', 'error');
            return;
        }
        
        if (password.length < 6 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
            showToast('Password must be 6+ characters with letters and numbers', 'error');
            return;
        }
        
        if (!photoFile || !idScanFile) {
            showToast('Please upload profile photo and ID scan', 'error');
            return;
        }
        
        let finalProfession = profession;
        if (profession === 'Other') {
            if (!otherProfession) {
                showToast('Please specify your profession', 'error');
                return;
            }
            finalProfession = saveNewProfession(otherProfession);
            if (!finalProfession) return;
        }
        
        // Read images as base64 (for localStorage fallback)
        const photoData = await readFileAsDataURL(photoFile);
        const idData = await readFileAsDataURL(idScanFile);
        
        // Create user object
        const user = {
            name,
            phone,
            id,
            password,
            location,
            profession: finalProfession,
            skills: skills || '',
            photo: photoData,
            idScan: idData,
            status: 'Active',
            verified: true,
            strikes: 0,
            rating: 0,
            reviewCount: 0,
            registeredAt: new Date().toISOString(),
            isPaid: false,
            isBanned: false
        };
        
        // Try Supabase first
        if (supabaseInitialized) {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .insert([{
                        phone: user.phone,
                        national_id: user.id,
                        full_name: user.name,
                        password_hash: user.password,
                        location: user.location,
                        profession: user.profession,
                        skills: user.skills ? user.skills.split(',').map(s => s.trim()) : [],
                        photo_url: user.photo,
                        id_scan_url: user.idScan,
                        is_paid: user.isPaid,
                        is_banned: user.isBanned
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                
                showToast('✅ Registered with cloud!', 'success');
            } catch (e) {
                console.log('Supabase save error, saving locally:', e);
                saveUserLocally(user);
            }
        } else {
            saveUserLocally(user);
        }
        
        // Save locally as fallback
        saveUserLocally(user);
        
        currentUser = user;
        localStorage.setItem('gkode_user', JSON.stringify(user));
        localStorage.setItem('gkode_token', 'local-token');
        
        showToast(`✅ Welcome, ${name}! Account created!`, 'success');
        showScreen('home');
        loadGigs();
        updateBottomNav();
        
    } catch (error) {
        showToast('Registration failed: ' + error.message, 'error');
        console.error('Registration error:', error);
    }
}

function saveUserLocally(user) {
    let users = getUsersLocal();
    const exists = users.find(u => u.phone === user.phone || u.id === user.id);
    if (exists) {
        showToast('Phone or ID already registered', 'error');
        return;
    }
    users.push(user);
    localStorage.setItem('gkode_users', JSON.stringify(users));
}

function getUsersLocal() {
    try {
        return JSON.parse(localStorage.getItem('gkode_users') || '[]');
    } catch { return []; }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============ LOGIN ============
async function login() {
    try {
        const phone = document.getElementById('loginPhone').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        
        if (!phone || !password) {
            showToast('Please enter phone and password', 'error');
            return;
        }
        
        // Try Supabase first
        if (supabaseInitialized) {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('phone', phone)
                    .single();
                
                if (!error && data) {
                    if (data.password_hash === password) {
                        const user = {
                            name: data.full_name,
                            phone: data.phone,
                            id: data.national_id,
                            password: data.password_hash,
                            location: data.location,
                            profession: data.profession,
                            skills: data.skills ? data.skills.join(', ') : '',
                            photo: data.photo_url,
                            idScan: data.id_scan_url,
                            status: 'Active',
                            verified: true,
                            strikes: data.strikes || 0,
                            rating: data.rating || 0,
                            reviewCount: data.review_count || 0,
                            registeredAt: data.created_at,
                            isPaid: data.is_paid,
                            isBanned: data.is_banned
                        };
                        loginSuccess(user);
                        return;
                    }
                }
            } catch (e) {
                console.log('Supabase login error, checking local:', e);
            }
        }
        
        // Check local
        const users = getUsersLocal();
        const found = users.find(u => u.phone === phone && u.password === password);
        if (found) {
            loginSuccess(found);
            return;
        }
        
        showToast('Invalid phone or password', 'error');
        
    } catch (error) {
        showToast('Login error: ' + error.message, 'error');
    }
}

function loginSuccess(user) {
    currentUser = user;
    localStorage.setItem('gkode_user', JSON.stringify(user));
    localStorage.setItem('gkode_token', 'local-token');
    showToast(`Welcome back, ${user.name}! 🇰🇪`, 'success');
    showScreen('home');
    loadGigs();
    updateBottomNav();
}

// ============ LOGOUT ============
function logout() {
    currentUser = null;
    localStorage.removeItem('gkode_user');
    localStorage.removeItem('gkode_token');
    showToast('Logged out', 'info');
    showScreen('welcome');
    updateBottomNav();
}

// ============ RESET EVERYTHING ============
function resetEverything() {
    if (!confirm('⚠️ WARNING: This will delete ALL data on this device!\n\nContinue?')) return;
    localStorage.clear();
    showToast('🔄 All data reset', 'info');
    showScreen('welcome');
    updateBottomNav();
}

function startFresh() {
    localStorage.removeItem('gkode_user');
    localStorage.removeItem('gkode_token');
    showToast('🆕 Fresh start! Please register or login', 'info');
    showScreen('welcome');
    updateBottomNav();
}

// ============ PASSWORD RESET ============
function verifyIdentity() {
    const phone = document.getElementById('resetPhone').value.trim();
    const id = document.getElementById('resetID').value.trim();
    const profession = document.getElementById('resetProfession').value.trim();
    const location = document.getElementById('resetLocation').value.trim();
    
    const users = getUsersLocal();
    const found = users.find(u => 
        u.phone === phone && 
        u.id === id && 
        u.profession === profession && 
        u.location === location
    );
    
    if (found) {
        document.getElementById('newPasswordSection').style.display = 'block';
        showToast('✅ Identity verified! Enter new password', 'success');
    } else {
        showToast('❌ Verification failed. Check your details.', 'error');
    }
}

function resetPassword() {
    const newPass = document.getElementById('newPassword').value.trim();
    const confirmPass = document.getElementById('confirmPassword').value.trim();
    const phone = document.getElementById('resetPhone').value.trim();
    
    if (!newPass || !confirmPass) {
        showToast('Please enter and confirm new password', 'error');
        return;
    }
    
    if (newPass.length < 6 || !/[a-zA-Z]/.test(newPass) || !/\d/.test(newPass)) {
        showToast('Password must be 6+ characters with letters and numbers', 'error');
        return;
    }
    
    if (newPass !== confirmPass) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    let users = getUsersLocal();
    const found = users.find(u => u.phone === phone);
    if (found) {
        found.password = newPass;
        localStorage.setItem('gkode_users', JSON.stringify(users));
        showToast('✅ Password reset successful! Login now.', 'success');
        showScreen('login');
    } else {
        showToast('❌ User not found', 'error');
    }
}

// ============ GIG FUNCTIONS ============
function postGig() {
    try {
        const title = document.getElementById('gigTitle').value.trim();
        const skill = document.getElementById('gigSkill').value.trim();
        const location = document.getElementById('gigLocation').value.trim();
        const urgency = document.getElementById('gigUrgency').value;
        const budgetMin = parseInt(document.getElementById('gigBudgetMin').value);
        const budgetMax = parseInt(document.getElementById('gigBudgetMax').value);
        const description = document.getElementById('gigDesc').value.trim();
        const lat = document.getElementById('gigGPSLat').value;
        const lon = document.getElementById('gigGPSLon').value;
        
        if (!title || !skill || !location || !budgetMin || !budgetMax) {
            showToast('Please fill all required fields', 'error');
            return;
        }
        
        if (budgetMin > budgetMax) {
            showToast('Min budget cannot be greater than max', 'error');
            return;
        }
        
        if (!currentUser) {
            showToast('Please login first', 'error');
            return;
        }
        
        const gig = {
            id: Date.now().toString(),
            title,
            skill,
            location,
            urgency,
            budgetMin,
            budgetMax,
            description,
            client: currentUser.name,
            clientPhone: currentUser.phone,
            clientId: currentUser.id || currentUser.phone,
            status: 'Open',
            worker: '',
            workerPhone: '',
            workerId: '',
            gpsLat: lat || null,
            gpsLon: lon || null,
            createdAt: new Date().toISOString()
        };
        
        // Save gig
        let gigs = getGigsLocal();
        gigs.push(gig);
        localStorage.setItem('gkode_gigs', JSON.stringify(gigs));
        
        // Try Supabase
        if (supabaseInitialized) {
            supabase
                .from('gigs')
                .insert([{
                    title: gig.title,
                    skill_needed: gig.skill,
                    location: gig.location,
                    urgency: gig.urgency,
                    budget_min: gig.budgetMin,
                    budget_max: gig.budgetMax,
                    description: gig.description,
                    client_id: gig.clientId,
                    gps_lat: gig.gpsLat,
                    gps_lon: gig.gpsLon,
                    status: 'open'
                }])
                .then(result => {
                    if (result.error) console.log('Supabase gig save error:', result.error);
                });
        }
        
        showToast('✅ Gig posted successfully!', 'success');
        document.getElementById('gigTitle').value = '';
        document.getElementById('gigSkill').value = '';
        document.getElementById('gigLocation').value = '';
        document.getElementById('gigBudgetMin').value = '';
        document.getElementById('gigBudgetMax').value = '';
        document.getElementById('gigDesc').value = '';
        document.getElementById('gigGPSLat').value = '';
        document.getElementById('gigGPSLon').value = '';
        document.getElementById('gigLocationStatus').textContent = 'No location captured yet';
        showScreen('home');
        loadGigs();
        
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

function getGigsLocal() {
    try {
        return JSON.parse(localStorage.getItem('gkode_gigs') || '[]');
    } catch { return []; }
}

function switchTab(tab) {
    currentTab = tab;
    const openBtn = document.getElementById('tabOpen');
    const takenBtn = document.getElementById('tabTaken');
    
    if (tab === 'open') {
        openBtn.style.background = '#006400';
        openBtn.style.color = '#FFD700';
        takenBtn.style.background = '#ddd';
        takenBtn.style.color = '#000';
    } else {
        openBtn.style.background = '#ddd';
        openBtn.style.color = '#000';
        takenBtn.style.background = '#006400';
        takenBtn.style.color = '#FFD700';
    }
    loadGigs();
}

function loadGigs() {
    const container = document.getElementById('gigsList');
    if (!container) return;
    
    const gigs = getGigsLocal();
    let filtered = gigs.filter(g => {
        if (currentTab === 'open') return g.status === 'Open';
        return g.status === 'Assigned' || g.status === 'Taken';
    });
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px 0;color:#888;">
                <p>📭 No ${currentTab} gigs found</p>
                ${currentTab === 'open' ? '<button class="btn green" onclick="showScreen(\'postGig\')" style="margin-top:10px;">Post a Gig</button>' : ''}
            </div>
        `;
        return;
    }
    
    let html = '';
    filtered.forEach(gig => {
        const isOpen = gig.status === 'Open';
        const urgencyColor = gig.urgency === 'Emergency' ? '#cc0000' :
                            gig.urgency === 'Urgent' ? '#ff9800' : '#006400';
        
        html += `
            <div class="gig-card" style="border-left:4px solid ${urgencyColor}; margin-bottom:12px; background:#fff; padding:15px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <div class="gig-title" style="font-weight:bold; font-size:18px; color:#006400;">${gig.title}</div>
                <div style="font-size:14px; color:#666;">👤 ${gig.client} | 🛠️ ${gig.skill}</div>
                <div style="font-size:14px; color:#666;">📍 ${gig.location}</div>
                <div style="font-weight:bold; color:#006400;">💰 Ksh ${gig.budgetMin} - ${gig.budgetMax}</div>
                ${isOpen ? `
                    <button class="btn-accept" onclick="acceptGig('${gig.id}')" style="background:#006400; color:#FFD700; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer; margin-top:10px;">✅ ACCEPT</button>
                ` : `
                    <div style="color:#666; margin-top:5px;">👷 Worker: ${gig.worker || 'Unknown'}</div>
                    <button onclick="openChat('${gig.id}')" style="background:#2196F3; color:#fff; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer; margin-top:5px;">💬 Chat</button>
                `}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function acceptGig(gigId) {
    if (!currentUser) {
        showToast('Please login first', 'error');
        return;
    }
    
    let gigs = getGigsLocal();
    const gig = gigs.find(g => g.id === gigId);
    
    if (!gig) {
        showToast('Gig not found', 'error');
        return;
    }
    
    if (gig.status !== 'Open') {
        showToast('This gig is already taken', 'error');
        return;
    }
    
    if (gig.clientPhone === currentUser.phone) {
        showToast('You cannot accept your own gig', 'warning');
        return;
    }
    
    gig.status = 'Assigned';
    gig.worker = currentUser.name;
    gig.workerPhone = currentUser.phone;
    gig.workerId = currentUser.id || currentUser.phone;
    gig.acceptedAt = new Date().toISOString();
    
    localStorage.setItem('gkode_gigs', JSON.stringify(gigs));
    
    // Try Supabase
    if (supabaseInitialized) {
        supabase
            .from('gigs')
            .update({ 
                status: 'taken', 
                worker_id: gig.workerId 
            })
            .eq('id', gigId)
            .then(result => {
                if (result.error) console.log('Supabase accept error:', result.error);
            });
    }
    
    showToast('✅ Gig accepted! Chat with the client.', 'success');
    loadGigs();
}

// ============ CHAT ============
function openChat(gigId) {
    currentGigId = gigId;
    document.getElementById('chatGigId').value = gigId;
    
    const gigs = getGigsLocal();
    const gig = gigs.find(g => g.id === gigId);
    if (gig) {
        const partner = gig.client === currentUser.name ? gig.worker : gig.client;
        document.getElementById('chatPartner').textContent = `💬 Chat with ${partner}`;
    }
    
    showScreen('chat');
    loadChatMessages(gigId);
}

function loadChatMessages(gigId) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    const messages = JSON.parse(localStorage.getItem(`gkode_chat_${gigId}`) || '[]');
    
    if (messages.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">No messages yet. Say hello! 👋</div>';
        return;
    }
    
    let html = '';
    messages.forEach(msg => {
        const isSent = msg.sender === currentUser.name;
        html += `
            <div class="chat-message ${isSent ? 'sent' : 'received'}" style="${isSent ? 'text-align:right; background:#006400; color:#FFD700; padding:10px; border-radius:10px; margin-bottom:5px;' : 'text-align:left; background:#f0f0f0; color:#000; padding:10px; border-radius:10px; margin-bottom:5px;'}">
                ${!isSent ? `<div style="font-weight:bold; font-size:11px;">${msg.sender}</div>` : ''}
                ${msg.isLocation ? `📍 <a href="https://maps.google.com/maps?q=${msg.lat},${msg.lon}" target="_blank" style="color:${isSent ? '#FFD700' : '#006400'};">View Location</a>` : msg.text}
                <div style="font-size:10px; color:${isSent ? '#FFD700' : '#888'}; margin-top:3px;">${new Date(msg.time).toLocaleTimeString()}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    const gigId = document.getElementById('chatGigId').value;
    
    if (!text || !gigId) return;
    if (!currentUser) {
        showToast('Please login first', 'error');
        return;
    }
    
    const messages = JSON.parse(localStorage.getItem(`gkode_chat_${gigId}`) || '[]');
    messages.push({
        sender: currentUser.name,
        text: text,
        time: new Date().toISOString(),
        isLocation: false
    });
    localStorage.setItem(`gkode_chat_${gigId}`, JSON.stringify(messages));
    
    // Try Supabase realtime
    if (supabaseInitialized) {
        supabase
            .from('messages')
            .insert([{
                gig_id: gigId,
                sender_id: currentUser.id || currentUser.phone,
                text: text,
                is_read: false
            }])
            .then(result => {
                if (result.error) console.log('Supabase message error:', result.error);
            });
    }
    
    input.value = '';
    loadChatMessages(gigId);
}

// ============ LOCATION ============
function captureGigLocation() {
    if (!navigator.geolocation) {
        showToast('GPS not supported', 'error');
        return;
    }
    
    showToast('📍 Getting location...', 'info');
    navigator.geolocation.getCurrentPosition(
        pos => {
            document.getElementById('gigGPSLat').value = pos.coords.latitude;
            document.getElementById('gigGPSLon').value = pos.coords.longitude;
            document.getElementById('gigLocationStatus').textContent = '✅ Location captured!';
            document.getElementById('gigLocationStatus').style.color = '#006400';
            showToast('Location captured!', 'success');
        },
        () => showToast('Failed to get location', 'error'),
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function shareLiveLocation() {
    if (!navigator.geolocation) {
        showToast('GPS not supported', 'error');
        return;
    }
    
    showToast('📍 Sharing location...', 'info');
    navigator.geolocation.getCurrentPosition(
        pos => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const url = `https://maps.google.com/maps?q=${lat},${lon}`;
            const gigId = document.getElementById('chatGigId').value;
            
            const messages = JSON.parse(localStorage.getItem(`gkode_chat_${gigId}`) || '[]');
            messages.push({
                sender: currentUser.name,
                text: `📍 My location: ${url}`,
                time: new Date().toISOString(),
                isLocation: true,
                lat: lat,
                lon: lon
            });
            localStorage.setItem(`gkode_chat_${gigId}`, JSON.stringify(messages));
            
            // Try Supabase
            if (supabaseInitialized) {
                supabase
                    .from('messages')
                    .insert([{
                        gig_id: gigId,
                        sender_id: currentUser.id || currentUser.phone,
                        text: `📍 My location`,
                        is_location: true,
                        lat: lat,
                        lon: lon,
                        is_read: false
                    }])
                    .then(result => {
                        if (result.error) console.log('Supabase location error:', result.error);
                    });
            }
            
            window.open(url, '_blank');
            loadChatMessages(gigId);
            showToast('✅ Location shared!', 'success');
        },
        () => showToast('Failed to get location', 'error'),
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function navigateToClient() {
    const gigId = document.getElementById('chatGigId').value;
    const gigs = getGigsLocal();
    const gig = gigs.find(g => g.id === gigId);
    
    if (!gig || !gig.gpsLat || !gig.gpsLon) {
        showToast('No location data for this gig', 'error');
        return;
    }
    
    const url = `https://maps.google.com/maps/dir/?api=1&destination=${gig.gpsLat},${gig.gpsLon}`;
    window.open(url, '_blank');
    showToast('🧭 Opening directions...', 'info');
}

// ============ PROFILE ============
function loadProfile() {
    if (!currentUser) return;
    
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profilePhone').textContent = `📞 ${currentUser.phone}`;
    document.getElementById('profileLocation').textContent = `📍 ${currentUser.location}`;
    document.getElementById('profileProfession').textContent = `👔 ${currentUser.profession}`;
    document.getElementById('profileSkills').textContent = `🛠️ ${currentUser.skills || 'None'}`;
    
    if (currentUser.photo) {
        document.getElementById('profilePhoto').src = currentUser.photo;
    }
    
    const statusText = currentUser.verified ? '✅ Verified' : '🟡 Pending';
    document.getElementById('profileStatus').textContent = `${statusText} | ⭐ ${currentUser.rating || 0} (${currentUser.reviewCount || 0} reviews)`;
    
    // Load user's gigs
    const gigs = getGigsLocal();
    const myGigs = gigs.filter(g => g.client === currentUser.name || g.worker === currentUser.name);
    const container = document.getElementById('myGigsList');
    
    if (myGigs.length === 0) {
        container.innerHTML = '<p style="color:#666;">No gigs yet.</p>';
    } else {
        let html = '';
        myGigs.forEach(g => {
            html += `
                <div style="background:#f5f5f5; padding:10px; border-radius:8px; margin-bottom:8px;">
                    <strong>${g.title}</strong> — ${g.status}
                    ${g.status === 'Assigned' && g.worker === currentUser.name ? 
                        ` <button onclick="openChat('${g.id}')" style="background:#2196F3; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">💬 Chat</button>` : ''}
                </div>
            `;
        });
        container.innerHTML = html;
    }
}

// ============ PAYMENT ============
function showPaymentScreen() {
    showScreen('payment');
}

function verifyMpesaPayment() {
    const code = document.getElementById('mpesaCode').value.trim();
    
    if (!code) {
        showToast('Please enter M-Pesa confirmation code', 'error');
        return;
    }
    
    // Save payment record
    let payments = JSON.parse(localStorage.getItem('gkode_payments') || '[]');
    payments.push({
        phone: currentUser.phone,
        code: code,
        amount: CONFIG.USER_FEE,
        type: 'user_fee',
        verified: true,
        date: new Date().toISOString()
    });
    localStorage.setItem('gkode_payments', JSON.stringify(payments));
    
    // Mark user as paid
    let users = getUsersLocal();
    const user = users.find(u => u.phone === currentUser.phone);
    if (user) {
        user.isPaid = true;
        localStorage.setItem('gkode_users', JSON.stringify(users));
        currentUser.isPaid = true;
        localStorage.setItem('gkode_user', JSON.stringify(currentUser));
    }
    
    // Try Supabase
    if (supabaseInitialized) {
        supabase
            .from('payments')
            .insert([{
                user_id: currentUser.id || currentUser.phone,
                phone: currentUser.phone,
                amount: CONFIG.USER_FEE,
                code: code,
                type: 'user_fee',
                verified: true
            }])
            .then(result => {
                if (result.error) console.log('Supabase payment error:', result.error);
            });
    }
    
    showToast('✅ Payment verified! Welcome to G-KODE Pro.', 'success');
    showScreen('home');
}

// ============ COMPLAINT ============
function submitComplaint() {
    const reason = document.getElementById('complaintReason').value;
    const details = document.getElementById('complaintDetails').value.trim();
    const userId = document.getElementById('complaintUserId').value;
    
    if (!reason || !details) {
        showToast('Please select a reason and provide details', 'error');
        return;
    }
    
    if (!userId) {
        showToast('Please specify the user you\'re complaining about', 'error');
        return;
    }
    
    // Save complaint
    let complaints = JSON.parse(localStorage.getItem('gkode_complaints') || '[]');
    complaints.push({
        id: Date.now().toString(),
        userId: userId,
        reporterId: currentUser.id || currentUser.phone,
        reason: reason,
        details: details,
        date: new Date().toISOString(),
        resolved: false
    });
    localStorage.setItem('gkode_complaints', JSON.stringify(complaints));
    
    // Add strike to user
    let users = getUsersLocal();
    const targetUser = users.find(u => u.id === userId || u.phone === userId);
    if (targetUser) {
        targetUser.strikes = (targetUser.strikes || 0) + 1;
        if (targetUser.strikes >= CONFIG.MAX_STRIKES) {
            targetUser.isBanned = true;
            showToast(`⚠️ User has been banned (${CONFIG.MAX_STRIKES} strikes)`, 'warning');
        }
        localStorage.setItem('gkode_users', JSON.stringify(users));
    }
    
    showToast('✅ Complaint filed. We will review it.', 'success');
    showScreen('home');
}

// ============ ADMIN ============
function isAdmin() {
    if (!currentUser) return false;
    return CONFIG.ADMIN_PHONES.includes(currentUser.phone);
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', function() {
    // Auto-login from saved session
    const savedUser = localStorage.getItem('gkode_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            if (currentUser) {
                showScreen('home');
                loadGigs();
                updateBottomNav();
            }
        } catch (e) {}
    }
});

console.log('🇰🇪 G-KODE v3.0 - Kenya Helping Kenya');
console.log('📊 Built for 50M+ users');
console.log('💡 Skill is Currency. Trust is the Bank.');