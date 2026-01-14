# 🔑 Kako dobiti Resend API Key

## Korak 1: Registracija na Resend

1. Idi na **https://resend.com**
2. Klikni **"Sign Up"** (besplatno!)
3. Registruj se sa svojim emailom (možeš koristiti `realestatebenco@gmail.com`)
4. Verifikuj email adresu

## Korak 2: Kreiraj API Key

1. Nakon prijave, idi na **Dashboard**
2. U lijevom meniju klikni na **"API Keys"**
3. Klikni **"Create API Key"** dugme
4. Daj mu ime (npr. "Ben&Co Website")
5. **Kopiraj API key** - izgleda ovako: `re_123456789abcdef...`

⚠️ **VAŽNO:** API key se prikazuje samo jednom! Zapiši ga negdje sigurno!

## Korak 3: Dodaj API Key u Vercel (ili drugi hosting)

### Ako koristiš Vercel:

1. Idi na svoj projekat na **https://vercel.com**
2. Klikni na **Settings**
3. Idi na **Environment Variables**
4. Dodaj novu varijablu:
   - **Name:** `RESEND_API_KEY`
   - **Value:** tvoj API key (npr. `re_123456789abcdef...`)
   - **Environment:** Production, Preview, Development (sve tri!)
5. Klikni **Save**
6. **Redeploy** projekat (Build će sada proći!)

### Ako koristiš drugi hosting:

Dodaj `RESEND_API_KEY` u environment variables na svojoj hosting platformi.

## Korak 4: Testiranje

1. Nakon redeploy-a, idi na svoj website
2. Popuni kontakt formu
3. Klikni "Pošalji poruku"
4. Email će stići na **realestatebenco@gmail.com**! 📧

## Besplatni Plan

Resend nudi **100 emailova dnevno BESPLATNO** - više nego dovoljno za početak! 🎉

## Troubleshooting

**Problem:** Build pada sa "Missing API key"
- ✅ Provjeri da li si dodao `RESEND_API_KEY` u Vercel environment variables
- ✅ Provjeri da li si redeploy-ovao projekat nakon dodavanja
- ✅ Provjeri da li je API key ispravno kopiran (bez razmaka)

**Problem:** Email se ne šalje
- ✅ Provjeri da li je API key aktivan u Resend dashboard-u
- ✅ Provjeri konzolu za greške
- ✅ Provjeri da li si prekoračio dnevni limit (100 emailova)

## Production Setup (Opcionalno)

Za production, preporučujem:
1. Verifikuj svoju domenu u Resend-u (besplatno)
2. Umjesto `onboarding@resend.dev`, koristi svoju domenu (npr. `info@benco.ba`)

---

**Link:** https://resend.com/api-keys
