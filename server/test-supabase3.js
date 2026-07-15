require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

console.log("1. Checking environment variables...");
console.log("   SUPABASE_URL:", process.env.SUPABASE_URL || "MISSING");
console.log(
  "   SUPABASE_SERVICE_KEY:",
  process.env.SUPABASE_SERVICE_KEY ? "PRESENT" : "MISSING",
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

console.log("2. Testing connection...");

supabase
  .from("users")
  .select("*", { count: "exact", head: true })
  .then((result) => {
    console.log("3. Result:");
    console.log("   Success?", !result.error);
    if (result.error) {
      console.log("   Error:", JSON.stringify(result.error, null, 2));
    } else {
      console.log("   Count:", result.count);
    }
  })
  .catch((err) => {
    console.log("4. Catch Error:", err.message);
  });
