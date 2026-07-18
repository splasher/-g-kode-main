// ============================================
// G-KODE - UNIVERSAL APP v5.0
// One App, Every Device, Scale Forever
// Kenya Helping Kenya 🇰🇪
// ============================================

// ============================================
// 🌐 DEVICE DETECTION & ADAPTATION SYSTEM
// ============================================

const Device = {
  // Detect device type
  type: (function () {
    const ua = navigator.userAgent;
    if (/Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile/i.test(ua))
      return "mobile";
    if (/Tablet|iPad|Kindle|PlayBook/i.test(ua)) return "tablet";
    if (/Windows|Mac|Linux|Chrome OS/i.test(ua)) return "desktop";
    return "unknown";
  })(),

  // Detect screen size
  screen: {
    width: window.innerWidth,
    height: window.innerHeight,
    isSmall: window.innerWidth < 480,
    isMedium: window.innerWidth >= 480 && window.innerWidth < 768,
    isLarge: window.innerWidth >= 768,
  },

  // Detect device capabilities
  capabilities: (function () {
    let memory = 2; // Safe default
    try {
      if (navigator.deviceMemory) memory = navigator.deviceMemory;
      else if (Device.type === "mobile") memory = 2;
      else if (Device.type === "tablet") memory = 4;
      else memory = 8;
    } catch (e) {
      memory = 2;
    }

    let cores = 2;
    try {
      if (navigator.hardwareConcurrency) cores = navigator.hardwareConcurrency;
    } catch (e) {
      cores = 2;
    }

    return {
      memory: memory,
      cores: cores,
      hasCamera: !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      ),
      isTouch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      connection: (function () {
        try {
          if (navigator.connection)
            return navigator.connection.effectiveType || "unknown";
          return "unknown";
        } catch (e) {
          return "unknown";
        }
      })(),
    };
  })(),

  // Summary
  summary: function () {
    return {
      type: this.type,
      screen: `${this.screen.width}x${this.screen.height}`,
      memory: this.capabilities.memory + "GB",
      cores: this.capabilities.cores,
      touch: this.capabilities.isTouch ? "Yes" : "No",
      connection: this.capabilities.connection,
    };
  },
};

console.log("🌐 Device:", Device.summary());

// ============================================
// 📊 ADAPTIVE SETTINGS BASED ON DEVICE
// ============================================

const Adaptive = {
  // Image settings - Auto adjusts based on device
  images: {
    maxWidth:
      Device.capabilities.memory <= 2
        ? 200
        : Device.capabilities.memory <= 4
          ? 400
          : 800,
    maxHeight:
      Device.capabilities.memory <= 2
        ? 200
        : Device.capabilities.memory <= 4
          ? 400
          : 800,
    quality:
      Device.capabilities.memory <= 2
        ? 0.4
        : Device.capabilities.memory <= 4
          ? 0.6
          : 0.8,
    maxFileSize:
      Device.capabilities.memory <= 2
        ? 2 * 1024 * 1024
        : Device.capabilities.memory <= 4
          ? 4 * 1024 * 1024
          : 10 * 1024 * 1024,
  },

  // Feature flags
  features: {
    camera: Device.capabilities.hasCamera && Device.capabilities.memory > 1,
    liveLocation: Device.capabilities.memory > 1,
    animations: Device.capabilities.memory > 1.5,
    backgroundSync:
      Device.capabilities.memory > 2 && "serviceWorker" in navigator,
    highQuality: Device.capabilities.memory > 4,
  },

  // Performance settings
  performance: {
    debounceDelay: Device.capabilities.memory <= 2 ? 500 : 300,
    throttleDelay: Device.capabilities.memory <= 2 ? 300 : 100,
    batchSize:
      Device.capabilities.memory <= 2
        ? 5
        : Device.capabilities.memory <= 4
          ? 20
          : 50,
    cacheTTL: Device.capabilities.memory <= 2 ? 60 : 300,
  },
};

console.log("📊 Adaptive settings loaded:", Adaptive.features);

// ============================================
// 🛡️ SECURITY SYSTEM (HARDENED)
// ============================================

const ENCRYPTION_SALT = "G-KODE-ULTRA-2026-QUANTUM";

function secureEncrypt(data) {
  try {
    if (typeof data === "undefined" || data === null) return data;
    const json = JSON.stringify(data);
    let encoded = btoa(encodeURIComponent(json));
    let xored = "";
    for (let i = 0; i < encoded.length; i++) {
      const charCode = encoded.charCodeAt(i) ^ 47;
      xored += String.fromCharCode(charCode);
    }
    const timestamp = Date.now();
    return xored + "|||" + timestamp + "|||" + ENCRYPTION_SALT;
  } catch (e) {
    console.error("🔴 Encryption failed:", e);
    return data;
  }
}

function secureDecrypt(data) {
  try {
    if (!data || typeof data !== "string") return data;
    if (!data.includes("|||" + ENCRYPTION_SALT)) return data;
    const parts = data.split("|||");
    const xored = parts[0];
    const timestamp = parseInt(parts[1]);
    if (Date.now() - timestamp > 86400000) return null;
    let decoded = "";
    for (let i = 0; i < xored.length; i++) {
      const charCode = xored.charCodeAt(i) ^ 47;
      decoded += String.fromCharCode(charCode);
    }
    const json = decodeURIComponent(atob(decoded));
    return JSON.parse(json);
  } catch (e) {
    console.error("🔴 Decryption failed:", e);
    return null;
  }
}

function sanitizeInput(input) {
  if (!input) return "";
  if (typeof input !== "string") return "";
  const div = document.createElement("div");
  div.textContent = input;
  let sanitized = div.innerHTML;
  const dangerous = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<[^>]*>/g,
    /on\w+="[^"]*"/g,
    /on\w+='[^']*'/g,
    /javascript:/gi,
    /eval\(/gi,
    /document\./gi,
    /window\./gi,
    /localStorage\./gi,
    /sessionStorage\./gi,
  ];
  for (let i = 0; i < dangerous.length; i++) {
    sanitized = sanitized.replace(dangerous[i], "");
  }
  return sanitized.trim();
}

function displaySafe(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function displaySafeHTML(html) {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  const dangerous = [
    "script",
    "iframe",
    "object",
    "embed",
    "form",
    "input",
    "button",
  ];
  for (let i = 0; i < dangerous.length; i++) {
    const elements = div.getElementsByTagName(dangerous[i]);
    while (elements.length > 0) {
      elements[0].parentNode.removeChild(elements[0]);
    }
  }
  const allElements = div.getElementsByTagName("*");
  for (let i = 0; i < allElements.length; i++) {
    const attrs = allElements[i].attributes;
    for (let j = attrs.length - 1; j >= 0; j--) {
      if (attrs[j].name.startsWith("on")) {
        allElements[i].removeAttribute(attrs[j].name);
      }
    }
  }
  return div.innerHTML;
}

// ============================================
// 🔄 DATABASE ABSTRACTION LAYER
// NEVER CHANGE THIS CODE AGAIN!
// ============================================

const Database = {
  // Configuration - CHANGE THIS WHEN YOU UPGRADE
  config: {
    provider: "supabase",
    url: "https://rqvijxpbdrholshzhusb.supabase.co",
    key: "sb_publishable_lw88kFd0iSFNmkGDfczPMg_1j_ptRUO",
    serviceKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxdmlqeHBiZHJob2xzaHpodXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjU3NjE4NSwiZXhwIjoyMDk4MTUyMTg1fQ.Ypd8iKnvD3By_75yEE1VRSVnJw7SGK6_IqLugRu2nCA",
    maxConnections: 10,
    timeout: 30000,
    retries: 3,
    cacheTTL: 300,
  },

  // ============================================
  // 🔄 USER FUNCTIONS
  // ============================================

  users: {
    get: async function (phone) {
      return await this._execute("users", "select", {
        filter: { phone: phone },
        single: true,
      });
    },
    getAll: async function (options) {
      options = options || {};
      return await this._execute("users", "select", {
        limit: options.limit || 20,
        offset: options.offset || 0,
        orderBy: options.orderBy || "created_at",
        order: options.order || "desc",
      });
    },
    create: async function (userData) {
      return await this._execute("users", "insert", {
        data: userData,
      });
    },
    update: async function (phone, updates) {
      return await this._execute("users", "update", {
        filter: { phone: phone },
        data: updates,
      });
    },
    delete: async function (phone) {
      return await this._execute("users", "delete", {
        filter: { phone: phone },
      });
    },
    count: async function () {
      return await this._execute("users", "count", {});
    },
  },

  // ============================================
  // 🔄 GIG FUNCTIONS
  // ============================================

  gigs: {
    get: async function (id) {
      return await this._execute("gigs", "select", {
        filter: { id: id },
        single: true,
      });
    },
    getAll: async function (options) {
      options = options || {};
      return await this._execute("gigs", "select", {
        filter: options.filter || {},
        limit: options.limit || 50,
        offset: options.offset || 0,
        orderBy: options.orderBy || "created_at",
        order: options.order || "desc",
      });
    },
    create: async function (gigData) {
      return await this._execute("gigs", "insert", {
        data: gigData,
      });
    },
    update: async function (id, updates) {
      return await this._execute("gigs", "update", {
        filter: { id: id },
        data: updates,
      });
    },
    delete: async function (id) {
      return await this._execute("gigs", "delete", {
        filter: { id: id },
      });
    },
  },

  // ============================================
  // 🔄 PAYMENT FUNCTIONS
  // ============================================

  payments: {
    create: async function (paymentData) {
      return await this._execute("payments", "insert", {
        data: paymentData,
      });
    },
    getByUser: async function (phone) {
      return await this._execute("payments", "select", {
        filter: { phone: phone },
        orderBy: "created_at",
        order: "desc",
      });
    },
    verify: async function (code) {
      return await this._execute("payments", "update", {
        filter: { code: code },
        data: { verified: true, verified_at: new Date().toISOString() },
      });
    },
  },

  // ============================================
  // 🔄 CHAT FUNCTIONS
  // ============================================

  chat: {
    getMessages: async function (gigId) {
      return await this._execute("chat_messages", "select", {
        filter: { gig_id: gigId },
        orderBy: "created_at",
        order: "asc",
      });
    },
    sendMessage: async function (messageData) {
      return await this._execute("chat_messages", "insert", {
        data: messageData,
      });
    },
  },

  // ============================================
  // 🔄 EXECUTION ENGINE
  // ============================================

  _cache: {},

  _execute: async function (table, operation, params) {
    const cacheKey = `${table}_${operation}_${JSON.stringify(params)}`;
    const cacheTime = 60000;

    if (operation === "select" || operation === "count") {
      const cached = this._cache[cacheKey];
      if (cached && Date.now() - cached.time < cacheTime) {
        Monitor.log("cache_hit", { key: cacheKey });
        return cached.data;
      }
      Monitor.log("cache_miss", { key: cacheKey });
    }

    try {
      let result;
      if (this.config.provider === "supabase") {
        result = await this._executeSupabase(table, operation, params);
      } else {
        throw new Error("Unknown database provider");
      }

      if (operation === "select" || operation === "count") {
        this._cache[cacheKey] = { data: result, time: Date.now() };
        // Limit cache size
        const keys = Object.keys(this._cache);
        if (keys.length > 100) {
          const oldest = keys.sort(
            (a, b) => this._cache[a].time - this._cache[b].time,
          )[0];
          delete this._cache[oldest];
        }
      }

      Monitor.log("success", { table, operation });
      return result;
    } catch (error) {
      Monitor.log("error", { table, operation, error: error.message });
      if (params.retry !== false) {
        return await this._retry(table, operation, params);
      }
      throw error;
    }
  },

  _executeSupabase: async function (table, operation, params) {
    const client = supabaseClient;
    let query = client.from(table);

    if (operation === "select") {
      query = query.select("*");
      if (params.filter) {
        for (const key in params.filter) {
          if (params.filter[key] !== undefined && params.filter[key] !== null) {
            query = query.eq(key, params.filter[key]);
          }
        }
      }
      if (params.limit) query = query.limit(params.limit);
      if (params.offset)
        query = query.range(params.offset, params.offset + params.limit - 1);
      if (params.orderBy)
        query = query.order(params.orderBy, {
          ascending: params.order === "asc",
        });
      if (params.single) {
        const { data, error } = await query.single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    if (operation === "insert") {
      const { data, error } = await query.insert(params.data).select();
      if (error) throw error;
      return data;
    }

    if (operation === "update") {
      let updateQuery = query;
      if (params.filter) {
        for (const key in params.filter) {
          if (params.filter[key] !== undefined && params.filter[key] !== null) {
            updateQuery = updateQuery.eq(key, params.filter[key]);
          }
        }
      }
      const { data, error } = await updateQuery.update(params.data).select();
      if (error) throw error;
      return data;
    }

    if (operation === "delete") {
      let deleteQuery = query;
      if (params.filter) {
        for (const key in params.filter) {
          if (params.filter[key] !== undefined && params.filter[key] !== null) {
            deleteQuery = deleteQuery.eq(key, params.filter[key]);
          }
        }
      }
      const { error } = await deleteQuery.delete();
      if (error) throw error;
      return { success: true };
    }

    if (operation === "count") {
      const { count, error } = await query.select("*", {
        count: "exact",
        head: true,
      });
      if (error) throw error;
      return count;
    }

    throw new Error(`Unknown operation: ${operation}`);
  },

  _retry: async function (table, operation, params, attempt) {
    attempt = attempt || 1;
    const maxRetries = this.config.retries || 3;
    const delay = 1000 * Math.pow(2, attempt - 1);
    if (attempt > maxRetries) {
      throw new Error(`Failed after ${maxRetries} retries`);
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    console.log(`🔄 Retry ${attempt}/${maxRetries} for ${table}.${operation}`);
    try {
      return await this._execute(table, operation, { ...params, retry: false });
    } catch (error) {
      return await this._retry(table, operation, params, attempt + 1);
    }
  },

  _clearCache: function () {
    this._cache = {};
    console.log("🗑️ Cache cleared");
  },
};

// ============================================
// 📊 MONITORING SYSTEM
// ============================================

const Monitor = {
  stats: {
    queries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    lastMinuteQueries: 0,
  },

  log: function (type, data) {
    this.stats.queries++;
    this.stats.lastMinuteQueries++;
    if (type === "cache_hit") this.stats.cacheHits++;
    if (type === "cache_miss") this.stats.cacheMisses++;
    if (type === "error") this.stats.errors++;

    if (this.stats.lastMinuteQueries > 50) {
      console.warn(
        `⚠️ High query rate: ${this.stats.lastMinuteQueries}/minute`,
      );
    }
  },

  getReport: function () {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    return {
      totalQueries: this.stats.queries,
      cacheHitRate:
        total > 0
          ? ((this.stats.cacheHits / total) * 100).toFixed(1) + "%"
          : "0%",
      errors: this.stats.errors,
      queriesLastMinute: this.stats.lastMinuteQueries,
    };
  },

  reset: function () {
    this.stats.lastMinuteQueries = 0;
  },
};

setInterval(function () {
  Monitor.reset();
}, 60000);

console.log("✅ Database abstraction layer loaded");
console.log("📊 Monitor active");

// ============================================
// 📱 UNIVERSAL CAMERA SUPPORT
// ============================================

function openCamera(inputId) {
  const input = document.getElementById(inputId);
  if (!input) {
    showToast("Error: Input not found.", "error");
    return;
  }

  if (!Adaptive.features.camera) {
    showToast("📸 Camera not supported. Please upload a photo.", "info");
    input.removeAttribute("capture");
    input.setAttribute("accept", "image/*");
    input.click();
    return;
  }

  if (
    Device.type === "mobile" &&
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost"
  ) {
    showToast("🔒 Please use HTTPS for camera on phones.", "warning");
    input.removeAttribute("capture");
    input.setAttribute("accept", "image/*");
    input.click();
    return;
  }

  if (Device.capabilities.memory <= 1.5) {
    showToast("⚠️ Low memory device. Using file upload.", "warning");
    input.removeAttribute("capture");
    input.setAttribute("accept", "image/*");
    input.click();
    return;
  }

  input.value = "";
  if (cameraActive) closeCamera();

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    input.removeAttribute("capture");
    input.setAttribute("accept", "image/*");
    input.click();
    return;
  }

  const videoSettings = {
    video: {
      facingMode: "user",
      width: { ideal: Device.capabilities.memory <= 2 ? 320 : 640 },
      height: { ideal: Device.capabilities.memory <= 2 ? 240 : 480 },
    },
    audio: false,
  };

  showCameraModal(input, videoSettings);
}

function showCameraModal(input, videoSettings) {
  const overlay = document.createElement("div");
  overlay.id = "cameraOverlay";
  overlay.style.cssText =
    "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);z-index:10000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;";

  const video = document.createElement("video");
  video.id = "cameraVideo";
  video.style.cssText =
    "width:100%;max-width:500px;max-height:70vh;border-radius:12px;background:#000;transform:scaleX(-1);object-fit:cover;";
  video.autoplay = true;
  video.playsInline = true;

  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText =
    "display:flex;gap:20px;margin-top:20px;width:100%;max-width:400px;justify-content:center;";

  const captureBtn = document.createElement("button");
  captureBtn.textContent = "📸 CAPTURE";
  captureBtn.style.cssText =
    "padding:15px 40px;background:#006400;color:#FFD700;border:none;border-radius:10px;font-size:18px;font-weight:bold;cursor:pointer;flex:1;";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "✕ CLOSE";
  cancelBtn.style.cssText =
    "padding:15px 30px;background:#cc0000;color:#fff;border:none;border-radius:10px;font-size:16px;font-weight:bold;cursor:pointer;flex:1;";

  buttonContainer.appendChild(captureBtn);
  buttonContainer.appendChild(cancelBtn);
  overlay.appendChild(video);
  overlay.appendChild(buttonContainer);
  document.body.appendChild(overlay);

  navigator.mediaDevices
    .getUserMedia(videoSettings)
    .then(function (stream) {
      cameraStream = stream;
      cameraActive = true;
      video.srcObject = stream;
    })
    .catch(function (err) {
      console.error("Camera error:", err);
      document.body.removeChild(overlay);
      input.removeAttribute("capture");
      input.setAttribute("accept", "image/*");
      input.click();
      showToast("Camera not available. Please select a file.", "warning");
    });

  captureBtn.onclick = function () {
    capturePhoto(video, input, overlay);
  };

  cancelBtn.onclick = function () {
    closeCamera();
    document.body.removeChild(overlay);
  };

  overlay.onclick = function (e) {
    if (e.target === overlay) {
      closeCamera();
      document.body.removeChild(overlay);
    }
  };
}

function capturePhoto(video, input, overlay) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    fetch(dataUrl)
      .then(function (res) {
        return res.blob();
      })
      .then(function (blob) {
        const file = new File([blob], "camera-photo.jpg", {
          type: "image/jpeg",
        });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        const event = new Event("change", { bubbles: true });
        input.dispatchEvent(event);
        closeCamera();
        document.body.removeChild(overlay);
        showToast("✅ Photo captured!", "success");
      });
  } catch (e) {
    console.error("Capture error:", e);
    showToast("Failed to capture photo. Please try again.", "error");
  }
}

function closeCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(function (track) {
      track.stop();
    });
    cameraStream = null;
  }
  cameraActive = false;
  const video = document.getElementById("cameraVideo");
  if (video) {
    video.srcObject = null;
  }
  const overlay = document.getElementById("cameraOverlay");
  if (overlay) {
    overlay.remove();
  }
}

