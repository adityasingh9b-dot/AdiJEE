import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// --- 1. FIREBASE INITIALIZATION ---
try {
  if (!admin.apps.length) {
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Vercel Environment Variable handling
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
    } else {
      // Local fallback: Using fs to avoid top-level await issues
      const keyPath = path.join(process.cwd(), "serviceAccountKey.json");
      if (fs.existsSync(keyPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
      } else {
        console.error("❌ serviceAccountKey.json not found locally!");
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://adijee-9b776-default-rtdb.firebaseio.com"
      });
      console.log("✅ Firebase Connected Successfully");
    }
  }
} catch (error) {
  console.error("❌ Firebase Init Error:", error);
}

const rtdb = admin.database();

const formatFirebaseData = (snapshot: any) => {
  const val = snapshot.val();
  if (!val) return [];
  return Object.keys(val).map(key => ({ id: key, ...val[key] }));
};

// --- 2. ROUTES ---

// Login Route
app.post("/api/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ error: "Missing phone or password" });

    const snapshot = await rtdb.ref("users")
      .orderByChild("phone")
      .equalTo(String(phone))
      .once("value");

    const users = formatFirebaseData(snapshot);
    const user = users.find((u: any) => u.password === password);
    
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err: any) {
    console.error("Login Error:", err.message);
    res.status(500).json({ error: "Database error. Check Firebase Indexing." });
  }
});

// Students List
app.get("/api/students", async (req, res) => {
  try {
    const snapshot = await rtdb.ref("users").orderByChild("role").equalTo("student").once("value");
    res.json(formatFirebaseData(snapshot));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Register User
app.post("/api/users", async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;
    const newUserRef = rtdb.ref("users").push();
    await newUserRef.set({ 
      name, 
      phone: String(phone), 
      password, 
      role: role || 'student', 
      created_at: Date.now() 
    });
    res.json({ success: true, id: newUserRef.key });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Delete Student
app.delete("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await rtdb.ref(`users/${id}`).remove();
    res.json({ success: true, message: "Student removed" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete student" });
  }
});

// Banners Routes
app.post("/api/banners", async (req, res) => {
  try {
    const { image_url, title } = req.body;
    const newBannerRef = rtdb.ref("banners").push();
    await newBannerRef.set({ image_url, title, created_at: Date.now() });
    res.json({ success: true, id: newBannerRef.key });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/banners", async (req, res) => {
  try {
    const snapshot = await rtdb.ref("banners").once("value");
    res.json(formatFirebaseData(snapshot).reverse()); 
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/banners/:id", async (req, res) => {
  try {
    await rtdb.ref(`banners/${req.params.id}`).remove();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Payments Routes
app.post("/api/payments", async (req, res) => {
  try {
    const { student_id, amount, screenshot_url } = req.body;
    const paymentRef = rtdb.ref("payments").push();
    await paymentRef.set({ student_id, amount, screenshot_url, status: 'pending', created_at: Date.now() });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/payments/:studentId", async (req, res) => {
  try {
    const snapshot = await rtdb.ref("payments").once("value");
    const allPayments = formatFirebaseData(snapshot);
    const filtered = allPayments.filter(p => String(p.student_id) === String(req.params.studentId));
    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Live Class Route
app.post("/api/live-class", async (req, res) => {
  try {
    const { meeting_id, is_active, invited_students } = req.body;
    await rtdb.ref("live_sessions/current").set({
      meeting_id, is_active, invited_students: invited_students || [], updatedAt: Date.now()
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI Bridge
app.post("/api/ask-jee", (req, res) => {
  res.json({ answer: "AdiJEE AI logic initialized." });
});

// --- 3. EXPORT & STARTUP ---

if (process.env.NODE_ENV !== "production") {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Local Server: http://localhost:${PORT}`);
  });
}

// CRITICAL FOR VERCEL
export default app;
