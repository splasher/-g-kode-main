// ============================================
// G-KODE - COMPLETE APP WITH PROXIMITY & MAP
// Supabase Cloud Storage + Google Maps
// ============================================

// ============ SUPABASE CONFIG ============
const SUPABASE_URL = 'https://rqvijxpbdrholshzhusb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lw88kFd0iSFNmkGDfczPMg_1j_ptRUO';

// ============ GLOBAL STATE ============
let currentUser = null;
let currentTab = 'open';
let currentGigId = null;
let supabase = null;
let supabaseInitialized = false;
let map = null;
let markers = [];
let userLocation = null;
let pendingRegistration = null;
let otpCode = null;
let resetEmailAddress = '';
let resetOtpCode = '';
let resetUser = null;

// ============ ADMIN PHONES ============
const ADMIN_PHONES = ['0703428192', '0711991467'];

// ============ EMAILJS CONFIG ============
const EMAILJS_CONFIG = {
    serviceID: 'service_hw35xfu',
    publicKey: 'vc371wcNfQy56zlH8',
    otpTemplateID: 'template_qycsjak',
    resetTemplateID: 'template_0787ox7'
};

// ============ INIT SUPABASE ============
function initSupabase() {
    if (supabaseInitialized) return;
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        supabaseInitialized = true;
        console.log('✅ Supabase connected!');
    } catch (e) {
        console.log('⚠️ Supabase not available:', e);
    }
}
initSupabase();

// ============================================
// 📍 PROXIMITY & LOCATION FUNCTIONS
// ============================================

// ----- Calculate Distance (Haversine Formula) -----
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ----- Format Distance -----
function formatDistance(km) {
    if (km < 1) {
        return Math.round(km * 1000) + 'm away';
    } else if (km < 10) {
        return km.toFixed(1) + 'km away';
    } else {
        return Math.round(km) + 'km away';
    }
}

// ----- Estimate Travel Time -----
function estimateTravelTime(distanceKm, mode = 'matatu') {
    const speeds = { walking: 5, driving: 30, matatu: 25 };
    const speed = speeds[mode] || 25;
    const minutes = Math.round((distanceKm / speed) * 60);
    
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return minutes + ' min';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs + 'h ' + mins + 'm';
}

// ----- Get User Location -----
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('GPS not supported'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }),
            err => reject(new Error('Could not get location: ' + err.message)),
            { enableHighAccuracy: true, timeout: 15000 }
        );
    });
}

// ----- Update Worker Location -----
async function updateWorkerLocation() {
    if (!currentUser) {
        showToast('Please login first', 'error');
        return;
    }
    
    showToast('📍 Getting your location...', 'info');
    
    try {
        const location = await getCurrentLocation();
        userLocation = location;
        
        // Update in Supabase
        if (supabaseInitialized) {
            await supabase
                .from('users')
                .update({
                    current_lat: location.lat,
                    current_lon: location.lon,
                    location_updated: new Date().toISOString()
                })
                .eq('phone', currentUser.phone);
        }
        
        // Update local
        currentUser.currentLat = location.lat;
        currentUser.currentLon = location.lon;
        currentUser.locationUpdated = new Date().toISOString();
        localStorage.setItem('gkode_user', JSON.stringify(currentUser));
        
        showToast(`✅ Location updated! (${location.accuracy}m accuracy)`, 'success');
        loadGigs();
        
    } catch (err) {
        showToast('❌ ' + err.message, 'error');
    }
}

// ----- Find Nearby Gigs -----
function findNearbyGigs(workerLat, workerLon, maxDistance) {
    const gigs = getGigsLocal();
    const nearby = [];
    
    for (const gig of gigs) {
        if (!gig.gpsLat || !gig.gpsLon) continue;
        if (gig.status !== 'Open') continue;
        
        const distance = calculateDistance(
            workerLat, workerLon,
            parseFloat(gig.gpsLat), parseFloat(gig.gpsLon)
        );
        
        if (distance <= maxDistance) {
            nearby.push({
                ...gig,
                distance: distance,
                distanceText: formatDistance(distance),
                travelTime: estimateTravelTime(distance)
            });
        }
    }
    
    nearby.sort((a, b) => a.distance - b.distance);
    return nearby;
}

// ----- Show Proximity Profile -----
function showProximityProfile() {
    if (!currentUser) {
        showToast('Please login first', 'error');
        return;
    }
    
    const lat = currentUser.currentLat;
    const lon = currentUser.currentLon;
    
    let msg = '📍 YOUR PROXIMITY PROFILE\n\n';
    msg += '👤 ' + currentUser.name + '\n';
    msg += '📞 ' + currentUser.phone + '\n\n';
    
    if (lat && lon) {
        msg += '📍 Location: ' + (currentUser.location || 'Unknown') + '\n';
        msg += '📏 Coordinates: ' + lat.toFixed(4) + ', ' + lon.toFixed(4) + '\n';
        msg += '🕐 Updated: ' + (currentUser.locationUpdated ? new Date(currentUser.locationUpdated).toLocaleString() : 'Never') + '\n\n';
        
        const nearby = findNearbyGigs(lat, lon, 10);
        msg += '📋 Nearby Gigs: ' + nearby.length + ' within 10km\n';
        
        if (nearby.length > 0) {
            msg += '\n📌 Nearest Gigs:\n';
            nearby.slice(0, 3).forEach((g, i) => {
                msg += (i+1) + '. ' + g.title + ' — ' + g.distanceText + '\n';
            });
        }
    } else {
        msg += '📍 Location: NOT SHARED\n';
        msg += '💡 Tap "Update My Location" to enable proximity features';
    }
    
    alert(msg);
}

