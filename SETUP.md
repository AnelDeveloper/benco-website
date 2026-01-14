# Setup Uputstva za Email Funkcionalnost

## Kako postaviti email funkcionalnost

Website koristi **Resend** servis za slanje emailova sa kontakt forme. Slijedi ove korake:

### 1. Kreiraj Resend nalog

1. Idi na [https://resend.com](https://resend.com)
2. Registruj se (potpuno besplatno za 100 emailova dnevno)
3. Verifikuj svoj email

### 2. Dobij API Key

1. Nakon prijave, idi na **API Keys** sekciju
2. Klikni **Create API Key**
3. Daj mu ime (npr. "BenCo Website")
4. Kopiraj API key (čuvaj ga sigurno!)

### 3. Dodaj API Key u projekat

Kreiraj fajl `.env.local` u root folderu projekta:

```bash
# U terminalu:
echo "RESEND_API_KEY=your_api_key_here" > .env.local
```

Ili ručno kreiraj fajl `.env.local` sa sadržajem:

```
RESEND_API_KEY=tvoj_resend_api_key_ovdje
```

**VAŽNO:** Zamijeni `tvoj_resend_api_key_ovdje` sa pravim API keyem!

### 4. Restartuj development server

```bash
npm run dev
```

### 5. Testiranje

1. Idi na **Contact** sekciju na websiteu
2. Popuni formu
3. Klikni **Pošalji poruku**
4. Email će stići na **realestatebenco@gmail.com**

## Kako funkcioniše

- Kada neko popuni kontakt formu, email se šalje preko Resend API-ja
- Email stiže na `realestatebenco@gmail.com`
- Email sadrži:
  - Ime pošiljaoca
  - Email adresu (možeš direktno odgovoriti)
  - Broj telefona (ako je dat)
  - Poruku
  - Datum i vrijeme

## Production Setup

Za production, preporučujem da:

1. Verifikuješ svoju domenu u Resend-u (besplatno)
2. Umjesto `onboarding@resend.dev`, koristi svoju domenu (npr. `info@benco.ba`)
3. Dodaj `RESEND_API_KEY` u environment variables na hosting platformi

## Troubleshooting

**Problem:** Email se ne šalje
- Provjeri da li je API key pravilno postavljen u `.env.local`
- Provjeri konzolu za greške
- Provjeri da li je Resend servis aktivan

**Problem:** Email ide u spam
- Verifikuj domenu u Resend-u
- Koristi profesionalnu email adresu

## Alternativa - Test Mode

Ako ne želiš da setupuješ Resend odmah, API će i dalje raditi ali neće slati prave emailove. Možeš testirati funkcionalnost i kasnije dodati API key.
