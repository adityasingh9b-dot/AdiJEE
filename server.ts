import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// --- 1. FIREBASE INITIALIZATION (Vercel + Local Fix) ---
try {
  if (!admin.apps.length) {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
    } else {
      // Local fallback
      const { default: localKey } = await import(path.join(process.cwd(), "serviceAccountKey.json"), {
        assert: { type: "json" }
      });
      serviceAccount = localKey;
    }

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

// --- 2. ROUTES (With Error Handling to stop 500 errors) ---

app.post("/api/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    // Firebase query with string phone fix
    const snapshot = await rtdb.ref("users").orderByChild("phone").equalTo(String(phone)).once("value");
    const users = formatFirebaseData(snapshot);
    const user = users.find(u => u.password === password);
    
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/students", async (req, res) => {
  const snapshot = await rtdb.ref("users").orderByChild("role").equalTo("student").once("value");
  res.json(formatFirebaseData(snapshot));
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

// ... Baki saare routes (Banners, Payments, etc.) same rahenge ...
// Bas unhe app.get/app.post karke likho, startServer() ke andar mat daalna.

app.get("/api/banners", async (req, res) => {
  const snapshot = await rtdb.ref("banners").once("value");
  res.json(formatFirebaseData(snapshot).reverse()); 
});

// --- 3. VERCEL / LOCAL EXPORT ---

if (process.env.NODE_ENV !== "production") {
  const PORT = 3000;
  app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
}

// Ye sabse zaruri hai Vercel ke liye
export default app;
