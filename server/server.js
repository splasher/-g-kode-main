// ============================================
// G-KODE SERVER v3.0 - FULLY UPDATED
// Kenya Helping Kenya 🇰🇪
// ============================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

// ============================================
// CONFIGURATION
// ============================================
const app = express();
const PORT = process.env.PORT || 3000;

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY,
);

// ============================================
// EMAIL CONFIGURATION
// ============================================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "trippleblooded866@gmail.com",
    pass: process.env.SMTP_PASS || "cnig jjej jrhw ewmm",
  },
});

// ============================================
// MIDDLEWARE
// ============================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : "*",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api", limiter);

// ============================================
// LOGGING
// ============================================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================
app.get("/", (req, res) => {
  res.json({
    name: "G-KODE Server",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    message: "🇰🇪 Kenya Helping Kenya",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
  });
});

// ============================================
// TEST SUPABASE CONNECTION
// ============================================
app.get("/api/test-db", async (req, res) => {
  try {
    const { data, error, count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    res.json({
      success: true,
      message: "✅ Supabase connection successful!",
      userCount: count || 0,
    });
  } catch (error) {
    console.error("DB test error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "❌ Supabase connection failed. Check your credentials.",
    });
  }
});

// ============================================
// 📧 EMAIL ROUTES
// ============================================

// Send OTP email endpoint
app.post("/api/send-otp", async (req, res) => {
  try {
    const { email, name, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email and code required" });
    }

    const mailOptions = {
      from: `"G-KODE" <${process.env.SMTP_USER || "trippleblooded866@gmail.com"}>`,
      to: email,
      subject: "🔐 G-KODE Verification Code",
      html: `
                <h1 style="color: #006400;">G-KODE Verification</h1>
                <p>Hello ${name || "User"},</p>
                <p>Your verification code is:</p>
                <h2 style="color: #006400; font-size: 32px; background: #f5f5f5; padding: 10px; border-radius: 8px;">${code}</h2>
                <p>This code expires in 10 minutes.</p>
                <p>🇰🇪 Kenya Helping Kenya</p>
            `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Send reset email endpoint
app.post("/api/send-reset", async (req, res) => {
  try {
    const { email, name, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email and code required" });
    }

    const mailOptions = {
      from: `"G-KODE" <${process.env.SMTP_USER || "trippleblooded866@gmail.com"}>`,
      to: email,
      subject: "🔑 G-KODE Password Reset",
      html: `
                <h1 style="color: #cc0000;">G-KODE Password Reset</h1>
                <p>Hello ${name || "User"},</p>
                <p>Your password reset code is:</p>
                <h2 style="color: #cc0000; font-size: 32px; background: #f5f5f5; padding: 10px; border-radius: 8px;">${code}</h2>
                <p>This code expires in 10 minutes.</p>
                <p>🇰🇪 Kenya Helping Kenya</p>
            `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Reset code sent successfully",
    });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// USER ROUTES
// ============================================
app.get("/api/users", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, phone, full_name, email, location, profession")
      .limit(10);

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      users: data,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/users/:phone", async (req, res) => {
  try {
    const { phone } = req.params;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      throw error;
    }

    res.json({
      success: true,
      user: data,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================
app.get("/api/admin/test", async (req, res) => {
  const adminKey = req.headers["x-admin-key"];

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Invalid admin key.",
    });
  }

  res.json({
    success: true,
    message: "Admin access granted!",
    adminKey: adminKey,
  });
});

// Admin: Get all users with full details
app.get("/api/admin/users", async (req, res) => {
  const adminKey = req.headers["x-admin-key"];

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      users: data,
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Admin: Ban/Unban user
app.put("/api/admin/users/:phone/ban", async (req, res) => {
  const adminKey = req.headers["x-admin-key"];

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const { phone } = req.params;
    const { banned } = req.body;

    const { data, error } = await supabase
      .from("users")
      .update({ is_banned: banned })
      .eq("phone", phone)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: banned ? "User banned" : "User unbanned",
      user: data,
    });
  } catch (error) {
    console.error("Ban user error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Admin: Delete user
app.delete("/api/admin/users/:phone", async (req, res) => {
  const adminKey = req.headers["x-admin-key"];

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const { phone } = req.params;

    const { error } = await supabase.from("users").delete().eq("phone", phone);

    if (error) throw error;

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Admin: Get stats
app.get("/api/admin/stats", async (req, res) => {
  const adminKey = req.headers["x-admin-key"];

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const [{ count: userCount }, { count: gigCount }, { count: paymentCount }] =
      await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("gigs").select("*", { count: "exact", head: true }),
        supabase.from("payments").select("*", { count: "exact", head: true }),
      ]);

    res.json({
      success: true,
      stats: {
        users: userCount || 0,
        gigs: gigCount || 0,
        payments: paymentCount || 0,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
  });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log("========================================");
  console.log("🚀 G-KODE SERVER v3.0");
  console.log("========================================");
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📡 Supabase: ✅ Configured`);
  console.log(`📧 Email: ✅ Configured`);
  console.log(`🔑 Admin Key: ${process.env.ADMIN_KEY || "MAYA"}`);
  console.log("========================================");
  console.log("🇰🇪 Kenya Helping Kenya");
  console.log("========================================");
});
