// ============================================
// G-KODE - COMPLETE WORKING APP
// ============================================

// ============ SUPABASE CONFIG ============
const SUPABASE_URL = "https://rqvijxpbdrholshzhusb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lw88kFd0iSFNmkGDfczPMg_1j_ptRUO";
// ============================================
// SUPABASE CONFIG - ADD THIS TO YOUR APP.JS
// ============================================
const SUPABASE_URL = "https://rqvijxpbdrholshzhusb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lw88kFd0iSFNmkGDfczPMg_1j_ptRUO";
let supabase = null;
let supabaseInitialized = false;

function initSupabase() {
  if (supabaseInitialized) return;
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabaseInitialized = true;
    console.log("✅ Supabase connected");
  } catch (e) {
    console.log("⚠️ Supabase not available");
  }
}

// Call this when the app loads
initSupabase();

// ============================================
// SYNC USER TO SUPABASE (MANDATORY)
// ============================================
async function syncUserToSupabase(userData) {
  if (!supabaseInitialized) {
    console.warn("⚠️ Supabase not initialized, user not synced");
    return false;
  }

  try {
    // Check if user already exists
    const { data: existing, error: checkError } = await supabase
      .from("users")
      .select("phone")
      .eq("phone", userData.phone);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      // UPDATE existing user
      const { error: updateError } = await supabase
        .from("users")
        .update({
          full_name: userData.name || userData.full_name,
          national_id: userData.id || userData.national_id,
          email: userData.email || "N/A",
          location: userData.location || "N/A",
          profession: userData.profession || "N/A",
          skills: userData.skills
            ? Array.isArray(userData.skills)
              ? userData.skills
              : [userData.skills]
            : [],
          photo_url: userData.photo || userData.photo_url || null,
          rating: userData.rating || 0,
          review_count: userData.reviewCount || userData.review_count || 0,
          strikes: userData.strikes || 0,
          is_paid: userData.isPaid || userData.is_paid || false,
          is_banned: userData.isBanned || userData.is_banned || false,
          last_active: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("phone", userData.phone);

      if (updateError) throw updateError;
      console.log("✅ User updated in Supabase:", userData.phone);
    } else {
      // INSERT new user
      const { error: insertError } = await supabase.from("users").insert({
        phone: userData.phone,
        full_name: userData.name || userData.full_name || "Unknown",
        national_id: userData.id || userData.national_id || "N/A",
        email: userData.email || "N/A",
        password_hash: userData.password || "password",
        location: userData.location || "N/A",
        profession: userData.profession || "N/A",
        skills: userData.skills
          ? Array.isArray(userData.skills)
            ? userData.skills
            : [userData.skills]
          : [],
        photo_url: userData.photo || userData.photo_url || null,
        rating: userData.rating || 0,
        review_count: userData.reviewCount || userData.review_count || 0,
        strikes: userData.strikes || 0,
        is_paid: userData.isPaid || userData.is_paid || false,
        is_banned: userData.isBanned || userData.is_banned || false,
        created_at: userData.registeredAt || new Date().toISOString(),
        last_active: new Date().toISOString(),
      });

      if (insertError) throw insertError;
      console.log("✅ New user saved to Supabase:", userData.phone);
    }
    return true;
  } catch (e) {
    console.error("❌ Supabase sync error:", e);
    // Still allow the user to continue even if sync fails
    // But show a warning
    showToast("⚠️ User saved locally but cloud sync failed", "warning");
    return false;
  }
}

// ============ STATE ============
let currentUser = null;
let currentTab = "open";
let currentGigId = null;
let supabase = null;
let supabaseInitialized = false;
let pendingRegistration = null;
let pendingOtp = null;
let resetUser = null;
let resetEmail = "";
let resetOtp = "";
let isProcessing = false;
let cameraStream = null;
let cameraActive = false;

// ============ ADMIN PHONES ============
const ADMIN_PHONES = ["0703428192", "0711991467"];

// ============ EMAILJS ============
const EMAILJS_CONFIG = {
  serviceID: "service_hw35xfu",
  publicKey: "vc371wcNfQy56zlH8",
  otpTemplateID: "template_qycsjak",
  resetTemplateID: "template_0787ox7",
};

// ============ INIT SUPABASE ============
function initSupabase() {
  if (supabaseInitialized) return;
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabaseInitialized = true;
    console.log("✅ Supabase connected");
  } catch (e) {
    console.log("⚠️ Supabase not available:", e);
  }
}
initSupabase();
// ============================================
// 📤 UPLOAD TO SUPABASE STORAGE
// ============================================