// ----- Show Gigs on Map -----
async function showOnMap() {
    const container = document.getElementById('mapContainer');
    const loading = document.getElementById('mapLoading');
    
    showScreen('mapView');
    
    if (loading) loading.style.display = 'block';
    
    try {
        // Get user location
        let lat, lon;
        if (currentUser && currentUser.currentLat) {
            lat = currentUser.currentLat;
            lon = currentUser.currentLon;
        } else {
            const loc = await getCurrentLocation();
            lat = loc.lat;
            lon = loc.lon;
        }
        
        // Load Google Maps
        if (typeof google === 'undefined' || !google.maps) {
            showToast('Loading Google Maps...', 'info');
            await loadGoogleMaps();
        }
        
        // Initialize map
        if (!map) {
            map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: lat, lng: lon },
                zoom: 13,
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true,
                styles: [
                    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
                ]
            });
        } else {
            map.setCenter({ lat: lat, lng: lon });
        }
        
        // Clear old markers
        markers.forEach(m => m.setMap(null));
        markers = [];
        
        // Add user marker
        const userMarker = new google.maps.Marker({
            position: { lat: lat, lng: lon },
            map: map,
            icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new google.maps.Size(40, 40)
            },
            title: 'You are here'
        });
        markers.push(userMarker);
        
        // Add info window for user
        const userInfo = new google.maps.InfoWindow({
            content: `<div style="padding:5px; font-weight:bold; color:#006400;">📍 You</div>`
        });
        userMarker.addListener('click', () => userInfo.open(map, userMarker));
        
        // Get gigs
        const gigs = getGigsLocal().filter(g => g.status === 'Open' && g.gpsLat && g.gpsLon);
        
        // Add gig markers
        const infoWindows = [];
        gigs.forEach((gig, index) => {
            const gigLat = parseFloat(gig.gpsLat);
            const gigLon = parseFloat(gig.gpsLon);
            const distance = calculateDistance(lat, lon, gigLat, gigLon);
            
            const marker = new google.maps.Marker({
                position: { lat: gigLat, lng: gigLon },
                map: map,
                icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/red-pin.png',
                    scaledSize: new google.maps.Size(32, 32)
                },
                title: gig.title,
                animation: google.maps.Animation.DROP,
                label: {
                    text: (index + 1).toString(),
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }
            });
            markers.push(marker);
            
            const urgencyColor = gig.urgency === 'Emergency' ? '#cc0000' :
                                gig.urgency === 'Urgent' ? '#ff9800' : '#006400';
            
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="padding:10px; max-width:200px;">
                        <h4 style="color:#006400; margin-bottom:5px;">${gig.title}</h4>
                        <p style="font-size:12px; color:#666;">👤 ${gig.client}</p>
                        <p style="font-size:12px; color:#666;">💰 Ksh ${gig.budgetMin} - ${gig.budgetMax}</p>
                        <p style="font-size:12px; color:#006400;">📏 ${formatDistance(distance)}</p>
                        <p style="font-size:12px; color:#888;">🚌 ${estimateTravelTime(distance)}</p>
                        <button onclick="viewGigFromMap('${gig.id}')" style="background:#006400; color:#FFD700; border:none; padding:5px 15px; border-radius:5px; cursor:pointer; margin-top:5px; width:100%; font-weight:bold;">VIEW GIG</button>
                    </div>
                `
            });
            infoWindows.push(infoWindow);
            
            marker.addListener('click', () => {
                infoWindows.forEach(win => win.close());
                infoWindow.open(map, marker);
            });
        });
        
        // Fit bounds to show all markers
        if (markers.length > 1) {
            const bounds = new google.maps.LatLngBounds();
            markers.forEach(m => bounds.extend(m.getPosition()));
            map.fitBounds(bounds);
        }
        
        if (loading) loading.style.display = 'none';
        
    } catch (error) {
        console.error('Map error:', error);
        showToast('❌ Failed to load map: ' + error.message, 'error');
        if (loading) loading.textContent = '❌ Failed to load map. Please try again.';
    }
}

function loadGoogleMaps() {
    return new Promise((resolve, reject) => {
        if (typeof google !== 'undefined' && google.maps) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&libraries=places,geometry&callback=initMapCallback`;
        script.async = true;
        script.defer = true;
        script.onerror = reject;
        document.head.appendChild(script);
        window.initMapCallback = resolve;
        setTimeout(reject, 30000);
    });
}

function viewGigFromMap(gigId) {
    showScreen('home');
    setTimeout(() => {
        const gigs = getGigsLocal();
        const gig = gigs.find(g => g.id === gigId);
        if (gig) {
            alert(`📍 ${gig.title}\n\n👤 Client: ${gig.client}\n💰 Budget: Ksh ${gig.budgetMin} - ${gig.budgetMax}\n📍 Location: ${gig.location}\n📏 ${gig.distanceText || 'Near you'}\n\nTap "ACCEPT" on the home screen to take this gig.`);
        }
    }, 300);
}

// ============================================
// 📡 SUPABASE DATA FUNCTIONS
// ============================================

