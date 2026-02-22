import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// --- 1. FIREBASE INITIALIZATION ---
let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Vercel Environment Variable handling
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    // Fix: Private key newlines fix for Vercel environments
    if (typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } else {
    // Local fallback: dynamic import for ES Modules (Avoids 'require is not defined' error)
    const { default: localKey } = await import(path.join(process.cwd(), "serviceAccountKey.json"), {
      assert: { type: "json" }
    });
    serviceAccount = localKey;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://adijee-9b776-default-rtdb.firebaseio.com"
    });
  }
} catch (error) {
  console.error("Firebase Init Error:", error);
}

const rtdb = admin.database();

const formatFirebaseData = (snapshot: any) => {
  const val = snapshot.val();
  if (!val) return [];
  return Object.keys(val).map(key => ({ id: key, ...val[key] }));
};

// --- 2. ROUTES ---

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

app.delete("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await rtdb.ref(`users/${id}`).remove();
    res.json({ success: true, message: "Student removed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete student" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;
    const newUserRef = rtdb.ref("users").push();
    await newUserRef.set({ name, phone, password, role: role || 'student', created_at: Date.now() });
    res.json({ success: true, id: newUserRef.key });
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

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

// GET current live class status
app.get("/api/live-class", async (req, res) => {
  const snapshot = await rtdb.ref("live_sessions/current").once("value");
  res.json(snapshot.val() || { is_active: false });
});

// GET announcements
app.get("/api/announcements", async (req, res) => {
  const snapshot = await rtdb.ref("announcements").once("value");
  res.json(formatFirebaseData(snapshot).reverse());
});

// POST announcements
app.post("/api/announcements", async (req, res) => {
  const { content } = req.body;
  const newRef = rtdb.ref("announcements").push();
  await newRef.set({ content, created_at: Date.now() });
  res.json({ success: true });
});

app.post("/api/payments", async (req, res) => {
  const { student_id, amount, screenshot_url } = req.body;
  const paymentRef = rtdb.ref("payments").push();
  await paymentRef.set({ student_id, amount, screenshot_url, status: 'pending', created_at: Date.now() });
  res.json({ success: true });
});

// Add this in api/index.ts
app.get("/api/admin/all-payments", async (req, res) => {
  try {
    const snapshot = await rtdb.ref("payments").once("value");
    const data = formatFirebaseData(snapshot).reverse(); // Newest first
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

app.get("/api/payments/:studentId", async (req, res) => {
  const snapshot = await rtdb.ref("payments").once("value");
  const allPayments = formatFirebaseData(snapshot);
  const filtered = allPayments.filter(p => String(p.student_id) === String(req.params.studentId));
  res.json(filtered);
});

app.post("/api/live-class", async (req, res) => {
  const { meeting_id, is_active, invited_students } = req.body;
  await rtdb.ref("live_sessions/current").set({
    meeting_id, is_active, invited_students: invited_students || [], updatedAt: Date.now()
  });
  res.json({ success: true });
});

// --- Add this route to fix the Delete Error ---
app.delete("/api/payments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await rtdb.ref(`payments/${id}`).remove();
    res.json({ success: true, message: "Payment record deleted" });
  } catch (error) {
    console.error("Delete Payment Error:", error);
    res.status(500).json({ error: "Failed to delete payment" });
  }
});

app.post("/api/ask-jee", (req, res) => {
  res.json({ answer: "AdiJEE AI logic initialized." });
});

// --- 3. VERCEL / LOCAL STARTUP ---

if (process.env.NODE_ENV !== "production") {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Local Server: http://localhost:${PORT}`);
  });
}

// CRITICAL: Vercel needs the exported app
export default app;