// ============================================
// 📸 ADAPTIVE IMAGE COMPRESSION
// ============================================

function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const settings = Adaptive.images;
        let width = img.width;
        let height = img.height;
        let targetWidth = maxWidth || settings.maxWidth;
        let targetHeight = maxHeight || settings.maxHeight;
        let targetQuality = quality || settings.quality;

        if (Device.capabilities.memory <= 2) {
          targetWidth = Math.min(targetWidth, 300);
          targetHeight = Math.min(targetHeight, 300);
          targetQuality = Math.min(targetQuality, 0.5);
        }

        if (width > targetWidth) {
          height = (height * targetWidth) / width;
          width = targetWidth;
        }
        if (height > targetHeight) {
          width = (width * targetHeight) / height;
          height = targetHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext("2d");
        const finalQuality =
          Device.capabilities.memory <= 2 ? 0.5 : targetQuality;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", finalQuality);
        canvas.width = 0;
        canvas.height = 0;
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================
// 📂 ADAPTIVE FILE VALIDATION
// ============================================

function validateFileUpload(file) {
  if (!file) {
    return { valid: false, message: "No file selected." };
  }

  const settings = Adaptive.images;
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
  ];

  if (Device.capabilities.memory <= 2) {
    if (file.type === "image/heic" || file.type === "image/heif") {
      return {
        valid: false,
        message:
          "HEIC format not supported on this device. Please use JPG or PNG.",
      };
    }
  }

  if (allowedTypes.indexOf(file.type) === -1) {
    return {
      valid: false,
      message: "File type not allowed. Use JPG, PNG, WEBP, or GIF.",
    };
  }

  const maxSize = settings.maxFileSize;
  if (file.size > maxSize) {
    return {
      valid: false,
      message: `File too large. Max ${maxSize / 1024 / 1024}MB for this device.`,
    };
  }

  if (Device.capabilities.memory <= 1.5 && file.size > 2 * 1024 * 1024) {
    return {
      valid: false,
      message: "File too large for this device. Max 2MB.",
    };
  }

  const ext = "." + file.name.split(".").pop().toLowerCase();
  const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  if (allowedExts.indexOf(ext) === -1) {
    return { valid: false, message: "Invalid file extension." };
  }

  return { valid: true, message: "File validated successfully." };
}

// ============================================
// 🔒 ADAPTIVE PASSWORD VALIDATION
// ============================================

function validatePasswordStrength(password) {
  if (Device.capabilities.memory <= 1.5) {
    return {
      valid: password.length >= 6,
      issues:
        password.length < 6 ? ["Password must be at least 6 characters"] : [],
      score: password.length >= 6 ? 60 : 0,
      strength: password.length >= 6 ? "medium" : "weak",
      message:
        password.length >= 6
          ? "✅ Password length OK."
          : "⚠️ Password must be at least 6 characters.",
    };
  }

  const issues = [];
  let score = 0;
  let strength = "weak";

  if (password.length < 6) {
    issues.push("At least 6 characters");
  } else if (password.length >= 12) {
    score += 25;
  } else {
    score += 15;
  }

  if (!/[A-Z]/.test(password)) {
    issues.push("At least one uppercase letter");
  } else {
    score += 15;
  }

  if (!/[a-z]/.test(password)) {
    issues.push("At least one lowercase letter");
  } else {
    score += 15;
  }

  if (!/[0-9]/.test(password)) {
    issues.push("At least one number");
  } else {
    score += 15;
  }

  if (Device.capabilities.memory > 2) {
    if (!/[^A-Za-z0-9]/.test(password)) {
      issues.push("At least one special character");
    } else {
      score += 15;
    }
  }

  if (score >= 60) strength = "strong";
  else if (score >= 35) strength = "medium";
  else strength = "weak";

  return {
    valid:
      issues.length === 0 ||
      (Device.capabilities.memory <= 1.5 && password.length >= 6),
    issues: issues,
    score: score,
    strength: strength,
    message:
      issues.length === 0
        ? "✅ Password is strong!"
        : "⚠️ Please fix the issues above.",
  };
}

// ============================================
// 🌐 NETWORK RETRY
// ============================================

function networkRetry(fn, maxRetries) {
  maxRetries = maxRetries || (Device.type === "mobile" ? 5 : 3);
  let attempt = 0;
  const baseDelay =
    Device.capabilities.connection === "slow-2g"
      ? 3000
      : Device.capabilities.connection === "2g"
        ? 2000
        : Device.capabilities.connection === "3g"
          ? 1000
          : 500;

  return new Promise(function (resolve, reject) {
    function tryAttempt() {
      attempt++;
      fn()
        .then(resolve)
        .catch(function (err) {
          if (attempt < maxRetries) {
            const delay = baseDelay * attempt;
            console.log(`📡 Retry ${attempt}/${maxRetries} in ${delay}ms`);
            setTimeout(tryAttempt, delay);
          } else {
            reject(err);
          }
        });
    }
    tryAttempt();
  });
}

// ============================================
// 🎨 ADAPTIVE UI RENDERING
// ============================================

function renderAdaptive(container, data, template) {
  if (Device.capabilities.memory <= 2) {
    const batchSize = Device.capabilities.memory <= 1.5 ? 5 : 10;
    let index = 0;
    function renderBatch() {
      const batch = data.slice(index, index + batchSize);
      if (batch.length === 0) return;
      batch.forEach(function (item) {
        container.innerHTML += template(item);
      });
      index += batchSize;
      if (index < data.length) {
        requestAnimationFrame(renderBatch);
      }
    }
    renderBatch();
  } else {
    data.forEach(function (item) {
      container.innerHTML += template(item);
    });
  }
}

// ============================================
// 📋 RATE LIMITING
// ============================================

