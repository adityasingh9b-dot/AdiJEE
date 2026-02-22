import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// --- 1. FIREBASE INITIALIZATION ---
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(path.join(__dirname, "serviceAccountKey.json")),
    databaseURL: "https://adijee-9b776-default-rtdb.firebaseio.com"
  });
}
const rtdb = admin.database();

const formatFirebaseData = (snapshot: any) => {
  const val = snapshot.val();
  if (!val) return [];
  return Object.keys(val).map(key => ({ id: key, ...val[key] }));
};

const valToArray = (val: any) => (val ? Object.values(val) as any[] : []);

// --- 2. AUTO-ADMIN SEEDING ---
async function seedAdmin() {
  const userRef = rtdb.ref("users");
  const snapshot = await userRef.once("value");
  const users = valToArray(snapshot.val());

  if (!users.some(u => u.phone === "9369250645")) {
    await userRef.push({ name: "Admin Sir", role: "admin", phone: "9369250645", password: "#$!&" });
  }
}

async function startServer() {
  await seedAdmin();
  const app = express();
  const server = createServer(app);
  const PORT = 3000;

  app.use(express.json());

  // --- 3. AUTH & STUDENT MANAGEMENT ---
  app.post("/api/login", async (req, res) => {
    const { phone, password } = req.body;
    const snapshot = await rtdb.ref("users").orderByChild("phone").equalTo(phone).once("value");
    const users = formatFirebaseData(snapshot);
    const user = users.find(u => u.password === password);
    res.json(user || null);
  });

  app.get("/api/students", async (req, res) => {
    const snapshot = await rtdb.ref("users").orderByChild("role").equalTo("student").once("value");
    res.json(formatFirebaseData(snapshot));
  });

  // 🔥 NEW: DELETE STUDENT ROUTE
  app.delete("/api/students/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await rtdb.ref(`users/${id}`).remove();
      res.json({ success: true, message: "Student removed from Firebase" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete student" });
    }
  });
  
  // --- ADD THIS TO server.ts ---
app.post("/api/users", async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;
    const newUserRef = rtdb.ref("users").push();
    await newUserRef.set({ 
      name, 
      phone, 
      password, 
      role: role || 'student',
      created_at: Date.now() 
    });
    res.json({ success: true, id: newUserRef.key });
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

  // --- 4. BANNERS ---
  app.post("/api/banners", async (req, res) => {
    const { image_url, title } = req.body;
    const newBannerRef = rtdb.ref("banners").push();
    await newBannerRef.set({ image_url, title, created_at: Date.now() });
    res.json({ success: true, id: newBannerRef.key });
  });

  app.get("/api/banners", async (req, res) => {
    const snapshot = await rtdb.ref("banners").once("value");
    res.json(formatFirebaseData(snapshot).reverse()); 
  });

  app.delete("/api/banners/:id", async (req, res) => {
    await rtdb.ref(`banners/${req.params.id}`).remove();
    res.json({ success: true });
  });

  // --- 5. PAYMENTS ---
  app.post("/api/payments", async (req, res) => {
    const { student_id, amount, screenshot_url } = req.body;
    const paymentRef = rtdb.ref("payments").push();
    await paymentRef.set({ student_id, amount, screenshot_url, status: 'pending', created_at: Date.now() });
    res.json({ success: true });
  });

  app.get("/api/payments/:studentId", async (req, res) => {
    const snapshot = await rtdb.ref("payments").once("value");
    const allPayments = formatFirebaseData(snapshot);
    const filtered = allPayments.filter(p => String(p.student_id) === String(req.params.studentId));
    res.json(filtered);
  });

  // --- 6. LIVE CLASS ---
  app.post("/api/live-class", async (req, res) => {
    const { meeting_id, is_active, invited_students } = req.body;
    await rtdb.ref("live_sessions/current").set({
      meeting_id, is_active, invited_students: invited_students || [], updatedAt: Date.now()
    });
    res.json({ success: true });
  });

  // --- 7. GEMINI BRIDGE & VITE ---
  app.post("/api/ask-jee", (req, res) => {
    res.json({ answer: "AdiJEE AI logic initialized." });
  });

// --- REPLACE THIS FINAL SECTION ---
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({ 
    server: { middlewareMode: true }, 
    appType: "spa" 
  });
  // Pehle API routes check honge, agar match nahi hue toh Vite handle karega
  app.use(vite.middlewares); 
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith('/api')) return next(); 
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

// ⚠️ YE LINE ZAROORI HAI LOCAL CHALANE KE LIYE
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 AdiJEE Studio Live: http://localhost:${PORT}`);
});
} // startServer bracket

startServer();