async function uploadToSupabase(file, bucket, folder) {
  if (!supabaseInitialized) {
    console.log("⚠️ Supabase not ready, using base64 fallback");
    return readFileAsDataURL(file);
  }

  try {
    // Compress image first (reduce to ~100KB)
    const compressedDataUrl = await compressImage(file);

    // Convert data URL to blob
    const response = await fetch(compressedDataUrl);
    const blob = await response.blob();

    // Create file name
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${folder}/${Date.now()}.${fileExt}`;
    const fileObj = new File([blob], fileName, { type: "image/jpeg" });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileObj, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log("✅ Image uploaded to Supabase:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("Upload error:", error);
    // Fallback to base64
    return readFileAsDataURL(file);
  }
}

// ============================================
// 🖼️ COMPRESS IMAGE (Reduce to ~100KB)
// ============================================

function compressImage(file, maxWidth = 400, maxHeight = 400, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Create canvas and compress
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with quality
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============ TOAST ============
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const colors = {
    success: "#006400",
    error: "#cc0000",
    info: "#2196F3",
    warning: "#ff9800",
  };
  const toast = document.createElement("div");
  toast.style.cssText = `background:${colors[type] || "#333"};color:#fff;padding:12px 20px;border-radius:10px;margin-bottom:8px;animation:slideDown 0.3s ease;font-weight:500;font-size:14px;box-shadow:0 4px 15px rgba(0,0,0,0.2);`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.5s";
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// Add animation
(function () {
  const style = document.createElement("style");
  style.textContent =
    "@keyframes slideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }";
  document.head.appendChild(style);
})();

// ============ DATA HELPERS ============
function getUsersLocal() {
  try {
    return JSON.parse(localStorage.getItem("gkode_users") || "[]");
  } catch {
    return [];
  }
}
function setUsersLocal(users) {
  localStorage.setItem("gkode_users", JSON.stringify(users));
}

function getGigsLocal() {
  try {
    return JSON.parse(localStorage.getItem("gkode_gigs") || "[]");
  } catch {
    return [];
  }
}
function setGigsLocal(gigs) {
  localStorage.setItem("gkode_gigs", JSON.stringify(gigs));
}

function getCompaniesLocal() {
  try {
    return JSON.parse(localStorage.getItem("gkode_companies") || "[]");
  } catch {
    return [];
  }
}
function setCompaniesLocal(companies) {
  localStorage.setItem("gkode_companies", JSON.stringify(companies));
}

function getProductsLocal() {
  try {
    return JSON.parse(localStorage.getItem("gkode_products") || "[]");
  } catch {
    return [];
  }
}
function setProductsLocal(products) {
  localStorage.setItem("gkode_products", JSON.stringify(products));
}

function getProfessions() {
  try {
    return JSON.parse(localStorage.getItem("gkode_professions") || "[]");
  } catch {
    return [];
  }
}
function setProfessions(professions) {
  localStorage.setItem("gkode_professions", JSON.stringify(professions));
}

function getCategories() {
  try {
    return JSON.parse(localStorage.getItem("gkode_categories") || "[]");
  } catch {
    return [];
  }
}
function setCategories(categories) {
  localStorage.setItem("gkode_categories", JSON.stringify(categories));
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============ NAVIGATION ============
function showScreen(id) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
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
  if (currentUser && allowed.includes(id)) {
    nav?.classList.remove("hidden");
  } else {
    nav?.classList.add("hidden");
  }

  if (id === "home") loadGigs();
  if (id === "profile") loadProfile();
  if (id === "marketplace") loadMarketplace();
  if (id === "companyDashboard") loadCompanyDashboard();
  if (id === "payment") loadPaymentDetails();
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

// ============ PROFESSIONS ============
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
  const all = [...defaultProfessions];
  saved.forEach((p) => {
    if (!all.includes(p)) all.push(p);
  });
  all.sort();
  return all;
}

function populateProfessionDropdown() {
  const dropdown = document.getElementById("regProfession");
  if (!dropdown) return;
  while (dropdown.options.length > 1) dropdown.remove(1);
  const all = getAllProfessions();
  all.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    dropdown.appendChild(opt);
  });
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
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  const all = getAllProfessions();
  if (all.includes(formatted)) return formatted;
  const saved = getProfessions();
  saved.push(formatted);
  setProfessions(saved);
  populateProfessionDropdown();
  showToast(`✅ New profession "${formatted}" saved!`, "success");
  return formatted;
}

// ============ CATEGORIES ============
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
  const all = [...defaultCategories];
  saved.forEach((c) => {
    if (!all.includes(c)) all.push(c);
  });
  all.sort();
  return all;
}

function populateCategoryDropdown() {
  const dropdown = document.getElementById("marketCategory");
  if (!dropdown) return;
  while (dropdown.options.length > 1) dropdown.remove(1);
  const all = getAllCategories();
  all.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    dropdown.appendChild(opt);
  });
}

// ============ CAMERA FUNCTIONS ============
function openCamera(inputId) {
  const input = document.getElementById(inputId);
  if (!input) {
    showToast("Error: Input not found.", "error");
    return;
  }
  input.value = "";
  if (cameraActive) {
    closeCamera();
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    input.removeAttribute("capture");
    input.setAttribute("accept", "image/*");
    input.click();
    return;
  }
  showCameraModal(input);
}

function showCameraModal(input) {
  const overlay = document.createElement("div");
  overlay.id = "cameraOverlay";
  overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.95);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

  const video = document.createElement("video");
  video.id = "cameraVideo";
  video.style.cssText = `
        width: 100%;
        max-width: 500px;
        max-height: 70vh;
        border-radius: 12px;
        background: #000;
        transform: scaleX(-1);
        object-fit: cover;
    `;
  video.autoplay = true;
  video.playsInline = true;

  const buttonContainer = document.createElement("div");
  buttonContainer.style.cssText = `
        display: flex;
        gap: 20px;
        margin-top: 20px;
        width: 100%;
        max-width: 400px;
        justify-content: center;
    `;

  const captureBtn = document.createElement("button");
  captureBtn.textContent = "📸 CAPTURE";
  captureBtn.style.cssText = `
        padding: 15px 40px;
        background: #006400;
        color: #FFD700;
        border: none;
        border-radius: 10px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        flex: 1;
    `;

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "✕ CLOSE";
  cancelBtn.style.cssText = `
        padding: 15px 30px;
        background: #cc0000;
        color: #fff;
        border: none;
        border-radius: 10px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        flex: 1;
    `;

  buttonContainer.appendChild(captureBtn);
  buttonContainer.appendChild(cancelBtn);
  overlay.appendChild(video);
  overlay.appendChild(buttonContainer);
  document.body.appendChild(overlay);

  navigator.mediaDevices
    .getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    })
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
}

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
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.", "error");
      input.value = "";
      if (container) container.style.display = "none";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image too large. Maximum 5MB.", "error");
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

// ============ EMAIL FUNCTIONS ============
function loadEmailJS(callback) {
  if (typeof emailjs !== "undefined") {
    callback();
    return;
  }
  const script = document.createElement("script");
  script.src =
    "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
  document.head.appendChild(script);
  script.onload = function () {
    emailjs.init(EMAILJS_CONFIG.publicKey);
    callback();
  };
  script.onerror = function () {
    showToast("⚠️ Email service unavailable. Using on-screen code.", "warning");
    callback();
  };
}