function checkRateLimit(action, maxPerMinute, maxPerHour, maxPerDay) {
  maxPerMinute = maxPerMinute || 5;
  maxPerHour = maxPerHour || 20;
  maxPerDay = maxPerDay || 50;

  const now = new Date();
  const userKey = currentUser ? currentUser.phone : "anonymous";
  const ipKey = getIPHash();

  const minuteKey = `rate_${action}_minute_${now.getMinutes()}_${now.getHours()}_${now.toDateString()}_${userKey}_${ipKey}`;
  const minuteCount = parseInt(localStorage.getItem(minuteKey) || "0");
  if (minuteCount >= maxPerMinute) {
    showToast(`⚠️ Too many ${action} attempts. Wait a moment.`, "error");
    return false;
  }

  const hourKey = `rate_${action}_hour_${now.getHours()}_${now.toDateString()}_${userKey}_${ipKey}`;
  const hourCount = parseInt(localStorage.getItem(hourKey) || "0");
  if (hourCount >= maxPerHour) {
    showToast(`⚠️ Too many ${action} attempts this hour.`, "error");
    return false;
  }

  const dayKey = `rate_${action}_day_${now.toDateString()}_${userKey}_${ipKey}`;
  const dayCount = parseInt(localStorage.getItem(dayKey) || "0");
  if (dayCount >= maxPerDay) {
    showToast(`⚠️ Too many ${action} attempts today.`, "error");
    return false;
  }

  localStorage.setItem(minuteKey, minuteCount + 1);
  localStorage.setItem(hourKey, hourCount + 1);
  localStorage.setItem(dayKey, dayCount + 1);
  return true;
}

function getIPHash() {
  const info =
    navigator.userAgent + navigator.language + screen.width + screen.height;
  let hash = 0;
  for (let i = 0; i < info.length; i++) {
    hash = (hash << 5) - hash + info.charCodeAt(i);
    hash = hash & hash;
  }
  return "ip_" + Math.abs(hash).toString(36);
}

// ============================================
// 🔐 SESSION MANAGEMENT
// ============================================

const SESSION_TIMEOUT = 10; // 10 minutes

function startSession(user) {
  const session = {
    userId: user.phone,
    userName: user.name,
    userEmail: user.email || "",
    loginTime: Date.now(),
    expiresAt: Date.now() + SESSION_TIMEOUT * 60 * 1000,
    token: generateSecureToken(128),
    fingerprint: getFingerprint(),
    ip: getIPHash(),
    userAgent: navigator.userAgent,
    lastActivity: Date.now(),
  };
  const encrypted = secureEncrypt(session);
  localStorage.setItem("gkode_session", encrypted);
  return session;
}

function validateSession() {
  const sessionData = localStorage.getItem("gkode_session");
  if (!sessionData) return false;
  try {
    const session = secureDecrypt(sessionData);
    if (!session || !session.expiresAt) return false;
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem("gkode_session");
      return false;
    }
    if (session.fingerprint !== getFingerprint()) {
      localStorage.removeItem("gkode_session");
      return false;
    }
    return session;
  } catch (e) {
    localStorage.removeItem("gkode_session");
    return false;
  }
}

function refreshSession() {
  const sessionData = localStorage.getItem("gkode_session");
  if (!sessionData) return false;
  try {
    const session = secureDecrypt(sessionData);
    if (!session) return false;
    session.expiresAt = Date.now() + SESSION_TIMEOUT * 60 * 1000;
    session.lastActivity = Date.now();
    localStorage.setItem("gkode_session", secureEncrypt(session));
    return true;
  } catch (e) {
    return false;
  }
}

function getFingerprint() {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    navigator.hardwareConcurrency || 0,
    navigator.deviceMemory || 0,
  ];
  try {
    return btoa(parts.join("|||"));
  } catch (e) {
    return parts.join("|||");
  }
}

function generateSecureToken(length) {
  length = length || 64;
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=";
  let token = "";
  const array = new Uint8Array(length);
  try {
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      token += chars.charAt(array[i] % chars.length);
    }
  } catch (e) {
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return token;
}

// ============================================
// 📧 EMAIL FUNCTIONS (Using Server)
// ============================================

const SERVER_URL = "http://localhost:3000";

async function sendOTPEmail(email, name, code) {
  try {
    const response = await fetch(`${SERVER_URL}/api/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, name: name || "User", code: code }),
    });
    const data = await response.json();
    if (data.success) {
      console.log("✅ OTP email sent!");
      showToast("📧 Verification code sent to your email!", "success");
      return true;
    } else {
      console.error("❌ OTP email failed:", data.error);
      showToast(`📱 Your code: ${code} (Check spam folder)`, "info");
      return false;
    }
  } catch (error) {
    console.error("❌ OTP email error:", error);
    showToast(`📱 Your code: ${code} (Check spam folder)`, "info");
    return false;
  }
}

async function sendResetEmail(email, name, code) {
  try {
    const response = await fetch(`${SERVER_URL}/api/send-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, name: name || "User", code: code }),
    });
    const data = await response.json();
    if (data.success) {
      console.log("✅ Reset email sent!");
      showToast("📧 Reset code sent to your email!", "success");
      return true;
    } else {
      console.error("❌ Reset email failed:", data.error);
      showToast(`📱 Your reset code: ${code} (Check spam folder)`, "info");
      return false;
    }
  } catch (error) {
    console.error("❌ Reset email error:", error);
    showToast(`📱 Your reset code: ${code} (Check spam folder)`, "info");
    return false;
  }
}

// ============================================
// ⏰ SESSION MONITOR
// ============================================

let securityInterval = null;

function initSecurity() {
  const session = validateSession();
  if (!session && currentUser) {
    showToast("⏰ Session expired. Please login again.", "warning");
    if (typeof logout === "function") logout();
  }

  if (securityInterval) clearInterval(securityInterval);
  securityInterval = setInterval(function () {
    if (currentUser) {
      const session = validateSession();
      if (!session) {
        showToast("⏰ Session expired. Please login again.", "warning");
        if (typeof logout === "function") logout();
      } else {
        refreshSession();
      }
    }
  }, 30000);

  console.log("🛡️ Security initialized");
}

// ============================================
// 📦 TOAST SYSTEM
// ============================================

function showToast(message, type) {
  type = type || "info";
  const container = document.getElementById("toast-container");
  if (!container) {
    const newContainer = document.createElement("div");
    newContainer.id = "toast-container";
    newContainer.style.cssText =
      "position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;width:90%;max-width:500px;pointer-events:none;";
    document.body.appendChild(newContainer);
  }
  const colors = {
    success: "#006400",
    error: "#cc0000",
    info: "#2196F3",
    warning: "#ff9800",
  };
  const toast = document.createElement("div");
  toast.style.cssText =
    "padding:12px 20px;border-radius:10px;color:#fff;margin-bottom:8px;animation:slideDown 0.3s ease;font-weight:500;font-size:14px;box-shadow:0 4px 15px rgba(0,0,0,0.2);background:" +
    (colors[type] || "#333");
  toast.textContent = message;
  document.getElementById("toast-container").appendChild(toast);
  setTimeout(function () {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.5s";
    setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, 500);
  }, 4000);
}

// ============================================
// 🚀 SUPABASE CLIENT
// ============================================

const SUPABASE_URL = "https://rqvijxpbdrholshzhusb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lw88kFd0iSFNmkGDfczPMg_1j_ptRUO";
let supabaseClient = null;
let supabaseInitialized = false;

function initSupabase() {
  if (supabaseInitialized) return;
  if (typeof window.supabase !== "undefined" && window.supabase.createClient) {
    try {
      supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
      );
      supabaseInitialized = true;
      console.log("✅ Supabase connected");
      return;
    } catch (e) {
      console.log("⚠️ Supabase init error:", e);
    }
  }
  console.log("📡 Loading Supabase library...");
  var script = document.createElement("script");
  script.src =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  script.onload = function () {
    try {
      if (
        typeof window.supabase !== "undefined" &&
        window.supabase.createClient
      ) {
        supabaseClient = window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_ANON_KEY,
        );
        supabaseInitialized = true;
        console.log("✅ Supabase loaded and connected");
      } else {
        console.log("⚠️ Supabase library not available");
      }
    } catch (e) {
      console.log("⚠️ Supabase connection error:", e);
    }
  };
  script.onerror = function () {
    console.log("❌ Failed to load Supabase library");
  };
  document.head.appendChild(script);
}

initSupabase();

// ============================================
// 📦 STATE VARIABLES
// ============================================

let paymentEnabled = true;
let currentUser = null;
let currentTab = "open";
let currentGigId = null;
let pendingRegistration = null;
let pendingOtp = null;
let resetData = null;
let resetTimerInterval = null;
let resetTimeLeft = 600;
let isProcessing = false;
let cameraStream = null;
let cameraActive = false;
let isOnline = true;

// ============================================
// ADMIN PHONES
// ============================================

const ADMIN_PHONES = ["0703428192", "0711991467"];

// ============================================
// LOAD PAYMENT SETTINGS
// ============================================

function loadPaymentSettings() {
  try {
    const saved = localStorage.getItem("gkode_payment_enabled");
    if (saved !== null) {
      paymentEnabled = saved === "true";
    }
    console.log(
      "💳 Payment system:",
      paymentEnabled ? "ACTIVE" : "DISABLED (Testing)",
    );
  } catch (e) {
    console.log("Payment settings load error:", e);
  }
}

function isPaymentEnabled() {
  return paymentEnabled;
}

function canAccessFeatures() {
  if (!currentUser) return false;
  if (!isPaymentEnabled()) {
    showToast(
      "⚠️ System is in testing mode. Features are disabled.",
      "warning",
    );
    return false;
  }
  if (!currentUser.isPaid && !currentUser.is_paid) {
    showToast(
      "💳 Please pay the one-time fee of Ksh 300 to access features.",
      "warning",
    );
    showScreen("payment");
    return false;
  }
  return true;
}

// ============================================
// CHECK ONLINE STATUS
// ============================================

function checkOnlineStatus() {
  isOnline = navigator.onLine;
  if (!isOnline) {
    showToast("⚠️ You are offline. Using local data.", "warning");
  }
  return isOnline;
}

window.addEventListener("online", function () {
  isOnline = true;
  showToast("✅ Back online! Syncing data...", "success");
});

window.addEventListener("offline", function () {
  isOnline = false;
  showToast("⚠️ You are offline. Changes will sync later.", "warning");
});

// ============================================
// 📂 DATA HELPERS
// ============================================

