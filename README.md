# BSU Chat Platform

Bakı Dövlət Universiteti Tələbə Chat Platforması

## Xüsusiyyətlər

- 16 fakültə üçün ayrı chat otaqları
- Şəxsi mesajlaşma sistemi
- Real-time mesajlaşma (Socket.IO)
- İstifadəçi doğrulama sistemi
- Admin paneli
- Mesaj filtrasiya sistemi
- Avtomatik mesaj silinməsi
- Şikayət sistemi

## Texnologiyalar

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL, Prisma ORM
- **Real-time**: Socket.IO
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: JWT
- **Deployment**: Railway

## Quraşdırma

### Lokal Development

1. Dependencies quraşdırın:
```bash
npm install
```

2. Database environment variable-larını konfiqurasiya edin `.env` faylında:
```
DATABASE_URL=postgresql://user:password@localhost:5432/bsu_chat
JWT_SECRET=your-secret-key
```

3. Database migration-larını işlədin:
```bash
npm run build
```

4. Serveri başladın:
```bash
npm start
```

Development üçün:
```bash
npm run dev
```

## Railway Deployment

Railway avtomatik olaraq aşağıdakı prosesləri icra edəcək:

1. Dependencies quraşdırılması: `npm install`
2. Build process: `npm run build` (Prisma migrations)
3. Server başlanması: `npm start`

### Environment Variables (Railway)

Railway-də aşağıdakı environment variable-ları əlavə edin:

- `DATABASE_URL`: PostgreSQL connection string (Railway Postgres addon avtomatik əlavə edəcək)
- `JWT_SECRET`: Your JWT secret key
- `NODE_ENV`: production
- `TZ`: Asia/Baku

### Railway Postgres Addon

1. Railway dashboard-da layihəyə Postgres addon əlavə edin
2. `DATABASE_URL` avtomatik konfiqurasiya olunacaq
3. Migration-lar avtomatik işlənəcək

## Admin Girişi

Super Admin credentials:
- Username: `ursamajor`
- Password: `ursa618`

## Struktur

```
/home/user/webapp/
├── server.js                 # Main server file
├── server/
│   ├── controllers/          # Request handlers
│   ├── middleware/           # Authentication, validation
│   ├── models/               # (Prisma handles models)
│   ├── routes/               # API routes
│   ├── services/             # Socket.IO service
│   └── utils/                # Helper functions
├── prisma/
│   └── schema.prisma         # Database schema
├── public/
│   ├── css/                  # Stylesheets
│   ├── js/                   # Frontend JavaScript
│   ├── images/               # Static images
│   └── uploads/              # User uploads
├── views/
│   ├── index.html            # Login/Register page
│   ├── chat.html             # Chat interface
│   └── admin.html            # Admin panel
├── package.json
└── .env                      # Environment variables
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Qeydiyyat
- `POST /api/auth/login` - Giriş
- `POST /api/auth/admin/login` - Admin girişi
- `GET /api/auth/verification-questions` - Doğrulama sualları
- `GET /api/auth/faculties` - Fakültə siyahısı

### User
- `GET /api/user/profile` - İstifadəçi profili
- `POST /api/user/profile-picture` - Profil şəkli yeniləmə
- `GET /api/user/faculty/:faculty` - Fakültə istifadəçiləri
- `POST /api/user/block` - İstifadəçi əngəlləmə
- `POST /api/user/report` - Şikayət etmə

### Messages
- `GET /api/messages/faculty/:faculty` - Fakültə mesajları
- `GET /api/messages/private/:userId` - Şəxsi mesajlar
- `GET /api/messages/conversations` - Söhbətlər siyahısı

### Admin
- `GET /api/admin/stats` - Dashboard statistikası
- `GET /api/admin/users` - Bütün istifadəçilər
- `POST /api/admin/users/toggle-status` - İstifadəçi statusu
- `GET /api/admin/reported-users` - Şikayət edilənlər
- `GET /api/admin/settings` - Parametrlər
- `POST /api/admin/settings` - Parametr yeniləmə
- `GET /api/admin/filter-words` - Filtr sözləri
- `POST /api/admin/filter-words` - Filtr söz əlavə et
- `DELETE /api/admin/filter-words/:wordId` - Filtr söz sil
- `GET /api/admin/admins` - Adminlər (Super Admin only)
- `POST /api/admin/admins` - Admin yarat (Super Admin only)
- `DELETE /api/admin/admins/:adminId` - Admin sil (Super Admin only)

### Settings
- `GET /api/settings/public` - Ümumi parametrlər

## Socket Events

### Client to Server
- `authenticate` - Authentication
- `join_faculty` - Fakültə otağına qoşul
- `leave_faculty` - Fakültə otağından çıx
- `send_faculty_message` - Fakültə mesajı göndər
- `start_private_chat` - Şəxsi söhbət başlat
- `send_private_message` - Şəxsi mesaj göndər

### Server to Client
- `authenticated` - Authentication uğurlu
- `auth_error` - Authentication xətası
- `new_faculty_message` - Yeni fakültə mesajı
- `new_private_message` - Yeni şəxsi mesaj
- `user_joined` - İstifadəçi qoşuldu
- `error` - Xəta mesajı

## Lisenziya

Private Project - BSU Chat Platform
