# Deploying to GitHub + Cloudflare Pages (with Client-Side AES-256-GCM Encryption)

This folder (`cloudflare_pages/`) is a **zero-build-step Cloudflare Pages + Pages Functions** deployment for **The Law Offices of Jill McDonald — MDFL Tampa Division Bankruptcy Petition Program**, including the integrated **FLMB Means Test Calculator** (`/means-test/`) and **Client-Side End-to-End Encryption (`AES-256-GCM`)**.

---

## How the Client-Side Encryption Works

Whenever you upload a filled-out `CIF - The ReAwakening.pdf` or send client data across the internet:

1. **Encrypted on your PC first:** `public/crypto_client.js` uses your browser's native **Web Crypto API** to encrypt the entire intake PDF / JSON payload on your computer using **`AES-256-GCM`** (with a fresh 96-bit random IV and 128-bit GCM auth tag) **before** a single byte leaves your PC.
   - **Recommended Production Mode (Firm Passphrase Lock):** Set a strong secret named `PETITION_ENCRYPTION_KEY` in Cloudflare Pages → *Settings → Environment variables* (mark as **Encrypt**). Keys are derived via **PBKDF2-SHA-256 (100,000 iterations)** — stateless across all Cloudflare edge nodes, and nobody without your firm's passphrase can decrypt or use the API.
   - **Automatic Fallback Mode (Zero Config):** If `PETITION_ENCRYPTION_KEY` is not set, the browser and Cloudflare Pages Function automatically negotiate an **ECDH P-256 + HKDF-SHA-256** shared key per request!
2. **Decrypted inside Cloudflare Pages:** `functions/api/secure/[[route]].js` decrypts the envelope inside volatile Cloudflare Worker memory (nothing is logged or saved to disk), processes or relays it, and **re-encrypts the response with AES-256-GCM** before returning it over TLS 1.3.
3. **ZIP Output (`LastName,FirstName.zip`):** Generates all selected official forms (Arial/Helvetica **9 pt**, client **`/s/` e-signatures**, **`Debtorcc.org`** defaults, fixed B2030 Certification Box, Tampa Division Verification of Creditor Matrix, 3-Column Matrix, MDFL LR 1007-2 `Creditor.txt`, separate restricted `Form_B121_RESTRICTED_SSN.pdf`, and merged public `Petition_Packet_Ch*.pdf`) in a single downloadable ZIP archive.

---

## Step-by-Step Deployment (GitHub → Cloudflare Pages)

### 1. Push to a **Private** GitHub Repository
> **Security Tip:** Keep your GitHub repository **Private**, and never commit filled client folders (`.gitignore` already blocks `Clients/`, `case_data.json`, and `*RESTRICTED_SSN*.pdf`).

```bash
cd cloudflare_pages
git init
git add .
git commit -m "Initial commit: MDFL Tampa Division Petition Program"
git branch -M main
git remote add origin https://github.com/<YOUR-ORG-OR-USER>/<YOUR-REPO>.git
git push -u origin main
```

### 2. Connect Repository to Cloudflare Pages
1. Log in to the **Cloudflare Dashboard** → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select your private GitHub repository.
3. Configure Build Settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `public`
4. Click **Save and Deploy**. Cloudflare automatically deploys both `public/` and `functions/api/`!

### 3. Enable Firm Passphrase Encryption (Strongly Recommended)
1. In Cloudflare Pages → your project → **Settings → Environment variables**.
2. Add a **Secret** (click *Encrypt*) for Production:
   - Variable name: `PETITION_ENCRYPTION_KEY`
   - Value: A strong firm passphrase (e.g., 24+ characters).
3. *(Optional)* Also enable **Cloudflare Access (Zero Trust)** on your `*.pages.dev` domain so only `@jillmcdonald.com` staff emails can open the site!
4. Trigger a quick redeploy so the secret takes effect.

### 4. *(Optional)* Connect Your Office Python/PyMuPDF Engine via Cloudflare Tunnel
Out of the box, Cloudflare Pages runs **100% standalone** (zero external server required) using pure-JS `pdf-lib` + `JSZip`.
If you also want Cloudflare Pages to delegate PDF flattening to your office PC's Python backend (`petition_app/server.py`), add two more Cloudflare Pages Secrets:
- `PYTHON_BACKEND_URL`: Your Cloudflare Tunnel URL (e.g., `https://petition-api.yourdomain.com`)
- `PYTHON_RELAY_SECRET`: A shared random token checked by the Python server.