function sendOTPEmail(email, name, code) {
  loadEmailJS(function () {
    if (typeof emailjs === "undefined") {
      showToast(`📱 Your code: ${code}`, "info");
      return;
    }
    const templateParams = {
      to_email: email,
      to_name: name || "User",
      code: code,
      app_name: "G-KODE",
      year: new Date().getFullYear(),
    };
    emailjs
      .send(
        EMAILJS_CONFIG.serviceID,
        EMAILJS_CONFIG.otpTemplateID,
        templateParams,
      )
      .then(() =>
        showToast("📧 Verification code sent to your email!", "success"),
      )
      .catch(() => showToast(`📱 Your code: ${code}`, "info"));
  });
}

function sendResetEmail(email, name, code) {
  loadEmailJS(function () {
    if (typeof emailjs === "undefined") {
      showToast(`📱 Your reset code: ${code}`, "info");
      return;
    }
    const templateParams = {
      to_email: email,
      to_name: name || "User",
      code: code,
      app_name: "G-KODE",
      year: new Date().getFullYear(),
    };
    emailjs
      .send(
        EMAILJS_CONFIG.serviceID,
        EMAILJS_CONFIG.resetTemplateID,
        templateParams,
      )
      .then(() => showToast("📧 Reset code sent to your email!", "success"))
      .catch(() => showToast(`📱 Your reset code: ${code}`, "info"));
  });
}