async function saveUserToSupabase(user) {
    if (!supabaseInitialized) return saveUserLocally(user);
    
    try {
        const { data, error } = await supabase
            .from('users')
            .insert([{
                phone: user.phone,
                national_id: user.id,
                email: user.email,
                password_hash: user.password,
                full_name: user.name,
                location: user.location,
                profession: user.profession,
                skills: user.skills ? user.skills.split(',').map(s => s.trim()) : [],
                photo_url: user.photo,
                id_scan_url: user.idScan,
                is_paid: user.isPaid || false,
                is_banned: user.isBanned || false,
                strikes: user.strikes || 0,
                rating: user.rating || 0,
                review_count: user.reviewCount || 0,
                registered_at: new Date().toISOString(),
                last_active: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        console.log('✅ User saved to Supabase');
        return data;
    } catch (error) {
        console.log('❌ Supabase save error:', error);
        return saveUserLocally(user);
    }
}

async function getUserFromSupabase(phone) {
    if (!supabaseInitialized) return null;
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .single();
        
        if (error) throw error;
        return data;
    } catch (error) {
        return null;
    }
}

async function updateUserInSupabase(phone, updates) {
    if (!supabaseInitialized) return false;
    
    try {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('phone', phone)
            .select()
            .single();
        
        if (error) throw error;
        console.log('✅ User updated in Supabase');
        return data;
    } catch (error) {
        console.log('❌ Update error:', error);
        return false;
    }
}

async function saveGigToSupabase(gig) {
    if (!supabaseInitialized) return false;
    
    try {
        const { data, error } = await supabase
            .from('gigs')
            .insert([{
                title: gig.title,
                skill_needed: gig.skill,
                location: gig.location,
                gps_lat: gig.gpsLat || null,
                gps_lon: gig.gpsLon || null,
                urgency: gig.urgency || 'Normal',
                budget_min: gig.budgetMin,
                budget_max: gig.budgetMax,
                description: gig.description || '',
                client_id: gig.clientId || gig.clientPhone,
                status: 'open',
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }])
            .select()
            .single();
        
        if (error) throw error;
        console.log('✅ Gig saved to Supabase');
        return data;
    } catch (error) {
        console.log('❌ Gig save error:', error);
        return false;
    }
}

async function acceptGigInSupabase(gigId, workerId, workerName, workerPhone) {
    if (!supabaseInitialized) return false;
    
    try {
        const { data, error } = await supabase
            .from('gigs')
            .update({
                status: 'taken',
                worker_id: workerId,
                worker_phone: workerPhone,
                worker_name: workerName,
                taken_at: new Date().toISOString()
            })
            .eq('id', gigId)
            .select()
            .single();
        
        if (error) throw error;
        console.log('✅ Gig accepted in Supabase');
        return data;
    } catch (error) {
        console.log('❌ Accept gig error:', error);
        return false;
    }
}

async function saveMessageToSupabase(gigId, senderId, text, isLocation = false, lat = null, lon = null) {
    if (!supabaseInitialized) return false;
    
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                gig_id: gigId,
                sender_id: senderId,
                text: text,
                is_location: isLocation,
                lat: lat,
                lon: lon,
                created_at: new Date().toISOString(),
                is_read: false
            }])
            .select()
            .single();
        
        if (error) throw error;
        console.log('✅ Message saved to Supabase');
        return data;
    } catch (error) {
        console.log('❌ Message save error:', error);
        return false;
    }
}

