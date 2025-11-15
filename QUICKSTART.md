# ⚡ Quick Start - Deploy in 30 Minutes

This is the **fastest path** to get your Muscle-Meta Matrix app live on the internet.

---

## ✅ Deployment Checklist

### Part 1: MongoDB Setup (10 min)
- [ ] Go to https://www.mongodb.com/cloud/atlas/register
- [ ] Sign up with Google
- [ ] Create free M0 cluster (AWS, us-west-2)
- [ ] Create database user: username `admin`, auto-generate password → **SAVE PASSWORD**
- [ ] Add IP: "Allow Access from Anywhere" (0.0.0.0/0)
- [ ] Get connection string → Click "Connect" → "Connect your application" → **COPY URL**
- [ ] Replace `<password>` in URL with your saved password → **SAVE FINAL URL**

**Example Connection String:**
```
mongodb+srv://admin:YourPassword123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

---

### Part 2: Render Setup (5 min)
- [ ] Go to https://render.com
- [ ] Click "Get Started" → Sign up with GitHub
- [ ] Authorize Render
- [ ] Install Render on your GitHub repo: `muscle-metacourse-newsletter`

---

### Part 3: Deploy (10 min)
- [ ] In Render dashboard: "New +" → "Blueprint"
- [ ] Select repo: `muscle-metacourse-newsletter`
- [ ] Branch: `claude/phase-2-enhancement-planning-011CUmPBNrMcjZTkHyfQ5F8D`
- [ ] Click "Apply"
- [ ] Wait for services to appear (2 services: backend + frontend)

---

### Part 4: Configure Backend (5 min)
- [ ] Click `muscle-meta-backend` service
- [ ] Click "Environment" tab
- [ ] Add variable: `MONGO_URL` = (your MongoDB URL from Part 1)
- [ ] Add variable: `STRIPE_API_KEY` = `sk_test_51...` (get from https://dashboard.stripe.com/test/apikeys)
- [ ] Click "Save Changes"
- [ ] Wait for redeploy (~5 min)

---

### Part 5: Test (2 min)
- [ ] Click `muscle-meta-frontend` → Copy URL
- [ ] Open URL in browser
- [ ] Click "Sign Up" → Create account
- [ ] See if you can log in ✅

---

## 🎉 Done!

Your app is live at:
- **Frontend**: `https://muscle-meta-frontend.onrender.com`
- **Backend**: `https://muscle-meta-backend.onrender.com`

---

## 🆘 If Something Breaks

1. **Check backend logs**: Click `muscle-meta-backend` → "Logs"
2. **Check frontend logs**: Click `muscle-meta-frontend` → "Logs"
3. **Common fix**: Verify `MONGO_URL` has correct password (no `<` `>` brackets)
4. **Still stuck?** See full DEPLOYMENT.md guide

---

## 🚀 Next Steps

- [ ] Test onboarding survey: Go to `/onboarding`
- [ ] Test dashboard: Complete survey, view `/dashboard`
- [ ] Share URL with testers
- [ ] Set up custom domain (optional)
- [ ] Upgrade to paid plan to prevent sleeping (optional, $7/mo)

**Need help?** Read the detailed DEPLOYMENT.md guide.
