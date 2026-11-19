# 🚀 The Ultimate LeadPulse User Manual

Welcome to LeadPulse! LeadPulse is your all-in-one platform to magically find new businesses, organize them into a visual pipeline, and reach out to them using high-deliverability cold email outreach—all without breaking a sweat.

We designed this manual specifically for non-technical users. If you can click a mouse and type an email, you can master LeadPulse in minutes!

---

## 1. The Dashboard (Finding Leads)
The Dashboard is your command center. It is where you discover new potential clients (leads) and keep an eye on your activity.

* **How to Find Leads:** 
  At the top of your Dashboard, you will see a search bar. Simply type what you are looking for (e.g., *"Plumbers in New York"* or *"Coffee shops in London"*) and click **Search**. LeadPulse connects directly to Google Maps behind the scenes to pull up highly accurate business profiles, including their names, ratings, websites, and phone numbers.
* **Lead Credits / Tokens:** 
  Every time you add a lead to your CRM, it costs 1 "Lead Credit / Token." Don't worry! Free accounts automatically refresh with 15 new tokens / credits every 4 days.

---

## 2. The CRM Pipeline (Organizing Your Leads)
CRM stands for "Customer Relationship Management." Think of it as your digital filing cabinet, but much more visual.

* **The Kanban Board:** 
  When you open the CRM, you will see a "Kanban" view. This simply means your leads are organized into visual columns: **New**, **Contacted**, **Replied**, and **Converted**. 
* **Drag and Drop:** 
  As a lead progresses (for example, you sent them an email), you can simply click their card, hold down your mouse button, and drag them from the "New" column into the "Contacted" column. It's incredibly satisfying!
* **Table View:** 
  If you prefer a traditional spreadsheet look, click the "List View" icon at the top right of the CRM to see all your leads in neat rows.

---

## 3. The Outreach Center (High-Deliverability Email Studio)
Once you have leads, it is time to say hello! The Outreach Center is a powerful tool that formats your email campaigns with precision.

### Sending Beautiful Emails & Sequences
1. **Choose a Layout:** Click the layout selector to choose from professional email designs (like 1-Column Editorial, Announcement, or High-Placement Plain Text).
2. **Subject Line A/B Split Testing:** Toggle on A/B Testing to craft Variant A and Variant B subject lines with a live 50/50 recipient preview.
3. **Smart 3-Step Follow-Up Sequence:** Toggle on the follow-up cadence to prepare Day 0 pitches, Step 2 gentle bumps (+3 days), and Step 3 closing values (+5 days).
4. **AI Copilot (Magic Wand):** Stuck on what to write? Look for the **Sparkle Icon** (AI Copilot). Just type a short prompt like *"Write a friendly email offering my plumbing software,"* and the AI will write the entire email for you!
5. **Executive Signature & Deliverability Engine:** Toggle your direct phone, booking link, and anti-spam deliverability jitter to guarantee inbox placement.
6. **Dispatch:** Select your prospect and click **Launch Email Batch** or **Send Test**.

---

## 4. Setting Up Your Email Gateway (SMTP)
By default, LeadPulse sends test emails. But to send emails to real clients, you need to connect your own email account. This ensures replies go straight to your inbox!

1. Click the **Settings (Gear)** icon on the Outreach page.
2. **Using Gmail:** Select the "Gmail" option. You will enter your Gmail address and a special 16-character "App Password" (which you can generate from your Google Account Security settings).
3. **Using Custom Email / Resend:** If you own a professional domain (like `you@yourbusiness.com`), you can paste your **Resend API Key** or enter your custom SMTP details (Host, Port, Username, Password) provided by your email host.
4. Click **Save Configuration**. Your emails will now be delivered securely from your own address!

---

> [!NOTE] 
> The following section is intended exclusively for the Platform Owner/Administrator. Regular users do not need to read beyond this point.

---

## 5. Super Admin Guide (Mission Control)
The Super Admin panel is completely hidden and physically isolated from the main application to ensure absolute security. It is where you, the owner, manage the platform.

### How to Access the Admin Panel
1. The Admin interface runs on a completely separate network port (Port `5174`).
2. Open your browser and navigate to **http://localhost:5174**.
3. You will see a standard login screen. **You must log in using an account that has been granted the `SUPER_ADMIN` role** (e.g., your master account).
4. If a standard user attempts to log in here, the system's security middleware will reject them and block access.

### What You Can Do
* **Global Analytics:** View total platform users, total leads generated across all accounts, and global email dispatch metrics.
* **User Management:** You will see a master table of every registered user.
* **Adjusting Lead Credits:** If a user purchases a subscription or needs a bonus, you can click on their credit balance in the table and instantly type in a new number. Their account will be credited immediately in real-time. 
* **Monitoring Plans:** Track who is on the `free` tier versus the `pro` tier.

*(Security Note: Your SuperAdmin panel is protected by a 3-layer cryptographic Gateway Token, IP whitelisting, and strict database role verification.)*
