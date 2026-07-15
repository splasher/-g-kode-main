// ============================================
// G-KODE SERVER v3.0 - FRESH START
// ============================================

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// SUPABASE CONNECTION
// ============================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());

// ============================================
// ROUTES
// ============================================

// Health Check
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "🇰🇪 G-KODE Server is running!",
    timestamp: new Date().toISOString(),
  });
});

// Test Supabase Connection
app.get("/api/test", async (req, res) => {
  try {
    const { data, error, count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "Supabase connection failed",
      });
    }

    res.json({
      success: true,
      message: "✅ Supabase connected!",
      userCount: count || 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get Users
app.get("/api/users", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("phone, full_name, email, location, profession")
      .limit(20);

    if (error) throw error;

    res.json({
      success: true,
      count: data.length,
      users: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Admin Test
app.get("/api/admin/test", (req, res) => {
  const key = req.headers["x-admin-key"];
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
  res.json({
    success: true,
    message: "✅ Admin access granted!",
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
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
  console.log(
    `📡 Supabase: ${process.env.SUPABASE_URL ? "✅ Configured" : "❌ Not configured"}`,
  );
  console.log(`🔑 Admin Key: ${process.env.ADMIN_KEY}`);
  console.log("========================================");
});
