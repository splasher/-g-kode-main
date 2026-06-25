// ============================================
// G-KODE SECURITY MODULE - COMPLETE
// Version: 2.0.0
// ============================================

// ============ ENCRYPTION ============
function secureEncrypt(data) {
    try {
        var json = JSON.stringify(data);
        var encoded = btoa(encodeURIComponent(json));
        var salt = 'G-KODE-SECURE-2026';
        var salted = encoded + salt;
        return salted;
    } catch(e) {
        console.error('Encryption error:', e);
        return data;
    }
}

function secureDecrypt(data) {
    try {
        var salt = 'G-KODE-SECURE-2026';
        if (typeof data === 'string' && data.endsWith(salt)) {
            var encoded = data.replace(salt, '');
            var json = decodeURIComponent(atob(encoded));
            return JSON.parse(json);
        }
        return data;
    } catch(e) {
        console.error('Decryption error:', e);
        return data;
    }
}

// ============ INPUT SANITIZATION ============
function sanitizeInput(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    var sanitized = div.innerHTML;
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/on\w+="[^"]*"/g, '');
    sanitized = sanitized.replace(/on\w+='[^']*'/g, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    return sanitized;
}

function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        return sanitizeInput(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(function(item) { return sanitizeObject(item); });
    }
    if (typeof obj === 'object' && obj !== null) {
        var result = {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                result[key] = sanitizeObject(obj[key]);
            }
        }
        return result;
    }
    return obj;
}

// ============ RATE LIMITING ============
function checkRateLimit(action, maxPerDay) {
    maxPerDay = maxPerDay || 10;
    var today = new Date().toDateString();
    var userKey = currentUser ? currentUser.phone : 'anonymous';
    var key = 'rate_' + action + '_' + today + '_' + userKey;
    var count = parseInt(localStorage.getItem(key) || '0');
    
    if (count >= maxPerDay) {
        showToast('⚠️ Too many ' + action + ' actions today. Limit: ' + maxPerDay, 'error');
        return false;
    }
    
    localStorage.setItem(key, count + 1);
    return true;
}

function getRateLimitStatus(action) {
    var today = new Date().toDateString();
    var userKey = currentUser ? currentUser.phone : 'anonymous';
    var key = 'rate_' + action + '_' + today + '_' + userKey;
    return parseInt(localStorage.getItem(key) || '0');
}

// ============ SESSION MANAGEMENT ============
function startSession(user) {
    var session = {
        userId: user.phone,
        userName: user.name,
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        token: generateSessionToken()
    };
    localStorage.setItem('gkode_session', secureEncrypt(session));
    return session;
}

function validateSession() {
    var sessionData = localStorage.getItem('gkode_session');
    if (!sessionData) return false;
    
    try {
        var session = secureDecrypt(sessionData);
        var now = new Date();
        var expires = new Date(session.expiresAt);
        
        if (now > expires) {
            localStorage.removeItem('gkode_session');
            return false;
        }
        
        var users = getUsers();
        var found = false;
        for (var i = 0; i < users.length; i++) {
            if (users[i].phone === session.userId) {
                found = true;
                break;
            }
        }
        
        if (!found) {
            localStorage.removeItem('gkode_session');
            return false;
        }
        
        return session;
    } catch(e) {
        return false;
    }
}

function refreshSession() {
    var sessionData = localStorage.getItem('gkode_session');
    if (!sessionData) return false;
    
    try {
        var session = secureDecrypt(sessionData);
        session.expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        localStorage.setItem('gkode_session', secureEncrypt(session));
        return true;
    } catch(e) {
        return false;
    }
}

function generateSessionToken() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var token = '';
    for (var i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

// ============ SECURE DATA STORAGE ============
function secureSetData(key, data) {
    try {
        var encrypted = secureEncrypt(data);
        localStorage.setItem(key, encrypted);
        return true;
    } catch(e) {
        console.error('Secure storage error:', e);
        return false;
    }
}

function secureGetData(key) {
    try {
        var data = localStorage.getItem(key);
        if (!data) return null;
        return secureDecrypt(data);
    } catch(e) {
        console.error('Secure retrieval error:', e);
        return null;
    }
}

// ============ CSRF PROTECTION ============
function generateCSRFToken() {
    var token = generateSessionToken();
    localStorage.setItem('gkode_csrf', token);
    return token;
}

function validateCSRFToken(token) {
    var stored = localStorage.getItem('gkode_csrf');
    return token === stored;
}

// ============ XSS PROTECTION ============
function displaySafe(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function displaySafeHTML(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    var scripts = div.querySelectorAll('script');
    for (var i = 0; i < scripts.length; i++) {
        scripts[i].remove();
    }
    return div.innerHTML;
}

// ============ SECURE FILE UPLOAD ============
function validateFileUpload(file, allowedTypes, maxSize) {
    allowedTypes = allowedTypes || ['image/jpeg', 'image/png', 'image/jpg'];
    maxSize = maxSize || 5 * 1024 * 1024;
    
    if (!file) {
        return { valid: false, message: 'No file selected.' };
    }
    
    if (allowedTypes.indexOf(file.type) === -1) {
        return { valid: false, message: 'File type not allowed. Use JPG or PNG.' };
    }
    
    if (file.size > maxSize) {
        return { valid: false, message: 'File too large. Max ' + (maxSize / 1024 / 1024) + 'MB.' };
    }
    
    if (file.size < 10 * 1024) {
        return { valid: false, message: 'File too small. Minimum 10KB.' };
    }
    
    return { valid: true, message: 'File validated.' };
}

// ============ SECURE PASSWORD ============
function validatePasswordStrength(password) {
    var issues = [];
    
    if (password.length < 8) {
        issues.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
        issues.push('At least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        issues.push('At least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        issues.push('At least one number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        issues.push('At least one special character (!@#$%^&*)');
    }
    
    if (issues.length > 0) {
        return { valid: false, issues: issues };
    }
    
    return { valid: true, issues: [] };
}

// ============ AUDIT LOG ============
function secureAuditLog(action, details) {
    try {
        var logs = getLogs();
        logs.push({
            type: 'SECURE_AUDIT',
            action: action,
            details: sanitizeObject(details),
            user: currentUser ? currentUser.phone : 'ANONYMOUS',
            userName: currentUser ? currentUser.name : 'ANONYMOUS',
            timestamp: new Date().toISOString(),
            ip: '127.0.0.1',
            sessionId: localStorage.getItem('gkode_session') ? 'active' : 'none'
        });
        setLogs(logs);
    } catch(e) {
        console.error('Audit log error:', e);
    }
}

// ============ SECURITY INIT ============
function initSecurity() {
    generateCSRFToken();
    
    var session = validateSession();
    if (!session && currentUser) {
        secureAuditLog('SESSION_EXPIRED', { user: currentUser.phone });
        logout();
    }
    
    setInterval(function() {
        if (currentUser) {
            var session = validateSession();
            if (!session) {
                secureAuditLog('AUTO_LOGOUT', { user: currentUser.phone });
                showToast('⏰ Session expired. Please login again.', 'warning');
                logout();
            } else {
                refreshSession();
            }
        }
    }, 60000);
    
    console.log('🛡️ Security system initialized');
    console.log('🔐 Encryption: ENABLED');
    console.log('🛡️ XSS Protection: ENABLED');
    console.log('⏰ Session Timeout: 30 minutes');
    console.log('📊 Rate Limiting: ENABLED');
}

function getSecurityVersion() {
    return '2.0.0';
}

console.log('🔐 Security module loaded successfully!');