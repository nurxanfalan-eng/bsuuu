# 🚀 RAILWAY TƏLƏSIK DEPLOYMENT

## Metod 1: Direct Deploy (ƏN ASAN)

Railway-də artıq GitHub bağlantısı varsa:

1. **Bu linki açın:**
   ```
   https://railway.app/new/github
   ```

2. **nurxanfalan-eng/bsuuu** tap və seçin

3. **Deploy Now** basın

4. **PostgreSQL əlavə et:**
   - Proyekt açılanda "+ New" düyməsi
   - "Database" → "Add PostgreSQL"

5. **Environment Variables (Settings → Variables):**
   ```
   NODE_ENV=production
   JWT_SECRET=bsu_chat_super_secret_2024_production_change_this
   TZ=Asia/Baku
   SUPER_ADMIN_USERNAME=ursamajor
   SUPER_ADMIN_PASSWORD=ursa618
   ```

6. **Domain yarat (Settings → Networking):**
   - "Generate Domain" düyməsi
   - URL-i əldə edin (məs: your-app.up.railway.app)

✅ HAZIR! Deploy 3-5 dəqiqə çəkir.

---

## Metod 2: Manual Deploy (GitHub işləmirsə)

1. **Lokal kompüterinizdə Railway CLI quraşdırın:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login olun:**
   ```bash
   railway login
   ```

3. **Repository-ni clone edin:**
   ```bash
   git clone https://github.com/nurxanfalan-eng/bsuuu.git
   cd bsuuu
   ```

4. **Railway proyekt yaradın:**
   ```bash
   railway init
   ```

5. **PostgreSQL əlavə edin:**
   ```bash
   railway add -d postgres
   ```

6. **Environment variables:**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=bsu_secret_2024
   railway variables set TZ=Asia/Baku
   railway variables set SUPER_ADMIN_USERNAME=ursamajor
   railway variables set SUPER_ADMIN_PASSWORD=ursa618
   ```

7. **Deploy:**
   ```bash
   railway up
   ```

8. **Domain:**
   ```bash
   railway domain
   ```

---

## GitHub Repo görünmürsə?

### A. Railway Settings-də:
1. Settings → Integrations
2. GitHub "Configure" 
3. Repository access → "bsuuu" seçin
4. Save

### B. GitHub.com-da:
1. https://github.com/settings/installations
2. "Railway" app tapın
3. "Configure" düyməsi
4. "nurxanfalan-eng/bsuuu" repository-ni seçin
5. Save

### C. Yeni GitHub Connection:
1. Railway-də Settings → Integrations
2. GitHub-ı disconnect et
3. Yenidən "Connect GitHub" et
4. Bütün permissions-lara icazə ver

---

## Deploy Log-larında nəyə baxmalı:

✅ **Uğurlu deploy:**
```
✓ Building...
✓ Installing dependencies
✓ Prisma generate
✓ Build complete
✓ Starting server
✓ Server listening on port $PORT
```

❌ **Xəta varsa:**
- DATABASE_URL yoxdur → PostgreSQL database əlavə et
- Port binding error → server.js-də process.env.PORT istifadə olunur ✅
- Prisma migration error → Build logs yoxla

---

## Test et:

Deploy olandan sonra:

1. **Health check:**
   ```
   https://your-app.up.railway.app/health
   ```
   Cavab: `{"status":"OK","timestamp":"..."}`

2. **Ana səhifə:**
   ```
   https://your-app.up.railway.app/
   ```
   Giriş/Qeydiyyat səhifəsi açılmalı

3. **Admin:**
   ```
   https://your-app.up.railway.app/admin
   ```
   Admin login səhifəsi

---

## Railway Environment Variables (KOPYALA-YAPIŞTIR):

```
NODE_ENV=production
JWT_SECRET=bsu_chat_jwt_secret_key_2024_production
TZ=Asia/Baku
SUPER_ADMIN_USERNAME=ursamajor
SUPER_ADMIN_PASSWORD=ursa618
```

⚠️ **VACIB:** `JWT_SECRET`-i real production-da daha təhlükəsiz bir key ilə dəyişdirin!

---

🎯 **Deploy Status Check:**

Railway Dashboard-da:
- 🟢 Deployments → Active (yaşıl)
- 🔵 Logs → "Server listening on port..."
- 🌐 Settings → Networking → Domain yaradılıb

Hamısı OK olarsa - HAZIRDIR! 🚀