function getData(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function getUsersLocal() {
  return getData("gkode_users");
}
function setUsersLocal(users) {
  localStorage.setItem("gkode_users", JSON.stringify(users));
}
function getGigsLocal() {
  return getData("gkode_gigs");
}
function setGigsLocal(gigs) {
  localStorage.setItem("gkode_gigs", JSON.stringify(gigs));
}
function getCompaniesLocal() {
  return getData("gkode_companies");
}
function setCompaniesLocal(companies) {
  localStorage.setItem("gkode_companies", JSON.stringify(companies));
}
function getProductsLocal() {
  return getData("gkode_products");
}
function setProductsLocal(products) {
  localStorage.setItem("gkode_products", JSON.stringify(products));
}
function getProfessions() {
  return getData("gkode_professions");
}
function setProfessions(professions) {
  localStorage.setItem("gkode_professions", JSON.stringify(professions));
}
function getCategories() {
  return getData("gkode_categories");
}
function setCategories(categories) {
  localStorage.setItem("gkode_categories", JSON.stringify(categories));
}
function getComplaints() {
  return getData("gkode_complaints");
}
function getPayments() {
  return getData("gkode_payments");
}
function getLogs() {
  return getData("gkode_adminLogs");
}
function getBackups() {
  return getData("gkode_backups");
}

// ============================================
// READ FILE AS DATA URL
// ============================================

function readFileAsDataURL(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function (e) {
      resolve(e.target.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================
// UPLOAD TO SUPABASE STORAGE
// ============================================

async function uploadToSupabase(file, bucket, folder) {
  if (!supabaseInitialized || !isOnline) {
    console.log("⚠️ Supabase not ready or offline, using base64 fallback");
    return readFileAsDataURL(file);
  }

  try {
    const compressedDataUrl = await compressImage(file);
    const response = await fetch(compressedDataUrl);
    const blob = await response.blob();

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = folder + "/" + Date.now() + "." + fileExt;
    const fileObj = new File([blob], fileName, { type: "image/jpeg" });

    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(fileName, fileObj, { cacheControl: "3600", upsert: true });

    if (error) throw error;

    const { data: urlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log("✅ Image uploaded to Supabase:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("Upload error:", error);
    return readFileAsDataURL(file);
  }
}

// ============================================
// 🎨 PROFESSIONS & CATEGORIES
// ============================================

const defaultProfessions = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "Mechanic",
  "Hairdresser",
  "Tailor",
  "Chef",
  "Driver",
  "Teacher",
  "Nurse",
  "Accountant",
  "Architect",
  "Baker",
  "Barber",
  "Builder",
  "Cleaner",
  "Cook",
  "Doctor",
  "Engineer",
  "Farmer",
  "Gardener",
  "Lawyer",
  "Mason",
  "Photographer",
  "Roofer",
  "Security Guard",
  "Surveyor",
  "Tiler",
  "Tour Guide",
  "Translator",
  "Vet",
  "Welder",
  "Writer",
];

function getAllProfessions() {
  const saved = getProfessions();
  const all = defaultProfessions.slice();
  for (var i = 0; i < saved.length; i++) {
    if (all.indexOf(saved[i]) === -1) all.push(saved[i]);
  }
  all.sort();
  return all;
}

function populateProfessionDropdown() {
  const dropdown = document.getElementById("regProfession");
  if (!dropdown) return;
  while (dropdown.options.length > 1) dropdown.remove(1);
  const all = getAllProfessions();
  for (var i = 0; i < all.length; i++) {
    const opt = document.createElement("option");
    opt.value = all[i];
    opt.textContent = all[i];
    dropdown.appendChild(opt);
  }
  const otherOpt = document.createElement("option");
  otherOpt.value = "Other";
  otherOpt.textContent = "Other (Add New)";
  dropdown.appendChild(otherOpt);
}

function checkProfession() {
  const profession = document.getElementById("regProfession")?.value || "";
  const box = document.getElementById("otherProfessionBox");
  if (box) box.style.display = profession === "Other" ? "block" : "none";
}

function saveNewProfession(professionName) {
  if (!professionName || professionName.trim().length < 3) {
    showToast("Enter a valid profession name.", "error");
    return null;
  }
  const formatted = professionName
    .trim()
    .split(" ")
    .map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
  const all = getAllProfessions();
  if (all.indexOf(formatted) !== -1) return formatted;
  const saved = getProfessions();
  saved.push(formatted);
  setProfessions(saved);
  populateProfessionDropdown();
  showToast('✅ New profession "' + formatted + '" saved!', "success");
  return formatted;
}

const defaultCategories = [
  "Cement",
  "Pipes",
  "Taps",
  "Electrical",
  "Paint",
  "Timber",
  "Steel",
  "Tiles",
  "Roofing",
  "Tools",
  "Beauty",
  "Food",
  "Seeds",
  "Auto Parts",
  "Hardware",
];

function getAllCategories() {
  const saved = getCategories();
  const all = defaultCategories.slice();
  for (var i = 0; i < saved.length; i++) {
    if (all.indexOf(saved[i]) === -1) all.push(saved[i]);
  }
  all.sort();
  return all;
}

function populateCategoryDropdown() {
  const dropdown = document.getElementById("marketCategory");
  if (!dropdown) return;
  while (dropdown.options.length > 1) dropdown.remove(1);
  const all = getAllCategories();
  for (var i = 0; i < all.length; i++) {
    const opt = document.createElement("option");
    opt.value = all[i];
    opt.textContent = all[i];
    dropdown.appendChild(opt);
  }
}

// ============================================
// 📱 MOBILE INPUT FIXES
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  // Fix phone inputs
  document.querySelectorAll('input[type="tel"]').forEach(function (input) {
    input.setAttribute("autocomplete", "off");
    input.setAttribute("inputmode", "numeric");
  });

  // Fix password inputs
  document.querySelectorAll('input[type="password"]').forEach(function (input) {
    input.setAttribute("autocorrect", "off");
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("spellcheck", "false");
  });
});

// ============================================
// 🎨 CLEAR IMAGE PREVIEW
// ============================================

function clearImage(inputId, previewId, containerId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const container = document.getElementById(containerId);
  if (input) input.value = "";
  if (preview) {
    preview.src = "";
    preview.style.display = "none";
  }
  if (container) container.style.display = "none";
}

function setupFilePreview(inputId, previewId, containerId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const container = document.getElementById(containerId);
  if (!input) return;

  input.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) {
      if (container) container.style.display = "none";
      return;
    }

    // Validate file
    const validation = validateFileUpload(file);
    if (!validation.valid) {
      showToast(validation.message, "error");
      input.value = "";
      if (container) container.style.display = "none";
      return;
    }

    if (preview && container) {
      const reader = new FileReader();
      reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = "block";
        container.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });
}

// ============================================
// 🔄 NAVIGATION
// ============================================

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(function (s) {
    s.classList.remove("active");
  });
  const s = document.getElementById(id);
  if (s) s.classList.add("active");

  const nav = document.getElementById("bottomNav");
  const allowed = [
    "home",
    "postGig",
    "profile",
    "chat",
    "marketplace",
    "companyRegister",
    "companyDashboard",
    "addProduct",
  ];
  if (currentUser && allowed.indexOf(id) !== -1) {
    if (nav) nav.classList.remove("hidden");
  } else {
    if (nav) nav.classList.add("hidden");
  }

  if (id === "home") {
    if (isPaymentEnabled() && currentUser && currentUser.isPaid) {
      loadGigs();
    } else if (isPaymentEnabled() && currentUser && !currentUser.isPaid) {
      showToast(
        "💳 Please pay the one-time fee of Ksh 300 to access features.",
        "warning",
      );
      showScreen("payment");
    } else if (!isPaymentEnabled()) {
      document.getElementById("gigsList").innerHTML = `
                <div style="padding: 40px 20px; text-align: center; background: #fff3e0; border-radius: 12px; margin: 20px 0;">
                    <h3 style="color: #ff9800;">⚠️ System Maintenance</h3>
                    <p style="color: #666; margin-top: 10px;">G-KODE is currently in testing mode.</p>
                    <p style="color: #666;">Please check back later.</p>
                    <p style="color: #888; font-size: 12px; margin-top: 10px;">🇰🇪 Kenya Helping Kenya</p>
                </div>
            `;
    } else {
      loadGigs();
    }
  }
  if (id === "profile") loadProfile();
  if (id === "marketplace") loadMarketplace();
  if (id === "companyDashboard") loadCompanyDashboard();
}

function togglePassword(fieldId, icon) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  if (field.type === "password") {
    field.type = "text";
    icon.textContent = "🙈";
  } else {
    field.type = "password";
    icon.textContent = "👁️";
  }
}

// ============================================
// 📝 REGISTER
// ============================================

async function register(e) {
  if (e) e.preventDefault();
  const btn = document.getElementById("registerBtn");
  if (!btn || isProcessing) return;
  isProcessing = true;
  btn.disabled = true;
  btn.textContent = "⏳ REGISTERING...";

  try {
    const name = document.getElementById("regName")?.value?.trim() || "";
    const phone = document.getElementById("regPhone")?.value?.trim() || "";
    const id = document.getElementById("regID")?.value?.trim() || "";
    const email = document.getElementById("regEmail")?.value?.trim() || "";
    const password =
      document.getElementById("regPassword")?.value?.trim() || "";
    const confirmPassword =
      document.getElementById("regConfirmPassword")?.value?.trim() || "";
    const location =
      document.getElementById("regLocation")?.value?.trim() || "";
    const profession = document.getElementById("regProfession")?.value || "";
    const otherProfession =
      document.getElementById("regOtherProfession")?.value?.trim() || "";
    const skills = document.getElementById("regSkills")?.value?.trim() || "";
    const photoFile = document.getElementById("regPhoto")?.files[0];
    const idScanFile = document.getElementById("regIDScan")?.files[0];
    const terms = document.getElementById("regTerms")?.checked || false;

    // Validate password for device
    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.valid) {
      showToast(passwordStrength.message, "error");
      btn.disabled = false;
      btn.textContent = "REGISTER";
      isProcessing = false;
      return;
    }

    if (
      !name ||
      !phone ||
      !id ||
      !email ||
      !password ||
      !location ||
      !profession
    ) {
      showToast("Please fill all required fields", "error");
      btn.disabled = false;
      btn.textContent = "REGISTER";
      isProcessing = false;
      return;
    }
    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      btn.disabled = false;
      btn.textContent = "REGISTER";
      isProcessing = false;
      return;
    }

    // Validate phone number (remove non-numeric)
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 12) {
      showToast("Please enter a valid phone number (10 digits)", "error");
      btn.disabled = false;
      btn.textContent = "REGISTER";
      isProcessing = false;
      return;
    }

    // Validate ID (remove non-numeric)
    const cleanId = id.replace(/\D/g, "");
    if (cleanId.length < 5 || cleanId.length > 8) {
      showToast("Please enter a valid ID number (5-8 digits)", "error");
      btn.disabled = false;
      btn.textContent = "REGISTER";
      isProcessing = false;
      return;
    }

    if (!photoFile || !idScanFile) {
      showToast("Please upload profile photo and ID scan", "error");
      btn.disabled = false;
      btn.textContent = "REGISTER";
      isProcessing = false;
      return;
    }

    // Validate files
    const photoValidation = validateFileUpload(photoFile);
    if (!photoValidation.valid) {
      showToast("Profile photo: " + photoValidation.message, "error");
      btn.disabled = false;
      btn.textContent = "REGISTER";
      isProcessing = false;
      return;
    }

    const idValidation = validateFileUpload(idScanFile);
    if (!idValidation.valid) {
      showToast("ID scan: " + idValidation.message, "error");
      btn.disabled = false;
      btn.textContent = "REGISTER";
      isProcessing = false;
      return;
    }

    if (!terms) {
      showToast("Please agree to the Terms of Use", "error");
      btn.disabled = false;
      btn.textContent = "REGISTER";
      isProcessing = false;
      return;
    }

    // Check for existing user
    if (supabaseInitialized && isOnline) {
      try {
        const existing = await Database.users.get(cleanPhone);
        if (existing) {
          showToast("Phone number already registered", "error");
          btn.disabled = false;
          btn.textContent = "REGISTER";
          isProcessing = false;
          return;
        }
      } catch (err) {
        console.log("Supabase check failed:", err);
      }
    }

    let finalProfession = profession;
    if (profession === "Other") {
      if (!otherProfession) {
        showToast("Please specify your profession", "error");
        btn.disabled = false;
        btn.textContent = "REGISTER";
        isProcessing = false;
        return;
      }
      finalProfession = saveNewProfession(otherProfession);
      if (!finalProfession) {
        btn.disabled = false;
        btn.textContent = "REGISTER";
        isProcessing = false;
        return;
      }
    }

    btn.textContent = "⏳ UPLOADING IMAGES...";

    // Compress and upload with adaptive settings
    const photoUrl = await uploadToSupabase(
      photoFile,
      "profiles",
      "user_" + cleanPhone,
    );
    const idScanUrl = await uploadToSupabase(
      idScanFile,
      "ids",
      "user_" + cleanPhone,
    );

    const user = {
      name: name,
      phone: cleanPhone,
      id: cleanId,
      email: email,
      password: password,
      location: location,
      profession: finalProfession,
      skills: skills || "",
      photo: photoUrl,
      idScan: idScanUrl,
      isPaid: false,
      isBanned: false,
      strikes: 0,
      rating: 0,
      reviewCount: 0,
      registeredAt: new Date().toISOString(),
    };

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    pendingRegistration = user;
    pendingOtp = otpCode;

    btn.textContent = "⏳ SENDING OTP...";
    try {
      await sendOTPEmail(email, name, otpCode);
    } catch (err) {
      console.error("Send OTP error:", err);
      showToast("📱 Your code: " + otpCode + " (Check spam folder)", "info");
    }

    const otpSection = document.getElementById("otpSection");
    if (otpSection) otpSection.style.display = "block";
    const otpInput = document.getElementById("regOtp");
    if (otpInput) otpInput.focus();

    btn.textContent = "VERIFY EMAIL";
    btn.disabled = false;
    isProcessing = false;
  } catch (error) {
    console.error("Registration error:", error);
    showToast("Registration error: " + error.message, "error");
    btn.disabled = false;
    btn.textContent = "REGISTER";
    isProcessing = false;
  }
}

function verifyOtp() {
  const enteredOtp = document.getElementById("regOtp")?.value?.trim() || "";
  if (!enteredOtp) {
    showToast("Please enter the verification code", "error");
    return;
  }
  if (enteredOtp !== pendingOtp) {
    showToast("❌ Invalid verification code. Please try again.", "error");
    return;
  }
  completeRegistration();
}

async function resendOtp() {
  if (!pendingRegistration) {
    showToast("Please start registration again", "error");
    return;
  }
  pendingOtp = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    await sendOTPEmail(
      pendingRegistration.email,
      pendingRegistration.name,
      pendingOtp,
    );
    showToast("📧 New code sent to your email!", "success");
  } catch (err) {
    console.error("Resend OTP error:", err);
    showToast("📱 Your new code: " + pendingOtp, "info");
  }
}

async function completeRegistration() {
  if (!pendingRegistration) {
    showToast("No registration in progress", "error");
    return;
  }

  const btn = document.getElementById("registerBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ COMPLETING...";
  }

  try {
    const user = pendingRegistration;
    let saved = false;

    if (supabaseInitialized && isOnline) {
      try {
        const result = await networkRetry(function () {
          return supabaseClient.from("users").insert({
            phone: user.phone,
            national_id: user.id,
            email: user.email,
            full_name: user.name,
            location: user.location,
            profession: user.profession,
            skills: user.skills
              ? user.skills.split(",").map(function (s) {
                  return s.trim();
                })
              : [],
            photo_url: user.photo,
            id_scan_url: user.idScan,
            password_hash: user.password,
            rating: 0,
            review_count: 0,
            strikes: 0,
            is_paid: false,
            is_banned: false,
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
          });
        });
        if (!result.error) saved = true;
      } catch (e) {
        console.log("Supabase save error:", e);
      }
    }

    let users = getUsersLocal();
    users.push(user);
    setUsersLocal(users);

    currentUser = user;
    localStorage.setItem("gkode_user", JSON.stringify(user));

    pendingRegistration = null;
    pendingOtp = null;
    const otpSection = document.getElementById("otpSection");
    if (otpSection) otpSection.style.display = "none";

    showToast(
      saved ? "✅ User saved to cloud!" : "✅ Saved locally!",
      "success",
    );
    showScreen("home");
    loadGigs();

    if (btn) {
      btn.disabled = false;
      btn.textContent = "REGISTER";
    }
  } catch (error) {
    console.error("Complete registration error:", error);
    showToast("Error completing registration: " + error.message, "error");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "REGISTER";
    }
  }
}