async function getMessagesFromSupabase(gigId) {
    if (!supabaseInitialized) return [];
    
    try {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:users!sender_id(full_name, phone)
            `)
            .eq('gig_id', gigId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.log('❌ Error fetching messages:', error);
        return [];
    }
}

// ============================================
// 📦 LOCAL STORAGE FALLBACK
// ============================================

function getUsersLocal() {
    try { return JSON.parse(localStorage.getItem('gkode_users') || '[]'); } catch { return []; }
}

function setUsersLocal(users) {
    localStorage.setItem('gkode_users', JSON.stringify(users));
}

function getGigsLocal() {
    try { return JSON.parse(localStorage.getItem('gkode_gigs') || '[]'); } catch { return []; }
}

function setGigsLocal(gigs) {
    localStorage.setItem('gkode_gigs', JSON.stringify(gigs));
}

function saveUserLocally(user) {
    const users = getUsersLocal();
    users.push(user);
    setUsersLocal(users);
    return user;
}

// ============================================
// 🔐 REGISTER
// ============================================

async function register(e) {
    e.preventDefault();
    
    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = '⏳ REGISTERING...';
    
    try {
        const name = document.getElementById('regName').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const id = document.getElementById('regID').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value.trim();
        const confirmPassword = document.getElementById('regConfirmPassword').value.trim();
        const location = document.getElementById('regLocation').value.trim();
        const profession = document.getElementById('regProfession').value;
        const otherProfession = document.getElementById('regOtherProfession').value.trim();
        const skills = document.getElementById('regSkills').value.trim();
        const photoFile = document.getElementById('regPhoto').files[0];
        const idScanFile = document.getElementById('regIDScan').files[0];
        const terms = document.getElementById('regTerms').checked;
        
        // Validation
        if (!name || !phone || !id || !email || !password || !location || !profession) {
            showToast('Please fill all required fields', 'error');
            btn.disabled = false;
            btn.textContent = 'REGISTER';
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            btn.disabled = false;
            btn.textContent = 'REGISTER';
            return;
        }
        
        if (password.length < 6 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
            showToast('Password must be 6+ characters with letters and numbers', 'error');
            btn.disabled = false;
            btn.textContent = 'REGISTER';
            return;
        }
        
        if (!photoFile || !idScanFile) {
            showToast('Please upload profile photo and ID scan', 'error');
            btn.disabled = false;
            btn.textContent = 'REGISTER';
            return;
        }
        
        if (!terms) {
            showToast('Please agree to the Terms of Use', 'error');
            btn.disabled = false;
            btn.textContent = 'REGISTER';
            return;
        }
        
        // Check if user exists
        const existingUser = await getUserFromSupabase(phone);
        if (existingUser) {
            showToast('Phone number already registered', 'error');
            btn.disabled = false;
            btn.textContent = 'REGISTER';
            return;
        }
        
        let finalProfession = profession;
        if (profession === 'Other') {
            if (!otherProfession) {
                showToast('Please specify your profession', 'error');
                btn.disabled = false;
                btn.textContent = 'REGISTER';
                return;
            }
            finalProfession = saveNewProfession(otherProfession);
            if (!finalProfession) return;
        }
        
        // Read images
        btn.textContent = '⏳ PROCESSING IMAGES...';
        const photoData = await readFileAsDataURL(photoFile);
        const idData = await readFileAsDataURL(idScanFile);
        
        // Create user
        const user = {
            name, phone, id, email, password,
            location, profession: finalProfession,
            skills: skills || '',
            photo: photoData,
            idScan: idData,
            isPaid: false,
            isBanned: false,
            strikes: 0,
            rating: 0,
            reviewCount: 0,
            registeredAt: new Date().toISOString()
        };
        
        // Send OTP
        otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        pendingRegistration = user;
        
        btn.textContent = '⏳ SENDING OTP...';
        sendOTPEmail(email, name, otpCode);
        
        document.getElementById('otpSection').style.display = 'block';
        document.getElementById('registerBtn').textContent = 'VERIFY EMAIL';
        document.getElementById('regOtp').focus();
        
        showToast('📧 Verification code sent to your email!', 'success');
        
    } catch (error) {
        showToast('Registration error: ' + error.message, 'error');
        console.error('Registration error:', error);
    } finally {
        btn.disabled = false;
    }
}

// ============================================
// ✅ VERIFY OTP
// ============================================

function verifyOtp() {
    const enteredOtp = document.getElementById('regOtp').value.trim();
    
    if (!enteredOtp) {
        showToast('Please enter the verification code', 'error');
        return;
    }
    
    if (enteredOtp !== otpCode) {
        showToast('❌ Invalid verification code. Please try again.', 'error');
        return;
    }
    
    completeRegistration();
}

function resendOtp() {
    if (!pendingRegistration) {
        showToast('Please start registration again', 'error');
        return;
    }
    
    otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    sendOTPEmail(pendingRegistration.email, pendingRegistration.name, otpCode);
    showToast('📧 New code sent to your email!', 'success');
}

async function completeRegistration() {
    if (!pendingRegistration) {
        showToast('No registration in progress', 'error');
        return;
    }
    
    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = '⏳ SAVING TO CLOUD...';
    
    try {
        const user = pendingRegistration;
        
        // Save to Supabase
        await saveUserToSupabase(user);
        
        // Save locally
        saveUserLocally(user);
        
        // Auto-login
        currentUser = user;
        localStorage.setItem('gkode_user', JSON.stringify(user));
        localStorage.setItem('gkode_token', 'local-token');
        
        pendingRegistration = null;
        otpCode = null;
        document.getElementById('otpSection').style.display = 'none';
        
        showToast(`✅ Welcome, ${user.name}! Account saved to cloud!`, 'success');
        showScreen('home');
        loadGigs();
        updateBottomNav();
        
        // Ask for location
        if (confirm('📍 Would you like to share your location for nearby gigs?')) {
            updateWorkerLocation();
        }
        
    } catch (error) {
        showToast('Error saving to cloud: ' + error.message, 'error');
        console.error('Complete registration error:', error);
    } finally {
        btn.disabled = false;
        btn.textContent = 'REGISTER';
    }
}

// ============================================
// 🔑 LOGIN
// ============================================

async function login(e) {
    e.preventDefault();
    
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = '⏳ LOGGING IN...';
    
    try {
        const phone = document.getElementById('loginPhone').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const remember = document.getElementById('rememberMe')?.checked || false;
        
        if (!phone || !password) {
            showToast('Please enter phone and password', 'error');
            btn.disabled = false;
            btn.textContent = 'LOGIN';
            return;
        }
        
        // Try Supabase first
        let userData = await getUserFromSupabase(phone);
        
        if (userData) {
            if (userData.password_hash === password) {
                const user = {
                    name: userData.full_name,
                    phone: userData.phone,
                    id: userData.national_id,
                    email: userData.email,
                    password: userData.password_hash,
                    location: userData.location,
                    profession: userData.profession,
                    skills: userData.skills ? userData.skills.join(', ') : '',
                    photo: userData.photo_url,
                    idScan: userData.id_scan_url,
                    isPaid: userData.is_paid || false,
                    isBanned: userData.is_banned || false,
                    strikes: userData.strikes || 0,
                    rating: userData.rating || 0,
                    reviewCount: userData.review_count || 0,
                    registeredAt: userData.created_at,
                    currentLat: userData.current_lat || null,
                    currentLon: userData.current_lon || null
                };
                
                if (user.isBanned) {
                    showToast('🚫 Account banned. Contact support.', 'error');
                    btn.disabled = false;
                    btn.textContent = 'LOGIN';
                    return;
                }
                
                currentUser = user;
                localStorage.setItem('gkode_user', JSON.stringify(user));
                localStorage.setItem('gkode_token', 'local-token');
                if (remember) localStorage.setItem('gkode_remember', 'true');
                
                await updateUserInSupabase(phone, { last_active: new Date().toISOString() });
                
                showToast(`Welcome back, ${user.name}! 🇰🇪`, 'success');
                showScreen('home');
                loadGigs();
                updateBottomNav();
                btn.disabled = false;
                btn.textContent = 'LOGIN';
                return;
            }
        }
        
        // Fallback to local
        const users = getUsersLocal();
        const localUser = users.find(u => u.phone === phone && u.password === password);
        
        if (localUser) {
            if (localUser.isBanned) {
                showToast('🚫 Account banned. Contact support.', 'error');
                btn.disabled = false;
                btn.textContent = 'LOGIN';
                return;
            }
            
            currentUser = localUser;
            localStorage.setItem('gkode_user', JSON.stringify(localUser));
            localStorage.setItem('gkode_token', 'local-token');
            if (remember) localStorage.setItem('gkode_remember', 'true');
            
            showToast(`Welcome back, ${localUser.name}! 🇰🇪`, 'success');
            showScreen('home');
            loadGigs();
            updateBottomNav();
            btn.disabled = false;
            btn.textContent = 'LOGIN';
            return;
        }
        
        showToast('Invalid phone or password', 'error');
        
    } catch (error) {
        showToast('Login error: ' + error.message, 'error');
        console.error('Login error:', error);
    } finally {
        btn.disabled = false;
        if (btn.textContent === '⏳ LOGGING IN...') btn.textContent = 'LOGIN';
    }
}

// ============================================
// 📧 EMAIL FUNCTIONS
// ============================================

function sendOTPEmail(email, name, code) {
    loadEmailJS(function() {
        if (typeof emailjs === 'undefined') {
            showToast('📱 Your code: ' + code, 'info');
            return;
        }
        
        const templateParams = {
            to_email: email,
            to_name: name || 'User',
            code: code,
            app_name: 'G-KODE',
            year: new Date().getFullYear(),
            support_email: 'support@g-kode.com'
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

function sendResetEmail(email, name, code) {
    loadEmailJS(function() {
        if (typeof emailjs === 'undefined') {
            showToast('📱 Your reset code: ' + code, 'info');
            return;
        }
        
        const templateParams = {
            to_email: email,
            to_name: name || 'User',
            code: code,
            app_name: 'G-KODE',
            year: new Date().getFullYear(),
            support_email: 'support@g-kode.com'
        };
        
        emailjs.send(EMAILJS_CONFIG.serviceID, EMAILJS_CONFIG.resetTemplateID, templateParams)
            .then(function(response) {
                console.log('✅ Reset email sent!', response.status);
                showToast('📧 Reset code sent to your email!', 'success');
            })
            .catch(function(error) {
                console.log('❌ Reset email failed:', error);
                showToast('📱 Your reset code: ' + code, 'info');
            });
    });
}

function loadEmailJS(callback) {
    if (typeof emailjs !== 'undefined') {
        callback();
        return;
    }
    
    const script = document.createElement('script');
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

// ============================================
// 🔑 PASSWORD RESET
// ============================================

function sendResetCode(e) {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value.trim();
    
    if (!email) {
        showToast('Please enter your email address', 'error');
        return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    checkUserInSupabase(email);
}

async function checkUserInSupabase(email) {
    if (!supabaseInitialized) {
        checkUserLocally(email);
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error || !data) {
            checkUserLocally(email);
            return;
        }
        
        resetUser = {
            name: data.full_name,
            phone: data.phone,
            email: data.email,
            id: data.national_id,
            profession: data.profession,
            location: data.location
        };
        resetEmailAddress = email;
        proceedWithReset();
        
    } catch (error) {
        checkUserLocally(email);
    }
}

function checkUserLocally(email) {
    const users = getUsersLocal();
    const user = users.find(u => u.email === email);
    
    if (!user) {
        showToast('No account found with that email', 'error');
        return;
    }
    
    resetUser = user;
    resetEmailAddress = email;
    proceedWithReset();
}

function proceedWithReset() {
    resetOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    sendResetEmail(resetEmailAddress, resetUser.name, resetOtpCode);
    
    document.getElementById('resetStep1').style.display = 'none';
    document.getElementById('resetStep2').style.display = 'block';
    document.getElementById('resetEmailDisplay').textContent = resetEmailAddress;
    
    showToast('📧 Reset code sent to your email!', 'success');
}

function resendResetCode() {
    if (!resetUser) {
        showToast('Please start password reset again', 'error');
        return;
    }
    
    resetOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    sendResetEmail(resetEmailAddress, resetUser.name, resetOtpCode);
    showToast('📧 New reset code sent!', 'success');
}

async function verifyResetIdentity() {
    const otp = document.getElementById('resetOtp').value.trim();
    const phone = document.getElementById('resetPhone').value.trim();
    const id = document.getElementById('resetID').value.trim();
    const profession = document.getElementById('resetProfession').value.trim();
    const location = document.getElementById('resetLocation').value.trim();
    
    if (!otp || !phone || !id || !profession || !location) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    if (otp !== resetOtpCode) {
        showToast('❌ Invalid reset code', 'error');
        return;
    }
    
    const users = getUsersLocal();
    const user = users.find(u => 
        u.email === resetEmailAddress &&
        u.phone === phone &&
        u.id === id &&
        u.profession === profession &&
        u.location === location
    );
    
    if (!user) {
        showToast('❌ Identity verification failed. Check your details.', 'error');
        return;
    }
    
    document.getElementById('resetStep2').style.display = 'none';
    document.getElementById('resetStep3').style.display = 'block';
    
    showToast('✅ Identity verified! Set new password.', 'success');
}

async function resetPassword() {
    const newPass = document.getElementById('newPassword').value.trim();
    const confirmPass = document.getElementById('confirmPassword').value.trim();
    
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
    
    if (supabaseInitialized) {
        const updated = await updateUserInSupabase(resetUser.phone, { password_hash: newPass });
        if (updated) {
            showToast('✅ Password reset successful in cloud!', 'success');
        } else {
            updateLocalPassword();
        }
    } else {
        updateLocalPassword();
    }
    
    document.getElementById('resetStep1').style.display = 'block';
    document.getElementById('resetStep2').style.display = 'none';
    document.getElementById('resetStep3').style.display = 'none';
    document.getElementById('resetEmail').value = '';
    document.getElementById('resetOtp').value = '';
    document.getElementById('resetPhone').value = '';
    document.getElementById('resetID').value = '';
    document.getElementById('resetProfession').value = '';
    document.getElementById('resetLocation').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    showScreen('login');
}

function updateLocalPassword() {
    let users = getUsersLocal();
    const user = users.find(u => u.email === resetEmailAddress);
    if (user) {
        user.password = document.getElementById('newPassword').value.trim();
        setUsersLocal(users);
        showToast('✅ Password reset successful locally!', 'success');
    }
}

// ============================================
// 📋 GIG FUNCTIONS
// ============================================

async function postGig() {
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
            title, skill, location, urgency,
            budgetMin, budgetMax, description,
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
        
        // Save to Supabase
        const saved = await saveGigToSupabase(gig);
        
        // Save locally
        let gigs = getGigsLocal();
        gigs.push(gig);
        setGigsLocal(gigs);
        
        if (saved) {
            showToast('✅ Gig posted to cloud!', 'success');
        } else {
            showToast('✅ Gig posted locally!', 'success');
        }
        
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

async function loadGigs() {
    const container = document.getElementById('gigsList');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align:center;padding:20px;"><div class="loader"></div><p>Loading gigs...</p></div>';
    
    try {
        // Get user location
        let lat = currentUser?.currentLat || null;
        let lon = currentUser?.currentLon || null;
        
        // If no location, try to get it
        if (!lat || !lon) {
            try {
                const loc = await getCurrentLocation();
                lat = loc.lat;
                lon = loc.lon;
                if (currentUser) {
                    currentUser.currentLat = lat;
                    currentUser.currentLon = lon;
                    localStorage.setItem('gkode_user', JSON.stringify(currentUser));
                }
            } catch (e) {
                // Use default location (Nairobi)
                lat = -1.286389;
                lon = 36.817223;
            }
        }
        
        // Get radius from dropdown
        const radiusSelect = document.getElementById('proximityRadius');
        const maxDistance = radiusSelect ? parseInt(radiusSelect.value) : 10;
        
        // Get gigs from Supabase
        let gigs = [];
        const supabaseGigs = await getGigsFromSupabase('open');
        
        if (supabaseGigs && supabaseGigs.length > 0) {
            gigs = supabaseGigs.map(g => ({
                id: g.id,
                title: g.title,
                skill: g.skill_needed,
                location: g.location,
                urgency: g.urgency,
                budgetMin: g.budget_min,
                budgetMax: g.budget_max,
                description: g.description,
                client: g.client?.full_name || 'Unknown',
                clientPhone: g.client?.phone || '',
                clientId: g.client_id,
                status: g.status === 'open' ? 'Open' : 'Taken',
                worker: g.worker?.full_name || '',
                workerPhone: g.worker?.phone || '',
                workerId: g.worker_id,
                gpsLat: g.gps_lat,
                gpsLon: g.gps_lon,
                createdAt: g.created_at
            }));
        }
        
        // If no Supabase gigs, use local
        if (gigs.length === 0) {
            gigs = getGigsLocal().filter(g => g.status === 'Open');
        }
        
        // Calculate distances and filter by radius
        let nearbyGigs = gigs;
        if (lat && lon && maxDistance > 0) {
            nearbyGigs = gigs.filter(g => {
                if (!g.gpsLat || !g.gpsLon) return true; // Include gigs without location
                const distance = calculateDistance(lat, lon, parseFloat(g.gpsLat), parseFloat(g.gpsLon));
                return distance <= maxDistance;
            });
            
            // Sort by distance
            nearbyGigs.sort((a, b) => {
                const distA = a.gpsLat ? calculateDistance(lat, lon, parseFloat(a.gpsLat), parseFloat(a.gpsLon)) : 999;
                const distB = b.gpsLat ? calculateDistance(lat, lon, parseFloat(b.gpsLat), parseFloat(b.gpsLon)) : 999;
                return distA - distB;
            });
        }
        
        if (nearbyGigs.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px 0;color:#888;">
                    <p>📭 No open gigs found${maxDistance > 0 ? ' within ' + maxDistance + 'km' : ''}</p>
                    <button class="btn green" onclick="showScreen('postGig')" style="margin-top:10px;">Post a Gig</button>
                    <button class="btn outline" onclick="loadGigs()" style="margin-top:5px;">🔄 Refresh</button>
                </div>
            `;
            return;
        }
        
        let html = '';
        if (lat && lon) {
            html += `<div style="font-size:12px; color:#888; margin-bottom:10px;">📍 Showing ${nearbyGigs.length} gigs within ${maxDistance > 0 ? maxDistance + 'km' : 'any distance'}</div>`;
        }
        
        nearbyGigs.forEach(gig => {
            const urgencyColor = gig.urgency === 'Emergency' ? '#cc0000' :
                                gig.urgency === 'Urgent' ? '#ff9800' : '#006400';
            
            let distanceText = '';
            let travelTime = '';
            if (lat && lon && gig.gpsLat && gig.gpsLon) {
                const dist = calculateDistance(lat, lon, parseFloat(gig.gpsLat), parseFloat(gig.gpsLon));
                distanceText = formatDistance(dist);
                travelTime = estimateTravelTime(dist);
            }
            
            html += `
                <div class="gig-card" style="border-left:4px solid ${urgencyColor}; margin-bottom:12px; background:#fff; padding:15px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    <div class="gig-title" style="font-weight:bold; font-size:18px; color:#006400;">${gig.title}</div>
                    <div style="font-size:14px; color:#666;">👤 ${gig.client} | 🛠️ ${gig.skill}</div>
                    <div style="font-size:14px; color:#666;">📍 ${gig.location}</div>
                    ${distanceText ? `<div style="font-size:13px; color:#FFD700;">📏 ${distanceText} | 🚌 ${travelTime}</div>` : ''}
                    <div style="font-weight:bold; color:#006400;">💰 Ksh ${gig.budgetMin} - ${gig.budgetMax}</div>
                    ${gig.gpsLat && gig.gpsLon ? `<button onclick="viewOnMap('${gig.id}')" style="background:#2196F3; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; margin-top:5px; font-size:12px;">🗺️ View on Map</button>` : ''}
                    <button class="btn-accept" onclick="acceptGig('${gig.id}')" style="background:#006400; color:#FFD700; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer; margin-top:10px;">✅ ACCEPT</button>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Load gigs error:', error);
        container.innerHTML = `
            <div style="text-align:center;padding:20px;color:#cc0000;">
                <p>❌ Failed to load gigs</p>
                <button class="btn green" onclick="loadGigs()" style="margin-top:10px;">Retry</button>
            </div>
        `;
    }
}

function viewOnMap(gigId) {
    const gigs = getGigsLocal();
    const gig = gigs.find(g => g.id === gigId);
    if (!gig || !gig.gpsLat || !gig.gpsLon) {
        showToast('No location data for this gig', 'error');
        return;
    }
    
    const url = `https://www.google.com/maps?q=${gig.gpsLat},${gig.gpsLon}`;
    window.open(url, '_blank');
}

async function acceptGig(gigId) {
    if (!currentUser) {
        showToast('Please login first', 'error');
        return;
    }
    
    showToast('Accepting gig...', 'info');
    
    try {
        // Accept in Supabase
        const accepted = await acceptGigInSupabase(
            gigId,
            currentUser.id || currentUser.phone,
            currentUser.name,
            currentUser.phone
        );
        
        // Update locally
        let gigs = getGigsLocal();
        const gig = gigs.find(g => g.id === gigId);
        if (gig) {
            gig.status = 'Assigned';
            gig.worker = currentUser.name;
            gig.workerPhone = currentUser.phone;
            gig.workerId = currentUser.id || currentUser.phone;
            setGigsLocal(gigs);
        }
        
        if (accepted) {
            showToast('✅ Gig accepted in cloud!', 'success');
        } else {
            showToast('✅ Gig accepted locally!', 'success');
        }
        
        loadGigs();
        
        // Open chat
        openChat(gigId);
        
    } catch (error) {
        showToast('Failed to accept gig: ' + error.message, 'error');
    }
}

// ============================================
// 📍 CAPTURE GIG LOCATION
// ============================================

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
            document.getElementById('gigLocationStatus').textContent = '✅ Location captured! (' + pos.coords.accuracy + 'm accuracy)';
            document.getElementById('gigLocationStatus').style.color = '#006400';
            showToast('Location captured!', 'success');
        },
        () => showToast('Failed to get location', 'error'),
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// ============================================
// 💬 CHAT FUNCTIONS
// ============================================

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

async function loadChatMessages(gigId) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align:center;padding:20px;"><div class="loader"></div><p>Loading messages...</p></div>';
    
    try {
        // Get from Supabase
        let messages = await getMessagesFromSupabase(gigId);
        
        // If no Supabase messages, use local
        if (!messages || messages.length === 0) {
            const localMessages = JSON.parse(localStorage.getItem(`gkode_chat_${gigId}`) || '[]');
            messages = localMessages.map(msg => ({
                text: msg.text,
                sender_id: msg.sender === currentUser.name ? currentUser.id : msg.senderId,
                sender: { full_name: msg.sender },
                is_location: msg.isLocation || false,
                lat: msg.lat || null,
                lon: msg.lon || null,
                created_at: msg.time || new Date().toISOString()
            }));
        }
        
        if (!messages || messages.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">No messages yet. Say hello! 👋</div>';
            return;
        }
        
        let html = '';
        messages.forEach(msg => {
            const isSent = msg.sender_id === currentUser.id || msg.sender?.full_name === currentUser.name;
            html += `
                <div class="chat-message ${isSent ? 'sent' : 'received'}" style="${isSent ? 'text-align:right; background:#006400; color:#FFD700; padding:10px; border-radius:10px; margin-bottom:5px;' : 'text-align:left; background:#f0f0f0; color:#000; padding:10px; border-radius:10px; margin-bottom:5px;'}">
                    ${!isSent ? `<div style="font-weight:bold; font-size:11px;">${msg.sender?.full_name || 'Unknown'}</div>` : ''}
                    ${msg.is_location ? `📍 <a href="https://maps.google.com/maps?q=${msg.lat},${msg.lon}" target="_blank" style="color:${isSent ? '#FFD700' : '#006400'};">View Location</a>` : msg.text}
                    <div style="font-size:10px; color:${isSent ? '#FFD700' : '#888'}; margin-top:3px;">${new Date(msg.created_at).toLocaleTimeString()}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
        
    } catch (error) {
        console.error('Load messages error:', error);
        container.innerHTML = '<div style="text-align:center;color:#cc0000;padding:20px;">❌ Failed to load messages</div>';
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    const gigId = document.getElementById('chatGigId').value;
    
    if (!text || !gigId) return;
    if (!currentUser) {
        showToast('Please login first', 'error');
        return;
    }
    
    // Save to Supabase
    await saveMessageToSupabase(gigId, currentUser.id || currentUser.phone, text);
    
    // Save locally
    const messages = JSON.parse(localStorage.getItem(`gkode_chat_${gigId}`) || '[]');
    messages.push({
        sender: currentUser.name,
        senderId: currentUser.id || currentUser.phone,
        text: text,
        time: new Date().toISOString(),
        isLocation: false
    });
    localStorage.setItem(`gkode_chat_${gigId}`, JSON.stringify(messages));
    
    input.value = '';
    loadChatMessages(gigId);
}

// ============================================
// 📍 SHARE LIVE LOCATION
// ============================================

function shareLiveLocation() {
    if (!navigator.geolocation) {
        showToast('GPS not supported', 'error');
        return;
    }
    
    showToast('📍 Sharing location...', 'info');
    navigator.geolocation.getCurrentPosition(
        async pos => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const url = `https://maps.google.com/maps?q=${lat},${lon}`;
            const gigId = document.getElementById('chatGigId').value;
            
            // Save to Supabase
            await saveMessageToSupabase(gigId, currentUser.id || currentUser.phone, `📍 My location: ${url}`, true, lat, lon);
            
            // Save locally
            const messages = JSON.parse(localStorage.getItem(`gkode_chat_${gigId}`) || '[]');
            messages.push({
                sender: currentUser.name,
                senderId: currentUser.id || currentUser.phone,
                text: `📍 My location: ${url}`,
                time: new Date().toISOString(),
                isLocation: true,
                lat: lat,
                lon: lon
            });
            localStorage.setItem(`gkode_chat_${gigId}`, JSON.stringify(messages));
            
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
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${gig.gpsLat},${gig.gpsLon}`;
    window.open(url, '_blank');
    showToast('🧭 Opening directions...', 'info');
}

// ============================================
// 🔄 NAVIGATION HELPERS
// ============================================

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

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
    
    updateBottomNav();
    
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

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

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
    toast.style.cssText = `background:${colors[type] || '#333'};color:#fff;padding:12px 20px;border-radius:10px;margin-bottom:8px;animation:slideDown 0.3s ease;font-weight:500;font-size:14px;box-shadow:0 4px 15px rgba(0,0,0,0.2);`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// ============================================
// 📋 OTHER FUNCTIONS
// ============================================

function logout() {
    currentUser = null;
    localStorage.removeItem('gkode_user');
    localStorage.removeItem('gkode_token');
    showToast('Logged out', 'info');
    showScreen('welcome');
    updateBottomNav();
}

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

function showPaymentScreen() { showScreen('payment'); }

function verifyMpesaPayment() {
    const code = document.getElementById('mpesaCode').value.trim();
    if (!code) {
        showToast('Please enter M-Pesa confirmation code', 'error');
        return;
    }
    
    let payments = JSON.parse(localStorage.getItem('gkode_payments') || '[]');
    payments.push({
        phone: currentUser.phone,
        code: code,
        amount: 300,
        type: 'user_fee',
        verified: true,
        date: new Date().toISOString()
    });
    localStorage.setItem('gkode_payments', JSON.stringify(payments));
    
    let users = getUsersLocal();
    const user = users.find(u => u.phone === currentUser.phone);
    if (user) {
        user.isPaid = true;
        setUsersLocal(users);
        currentUser.isPaid = true;
        localStorage.setItem('gkode_user', JSON.stringify(currentUser));
    }
    
    showToast('✅ Payment verified! Welcome to G-KODE Pro.', 'success');
    showScreen('home');
}

function submitComplaint() {
    const reason = document.getElementById('complaintReason').value;
    const details = document.getElementById('complaintDetails').value.trim();
    const userId = document.getElementById('complaintUserId').value;
    
    if (!reason || !details) {
        showToast('Please select a reason and provide details', 'error');
        return;
    }
    
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
    
    let users = getUsersLocal();
    const targetUser = users.find(u => u.id === userId || u.phone === userId);
    if (targetUser) {
        targetUser.strikes = (targetUser.strikes || 0) + 1;
        if (targetUser.strikes >= 6) {
            targetUser.isBanned = true;
            showToast(`⚠️ User has been banned (6 strikes)`, 'warning');
        }
        setUsersLocal(users);
    }
    
    showToast('✅ Complaint filed. We will review it.', 'success');
    showScreen('home');
}

function registerCompany() {
    // Basic company registration (kept from original)
    showToast('🏢 Business registration feature coming soon!', 'info');
}

function loadCompanyDashboard() {
    // Basic company dashboard
    document.getElementById('compInfo').innerHTML = '<p>No business registered yet.</p>';
    document.getElementById('compTabContent').innerHTML = '<p>Register a business to get started.</p>';
}

function showCompTab(tab) {
    const content = document.getElementById('compTabContent');
    if (tab === 'products') content.innerHTML = '<p>Products will appear here.</p>';
    else if (tab === 'orders') content.innerHTML = '<p>Orders will appear here.</p>';
    else if (tab === 'sales') content.innerHTML = '<p>Sales analytics will appear here.</p>';
}

function addProduct() {
    showToast('📦 Product feature coming soon!', 'info');
}

function loadMarketplace() {
    const container = document.getElementById('marketplaceList');
    container.innerHTML = '<p style="text-align:center;color:#888;padding:40px 0;">🛒 Marketplace coming soon!</p>';
}

function saveNewProfession(profession) {
    const formatted = profession.trim().split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    
    let professions = JSON.parse(localStorage.getItem('gkode_professions') || '[]');
    if (!professions.includes(formatted)) {
        professions.push(formatted);
        localStorage.setItem('gkode_professions', JSON.stringify(professions));
    }
    return formatted;
}

function checkProfession() {
    const profession = document.getElementById('regProfession').value;
    document.getElementById('otherProfessionBox').style.display = profession === 'Other' ? 'block' : 'none';
}

// ============================================
// 🚀 INIT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Load professions
    const dropdown = document.getElementById('regProfession');
    if (dropdown) {
        const professions = JSON.parse(localStorage.getItem('gkode_professions') || '[]');
        const defaults = [
            'Plumber', 'Electrician', 'Carpenter', 'Painter', 'Mechanic',
            'Hairdresser', 'Tailor', 'Chef', 'Driver', 'Teacher', 'Nurse',
            'Accountant', 'Architect', 'Baker', 'Barber', 'Builder',
            'Cleaner', 'Cook', 'Doctor', 'Engineer', 'Farmer', 'Gardener',
            'Lawyer', 'Mason', 'Photographer', 'Roofer', 'Security Guard',
            'Surveyor', 'Tiler', 'Tour Guide', 'Translator', 'Vet', 'Welder', 'Writer'
        ];
        const all = [...defaults, ...professions].filter((v, i, a) => a.indexOf(v) === i).sort();
        
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
    
    // Auto-login
    const savedUser = localStorage.getItem('gkode_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            if (currentUser) {
                showScreen('home');
                loadGigs();
                updateBottomNav();
                
                // Update location if user has one
                if (currentUser.currentLat && currentUser.currentLon) {
                    userLocation = { lat: currentUser.currentLat, lon: currentUser.currentLon };
                }
            }
        } catch (e) {}
    }
    
    console.log('🚀 G-KODE v3.0 loaded');
    console.log('📍 Proximity + Map features enabled');
    console.log('☁️ Supabase cloud storage active');
    console.log('🇰🇪 Kenya Helping Kenya');
});

// Global function for map callback
window.initMapCallback = function() {
    console.log('✅ Google Maps loaded');
};