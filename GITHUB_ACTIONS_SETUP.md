# 🔄 GitHub Actions pentru Plăți Recurente

## Ce face acest workflow?

GitHub Actions va rula **automat zilnic la 12:00 PM (ora României)** și va procesa toate plățile recurente prin API-ul aplicației tale.

## 📋 Configurarea în GitHub

### 1. **Secrets de Repository**

Mergi pe GitHub la: `Settings` → `Secrets and variables` → `Actions` și adaugă:

```
ADMIN_SECRET = your-admin-secret-key
APP_URL = https://your-domain.com
```

**Exemplu:**
- `ADMIN_SECRET`: `secure-admin-key-2024`
- `APP_URL`: `https://3d7a-82-77-85-130.ngrok-free.app` (sau domeniul tău)

### 2. **Activarea Workflow-ului**

După ce faci push la repository, workflow-ul va fi activat automat și va:
- ✅ Rula zilnic la **9:00 UTC** (12:00 PM în România)
- ✅ Permite rularea manuală din GitHub interface
- ✅ Procesa toate abonamentele expirate
- ✅ Reînnoi plățile cu success sau downgrada utilizatorii

## 🎯 Cum să testezi manual

### Opțiunea 1: Din GitHub Interface
1. Mergi la `Actions` tab pe GitHub
2. Selectează `Recurring Payments Processor`
3. Click pe `Run workflow` → `Run workflow`

### Opțiunea 2: Din cod
```bash
# Trigger manual prin GitHub API
curl -X POST \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/USERNAME/REPOSITORY/actions/workflows/recurring-payments.yml/dispatches \
  -d '{"ref":"main"}'
```

## 📊 Monitorizarea

### Logs detailiate
GitHub va afișa logs complete cu:
```
🔄 Processing recurring payments...
✅ Recurring payments processed successfully
📊 Results: Processed: 5, Successful: 3, Failed: 2, Downgraded: 2
👤 User: user@example.com - Status: renewed - Success
👤 User: user2@example.com - Status: downgraded - Reason: No recurring token found
```

### Email notifications
GitHub poate trimite notificări email dacă workflow-ul eșuează:
- `Settings` → `Notifications` → `Actions`

## ⚙️ Programarea

Workflow-ul rulează la `cron: '0 9 * * *'`:
- **9:00 UTC** = **12:00 PM România** (în timpul iernii)
- **9:00 UTC** = **11:00 AM România** (în timpul verii - DST)

### Schimbarea orei:
```yaml
schedule:
  - cron: '0 8 * * *'  # 11:00 AM România
  - cron: '0 10 * * *' # 1:00 PM România
```

## 🚨 Troubleshooting

### Eroarea "Unauthorized"
- Verifică că `ADMIN_SECRET` este setat corect în GitHub Secrets
- Confirmă că API-ul acceptă acest secret

### Eroarea "Connection refused"
- Verifică că `APP_URL` este corect în GitHub Secrets
- Confirmă că aplicația rulează și este accesibilă

### Workflow nu rulează
- Verifică că repository-ul are activitate (commits) în ultimele 60 de zile
- GitHub dezactivează workflow-urile pentru repository-uri inactive

## 💡 Tips

1. **Testează local mai întâi:**
   ```bash
   curl -X POST \
     -H "Authorization: Bearer your-secret" \
     https://your-domain.com/api/admin/recurring-payments
   ```

2. **Monitorizează în primele zile** să vezi că totul funcționează corect

3. **Backup plan:** Poți rula manual workflow-ul oricând din GitHub interface

## 🔐 Securitate

- ✅ Secrets sunt criptate în GitHub
- ✅ Nu sunt expuse în logs
- ✅ Accesibile doar în workflow-uri
- ✅ Authentication prin Bearer token 