// ============================================
// 🔐 LOGIN
// ============================================

async function login(e) {
  e.preventDefault();

  const btn = document.getElementById("loginBtn");
  btn.disabled = true;
  btn.textContent = "⏳ LOGGING IN...";

  try {
    const phone = document
      .getElementById("loginPhone")
      .value.trim()
      .replace(/\D/g, "");
    const password = document.getElementById("loginPassword").value;
    const rememberMe = document.getElementById("rememberMe").checked;

    if (!phone || !password) {
      showToast("❌ Enter phone and password.", "error");
      btn.disabled = false;
      btn.textContent = "LOGIN";
      return;
    }

    if (supabaseInitialized && isOnline) {
      try {
        const user = await Database.users.get(phone);
        if (user) {
          if (user.password_hash !== password) {
            showToast("❌ Wrong password.", "error");
            btn.disabled = false;
            btn.textContent = "LOGIN";
            return;
          }

          if (user.is_banned) {
            showToast("🚫 Account is banned! Contact support.", "error");
            btn.disabled = false;
            btn.textContent = "LOGIN";
            return;
          }

          try {
            await Database.users.update(phone, {
              last_active: new Date().toISOString(),
            });
          } catch (updateErr) {
            console.log("Could not update last_active:", updateErr);
          }

          currentUser = {
            phone: user.phone,
            name: user.full_name,
            full_name: user.full_name,
            id: user.national_id,
            email: user.email,
            location: user.location,
            profession: user.profession,
            skills: user.skills ? user.skills.join(", ") : "",
            photo: user.photo_url,
            idScan: user.id_scan_url,
            password: user.password_hash,
            isPaid: user.is_paid || false,
            is_paid: user.is_paid || false,
            isBanned: user.is_banned || false,
            is_banned: user.is_banned || false,
            strikes: user.strikes || 0,
            rating: user.rating || 0,
            reviewCount: user.review_count || 0,
            registeredAt: user.created_at,
          };

          if (rememberMe) {
            localStorage.setItem(
              "gkode_currentUser",
              JSON.stringify(currentUser),
            );
          } else {
            sessionStorage.setItem(
              "gkode_currentUser",
              JSON.stringify(currentUser),
            );
          }

          document.getElementById("loginForm").reset();
          showToast("Welcome back, " + user.full_name + "!", "success");
          showScreen("home");
          loadGigs();
          initSecurity();
          btn.disabled = false;
          btn.textContent = "LOGIN";
          return;
        }
      } catch (err) {
        console.log("Supabase login error, falling back to local:", err);
      }
    }

    const localUsers = getUsersLocal();
    const localUser = localUsers.find(function (u) {
      return u.phone === phone;
    });

    if (!localUser) {
      showToast("❌ Phone not registered.", "error");
      btn.disabled = false;
      btn.textContent = "LOGIN";
      return;
    }

    if (localUser.password !== password) {
      showToast("❌ Wrong password.", "error");
      btn.disabled = false;
      btn.textContent = "LOGIN";
      return;
    }

    if (localUser.isBanned) {
      showToast("🚫 Account is banned!", "error");
      btn.disabled = false;
      btn.textContent = "LOGIN";
      return;
    }

    currentUser = localUser;
    localStorage.setItem("gkode_user", JSON.stringify(localUser));
    showToast("Welcome back, " + localUser.name + "!", "success");
    showScreen("home");
    loadGigs();
    initSecurity();
  } catch (err) {
    showToast("Login error: " + err.message, "error");
    console.error("Login error:", err);
  }

  btn.disabled = false;
  btn.textContent = "LOGIN";
}

// ============================================
// 🚪 LOGOUT
// ============================================

function logout() {
  currentUser = null;
  localStorage.removeItem("gkode_currentUser");
  sessionStorage.removeItem("gkode_currentUser");
  if (securityInterval) {
    clearInterval(securityInterval);
    securityInterval = null;
  }
  showToast("Logged out.", "info");
  showScreen("welcome");
}

// ============================================
// 🔑 RESET PASSWORD
// ============================================

