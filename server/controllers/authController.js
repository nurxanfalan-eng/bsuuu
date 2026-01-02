const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Verification questions and answers
const VERIFICATION_QUESTIONS = [
  { id: 1, question: "Mexanika-riyaziyyat fakültəsi hansı korpusda yerləşir?", answer: "3" },
  { id: 2, question: "Tətbiqi riyaziyyat və kibernetika fakültəsi hansı korpusda yerləşir?", answer: "3" },
  { id: 3, question: "Fizika fakültəsi hansı korpusda yerləşir?", answer: "əsas" },
  { id: 4, question: "Kimya fakültəsi hansı korpusda yerləşir?", answer: "əsas" },
  { id: 5, question: "Biologiya fakültəsi hansı korpusda yerləşir?", answer: "əsas" },
  { id: 6, question: "Ekologiya və torpaqşünaslıq fakültəsi hansı korpusda yerləşir?", answer: "əsas" },
  { id: 7, question: "Coğrafiya fakültəsi hansı korpusda yerləşir?", answer: "əsas" },
  { id: 8, question: "Geologiya fakültəsi hansı korpusda yerləşir?", answer: "əsas" },
  { id: 9, question: "Filologiya fakültəsi hansı korpusda yerləşir?", answer: "1" },
  { id: 10, question: "Tarix fakültəsi hansı korpusda yerləşir?", answer: "3" },
  { id: 11, question: "Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi hansı korpusda yerləşir?", answer: "1" },
  { id: 12, question: "Hüquq fakültəsi hansı korpusda yerləşir?", answer: "1" },
  { id: 13, question: "Jurnalistika fakültəsi hansı korpusda yerləşir?", answer: "2" },
  { id: 14, question: "İnformasiya və sənəd menecmenti fakültəsi hansı korpusda yerləşir?", answer: "2" },
  { id: 15, question: "Şərqşünaslıq fakültəsi hansı korpusda yerləşir?", answer: "2" },
  { id: 16, question: "Sosial elmlər və psixologiya fakültəsi hansı korpusda yerləşir?", answer: "2" }
];

const FACULTIES = [
  "Mexanika-riyaziyyat fakültəsi",
  "Tətbiqi riyaziyyat və kibernetika fakültəsi",
  "Fizika fakültəsi",
  "Kimya fakültəsi",
  "Biologiya fakültəsi",
  "Ekologiya və torpaqşünaslıq fakültəsi",
  "Coğrafiya fakültəsi",
  "Geologiya fakültəsi",
  "Filologiya fakültəsi",
  "Tarix fakültəsi",
  "Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi",
  "Hüquq fakültəsi",
  "Jurnalistika fakültəsi",
  "İnformasiya və sənəd menecmenti fakültəsi",
  "Şərqşünaslıq fakültəsi",
  "Sosial elmlər və psixologiya fakültəsi"
];

// Get random verification questions
exports.getVerificationQuestions = async (req, res) => {
  try {
    // Select 3 random questions
    const shuffled = [...VERIFICATION_QUESTIONS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map(q => ({
      id: q.id,
      question: q.question,
      options: ["1", "2", "3", "əsas"]
    }));
    
    res.json({ questions: selected });
  } catch (error) {
    console.error('Error getting verification questions:', error);
    res.status(500).json({ error: 'Xəta baş verdi' });
  }
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, faculty, degree, course, verificationAnswers } = req.body;

    // Validation
    if (!name || !email || !phone || !password || !faculty || !degree || !course) {
      return res.status(400).json({ error: 'Bütün sahələr doldurulmalıdır' });
    }

    // Validate email format (@bsu.edu.az)
    if (!email.endsWith('@bsu.edu.az')) {
      return res.status(400).json({ error: 'Email @bsu.edu.az ilə bitməlidir' });
    }

    // Validate phone format (+994XXXXXXXXX)
    const phoneRegex = /^\+994\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Telefon nömrəsi +994XXXXXXXXX formatında olmalıdır' });
    }

    // Validate faculty
    if (!FACULTIES.includes(faculty)) {
      return res.status(400).json({ error: 'Düzgün fakültə seçilməlidir' });
    }

    // Validate degree
    if (!['bakalavr', 'magistr', 'doktorantura'].includes(degree)) {
      return res.status(400).json({ error: 'Düzgün dərəcə seçilməlidir' });
    }

    // Validate course
    if (course < 1 || course > 6) {
      return res.status(400).json({ error: 'Kurs 1-6 arasında olmalıdır' });
    }

    // Verify answers - at least 2 out of 3 must be correct
    if (!verificationAnswers || verificationAnswers.length !== 3) {
      return res.status(400).json({ error: 'Doğrulama sualları cavablandırılmalıdır' });
    }

    let correctAnswers = 0;
    verificationAnswers.forEach(answer => {
      const question = VERIFICATION_QUESTIONS.find(q => q.id === answer.questionId);
      if (question && question.answer === answer.answer) {
        correctAnswers++;
      }
    });

    if (correctAnswers < 2) {
      return res.status(400).json({ error: 'Doğrulama uğursuz oldu. Ən azı 2 sual düzgün cavablandırılmalıdır' });
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Bu email artıq qeydiyyatdan keçib' });
    }

    // Check if phone already exists
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ error: 'Bu telefon nömrəsi artıq qeydiyyatdan keçib' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        faculty,
        degree,
        course: parseInt(course)
      }
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Qeydiyyat uğurla tamamlandı',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        faculty: user.faculty,
        degree: user.degree,
        course: user.course,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Qeydiyyat zamanı xəta baş verdi' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email və şifrə daxil edilməlidir' });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Email və ya şifrə yanlışdır' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Hesabınız deaktiv edilib. Adminlə əlaqə saxlayın' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email və ya şifrə yanlışdır' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Giriş uğurlu oldu',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        faculty: user.faculty,
        degree: user.degree,
        course: user.course,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Giriş zamanı xəta baş verdi' });
  }
};

// Admin login
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'İstifadəçi adı və şifrə daxil edilməlidir' });
    }

    // Check super admin credentials
    if (username === process.env.SUPER_ADMIN_USERNAME && password === process.env.SUPER_ADMIN_PASSWORD) {
      // Check if super admin exists in database
      let superAdmin = await prisma.admin.findFirst({ where: { isSuperAdmin: true } });
      
      if (!superAdmin) {
        // Create super admin
        const hashedPassword = await bcrypt.hash(password, 10);
        superAdmin = await prisma.admin.create({
          data: {
            username,
            password: hashedPassword,
            isSuperAdmin: true
          }
        });
      }

      const token = jwt.sign(
        { adminId: superAdmin.id, username: superAdmin.username, isSuperAdmin: true },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Admin girişi uğurlu oldu',
        token,
        admin: {
          id: superAdmin.id,
          username: superAdmin.username,
          isSuperAdmin: true
        }
      });
    }

    // Check regular admin
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }

    const token = jwt.sign(
      { adminId: admin.id, username: admin.username, isSuperAdmin: admin.isSuperAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Admin girişi uğurlu oldu',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        isSuperAdmin: admin.isSuperAdmin
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Admin girişi zamanı xəta baş verdi' });
  }
};

// Get faculties list
exports.getFaculties = async (req, res) => {
  res.json({ faculties: FACULTIES });
};
