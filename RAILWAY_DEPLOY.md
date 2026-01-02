# Railway CLI ilə Deployment

## 1. Railway CLI quraşdırın (Lokal kompüterinizdə)

```bash
npm install -g @railway/cli
```

## 2. Railway-ə login olun

```bash
railway login
```

## 3. Proyekt yaradın

```bash
cd /path/to/bsuuu
railway init
```

## 4. PostgreSQL əlavə edin

```bash
railway add --database postgres
```

## 5. Environment variables əlavə edin

```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-super-secret-key-change-this
railway variables set TZ=Asia/Baku
railway variables set SUPER_ADMIN_USERNAME=ursamajor
railway variables set SUPER_ADMIN_PASSWORD=ursa618
```

## 6. Deploy edin

```bash
railway up
```

## 7. Domain əlavə edin

```bash
railway domain
```

---

# VƏ YA Railway Dashboard istifadə edin:

## Addımlar:

1. https://railway.app/new
2. "Deploy from GitHub repo"
3. nurxanfalan-eng/bsuuu seçin
4. Postgres database əlavə edin: "+ New" → "Database" → "PostgreSQL"
5. Environment Variables əlavə edin:
   - NODE_ENV=production
   - JWT_SECRET=your-secret-key
   - TZ=Asia/Baku
   - SUPER_ADMIN_USERNAME=ursamajor
   - SUPER_ADMIN_PASSWORD=ursa618
6. Settings → Networking → Generate Domain

Deploy avtomatik başlayacaq!

---

# Əgər problem varsa:

## Railway-də GitHub bağlantısı problemləri:

1. Railway → Settings → Integrations
2. GitHub App-ı yenidən connect edin
3. Repository permissions yoxlayın

## Build xətaları:

1. Railway Logs-a baxın
2. DATABASE_URL düzgün konfiqurasiya olunub?
3. Prisma migrations işləyib?

## Deploy 20 dəqiqədən çox sürürsə:

1. Build logs-u yoxlayın
2. Networking settings-də port düzgündür? (Railway $PORT istifadə edir)
3. Health check endpoint: /health

---

# Bizim proyektdə hər şey hazırdır:

✅ package.json - scripts düzgün
✅ Procfile - Railway üçün
✅ railway.toml - Build konfiqurasiyası
✅ server.js - process.env.PORT istifadə edir
✅ Prisma schema - PostgreSQL üçün
✅ /health endpoint - health check

Deploy problemsiz olmalıdır! 🚀
