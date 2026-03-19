const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
app.use(cors());
// زيادة حجم الطلبات المسموح بها لاستيعاب الصور المرفوعة (Base64)
app.use(express.json({ limit: '50mb' }));

const DB_FILE = path.join(__dirname, 'database.sqlite');

// إعداد اتصال SQLite وتجهيز الجدول
let dbPromise = open({
    filename: DB_FILE,
    driver: sqlite3.Database
}).then(async (db) => {
    await db.exec(`CREATE TABLE IF NOT EXISTS app_database (
        id TEXT PRIMARY KEY,
        data TEXT
    )`);
    return db;
});

// جعل الخادم يعرض ملفات الواجهة الأمامية (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// قالب البيانات الافتراضي (الأساسي)
const defaultData = {
    students: [], recentStudents: [],
    roles: [
        { name: 'مدير النظام', email: 'admin@panda.com', password: 'admin', role: 'مدير النظام', roleCode: 'admin', statusCode: 'active', date: '' }
    ],
    instructors: [], courses: [], subjects: [], accounting: [], notifications: [],
    settings: { instituteName: 'مركز الباندا', phone: '', currency: 'IQD', logo: '', maxStudentsPerCourse: 30 },
    attendance: []
};

let cachedDB = null;

// دالة جلب قاعدة البيانات من SQLite
async function getDB() {
    if (cachedDB) return cachedDB;
    
    const db = await dbPromise;
    const row = await db.get(`SELECT data FROM app_database WHERE id = 'main'`);
        
    if (!row || !row.data) {
        cachedDB = defaultData;
        await saveDB(defaultData);
        return defaultData;
    }
    
    cachedDB = JSON.parse(row.data);
    return cachedDB;
}

// دالة حفظ قاعدة البيانات إلى SQLite
async function saveDB(data) {
    cachedDB = data; // التحديث في الذاكرة لتسريع الطلبات القادمة
    const db = await dbPromise;
    const jsonData = JSON.stringify(data);
    
    // تحديث البيانات إذا كانت موجودة، أو إدراجها إذا لم تكن موجودة
    await db.run(`
        INSERT INTO app_database (id, data) 
        VALUES ('main', ?)
        ON CONFLICT(id) DO UPDATE SET data = excluded.data
    `, [jsonData]);
}

// --- مسارات النظام (API Routes) ---

// 1. تسجيل الدخول
app.post('/api/login', async (req, res) => {
    const db = await getDB();
    const { identifier, password } = req.body;
    const user = db.roles.find(u => u.email === identifier || u.name === identifier || u.roleCode === identifier);
    if (user && user.password === password) {
        const safeUser = { ...user };
        delete safeUser.password;
        return res.json({ success: true, user: safeUser });
    }
    res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
});

// 2. جلب وتصدير كافة البيانات
app.get('/api/data', async (req, res) => {
    res.json(await getDB());
});

// 3. استيراد قاعدة بيانات كاملة (النسخ الاحتياطية)
app.post('/api/data/import', async (req, res) => {
    const db = req.body;
    if (db && db.students && db.roles) {
        await saveDB(db);
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'ملف البيانات غير صالح' });
    }
});

// 4. إضافة طالب (معالجة خاصة)
app.post('/api/students', async (req, res) => {
    const db = await getDB();
    const { student, recent } = req.body;
    if (!student.id) student.id = `Std-${Date.now()}`;
    db.students.push(student);
    if (recent) db.recentStudents.push(recent);
    await saveDB(db);
    res.json({ success: true });
});

// 5. معالجة سجلات الحضور
app.post('/api/attendance', async (req, res) => {
    const db = await getDB();
    const existingIdx = db.attendance.findIndex(a => a.class_id === req.body.class_id && a.date === req.body.date);
    if (existingIdx > -1) {
        db.attendance[existingIdx] = req.body;
    } else {
        db.attendance.push(req.body);
    }
    await saveDB(db);
    res.json({ success: true });
});

// 6. معالجة تحديثات الإعدادات
app.post('/api/update/settings', async (req, res) => {
    const db = await getDB();
    db.settings = { ...db.settings, ...req.body };
    await saveDB(db);
    res.json({ success: true });
});

// 7. معالجة إضافة وتعديل الصلاحيات
app.post('/api/roles', async (req, res) => {
    const db = await getDB();
    if (db.roles.find(r => r.email === req.body.email)) {
        return res.status(409).json({ error: "هذا البريد الإلكتروني مستخدم مسبقاً" });
    }
    db.roles.push(req.body);
    await saveDB(db);
    res.json({ success: true, roles: db.roles });
});

// 8. مسار ديناميكي (عام) لإنشاء مصفوفات البيانات (Instructors, Courses, etc..)
app.post('/api/update/:collection', async (req, res) => {
    const db = await getDB();
    const col = req.params.collection;
    if (Array.isArray(req.body)) {
        db[col] = req.body; 
    } else {
        if (!db[col]) db[col] = [];
        db[col].push(req.body);
    }
    await saveDB(db);
    res.json({ success: true });
});

// 9. مسار ديناميكي (عام) لتعديل عنصر محدد (PUT)
app.put('/api/:collection/:id', async (req, res) => {
    const db = await getDB();
    const { collection, id } = req.params;
    if (db[collection]) {
        const idx = db[collection].findIndex(item => item.id === id || item.email === id);
        if (idx > -1) {
            const updates = req.body.student ? req.body.student : req.body;
            db[collection][idx] = { ...db[collection][idx], ...updates };
            await saveDB(db);
        }
    }
    if (collection === 'roles') return res.json({ success: true, roles: db.roles });
    res.json({ success: true });
});

// 10. مسار ديناميكي (عام) لحذف عنصر (DELETE)
app.delete('/api/:collection/:id', async (req, res) => {
    const db = await getDB();
    const { collection, id } = req.params;
    if (db[collection]) {
        db[collection] = db[collection].filter(item => item.id !== id && item.email !== id);
        await saveDB(db);
    }
    if (collection === 'roles') return res.json({ success: true, roles: db.roles });
    res.json({ success: true });
});

// توجيه أي طلب آخر (غير الـ API) إلى صفحة الموقع الرئيسية
app.use((req, res) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.status(404).json({ error: "المسار غير موجود" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Panda Backend Server is running on http://localhost:${PORT}`);
    console.log(`Database is connected to Local SQLite (${DB_FILE})`);
});