async function sendResetCode() {
  const btn = document.getElementById("sendResetBtn");
  btn.disabled = true;
  btn.textContent = "⏳ SENDING...";

  try {
    const email = document.getElementById("resetEmail").value.trim();

    if (!email) {
      showToast("❌ Please enter your email.", "error");
      btn.disabled = false;
      btn.textContent = "📧 SEND RESET CODE";
      return;
    }

    let user = null;

    if (supabaseInitialized && isOnline) {
      try {
        const { data: users, error: findError } = await supabaseClient
          .from("users")
          .select("*")
          .eq("email", email);

        if (!findError && users && users.length > 0) {
          user = users[0];
        }
      } catch (err) {
        console.log("Supabase email check failed:", err);
      }
    }

    if (!user) {
      const localUsers = getUsersLocal();
      const localUser = localUsers.find(function (u) {
        return u.email === email;
      });
      if (localUser) {
        user = {
          phone: localUser.phone,
          national_id: localUser.id,
          profession: localUser.profession,
          location: localUser.location,
          full_name: localUser.name,
          id: localUser.phone,
        };
      }
    }

    if (!user) {
      showToast("❌ No account found with this email.", "error");
      btn.disabled = false;
      btn.textContent = "📧 SEND RESET CODE";
      return;
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("🔑 Reset Code:", resetCode);

    try {
      const emailSent = await sendResetEmail(
        email,
        user.full_name || "User",
        resetCode,
      );
      if (!emailSent) {
        showToast("⚠️ Email failed. Your code: " + resetCode, "warning");
      } else {
        showToast("📧 Reset code sent to " + email, "success");
      }
    } catch (err) {
      console.error("Send reset email error:", err);
      showToast(
        "📱 Your reset code: " + resetCode + " (Check spam folder)",
        "info",
      );
    }

    resetData = {
      email: email,
      code: resetCode,
      phone: user.phone,
      national_id: user.national_id,
      profession: user.profession,
      location: user.location,
      userId: user.id || user.phone,
    };

    document.getElementById("resetStep1").style.display = "none";
    document.getElementById("resetStep2").style.display = "block";
    document.getElementById("resetEmailDisplay").textContent = email;
    document.getElementById("resetOtp").value = "";
    document.getElementById("resetOtp").focus();

    startResetTimer();
  } catch (err) {
    showToast("Error: " + err.message, "error");
    console.error("Reset error:", err);
  }

  btn.disabled = false;
  btn.textContent = "📧 SEND RESET CODE";
}

async function verifyResetIdentity() {
  const btn = document.getElementById("verifyBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ VERIFYING...";
  }

  try {
    const enteredCode = document.getElementById("resetOtp").value.trim();
    const phone = document
      .getElementById("resetPhone")
      .value.trim()
      .replace(/\D/g, "");
    const id = document
      .getElementById("resetID")
      .value.trim()
      .replace(/\D/g, "");
    const profession = document.getElementById("resetProfession").value.trim();
    const location = document.getElementById("resetLocation").value.trim();

    if (!enteredCode || enteredCode.length !== 6) {
      showToast("❌ Please enter the 6-digit reset code.", "error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "VERIFY IDENTITY";
      }
      return;
    }

    if (!resetData) {
      showToast("❌ Reset session expired. Please start over.", "error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "VERIFY IDENTITY";
      }
      return;
    }

    if (enteredCode !== resetData.code) {
      showToast("❌ Invalid reset code. Please try again.", "error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "VERIFY IDENTITY";
      }
      return;
    }

    let errorMsg = "";

    if (phone !== resetData.phone) {
      errorMsg = "❌ Phone number does not match our records.";
    } else if (id !== resetData.national_id) {
      errorMsg = "❌ National ID does not match our records.";
    } else if (
      profession.toLowerCase() !== resetData.profession.toLowerCase()
    ) {
      errorMsg = "❌ Profession does not match our records.";
    } else if (location.toLowerCase() !== resetData.location.toLowerCase()) {
      errorMsg = "❌ Location does not match our records.";
    }

    if (errorMsg) {
      showToast(errorMsg + " Please check your details.", "error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "VERIFY IDENTITY";
      }
      return;
    }

    document.getElementById("resetStep2").style.display = "none";
    document.getElementById("resetStep3").style.display = "block";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
    document.getElementById("newPassword").focus();

    showToast("✅ Identity verified! Set your new password.", "success");
  } catch (err) {
    showToast("Error: " + err.message, "error");
    console.error("Verification error:", err);
  }

  if (btn) {
    btn.disabled = false;
    btn.textContent = "VERIFY IDENTITY";
  }
}

async function resendResetCode() {
  if (!resetData) {
    showToast("❌ Reset session expired. Please start over.", "error");
    return;
  }

  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  resetData.code = newCode;

  try {
    const emailSent = await sendResetEmail(resetData.email, "User", newCode);
    if (emailSent) {
      showToast("📧 New reset code sent!", "success");
      startResetTimer();
    } else {
      showToast("⚠️ Email failed. Your new code: " + newCode, "warning");
    }
  } catch (err) {
    console.error("Resend reset error:", err);
    showToast("📱 Your new code: " + newCode, "info");
  }
}

async function resetPassword() {
  const btn = document.getElementById("resetPasswordBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ RESETTING...";
  }

  try {
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const passwordStrength = validatePasswordStrength(newPassword);
    if (!passwordStrength.valid) {
      showToast(passwordStrength.message, "error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "RESET PASSWORD";
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("❌ Passwords do not match!", "error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "RESET PASSWORD";
      }
      return;
    }

    if (!resetData) {
      showToast("❌ Reset session expired. Please start over.", "error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "RESET PASSWORD";
      }
      return;
    }

    if (supabaseInitialized && isOnline) {
      try {
        const { error: updateError } = await supabaseClient
          .from("users")
          .update({ password_hash: newPassword })
          .eq("id", resetData.userId);

        if (!updateError) {
          const localUsers = getUsersLocal();
          for (var i = 0; i < localUsers.length; i++) {
            if (localUsers[i].phone === resetData.phone) {
              localUsers[i].password = newPassword;
              break;
            }
          }
          setUsersLocal(localUsers);

          resetData = null;
          clearInterval(resetTimerInterval);
          document.getElementById("resetStep3").style.display = "none";
          document.getElementById("resetStep1").style.display = "block";
          document.getElementById("resetEmail").value = "";
          showToast("✅ Password reset successful! Please login.", "success");
          showScreen("login");
          if (btn) {
            btn.disabled = false;
            btn.textContent = "RESET PASSWORD";
          }
          return;
        }
      } catch (err) {
        console.log("Supabase reset failed, trying local:", err);
      }
    }

    const localUsers = getUsersLocal();
    for (var i = 0; i < localUsers.length; i++) {
      if (localUsers[i].phone === resetData.phone) {
        localUsers[i].password = newPassword;
        break;
      }
    }
    setUsersLocal(localUsers);

    resetData = null;
    clearInterval(resetTimerInterval);
    document.getElementById("resetStep3").style.display = "none";
    document.getElementById("resetStep1").style.display = "block";
    document.getElementById("resetEmail").value = "";
    showToast("✅ Password reset successful! (Local)", "success");
    showScreen("login");
  } catch (err) {
    showToast("Error: " + err.message, "error");
    console.error("Reset password error:", err);
  }

  if (btn) {
    btn.disabled = false;
    btn.textContent = "RESET PASSWORD";
  }
}

function startResetTimer() {
  resetTimeLeft = 600;
  updateResetTimerDisplay();

  if (resetTimerInterval) clearInterval(resetTimerInterval);

  resetTimerInterval = setInterval(function () {
    resetTimeLeft--;
    updateResetTimerDisplay();

    if (resetTimeLeft <= 0) {
      clearInterval(resetTimerInterval);
      document.getElementById("resetCountdown").textContent = "00:00";
      document.getElementById("resetCountdown").style.color = "#cc0000";
      showToast("⏰ Reset code expired. Please resend.", "warning");
    }
  }, 1000);
}

function updateResetTimerDisplay() {
  const minutes = Math.floor(resetTimeLeft / 60);
  const seconds = resetTimeLeft % 60;
  const display = document.getElementById("resetCountdown");
  if (display) {
    display.textContent =
      String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  }
}

// ============================================
// 📋 GIG FUNCTIONS
// ============================================

function postGig(e) {
  if (e) e.preventDefault();
  if (!currentUser) {
    showToast("Please login first.", "error");
    return;
  }

  if (!isPaymentEnabled()) {
    showToast(
      "⚠️ System is in testing mode. Posting gigs is disabled.",
      "warning",
    );
    return;
  }

  if (!currentUser.isPaid && !currentUser.is_paid) {
    showToast(
      "💳 Please pay the one-time fee of Ksh 300 to post a gig.",
      "warning",
    );
    showScreen("payment");
    return;
  }

  // Rate limit
  if (!checkRateLimit("gig", 5, 20, 50)) return;

  const btn = document.getElementById("postGigBtn");
  if (!btn || isProcessing) return;
  isProcessing = true;
  btn.disabled = true;
  btn.textContent = "⏳ POSTING...";

  try {
    const title = document.getElementById("gigTitle")?.value?.trim() || "";
    const skill = document.getElementById("gigSkill")?.value?.trim() || "";
    const location =
      document.getElementById("gigLocation")?.value?.trim() || "";
    const urgency = document.getElementById("gigUrgency")?.value || "Normal";
    const budgetMin =
      parseInt(document.getElementById("gigBudgetMin")?.value) || 0;
    const budgetMax =
      parseInt(document.getElementById("gigBudgetMax")?.value) || 0;
    const description = document.getElementById("gigDesc")?.value?.trim() || "";

    if (!title || !skill || !location || !budgetMin || !budgetMax) {
      showToast("Fill all required fields.", "error");
      btn.disabled = false;
      btn.textContent = "POST GIG";
      isProcessing = false;
      return;
    }

    if (budgetMin > budgetMax) {
      showToast("Min budget cannot be greater than Max.", "error");
      btn.disabled = false;
      btn.textContent = "POST GIG";
      isProcessing = false;
      return;
    }

    const gig = {
      id: Date.now().toString(),
      title: sanitizeInput(title),
      skill: sanitizeInput(skill),
      location: sanitizeInput(location),
      urgency: urgency,
      budgetMin: budgetMin,
      budgetMax: budgetMax,
      description: sanitizeInput(description),
      client: currentUser.name,
      clientPhone: currentUser.phone,
      status: "Open",
      worker: "",
      workerPhone: "",
      gpsLat: document.getElementById("gigGPSLat")?.value || null,
      gpsLon: document.getElementById("gigGPSLon")?.value || null,
      createdAt: new Date().toISOString(),
    };

    let gigs = getGigsLocal();
    gigs.push(gig);
    setGigsLocal(gigs);

    if (supabaseInitialized && isOnline) {
      try {
        networkRetry(function () {
          return supabaseClient.from("gigs").insert({
            id: gig.id,
            title: gig.title,
            skill: gig.skill,
            location: gig.location,
            urgency: gig.urgency,
            budget_min: gig.budgetMin,
            budget_max: gig.budgetMax,
            description: gig.description,
            client_phone: gig.clientPhone,
            client_name: gig.client,
            status: gig.status,
            gps_lat: gig.gpsLat,
            gps_lon: gig.gpsLon,
            created_at: gig.createdAt,
          });
        });
      } catch (err) {
        console.log("Could not save gig to Supabase:", err);
      }
    }

    showToast("✅ Gig posted successfully!", "success");
    showScreen("home");
    loadGigs();
  } catch (err) {
    showToast("Error: " + err.message, "error");
    console.error("Post gig error:", err);
  } finally {
    btn.disabled = false;
    btn.textContent = "POST GIG";
    isProcessing = false;
  }
}

function captureGigLocation() {
  if (!navigator.geolocation) {
    showToast("GPS not supported.", "error");
    return;
  }
  showToast("📍 Capturing location...", "info");
  navigator.geolocation.getCurrentPosition(
    function (pos) {
      document.getElementById("gigGPSLat").value = pos.coords.latitude;
      document.getElementById("gigGPSLon").value = pos.coords.longitude;
      document.getElementById("gigLocationStatus").textContent =
        "✅ Location captured!";
      document.getElementById("gigLocationStatus").style.color = "#006400";
      showToast("✅ Location captured!", "success");
    },
    function () {
      showToast("❌ Enable GPS.", "error");
    },
  );
}

function switchTab(tab) {
  currentTab = tab;
  const openBtn = document.getElementById("tabOpen");
  const takenBtn = document.getElementById("tabTaken");
  if (tab === "open") {
    openBtn.className = "active";
    takenBtn.className = "";
  } else {
    openBtn.className = "";
    takenBtn.className = "active";
  }
  loadGigs();
}

async function loadGigs() {
  const container = document.getElementById("gigsList");
  if (!container) return;

  if (!isPaymentEnabled()) {
    container.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; background: #fff3e0; border-radius: 12px; margin: 20px 0;">
                <h3 style="color: #ff9800;">⚠️ System Maintenance</h3>
                <p style="color: #666; margin-top: 10px;">G-KODE is currently in testing mode.</p>
                <p style="color: #666;">Features are temporarily disabled.</p>
                <p style="color: #888; font-size: 12px; margin-top: 10px;">🇰🇪 Kenya Helping Kenya</p>
            </div>
        `;
    return;
  }

  let gigs = [];

  if (supabaseInitialized && isOnline) {
    try {
      const data = await Database.gigs.getAll({
        limit: Device.capabilities.memory <= 2 ? 20 : 50,
        filter:
          currentTab === "open" ? { status: "Open" } : { status: "Assigned" },
      });
      gigs = data || [];
    } catch (err) {
      console.log("Could not load gigs from Supabase:", err);
    }
  }

  if (gigs.length === 0) {
    gigs = getGigsLocal();
  }

  const filtered = [];
  for (var i = 0; i < gigs.length; i++) {
    var g = gigs[i];
    if (currentTab === "open" && g.status === "Open") {
      filtered.push(g);
    } else if (
      currentTab === "taken" &&
      (g.status === "Assigned" || g.status === "Taken")
    ) {
      filtered.push(g);
    }
  }

  if (filtered.length === 0) {
    container.innerHTML =
      '<div style="padding:40px 0;text-align:center;color:#666;"><p>No ' +
      currentTab +
      " gigs found.</p></div>";
    return;
  }

  function renderGigCard(g) {
    var open = g.status === "Open";
    var urgencyColor =
      g.urgency === "Emergency"
        ? "#cc0000"
        : g.urgency === "Urgent"
          ? "#ff9800"
          : "#006400";

    var html =
      '<div class="gig-card" style="border-left:4px solid ' +
      urgencyColor +
      ';">';
    html += '<div class="gig-title">' + displaySafe(g.title) + "</div>";
    html +=
      '<span class="badge ' +
      (open ? "badge-open" : "badge-taken") +
      '">' +
      (open ? "🟢 OPEN" : "🔴 TAKEN") +
      "</span>";
    html +=
      '<div class="gig-meta">👤 ' +
      displaySafe(g.client) +
      " | 🛠️ " +
      displaySafe(g.skill) +
      "</div>";
    html += '<div class="gig-meta">📍 ' + displaySafe(g.location) + "</div>";
    html +=
      '<div class="gig-budget">💰 Ksh ' +
      g.budgetMin +
      " - " +
      g.budgetMax +
      "</div>";
    if (open) {
      if (
        isPaymentEnabled() &&
        currentUser &&
        (currentUser.isPaid || currentUser.is_paid)
      ) {
        html +=
          '<div class="gig-actions"><button class="btn-accept" onclick="acceptGig(\'' +
          g.id +
          "')\">✅ ACCEPT</button></div>";
      } else if (currentUser && !currentUser.isPaid && !currentUser.is_paid) {
        html +=
          '<div class="gig-actions"><button class="btn-accept" style="background:#ff9800;" onclick="showPaymentScreen()">💳 PAY TO ACCEPT</button></div>';
      }
    } else {
      html +=
        '<div class="gig-actions"><button class="btn-chat" onclick="openChat(\'' +
        g.id +
        "')\">💬 Chat</button></div>";
    }
    html += "</div>";
    return html;
  }

  // Use adaptive rendering
  if (Device.capabilities.memory <= 2) {
    container.innerHTML = "";
    renderAdaptive(container, filtered, renderGigCard);
  } else {
    var html = "";
    filtered.forEach(function (g) {
      html += renderGigCard(g);
    });
    container.innerHTML = html;
  }
}

function acceptGig(id) {
  if (!currentUser) {
    showToast("Please login first.", "error");
    return;
  }

  if (!isPaymentEnabled()) {
    showToast(
      "⚠️ System is in testing mode. Accepting gigs is disabled.",
      "warning",
    );
    return;
  }

  if (!currentUser.isPaid && !currentUser.is_paid) {
    showToast(
      "💳 Please pay the one-time fee of Ksh 300 to accept gigs.",
      "warning",
    );
    showScreen("payment");
    return;
  }

  let gigs = getGigsLocal();
  var gig = null;
  for (var i = 0; i < gigs.length; i++) {
    if (gigs[i].id === id) {
      gig = gigs[i];
      break;
    }
  }
  if (!gig) {
    showToast("Gig not found.", "error");
    return;
  }
  if (gig.status !== "Open") {
    showToast("Gig already taken.", "error");
    return;
  }
  if (gig.client === currentUser.name) {
    showToast("You cannot accept your own gig.", "warning");
    return;
  }

  gig.status = "Assigned";
  gig.worker = currentUser.name;
  gig.workerPhone = currentUser.phone;

  setGigsLocal(gigs);

  if (supabaseInitialized && isOnline) {
    try {
      networkRetry(function () {
        return supabaseClient
          .from("gigs")
          .update({
            status: "Assigned",
            worker_name: currentUser.name,
            worker_phone: currentUser.phone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
      });
    } catch (err) {
      console.log("Could not update gig in Supabase:", err);
    }
  }

  showToast("✅ Gig accepted!", "success");
  loadGigs();
  openChat(id);
}

// ============================================
// 💬 CHAT FUNCTIONS
// ============================================

function openChat(id) {
  currentGigId = id;
  document.getElementById("chatGigId").value = id;
  const gigs = getGigsLocal();
  var gig = null;
  for (var i = 0; i < gigs.length; i++) {
    if (gigs[i].id === id) {
      gig = gigs[i];
      break;
    }
  }
  if (gig) {
    var partner = gig.client === currentUser.name ? gig.worker : gig.client;
    document.getElementById("chatPartner").textContent =
      "💬 Chat with " + displaySafe(partner);
  }
  showScreen("chat");
  loadChatMessages(id);
}

function loadChatMessages(id) {
  const container = document.getElementById("chatMessages");
  if (!container) return;
  const messages = JSON.parse(localStorage.getItem("gkode_chat_" + id) || "[]");
  if (messages.length === 0) {
    container.innerHTML =
      '<div style="color:#999;padding:20px;text-align:center;">No messages yet.</div>';
    return;
  }
  var html = "";
  for (var i = 0; i < messages.length; i++) {
    var msg = messages[i];
    var isSent = msg.sender === currentUser.name;
    html += '<div class="chat-message ' + (isSent ? "sent" : "received") + '">';
    if (!isSent)
      html += '<div class="sender">' + displaySafe(msg.sender) + "</div>";
    if (msg.isLocation) {
      html +=
        '📍 <a href="' +
        displaySafe(msg.text) +
        '" target="_blank" style="color:' +
        (isSent ? "#FFD700" : "#006400") +
        ';">View Location</a>';
    } else {
      html += displaySafe(msg.text);
    }
    html +=
      '<div class="time">' + new Date(msg.time).toLocaleTimeString() + "</div>";
    html += "</div>";
  }
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

function sendMessage(e) {
  if (e) e.preventDefault();
  const text = document.getElementById("chatInput")?.value?.trim() || "";
  const id = document.getElementById("chatGigId")?.value || "";
  if (!text || !id || !currentUser) return;
  const messages = JSON.parse(localStorage.getItem("gkode_chat_" + id) || "[]");
  messages.push({
    sender: currentUser.name,
    text: sanitizeInput(text),
    time: new Date().toISOString(),
    isLocation: false,
  });
  localStorage.setItem("gkode_chat_" + id, JSON.stringify(messages));
  document.getElementById("chatInput").value = "";
  loadChatMessages(id);
}

function shareLiveLocation() {
  if (!currentUser || !navigator.geolocation) {
    showToast(
      !currentUser ? "Please login first." : "GPS not supported.",
      "error",
    );
    return;
  }
  showToast("📍 Getting your location...", "info");
  navigator.geolocation.getCurrentPosition(
    function (pos) {
      var url =
        "https://www.google.com/maps?q=" +
        pos.coords.latitude +
        "," +
        pos.coords.longitude;
      var id = document.getElementById("chatGigId")?.value || "";
      var messages = JSON.parse(
        localStorage.getItem("gkode_chat_" + id) || "[]",
      );
      messages.push({
        sender: currentUser.name,
        text: url,
        time: new Date().toISOString(),
        isLocation: true,
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      });
      localStorage.setItem("gkode_chat_" + id, JSON.stringify(messages));
      window.open(url, "_blank");
      loadChatMessages(id);
      showToast("✅ Location shared!", "success");
    },
    function () {
      showToast("❌ Could not get location.", "error");
    },
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

function navigateToClient() {
  var id = document.getElementById("chatGigId")?.value || "";
  var gigs = getGigsLocal();
  var gig = null;
  for (var i = 0; i < gigs.length; i++) {
    if (gigs[i].id === id) {
      gig = gigs[i];
      break;
    }
  }
  if (!gig || !gig.gpsLat || !gig.gpsLon) {
    showToast("No location data for this gig.", "error");
    return;
  }
  var url =
    "https://www.google.com/maps/dir/?api=1&destination=" +
    gig.gpsLat +
    "," +
    gig.gpsLon;
  window.open(url, "_blank");
  showToast("🧭 Opening directions...", "info");
}

// ============================================
// 👤 PROFILE FUNCTIONS
// ============================================

function loadProfile() {
  if (!currentUser) return;
  document.getElementById("profileName").textContent =
    currentUser.full_name || currentUser.name;
  document.getElementById("profilePhone").textContent =
    "📞 " + currentUser.phone;
  document.getElementById("profileLocation").textContent =
    "📍 " + currentUser.location;
  document.getElementById("profileProfession").textContent =
    "👔 " + currentUser.profession;
  document.getElementById("profileSkills").textContent =
    "🛠️ " +
    (currentUser.skills
      ? Array.isArray(currentUser.skills)
        ? currentUser.skills.join(", ")
        : currentUser.skills
      : "None");
  if (currentUser.photo_url || currentUser.photo) {
    document.getElementById("profilePhoto").src =
      currentUser.photo_url || currentUser.photo;
  }
  var statusText = currentUser.is_paid ? "✅ Paid" : "🟡 Pending";
  document.getElementById("profileStatus").innerHTML =
    statusText +
    " | ⭐ " +
    (currentUser.rating || 0) +
    " (" +
    (currentUser.review_count || 0) +
    " reviews)";

  var gigs = getGigsLocal();
  var myGigs = [];
  for (var i = 0; i < gigs.length; i++) {
    if (
      gigs[i].client === currentUser.name ||
      gigs[i].worker === currentUser.name
    ) {
      myGigs.push(gigs[i]);
    }
  }
  var container = document.getElementById("myGigsList");
  if (myGigs.length === 0) {
    container.innerHTML = '<p style="color:#666;">No gigs yet.</p>';
  } else {
    var html = "";
    for (var i = 0; i < myGigs.length; i++) {
      var g = myGigs[i];
      html +=
        '<div style="background:#f5f5f5;padding:10px;border-radius:8px;margin-bottom:8px;">';
      html += "<strong>" + displaySafe(g.title) + "</strong> — " + g.status;
      if (g.status === "Assigned" && g.worker === currentUser.name) {
        html +=
          " <button onclick=\"openChat('" +
          g.id +
          '\')" style="background:#2196F3;color:#fff;border:none;padding:5px 10px;border-radius:5px;font-size:12px;cursor:pointer;">💬 Chat</button>';
      }
      html += "</div>";
    }
    container.innerHTML = html;
  }
  checkAdminAccess();
}

function isAdmin() {
  if (!currentUser) return false;
  for (var i = 0; i < ADMIN_PHONES.length; i++) {
    if (ADMIN_PHONES[i] === currentUser.phone) return true;
  }
  return false;
}

function checkAdminAccess() {
  var btn = document.getElementById("adminAccessBtn");
  if (!btn) return;
  btn.style.display = isAdmin() ? "block" : "none";
}

function openAdminPanel() {
  window.open("admin.html", "_blank");
}

// ============================================
// 🛒 MARKETPLACE FUNCTIONS
// ============================================

function loadMarketplace() {
  var container = document.getElementById("marketplaceList");
  if (!container) return;

  if (!isPaymentEnabled()) {
    container.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; background: #fff3e0; border-radius: 12px; margin: 20px 0;">
                <h3 style="color: #ff9800;">⚠️ System Maintenance</h3>
                <p style="color: #666; margin-top: 10px;">Marketplace is temporarily disabled.</p>
                <p style="color: #888; font-size: 12px; margin-top: 10px;">🇰🇪 Kenya Helping Kenya</p>
            </div>
        `;
    return;
  }

  var products = getProductsLocal();
  if (products.length === 0) {
    container.innerHTML =
      '<div style="padding:40px 0;text-align:center;color:#666;"><p>No products available.</p></div>';
    return;
  }
  var html = "";
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    html += '<div class="gig-card">';
    html += "<h3>" + displaySafe(p.name) + "</h3>";
    html +=
      "<p>🏢 " +
      displaySafe(p.companyName) +
      " | " +
      displaySafe(p.category) +
      "</p>";
    html += "<p>💰 Ksh " + p.price + "/" + p.unit + "</p>";
    html += "<p>📦 Stock: " + p.stock + "</p>";
    if (currentUser && (currentUser.isPaid || currentUser.is_paid)) {
      html +=
        "<button onclick=\"buyProduct('" +
        p.id +
        '\')" style="background:#006400;color:#FFD700;border:none;padding:10px;border-radius:8px;width:100%;font-weight:bold;cursor:pointer;margin-top:5px;">🛒 BUY</button>';
    } else {
      html +=
        '<button style="background:#ff9800;color:#000;border:none;padding:10px;border-radius:8px;width:100%;font-weight:bold;cursor:pointer;margin-top:5px;" onclick="showPaymentScreen()">💳 PAY TO BUY</button>';
    }
    html += "</div>";
  }
  container.innerHTML = html;
}

function buyProduct(id) {
  if (!currentUser) {
    showToast("Please login first.", "error");
    return;
  }
  if (!currentUser.isPaid && !currentUser.is_paid) {
    showToast(
      "💳 Please pay the one-time fee of Ksh 300 to buy products.",
      "warning",
    );
    showScreen("payment");
    return;
  }
  var products = getProductsLocal();
  var product = null;
  for (var i = 0; i < products.length; i++) {
    if (products[i].id === id) {
      product = products[i];
      break;
    }
  }
  if (!product) {
    showToast("Product not found.", "error");
    return;
  }
  if (product.stock <= 0) {
    showToast("Out of stock.", "error");
    return;
  }
  product.stock--;
  setProductsLocal(products);
  showToast("✅ Purchased!", "success");
  loadMarketplace();
}

// ============================================
// 🏢 COMPANY FUNCTIONS
// ============================================

function registerCompany(e) {
  if (e) e.preventDefault();
  if (!currentUser) {
    showToast("Please login first.", "error");
    return;
  }

  if (!isPaymentEnabled()) {
    showToast(
      "⚠️ System is in testing mode. Business registration is disabled.",
      "warning",
    );
    return;
  }

  if (!currentUser.isPaid && !currentUser.is_paid) {
    showToast(
      "💳 Please pay the one-time fee of Ksh 300 to register a business.",
      "warning",
    );
    showScreen("payment");
    return;
  }

  var btn = document.getElementById("compRegisterBtn");
  if (!btn || isProcessing) return;
  isProcessing = true;
  btn.disabled = true;
  btn.textContent = "⏳ REGISTERING...";

  try {
    var name = document.getElementById("compName")?.value?.trim() || "";
    var type = document.getElementById("compType")?.value || "";
    var regNo = document.getElementById("compRegNo")?.value?.trim() || "";
    var location = document.getElementById("compLocation")?.value?.trim() || "";
    var phone = document.getElementById("compPhone")?.value?.trim() || "";
    var email = document.getElementById("compEmail")?.value?.trim() || "";
    var desc = document.getElementById("compDesc")?.value?.trim() || "";

    if (!name || !type || !regNo || !location || !phone) {
      showToast("Fill all required fields.", "error");
      btn.disabled = false;
      btn.textContent = "REGISTER BUSINESS";
      isProcessing = false;
      return;
    }

    var companies = getCompaniesLocal();
    for (var i = 0; i < companies.length; i++) {
      if (companies[i].name === name) {
        showToast("Business name already registered.", "error");
        btn.disabled = false;
        btn.textContent = "REGISTER BUSINESS";
        isProcessing = false;
        return;
      }
    }

    var company = {
      id: Date.now().toString(),
      name: sanitizeInput(name),
      type: sanitizeInput(type),
      regNo: sanitizeInput(regNo),
      location: sanitizeInput(location),
      phone: phone,
      email: email || "",
      desc: sanitizeInput(desc),
      owner: currentUser.name,
      ownerPhone: currentUser.phone,
      registeredAt: new Date().toISOString(),
      totalSales: 0,
      totalCommission: 0,
    };

    companies.push(company);
    setCompaniesLocal(companies);

    if (supabaseInitialized && isOnline) {
      try {
        networkRetry(function () {
          return supabaseClient.from("companies").insert({
            id: company.id,
            name: company.name,
            type: company.type,
            reg_no: company.regNo,
            location: company.location,
            phone: company.phone,
            email: company.email,
            description: company.desc,
            owner_phone: company.ownerPhone,
            owner_name: company.owner,
            created_at: company.registeredAt,
          });
        });
      } catch (err) {
        console.log("Could not save company to Supabase:", err);
      }
    }

    showToast("✅ " + name + " registered successfully!", "success");
    showScreen("companyDashboard");
    loadCompanyDashboard();
  } catch (err) {
    showToast("Error: " + err.message, "error");
    console.error("Company registration error:", err);
  } finally {
    btn.disabled = false;
    btn.textContent = "REGISTER BUSINESS";
    isProcessing = false;
  }
}

function loadCompanyDashboard() {
  if (!currentUser) return;
  var companies = getCompaniesLocal();
  var myComp = null;
  for (var i = 0; i < companies.length; i++) {
    if (companies[i].ownerPhone === currentUser.phone) {
      myComp = companies[i];
      break;
    }
  }
  if (!myComp) {
    document.getElementById("compInfo").innerHTML =
      "<p>No business registered.</p>";
    return;
  }
  document.getElementById("compInfo").innerHTML =
    "<h3>" +
    displaySafe(myComp.name) +
    "</h3><p>🏢 " +
    displaySafe(myComp.type) +
    " | 📍 " +
    displaySafe(myComp.location) +
    "</p><p>📞 " +
    myComp.phone +
    "</p><p>📜 Reg No: " +
    displaySafe(myComp.regNo) +
    "</p>";
  showCompTab("products");
}

function showCompTab(tab) {
  var content = document.getElementById("compTabContent");
  var companies = getCompaniesLocal();
  var myComp = null;
  for (var i = 0; i < companies.length; i++) {
    if (companies[i].ownerPhone === currentUser.phone) {
      myComp = companies[i];
      break;
    }
  }
  if (!myComp) return;
  var products = getProductsLocal();
  var myProducts = [];
  for (var i = 0; i < products.length; i++) {
    if (products[i].companyId === myComp.id) {
      myProducts.push(products[i]);
    }
  }

  if (tab === "products") {
    if (myProducts.length === 0) {
      content.innerHTML = "<p>No products yet.</p>";
      return;
    }
    var html = "";
    for (var i = 0; i < myProducts.length; i++) {
      var p = myProducts[i];
      html += '<div class="gig-card">';
      html += "<h3>" + displaySafe(p.name) + "</h3>";
      html +=
        "<p>" +
        displaySafe(p.category) +
        " | Ksh " +
        p.price +
        "/" +
        p.unit +
        " | Stock: " +
        p.stock +
        "</p>";
      html +=
        "<button onclick=\"deleteProduct('" +
        p.id +
        '\')" style="background:#cc0000;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">🗑️ Delete</button>';
      html += "</div>";
    }
    content.innerHTML = html;
  } else if (tab === "orders") {
    content.innerHTML = "<p>Orders will appear here.</p>";
  } else if (tab === "sales") {
    var totalSales = myComp.totalSales || 0;
    var totalCommission = myComp.totalCommission || 0;
    content.innerHTML =
      '<div class="admin-card"><p><strong>Total Sales:</strong> Ksh ' +
      totalSales +
      "</p><p><strong>Total Commission:</strong> Ksh " +
      totalCommission +
      "</p><p><strong>Commission Rate:</strong> 3%</p></div>";
  }
}

function addProduct(e) {
  if (e) e.preventDefault();
  if (!currentUser) {
    showToast("Please login first.", "error");
    return;
  }
  if (!currentUser.isPaid && !currentUser.is_paid) {
    showToast(
      "💳 Please pay the one-time fee of Ksh 300 to add products.",
      "warning",
    );
    showScreen("payment");
    return;
  }
  var btn = document.getElementById("addProductBtn");
  if (!btn || isProcessing) return;
  isProcessing = true;
  btn.disabled = true;
  btn.textContent = "⏳ ADDING...";

  try {
    var name = document.getElementById("prodName")?.value?.trim() || "";
    var category = document.getElementById("prodCategory")?.value || "";
    var unit = document.getElementById("prodUnit")?.value?.trim() || "";
    var price = parseFloat(document.getElementById("prodPrice")?.value) || 0;
    var stock = parseInt(document.getElementById("prodStock")?.value) || 0;
    var desc = document.getElementById("prodDesc")?.value?.trim() || "";

    if (!name || !category || !unit || !price || !stock) {
      showToast("Fill all fields.", "error");
      btn.disabled = false;
      btn.textContent = "ADD PRODUCT";
      isProcessing = false;
      return;
    }

    var companies = getCompaniesLocal();
    var myComp = null;
    for (var i = 0; i < companies.length; i++) {
      if (companies[i].ownerPhone === currentUser.phone) {
        myComp = companies[i];
        break;
      }
    }
    if (!myComp) {
      showToast("Register a business first.", "error");
      btn.disabled = false;
      btn.textContent = "ADD PRODUCT";
      isProcessing = false;
      return;
    }

    var product = {
      id: Date.now().toString(),
      companyId: myComp.id,
      companyName: myComp.name,
      name: sanitizeInput(name),
      category: sanitizeInput(category),
      unit: sanitizeInput(unit),
      price: price,
      stock: stock,
      desc: sanitizeInput(desc),
      createdAt: new Date().toISOString(),
    };

    var products = getProductsLocal();
    products.push(product);
    setProductsLocal(products);

    if (supabaseInitialized && isOnline) {
      try {
        networkRetry(function () {
          return supabaseClient.from("products").insert({
            id: product.id,
            company_id: product.companyId,
            company_name: product.companyName,
            name: product.name,
            category: product.category,
            unit: product.unit,
            price: product.price,
            stock: product.stock,
            description: product.desc,
            created_at: product.createdAt,
          });
        });
      } catch (err) {
        console.log("Could not save product to Supabase:", err);
      }
    }

    showToast("✅ " + name + " added!", "success");
    showScreen("companyDashboard");
    loadCompanyDashboard();
  } catch (err) {
    showToast("Error: " + err.message, "error");
    console.error("Add product error:", err);
  } finally {
    btn.disabled = false;
    btn.textContent = "ADD PRODUCT";
    isProcessing = false;
  }
}

function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  var products = getProductsLocal();
  var newProducts = [];
  for (var i = 0; i < products.length; i++) {
    if (products[i].id !== id) {
      newProducts.push(products[i]);
    }
  }
  setProductsLocal(newProducts);
  showToast("Product deleted.", "info");
  loadCompanyDashboard();
}