// ============================================
// 🔐 REGISTER
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
    if (
      password.length < 6 ||
      !/[a-zA-Z]/.test(password) ||
      !/\d/.test(password)
    ) {
      showToast(
        "Password must be 6+ characters with letters and numbers",
        "error",
      );
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
    if (!terms) {
      showToast("Please agree to the Terms of Use", "error");
      btn.disabled = false;
      btn.textContent = "REGISTER";
      isProcessing = false;
      return;
    }

    const users = getUsersLocal();
    if (users.find((u) => u.phone === phone)) {
      showToast("Phone already registered", "error");
      btn.disabled = false;
      btn.textContent = "REGISTER";
      isProcessing = false;
      return;
    }
    if (users.find((u) => u.id === id)) {
      showToast("ID already registered", "error");
      btn.disabled = false;
      btn.textContent = "REGISTER";
      isProcessing = false;
      return;
    }

    if (supabaseInitialized) {
      const { data, error } = await supabase
        .from("users")
        .select("phone, email")
        .or(`phone.eq.${phone},email.eq.${email}`)
        .maybeSingle();
      if (data) {
        showToast("Phone or email already registered", "error");
        btn.disabled = false;
        btn.textContent = "REGISTER";
        isProcessing = false;
        return;
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
    const photoUrl = await uploadToSupabase(
      photoFile,
      "profiles",
      `user_${phone}`,
    );
    const idScanUrl = await uploadToSupabase(
      idScanFile,
      "ids",
      `user_${phone}`,
    );

    const user = {
      name,
      phone,
      id,
      email,
      password,
      location,
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
    sendOTPEmail(email, name, otpCode);

    const otpSection = document.getElementById("otpSection");
    if (otpSection) otpSection.style.display = "block";
    const otpInput = document.getElementById("regOtp");
    if (otpInput) otpInput.focus();

    btn.textContent = "VERIFY EMAIL";
    btn.disabled = false;
    isProcessing = false;
    showToast("📧 Verification code sent to your email!", "success");
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

function resendOtp() {
  if (!pendingRegistration) {
    showToast("Please start registration again", "error");
    return;
  }
  pendingOtp = Math.floor(100000 + Math.random() * 900000).toString();
  sendOTPEmail(pendingRegistration.email, pendingRegistration.name, pendingOtp);
  showToast("📧 New code sent to your email!", "success");
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
    if (supabaseInitialized) {
      try {
        const { error } = await supabase.from("users").insert([
          {
            phone: user.phone,
            national_id: user.id,
            email: user.email,
            full_name: user.name,
            location: user.location,
            profession: user.profession,
            skills: user.skills
              ? user.skills.split(",").map((s) => s.trim())
              : [],
            photo_url: user.photo,
            id_scan_url: user.idScan,
            password_hash: user.password,
          },
        ]);
        if (!error) saved = true;
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
    updateBottomNav();

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
// LOGIN - CLOUD ONLY
// ============================================
async function login(e) {
  e.preventDefault();

  const btn = document.getElementById("loginBtn");
  btn.disabled = true;
  btn.textContent = "⏳ LOGGING IN...";

  try {
    const phone = document.getElementById("loginPhone").value.trim();
    const password = document.getElementById("loginPassword").value;
    const rememberMe = document.getElementById("rememberMe").checked;

    if (!phone || !password) {
      showToast("❌ Enter phone and password.", "error");
      btn.disabled = false;
      btn.textContent = "LOGIN";
      return;
    }

    // Check Supabase
    const { data: users, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone);

    if (findError) throw findError;

    if (!users || users.length === 0) {
      showToast("❌ Phone not registered.", "error");
      btn.disabled = false;
      btn.textContent = "LOGIN";
      return;
    }

    const user = users[0];

    // Check password
    if (user.password_hash !== password) {
      showToast("❌ Wrong password.", "error");
      btn.disabled = false;
      btn.textContent = "LOGIN";
      return;
    }

    // Check if banned
    if (user.is_banned) {
      showToast("🚫 Account is banned! Contact support.", "error");
      btn.disabled = false;
      btn.textContent = "LOGIN";
      return;
    }

    // Update last active
    await supabase
      .from("users")
      .update({ last_active: new Date().toISOString() })
      .eq("id", user.id);

    // Store user
    currentUser = user;
    if (rememberMe) {
      localStorage.setItem("gkode_currentUser", JSON.stringify(user));
    } else {
      sessionStorage.setItem("gkode_currentUser", JSON.stringify(user));
    }

    document.getElementById("loginForm").reset();
    showToast("Welcome back, " + user.full_name + "!", "success");
    showScreen("home");
    loadGigs();
  } catch (err) {
    showToast("Login error: " + err.message, "error");
    console.error("Login error:", err);
  }

  btn.disabled = false;
  btn.textContent = "LOGIN";
}

// ============================================
// RESET PASSWORD - VARIABLES
// ============================================
let resetData = null;
let resetTimerInterval = null;
let resetTimeLeft = 600;

// ============================================
// SEND RESET CODE (Step 1)
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

    // Check if email exists
    const { data: users, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (findError) throw findError;

    if (!users || users.length === 0) {
      showToast("❌ No account found with this email.", "error");
      btn.disabled = false;
      btn.textContent = "📧 SEND RESET CODE";
      return;
    }

    const user = users[0];

    // Generate reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("🔑 Reset Code:", resetCode);

    // Send reset code to email
    showToast(`📧 Sending reset code to ${email}...`, "info");

    const emailSent = await sendResetEmail(email, user.full_name, resetCode);

    if (!emailSent) {
      showToast(`⚠️ Email failed. Your code: ${resetCode}`, "warning");
    }

    // Store reset data
    resetData = {
      email: email,
      code: resetCode,
      phone: user.phone,
      national_id: user.national_id,
      profession: user.profession,
      location: user.location,
      userId: user.id,
    };

    // Show Step 2
    document.getElementById("resetStep1").style.display = "none";
    document.getElementById("resetStep2").style.display = "block";
    document.getElementById("resetEmailDisplay").textContent = email;
    document.getElementById("resetOtp").value = "";
    document.getElementById("resetOtp").focus();

    // Start timer
    startResetTimer();

    showToast(`📧 Reset code sent to ${email}`, "success");
  } catch (err) {
    showToast("Error: " + err.message, "error");
    console.error("Reset error:", err);
  }

  btn.disabled = false;
  btn.textContent = "📧 SEND RESET CODE";
}

// ============================================
// SEND RESET EMAIL
// ============================================
async function sendResetEmail(email, name, code) {
  try {
    if (typeof emailjs === "undefined") {
      await loadEmailJS();
    }

    const templateParams = {
      to_email: email,
      to_name: name || "User",
      code: code,
      app_name: "G-KODE",
      year: new Date().getFullYear(),
      message: "Your G-KODE password reset code",
    };

    const response = await emailjs.send(
      "service_hw35xfu",
      "template_0787ox7",
      templateParams,
      "vc371wcNfQy56zlH8",
    );

    console.log("✅ Reset email sent! Status:", response.status);
    return true;
  } catch (error) {
    console.error("❌ Reset email failed:", error);
    return false;
  }
}

// ============================================
// VERIFY RESET IDENTITY (Step 2)
// ============================================
async function verifyResetIdentity() {
  const btn = document.getElementById("verifyBtn");
  btn.disabled = true;
  btn.textContent = "⏳ VERIFYING...";

  try {
    const enteredCode = document.getElementById("resetOtp").value.trim();
    const phone = document.getElementById("resetPhone").value.trim();
    const id = document.getElementById("resetID").value.trim();
    const profession = document.getElementById("resetProfession").value.trim();
    const location = document.getElementById("resetLocation").value.trim();

    // Validate code
    if (!enteredCode || enteredCode.length !== 6) {
      showToast("❌ Please enter the 6-digit reset code.", "error");
      btn.disabled = false;
      btn.textContent = "VERIFY IDENTITY";
      return;
    }

    if (!resetData) {
      showToast("❌ Reset session expired. Please start over.", "error");
      btn.disabled = false;
      btn.textContent = "VERIFY IDENTITY";
      return;
    }

    // Verify code
    if (enteredCode !== resetData.code) {
      showToast("❌ Invalid reset code. Please try again.", "error");
      btn.disabled = false;
      btn.textContent = "VERIFY IDENTITY";
      return;
    }

    // Verify user details
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
      btn.disabled = false;
      btn.textContent = "VERIFY IDENTITY";
      return;
    }

    // All verified! Show Step 3
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

  btn.disabled = false;
  btn.textContent = "VERIFY IDENTITY";
}

// ============================================
// RESEND RESET CODE
// ============================================
async function resendResetCode() {
  if (!resetData) {
    showToast("❌ Reset session expired. Please start over.", "error");
    return;
  }

  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  resetData.code = newCode;

  showToast(`📧 Sending new reset code...`, "info");

  const emailSent = await sendResetEmail(resetData.email, "User", newCode);

  if (emailSent) {
    showToast("📧 New reset code sent!", "success");
    startResetTimer();
  } else {
    showToast(`⚠️ Email failed. Your new code: ${newCode}`, "warning");
  }
}

// ============================================
// RESET PASSWORD (Step 3)
// ============================================
async function resetPassword() {
  const btn = document.getElementById("resetPasswordBtn");
  btn.disabled = true;
  btn.textContent = "⏳ RESETTING...";

  try {
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword.length < 6) {
      showToast("❌ Password must be at least 6 characters.", "error");
      btn.disabled = false;
      btn.textContent = "RESET PASSWORD";
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("❌ Passwords do not match!", "error");
      btn.disabled = false;
      btn.textContent = "RESET PASSWORD";
      return;
    }

    if (!resetData) {
      showToast("❌ Reset session expired. Please start over.", "error");
      btn.disabled = false;
      btn.textContent = "RESET PASSWORD";
      return;
    }

    // Update password in Supabase
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: newPassword })
      .eq("id", resetData.userId);

    if (updateError) throw updateError;

    // Reset everything
    resetData = null;
    clearInterval(resetTimerInterval);
    document.getElementById("resetStep3").style.display = "none";
    document.getElementById("resetStep1").style.display = "block";
    document.getElementById("resetEmail").value = "";

    showToast("✅ Password reset successful! Please login.", "success");
    showScreen("login");
  } catch (err) {
    showToast("Error: " + err.message, "error");
    console.error("Reset password error:", err);
  }

  btn.disabled = false;
  btn.textContent = "RESET PASSWORD";
}

// ============================================
// RESET TIMER
// ============================================
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
// CHECK SESSION
// ============================================
async function checkSession() {
  const savedUser =
    sessionStorage.getItem("gkode_currentUser") ||
    localStorage.getItem("gkode_currentUser");

  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id);

      if (!error && data && data.length > 0) {
        currentUser = data[0];
        showScreen("home");
        loadGigs();
        return;
      }
    } catch (e) {
      console.log("Session expired");
    }
  }
  showScreen("welcome");
}