// ============================================
// 💳 PAYMENT FUNCTIONS
// ============================================

function getPaymentSettings() {
  try {
    return JSON.parse(localStorage.getItem("gkode_payment_settings") || "{}");
  } catch {
    return {};
  }
}

function setPaymentSettings(settings) {
  localStorage.setItem("gkode_payment_settings", JSON.stringify(settings));
}

function loadPaymentDetails() {
  var settings = getPaymentSettings();
  var till = document.getElementById("displayTill");
  var paybill = document.getElementById("displayPaybill");
  var account = document.getElementById("displayAccount");
  var commission = document.getElementById("displayCommission");
  var bank = document.getElementById("displayGkodeBank");
  if (till) till.textContent = settings.tillNumber || "9876543";
  if (paybill) paybill.textContent = settings.paybillNumber || "247247";
  if (account) account.textContent = settings.accountReference || "G-KODE";
  if (commission) commission.textContent = (settings.commissionRate || 3) + "%";
  if (bank) bank.textContent = settings.bankName || "Equity Bank";
}

function showPaymentScreen() {
  loadPaymentDetails();
  showScreen("payment");
}

function verifyMpesaPayment() {
  var code = document.getElementById("mpesaCode")?.value?.trim() || "";
  if (!code) {
    showToast("Please enter M-Pesa confirmation code.", "error");
    return;
  }

  var settings = getPaymentSettings();
  var commissionRate = settings.commissionRate || 3;
  var amount = 300;
  var commission = (amount * commissionRate) / 100;
  var sellerAmount = amount - commission;

  var msg =
    "💳 PAYMENT BREAKDOWN\n\n" +
    "💰 Total Amount: Ksh " +
    amount +
    "\n" +
    "📊 Commission (" +
    commissionRate +
    "%): Ksh " +
    commission.toFixed(2) +
    "\n" +
    "🏦 You Pay: Ksh " +
    amount +
    "\n" +
    "🏢 G-KODE Bank: " +
    (settings.bankName || "Equity Bank") +
    "\n\n" +
    "✅ Confirm payment?";

  if (!confirm(msg)) return;

  var payments = JSON.parse(localStorage.getItem("gkode_payments") || "[]");
  payments.push({
    id: Date.now().toString(),
    phone: currentUser.phone,
    userName: currentUser.name,
    code: code,
    amount: amount,
    commission: commission,
    commissionRate: commissionRate,
    sellerAmount: sellerAmount,
    type: "user_fee",
    verified: true,
    date: new Date().toISOString(),
  });
  localStorage.setItem("gkode_payments", JSON.stringify(payments));

  var users = getUsersLocal();
  for (var i = 0; i < users.length; i++) {
    if (users[i].phone === currentUser.phone) {
      users[i].isPaid = true;
      break;
    }
  }
  setUsersLocal(users);
  currentUser.isPaid = true;
  localStorage.setItem("gkode_user", JSON.stringify(currentUser));

  showToast(
    "✅ Payment verified! Commission: Ksh " + commission.toFixed(2),
    "success",
  );
  showScreen("home");
}