// ============================================
// LOGOUT
// ============================================
function logout() {
  currentUser = null;
  localStorage.removeItem("gkode_currentUser");
  sessionStorage.removeItem("gkode_currentUser");
  showToast("Logged out.", "info");
  showScreen("welcome");
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
      title,
      skill,
      location,
      urgency,
      budgetMin,
      budgetMax,
      description,
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
    (pos) => {
      document.getElementById("gigGPSLat").value = pos.coords.latitude;
      document.getElementById("gigGPSLon").value = pos.coords.longitude;
      document.getElementById("gigLocationStatus").textContent =
        "✅ Location captured!";
      document.getElementById("gigLocationStatus").style.color = "#006400";
      showToast("✅ Location captured!", "success");
    },
    () => showToast("❌ Enable GPS.", "error"),
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

function loadGigs() {
  const container = document.getElementById("gigsList");
  if (!container) return;

  // ===== AD BANNER =====
  const adContainer = document.getElementById("adBannerContainer");
  if (adContainer) {
    adContainer.innerHTML = renderAdBanner("home_banner");
  }

  const gigs = getGigsLocal();
  const filtered = gigs.filter((g) => {
    if (currentTab === "open") return g.status === "Open";
    return g.status === "Assigned" || g.status === "Taken";
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding:40px 0;text-align:center;color:#666;"><p>No ${currentTab} gigs found.</p></div>`;
    return;
  }

  let html = "";
  filtered.forEach((g) => {
    const open = g.status === "Open";
    const urgencyColor =
      g.urgency === "Emergency"
        ? "#cc0000"
        : g.urgency === "Urgent"
          ? "#ff9800"
          : "#006400";

    html += `
            <div class="gig-card" style="border-left:4px solid ${urgencyColor};">
                <div class="gig-title">${g.title}</div>
                <span class="badge ${open ? "badge-open" : "badge-taken"}">${open ? "🟢 OPEN" : "🔴 TAKEN"}</span>
                <div class="gig-meta">👤 ${g.client} | 🛠️ ${g.skill}</div>
                <div class="gig-meta">📍 ${g.location}</div>
                <div class="gig-budget">💰 Ksh ${g.budgetMin} - ${g.budgetMax}</div>
                ${
                  open
                    ? `<div class="gig-actions"><button class="btn-accept" onclick="acceptGig('${g.id}')">✅ ACCEPT</button></div>`
                    : `<div class="gig-actions"><button class="btn-chat" onclick="openChat('${g.id}')">💬 Chat</button></div>`
                }
            </div>
        `;
  });
  container.innerHTML = html;
}

function acceptGig(id) {
  if (!currentUser) {
    showToast("Please login first.", "error");
    return;
  }

  let gigs = getGigsLocal();
  const gig = gigs.find((g) => g.id === id);
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
  const gig = gigs.find((g) => g.id === id);
  if (gig) {
    const partner = gig.client === currentUser.name ? gig.worker : gig.client;
    document.getElementById("chatPartner").textContent =
      `💬 Chat with ${partner}`;
  }
  showScreen("chat");
  loadChatMessages(id);
}

function loadChatMessages(id) {
  const container = document.getElementById("chatMessages");
  if (!container) return;
  const messages = JSON.parse(localStorage.getItem(`gkode_chat_${id}`) || "[]");
  if (messages.length === 0) {
    container.innerHTML =
      '<div style="color:#999;padding:20px;text-align:center;">No messages yet.</div>';
    return;
  }
  let html = "";
  messages.forEach((msg) => {
    const isSent = msg.sender === currentUser.name;
    html += `
            <div class="chat-message ${isSent ? "sent" : "received"}">
                ${!isSent ? `<div class="sender">${msg.sender}</div>` : ""}
                ${msg.isLocation ? `📍 <a href="${msg.text}" target="_blank" style="color:${isSent ? "#FFD700" : "#006400"};">View Location</a>` : msg.text}
                <div class="time">${new Date(msg.time).toLocaleTimeString()}</div>
            </div>
        `;
  });
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

function sendMessage(e) {
  if (e) e.preventDefault();
  const text = document.getElementById("chatInput")?.value?.trim() || "";
  const id = document.getElementById("chatGigId")?.value || "";
  if (!text || !id || !currentUser) return;
  const messages = JSON.parse(localStorage.getItem(`gkode_chat_${id}`) || "[]");
  messages.push({
    sender: currentUser.name,
    text: text,
    time: new Date().toISOString(),
    isLocation: false,
  });
  localStorage.setItem(`gkode_chat_${id}`, JSON.stringify(messages));
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
    (pos) => {
      const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
      const id = document.getElementById("chatGigId")?.value || "";
      const messages = JSON.parse(
        localStorage.getItem(`gkode_chat_${id}`) || "[]",
      );
      messages.push({
        sender: currentUser.name,
        text: url,
        time: new Date().toISOString(),
        isLocation: true,
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      });
      localStorage.setItem(`gkode_chat_${id}`, JSON.stringify(messages));
      window.open(url, "_blank");
      loadChatMessages(id);
      showToast("✅ Location shared!", "success");
    },
    () => showToast("❌ Could not get location.", "error"),
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

function navigateToClient() {
  const id = document.getElementById("chatGigId")?.value || "";
  const gigs = getGigsLocal();
  const gig = gigs.find((g) => g.id === id);
  if (!gig || !gig.gpsLat || !gig.gpsLon) {
    showToast("No location data for this gig.", "error");
    return;
  }
  const url = `https://www.google.com/maps/dir/?api=1&destination=${gig.gpsLat},${gig.gpsLon}`;
  window.open(url, "_blank");
  showToast("🧭 Opening directions...", "info");
}

// ============================================
// 👤 PROFILE FUNCTIONS
// ============================================
function loadProfile() {
  if (!currentUser) return;
  document.getElementById("profileName").textContent = currentUser.name;
  document.getElementById("profilePhone").textContent =
    `📞 ${currentUser.phone}`;
  document.getElementById("profileLocation").textContent =
    `📍 ${currentUser.location}`;
  document.getElementById("profileProfession").textContent =
    `👔 ${currentUser.profession}`;
  document.getElementById("profileSkills").textContent =
    `🛠️ ${currentUser.skills || "None"}`;
  if (currentUser.photo) {
    document.getElementById("profilePhoto").src = currentUser.photo;
  }
  const statusText = currentUser.verified ? "✅ Verified" : "🟡 Pending";
  document.getElementById("profileStatus").innerHTML =
    `${statusText} | ⭐ ${currentUser.rating || 0} (${currentUser.reviewCount || 0} reviews)`;
  const gigs = getGigsLocal();
  const myGigs = gigs.filter(
    (g) => g.client === currentUser.name || g.worker === currentUser.name,
  );
  const container = document.getElementById("myGigsList");
  if (myGigs.length === 0) {
    container.innerHTML = '<p style="color:#666;">No gigs yet.</p>';
  } else {
    let html = "";
    myGigs.forEach((g) => {
      html += `
                <div style="background:#f5f5f5;padding:10px;border-radius:8px;margin-bottom:8px;">
                    <strong>${g.title}</strong> — ${g.status}
                    ${
                      g.status === "Assigned" && g.worker === currentUser.name
                        ? ` <button onclick="openChat('${g.id}')" style="background:#2196F3;color:#fff;border:none;padding:5px 10px;border-radius:5px;font-size:12px;cursor:pointer;">💬 Chat</button>`
                        : ""
                    }
                </div>
            `;
    });
    container.innerHTML = html;
  }
  checkAdminAccess();
}

// ============================================
// 🔐 ADMIN FUNCTIONS
// ============================================
function isAdmin() {
  if (!currentUser) return false;
  return ADMIN_PHONES.includes(currentUser.phone);
}

function checkAdminAccess() {
  const btn = document.getElementById("adminAccessBtn");
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
  const container = document.getElementById("marketplaceList");
  if (!container) return;
  const products = getProductsLocal();
  if (products.length === 0) {
    container.innerHTML =
      '<div style="padding:40px 0;text-align:center;color:#666;"><p>No products available.</p></div>';
    return;
  }
  let html = "";
  products.forEach((p) => {
    html += `
            <div class="gig-card">
                <h3>${p.name}</h3>
                <p>🏢 ${p.companyName} | ${p.category}</p>
                <p>💰 Ksh ${p.price}/${p.unit}</p>
                <p>📦 Stock: ${p.stock}</p>
                <button onclick="buyProduct('${p.id}')" style="background:#006400;color:#FFD700;border:none;padding:10px;border-radius:8px;width:100%;font-weight:bold;cursor:pointer;margin-top:5px;">🛒 BUY</button>
            </div>
        `;
  });
  container.innerHTML = html;
}

function buyProduct(id) {
  if (!currentUser) {
    showToast("Please login first.", "error");
    return;
  }
  const products = getProductsLocal();
  const product = products.find((p) => p.id === id);
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
  const btn = document.getElementById("compRegisterBtn");
  if (!btn || isProcessing) return;
  isProcessing = true;
  btn.disabled = true;
  btn.textContent = "⏳ REGISTERING...";

  try {
    const name = document.getElementById("compName")?.value?.trim() || "";
    const type = document.getElementById("compType")?.value || "";
    const regNo = document.getElementById("compRegNo")?.value?.trim() || "";
    const location =
      document.getElementById("compLocation")?.value?.trim() || "";
    const phone = document.getElementById("compPhone")?.value?.trim() || "";
    const email = document.getElementById("compEmail")?.value?.trim() || "";
    const desc = document.getElementById("compDesc")?.value?.trim() || "";

    if (!name || !type || !regNo || !location || !phone) {
      showToast("Fill all required fields.", "error");
      btn.disabled = false;
      btn.textContent = "REGISTER BUSINESS";
      isProcessing = false;
      return;
    }

    const companies = getCompaniesLocal();
    if (companies.some((c) => c.name === name)) {
      showToast("Business name already registered.", "error");
      btn.disabled = false;
      btn.textContent = "REGISTER BUSINESS";
      isProcessing = false;
      return;
    }

    companies.push({
      id: Date.now().toString(),
      name,
      type,
      regNo,
      location,
      phone,
      email,
      desc,
      owner: currentUser.name,
      ownerPhone: currentUser.phone,
      registeredAt: new Date().toISOString(),
      totalSales: 0,
      totalCommission: 0,
    });
    setCompaniesLocal(companies);

    showToast(`✅ ${name} registered successfully!`, "success");
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
  const companies = getCompaniesLocal();
  const myComp = companies.find((c) => c.ownerPhone === currentUser.phone);
  if (!myComp) {
    document.getElementById("compInfo").innerHTML =
      "<p>No business registered.</p>";
    return;
  }
  document.getElementById("compInfo").innerHTML = `
        <h3>${myComp.name}</h3>
        <p>🏢 ${myComp.type} | 📍 ${myComp.location}</p>
        <p>📞 ${myComp.phone}</p>
        <p>📜 Reg No: ${myComp.regNo}</p>
    `;
  showCompTab("products");
}

function showCompTab(tab) {
  const content = document.getElementById("compTabContent");
  const companies = getCompaniesLocal();
  const myComp = companies.find((c) => c.ownerPhone === currentUser.phone);
  if (!myComp) return;
  const products = getProductsLocal().filter((p) => p.companyId === myComp.id);

  if (tab === "products") {
    if (products.length === 0) {
      content.innerHTML = "<p>No products yet.</p>";
      return;
    }
    let html = "";
    products.forEach((p) => {
      html += `
                <div class="gig-card">
                    <h3>${p.name}</h3>
                    <p>${p.category} | Ksh ${p.price}/${p.unit} | Stock: ${p.stock}</p>
                    <button onclick="deleteProduct('${p.id}')" style="background:#cc0000;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">🗑️ Delete</button>
                </div>
            `;
    });
    content.innerHTML = html;
  } else if (tab === "orders") {
    content.innerHTML = "<p>Orders will appear here.</p>";
  } else if (tab === "sales") {
    const totalSales = myComp.totalSales || 0;
    const totalCommission = myComp.totalCommission || 0;
    content.innerHTML = `
            <div class="admin-card">
                <p><strong>Total Sales:</strong> Ksh ${totalSales}</p>
                <p><strong>Total Commission:</strong> Ksh ${totalCommission}</p>
                <p><strong>Commission Rate:</strong> 3%</p>
            </div>
        `;
  }
}

function addProduct(e) {
  if (e) e.preventDefault();
  if (!currentUser) {
    showToast("Please login first.", "error");
    return;
  }
  const btn = document.getElementById("addProductBtn");
  if (!btn || isProcessing) return;
  isProcessing = true;
  btn.disabled = true;
  btn.textContent = "⏳ ADDING...";

  try {
    const name = document.getElementById("prodName")?.value?.trim() || "";
    const category = document.getElementById("prodCategory")?.value || "";
    const unit = document.getElementById("prodUnit")?.value?.trim() || "";
    const price = parseFloat(document.getElementById("prodPrice")?.value) || 0;
    const stock = parseInt(document.getElementById("prodStock")?.value) || 0;
    const desc = document.getElementById("prodDesc")?.value?.trim() || "";

    if (!name || !category || !unit || !price || !stock) {
      showToast("Fill all fields.", "error");
      btn.disabled = false;
      btn.textContent = "ADD PRODUCT";
      isProcessing = false;
      return;
    }

    const companies = getCompaniesLocal();
    const myComp = companies.find((c) => c.ownerPhone === currentUser.phone);
    if (!myComp) {
      showToast("Register a business first.", "error");
      btn.disabled = false;
      btn.textContent = "ADD PRODUCT";
      isProcessing = false;
      return;
    }

    const products = getProductsLocal();
    products.push({
      id: Date.now().toString(),
      companyId: myComp.id,
      companyName: myComp.name,
      name,
      category,
      unit,
      price,
      stock,
      desc,
      createdAt: new Date().toISOString(),
    });
    setProductsLocal(products);

    showToast(`✅ ${name} added!`, "success");
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
  const products = getProductsLocal().filter((p) => p.id !== id);
  setProductsLocal(products);
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
  const settings = getPaymentSettings();
  const till = document.getElementById("displayTill");
  const paybill = document.getElementById("displayPaybill");
  const account = document.getElementById("displayAccount");
  const commission = document.getElementById("displayCommission");
  const bank = document.getElementById("displayGkodeBank");
  if (till) till.textContent = settings.tillNumber || "9876543";
  if (paybill) paybill.textContent = settings.paybillNumber || "247247";
  if (account) account.textContent = settings.accountNumber || "G-KODE";
  if (commission) commission.textContent = (settings.commissionRate || 3) + "%";
  if (bank) bank.textContent = settings.bank || "Equity Bank";
}

function showPaymentScreen() {
  loadPaymentDetails();
  showScreen("payment");
}

function verifyMpesaPayment() {
  const code = document.getElementById("mpesaCode")?.value?.trim() || "";
  if (!code) {
    showToast("Please enter M-Pesa confirmation code.", "error");
    return;
  }

  const settings = getPaymentSettings();
  const commissionRate = settings.commissionRate || 3;
  const amount = 300;
  const commission = (amount * commissionRate) / 100;
  const sellerAmount = amount - commission;

  const msg =
    `💳 PAYMENT BREAKDOWN\n\n` +
    `💰 Total Amount: Ksh ${amount}\n` +
    `📊 Commission (${commissionRate}%): Ksh ${commission.toFixed(2)}\n` +
    `🏦 You Pay: Ksh ${amount}\n` +
    `🏢 G-KODE Bank: ${settings.bank || "Equity Bank"}\n\n` +
    `✅ Confirm payment?`;

  if (!confirm(msg)) return;

  let payments = JSON.parse(localStorage.getItem("gkode_payments") || "[]");
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

  let users = getUsersLocal();
  const user = users.find((u) => u.phone === currentUser.phone);
  if (user) {
    user.isPaid = true;
    setUsersLocal(users);
    currentUser.isPaid = true;
    localStorage.setItem("gkode_user", JSON.stringify(currentUser));
  }

  showToast(
    `✅ Payment verified! Commission: Ksh ${commission.toFixed(2)}`,
    "success",
  );
  showScreen("home");
}

// ============================================
// 📢 ADVERTISING SYSTEM
// ============================================
function getAds() {
  try {
    return JSON.parse(localStorage.getItem("gkode_ads") || "[]");
  } catch {
    return [];
  }
}

function setAds(ads) {
  localStorage.setItem("gkode_ads", JSON.stringify(ads));
}

function getActiveAds(placement) {
  const ads = getAds();
  return ads.filter((ad) => ad.isActive === true && ad.placement === placement);
}

function trackAdView(adId) {
  const ads = getAds();
  const ad = ads.find((a) => a.id === adId);
  if (ad) {
    ad.views = (ad.views || 0) + 1;
    setAds(ads);
  }
}

function trackAdClick(adId) {
  const ads = getAds();
  const ad = ads.find((a) => a.id === adId);
  if (ad) {
    ad.clicks = (ad.clicks || 0) + 1;
    setAds(ads);
  }
}

function renderAdBanner(placement) {
  const ads = getActiveAds(placement);
  if (ads.length === 0) return "";

  const ad = ads[Math.floor(Math.random() * ads.length)];
  trackAdView(ad.id);

  return `
        <div class="ad-banner" style="background:linear-gradient(135deg,#1a1a1a,#006400);border-radius:12px;padding:12px 16px;margin-bottom:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;border:1px solid rgba(255,215,0,0.2);">
            <div style="flex:1;min-width:150px;">
                <div style="font-size:10px;color:#FFD700;font-weight:bold;">📢 SPONSORED</div>
                <div style="font-weight:bold;color:#fff;font-size:14px;">${ad.title}</div>
                <div style="font-size:12px;color:#ccc;">${ad.description}</div>
            </div>
            <a href="${ad.link}" target="_blank" onclick="trackAdClick('${ad.id}')" style="background:#FFD700;color:#000;padding:8px 16px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;white-space:nowrap;">LEARN MORE →</a>
            <button onclick="this.parentElement.style.display='none'" style="background:none;border:none;color:#666;font-size:16px;cursor:pointer;">✕</button>
        </div>
    `;
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
  const nav = document.getElementById("bottomNav");
  if (!nav) return;
  if (currentUser) {
    nav.classList.remove("hidden");
  } else {
    nav.classList.add("hidden");
  }
}

// ============================================
// 🧹 RESET
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
  const notices = {
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
  const data = {
    exportedAt: new Date().toISOString(),
    user: currentUser,
    userGigs: getGigsLocal().filter(
      (g) => g.client === currentUser.name || g.worker === currentUser.name,
    ),
    userOrders: [],
    userPayments: JSON.parse(
      localStorage.getItem("gkode_payments") || "[]",
    ).filter((p) => p.phone === currentUser.phone),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `gkode-my-data-${new Date().toISOString().split("T")[0]}.json`;
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

  let users = getUsersLocal().filter((u) => u.phone !== currentUser.phone);
  setUsersLocal(users);

  let gigs = getGigsLocal().filter(
    (g) => g.client !== currentUser.name && g.worker !== currentUser.name,
  );
  setGigsLocal(gigs);

  currentUser = null;
  localStorage.removeItem("gkode_user");
  localStorage.removeItem("gkode_token");
  showToast("✅ Account deleted successfully.", "success");
  showScreen("welcome");
  updateBottomNav();
}

// ============================================
// 🚀 INIT
// ============================================
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 G-KODE v3.0 loading...");

  populateProfessionDropdown();
  populateCategoryDropdown();

  setupFilePreview("regPhoto", "photoPreview", "photoPreviewContainer");
  setupFilePreview("regIDScan", "idPreview", "idPreviewContainer");

  const savedUser = localStorage.getItem("gkode_user");
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      if (currentUser) {
        console.log("✅ Auto-login:", currentUser.name);
        showScreen("home");
        loadGigs();
        updateBottomNav();
      }
    } catch (e) {
      console.log("Auto-login failed:", e);
      showScreen("welcome");
    }
  } else {
    showScreen("welcome");
  }

  console.log("🚀 G-KODE v3.0 loaded successfully!");
  console.log("📊 Data stored in localStorage (fallback).");
  console.log("☁️ Supabase URL:", SUPABASE_URL);
  console.log("📧 EmailJS configured.");
});

// ============ GLOBAL ERROR HANDLING ============
window.onerror = function (message, source, lineno, colno, error) {
  console.error("Global error:", { message, source, lineno, colno, error });
  showToast("An unexpected error occurred. Please try again.", "error");
};
// ============================================
// SYNC ALL LOCAL USERS TO SUPABASE
// ============================================
async function syncAllUsersToCloud() {
  if (!supabaseInitialized) {
    showToast("❌ Supabase not connected!", "error");
    return;
  }

  const localUsers = getUsersSync(); // Your existing function to get local users

  if (localUsers.length === 0) {
    showToast("⚠️ No local users to sync", "warning");
    return;
  }

  showToast(`⏳ Syncing ${localUsers.length} users to cloud...`, "info");

  let successCount = 0;
  let failCount = 0;

  for (const user of localUsers) {
    const synced = await syncUserToSupabase(user);
    if (synced) {
      successCount++;
    } else {
      failCount++;
    }
  }

  showToast(
    `✅ Synced ${successCount} users, ${failCount} failed`,
    successCount > 0 ? "success" : "error",
  );
} // ============================================
// AUTO-SYNC USER TO SUPABASE (NEW)
// ============================================
async function autoSyncUserToSupabase(userData) {
  if (!supabaseInitialized) {
    console.log("⚠️ Supabase not ready, skipping sync");
    return false;
  }

  try {
    // Check if user exists in Supabase
    const { data: existing, error: checkError } = await supabase
      .from("users")
      .select("phone")
      .eq("phone", userData.phone);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      // UPDATE existing user
      const { error: updateError } = await supabase
        .from("users")
        .update({
          full_name: userData.name || userData.full_name,
          national_id: userData.id || userData.national_id,
          email: userData.email || "N/A",
          location: userData.location || "N/A",
          profession: userData.profession || "N/A",
          skills: userData.skills ? [userData.skills] : [],
          photo_url: userData.photo || null,
          rating: userData.rating || 0,
          review_count: userData.reviewCount || 0,
          strikes: userData.strikes || 0,
          is_paid: userData.isPaid || false,
          is_banned: userData.isBanned || false,
          last_active: new Date().toISOString(),
        })
        .eq("phone", userData.phone);

      if (updateError) throw updateError;
      console.log("✅ User updated in Supabase:", userData.phone);
    } else {
      // INSERT new user
      const { error: insertError } = await supabase.from("users").insert({
        phone: userData.phone,
        full_name: userData.name || userData.full_name || "Unknown",
        national_id: userData.id || userData.national_id || "N/A",
        email: userData.email || "N/A",
        password_hash: userData.password || "password",
        location: userData.location || "N/A",
        profession: userData.profession || "N/A",
        skills: userData.skills ? [userData.skills] : [],
        photo_url: userData.photo || null,
        rating: userData.rating || 0,
        review_count: userData.reviewCount || 0,
        strikes: userData.strikes || 0,
        is_paid: userData.isPaid || false,
        is_banned: userData.isBanned || false,
        created_at: userData.registeredAt || new Date().toISOString(),
        last_active: new Date().toISOString(),
      });

      if (insertError) throw insertError;
      console.log("✅ New user saved to Supabase:", userData.phone);
    }
    return true;
  } catch (e) {
    console.error("❌ Auto-sync error:", e);
    return false;
  }
}