// ============================================
// 🚨 EMERGENCY
// ============================================

function emergencyCall() {
  if (confirm("🚨 EMERGENCY\n\nTap OK to open emergency contacts.")) {
    window.location.href = "emergency.html";
  }
}

// ============================================
// 🔄 UPDATE BOTTOM NAV
// ============================================

function updateBottomNav() {
  var nav = document.getElementById("bottomNav");
  if (!nav) return;
  if (currentUser) {
    nav.classList.remove("hidden");
  } else {
    nav.classList.add("hidden");
  }
}

// ============================================
// 🔄 RESET
// ============================================

function resetEverything() {
  if (
    !confirm(
      "⚠️ WARNING: This will delete ALL data on this device!\n\nContinue?",
    )
  )
    return;
  localStorage.clear();
  showToast("🔄 All data reset", "info");
  showScreen("welcome");
  updateBottomNav();
}

// ============================================
// ⚖️ LEGAL & EXPORT
// ============================================

function showLegalNotice(type) {
  var notices = {
    privacy:
      "🔒 PRIVACY NOTICE\n\nWe collect: Name, phone, ID, email, location, profession, skills, photo, ID scan, GPS location.\n\nYour rights: Access, correct, delete anytime.",
    terms:
      "📜 TERMS OF SERVICE\n\n1. G-KODE is a connector\n2. Users responsible for actions\n3. Kenyan law applies",
    disclaimer:
      "⚠️ DISCLAIMER\n\n1. G-KODE provides platform connection\n2. We do not guarantee gig completion\n3. Use at your own risk",
  };
  alert(notices[type] || "Notice not found.");
}

function exportUserData() {
  if (!currentUser) {
    showToast("Please login first.", "error");
    return;
  }
  var data = {
    exportedAt: new Date().toISOString(),
    user: currentUser,
    userGigs: [],
    userOrders: [],
    userPayments: [],
  };
  var gigs = getGigsLocal();
  for (var i = 0; i < gigs.length; i++) {
    if (
      gigs[i].client === currentUser.name ||
      gigs[i].worker === currentUser.name
    ) {
      data.userGigs.push(gigs[i]);
    }
  }
  var payments = JSON.parse(localStorage.getItem("gkode_payments") || "[]");
  for (var i = 0; i < payments.length; i++) {
    if (payments[i].phone === currentUser.phone) {
      data.userPayments.push(payments[i]);
    }
  }
  var blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download =
    "gkode-my-data-" + new Date().toISOString().split("T")[0] + ".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast("✅ Your data has been exported.", "success");
}

function deleteAccount() {
  if (!currentUser) {
    showToast("Please login first.", "error");
    return;
  }
  if (!confirm("⚠️ ACCOUNT DELETION\n\nThis CANNOT be undone!")) return;
  if (!confirm("FINAL WARNING: Continue?")) return;

  var users = getUsersLocal();
  var newUsers = [];
  for (var i = 0; i < users.length; i++) {
    if (users[i].phone !== currentUser.phone) {
      newUsers.push(users[i]);
    }
  }
  setUsersLocal(newUsers);

  var gigs = getGigsLocal();
  var newGigs = [];
  for (var i = 0; i < gigs.length; i++) {
    if (
      gigs[i].client !== currentUser.name &&
      gigs[i].worker !== currentUser.name
    ) {
      newGigs.push(gigs[i]);
    }
  }
  setGigsLocal(newGigs);

  currentUser = null;
  localStorage.removeItem("gkode_user");
  localStorage.removeItem("gkode_token");
  showToast("✅ Account deleted successfully.", "success");
  showScreen("welcome");
  updateBottomNav();
}

// ============================================
// 🔄 SYNC ALL LOCAL USERS TO SUPABASE
// ============================================

async function syncAllUsersToCloud() {
  if (!supabaseInitialized || !isOnline) {
    showToast("❌ Supabase not connected or offline!", "error");
    return;
  }

  var localUsers = getUsersLocal();

  if (localUsers.length === 0) {
    showToast("⚠️ No local users to sync", "warning");
    return;
  }

  showToast("⏳ Syncing " + localUsers.length + " users to cloud...", "info");

  var successCount = 0;
  var failCount = 0;

  for (var i = 0; i < localUsers.length; i++) {
    try {
      var result = await networkRetry(function () {
        return supabaseClient.from("users").upsert(
          {
            phone: localUsers[i].phone,
            national_id: localUsers[i].id,
            email: localUsers[i].email,
            full_name: localUsers[i].name,
            location: localUsers[i].location,
            profession: localUsers[i].profession,
            skills: localUsers[i].skills ? [localUsers[i].skills] : [],
            photo_url: localUsers[i].photo,
            password_hash: localUsers[i].password,
            rating: localUsers[i].rating || 0,
            review_count: localUsers[i].reviewCount || 0,
            strikes: localUsers[i].strikes || 0,
            is_paid: localUsers[i].isPaid || false,
            is_banned: localUsers[i].isBanned || false,
            last_active: new Date().toISOString(),
          },
          { onConflict: "phone" },
        );
      });
      if (!result.error) {
        successCount++;
      } else {
        failCount++;
        console.error("Sync error for", localUsers[i].phone, result.error);
      }
    } catch (err) {
      failCount++;
      console.error("Sync error for", localUsers[i].phone, err);
    }
  }

  showToast(
    "✅ Synced " + successCount + " users, " + failCount + " failed",
    successCount > 0 ? "success" : "error",
  );
}

// ============================================
// 🚀 INIT
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 G-KODE v5.0 (Universal) loading...");
  console.log("🌐 Device:", Device.type);
  console.log("📊 Memory:", Device.capabilities.memory + "GB");
  console.log("📡 Online:", navigator.onLine ? "✅" : "❌");
  console.log("💳 Payment:", paymentEnabled ? "ACTIVE" : "DISABLED");

  populateProfessionDropdown();
  populateCategoryDropdown();

  setupFilePreview("regPhoto", "photoPreview", "photoPreviewContainer");
  setupFilePreview("regIDScan", "idPreview", "idPreviewContainer");

  loadPaymentSettings();

  // Add mobile input fixes
  document.querySelectorAll('input[type="tel"]').forEach(function (input) {
    input.setAttribute("autocomplete", "off");
    input.setAttribute("inputmode", "numeric");
  });

  document.querySelectorAll('input[type="password"]').forEach(function (input) {
    input.setAttribute("autocorrect", "off");
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("spellcheck", "false");
  });

  var savedUser =
    localStorage.getItem("gkode_user") ||
    localStorage.getItem("gkode_currentUser");
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      if (currentUser) {
        console.log(
          "✅ Auto-login:",
          currentUser.full_name || currentUser.name,
        );
        showScreen("home");
        loadGigs();
        updateBottomNav();
        initSecurity();
        if (supabaseInitialized && isOnline) {
          syncAllUsersToCloud();
        }
      }
    } catch (e) {
      console.log("Auto-login failed:", e);
      showScreen("welcome");
    }
  } else {
    showScreen("welcome");
  }

  console.log("🚀 G-KODE v5.0 loaded successfully!");
  console.log("📊 Universal compatibility enabled");
  console.log("📱 Device optimized for:", Device.type);
  console.log("☁️ Supabase URL:", SUPABASE_URL);
  console.log("📧 Email: Server configured");
});

// Expose for debugging
window._app = {
  Device: Device,
  Adaptive: Adaptive,
  Database: Database,
  Monitor: Monitor,
  currentUser: currentUser,
  supabaseClient: supabaseClient,
};
