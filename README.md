I have single-handedly developed this project from scratch. Welcome to LiliShop! 🛍️

**Project Name:** LiliShop

**Core Technologies:** .NET 10, Angular 22

LiliShop is a modern, security-hardened e-commerce platform built with .NET 10 and Angular 22, offering multi-language support and a seamless shopping experience for users, alongside robust management capabilities for administrators.

---

## 🚀 User Features:

* **Product Discovery:**
    * Browse and view a comprehensive product catalog 📖.
    * Filter products by brand, type, and size.
    * Isolate products with active discounts 💰.
    * Search for specific products by name 🔍.
    * Sort products by price (ascending/descending) and alphabetically ⇅.
* **Purchasing & Account Management:**
    * Securely purchase products using **Stripe**, with card payments protected by 3D Secure / Strong Customer Authentication (SCA) 💳.
    * Access a detailed history of completed orders 📜.
    * Register for an account using a traditional username/password combination or via Google social login 👤.
    * Confirm registration through an email verification link ✅.
    * Utilize a password recovery feature for forgotten passwords 🔑.
    * Stay securely signed in across sessions via automatic token refresh, and log out from all active sessions on different devices in one click 🔒.
* **Multi-Language Support:**
    * Browse the entire storefront — including product, brand, and category names — in **11 languages**: English, German, Spanish, Russian, Hindi, Chinese, Turkish, Danish, and Swedish, plus full right-to-left (RTL) support for **Persian and Arabic** 🌍.
    * Switch languages instantly from a dedicated language switcher in the UI.
    * *(Deep dive: [Localization Architecture](https://github.com/jahanalem/LinkedIn2GitHub/blob/main/0062_LiliShop-Localization-Architecture-Deep-Dive.md))*
* **Notifications & Communication:**
    * Subscribe to products to receive email notifications when their price drops 🔔.
    * Manage product subscriptions on a dedicated page with an easy unsubscribe option ⚙️.
    * Contact the website administrators directly through a "Contact Us" page ✉️.
* **Compliance:**
    * View the website's Cookie Policy and choose to accept or reject cookies 🍪.

---

## 🛡️ Security & Trust:

LiliShop went through a full, self-led, white-box security review — eight real vulnerabilities found and fixed, each documented in its own technical article.

* **Multi-Factor Authentication (MFA):** Mandatory TOTP-based two-factor login for admin accounts (compatible with Google Authenticator, Authy, etc.), with 10 single-use backup codes generated at setup in case the authenticator device is lost 🔐.
* **Brute-Force Protection:** IP-based rate limiting on login attempts plus automatic account lockout after repeated failed sign-ins — no unlimited password guessing 🚫.
* **Verified Payment Integrity:** Every price and quantity is re-validated against the database on the server before checkout, and orders are only ever confirmed via a cryptographically verified Stripe webhook — the app never trusts the browser's word alone 🔎.
* **Hardened Access Control:** Protections against IDOR (one user reaching another user's private data), a properly secured admin dashboard, a correctly scoped CORS policy, and browser-level security headers (CSP, HSTS, and more) 🛡️.
* **Verified Google Sign-In:** Google identity tokens are cryptographically signature-checked before being trusted, closing the door on forged login tokens.
* **Reduced Information Disclosure:** Sanitized logs, generic error messages, and a login flow that doesn't reveal which email addresses have an account.
* **Secrets Management:** No API keys, database passwords, or signing secrets are ever stored in source control — all are injected from Azure's environment configuration at deploy time.
* *(Full write-up: [LiliShop Security Series — 8 Vulnerabilities, 8 Fixes](https://github.com/jahanalem/LinkedIn2GitHub/blob/main/0061_LiliShop-Security-Series-Overview.md))*

---

## 🛠️ Admin Features:

* **Product & Catalog Management:**
    * Full CRUD (Create, Read, Update, Delete) capabilities for products ✨.
    * View, search (by name), and sort the product list using various data columns 📊.
    * Assign one or more images to each product, with images hosted on **Cloudinary** 🖼️.
    * Manage product brands and types with full CRUD functionality 🏷️.
    * Translate product, brand, and category names into any supported language from a dedicated translations UI 🌍.
* **User & Access Management:**
    * View a list of all registered users, with search (by name) and sort functionalities 👥.
    * View a list of users subscribed to product price drop notifications 🧐.
    * Fine-grained, five-tier role-based access control (**SuperAdmin, Administrator, DiscountManager, AdminPanelViewer, Standard**), letting the owner grant full or narrowly scoped admin privileges to other users 🛡️.
* **Discount System:**
    * **Single Product Discounts:** Apply time-limited discounts to individual products. The discounted price is automatically displayed during the promotional period and reverts to the original price upon expiration ⏳.
    * **Group Discounts:** A sophisticated system for defining discounts applicable to specific **product brands** or **product types** within defined timeframes, managed via an intuitive admin interface.
    * **Multi-Campaign Engine:** Multiple discount campaigns can run simultaneously; the system automatically resolves and displays the best price for each product and gracefully falls back to the next-best active promotion as campaigns expire.
        * *Priority Note:* Single-product discounts always take precedence over group discounts.
        * *Future Enhancement:* Size-based and per-product conditions within group discounts are planned for future development.
* **Content & Communication Management:**
    * Integrate the [**Printess Editor**](https://github.com/jahanalem/LinkedIn2GitHub/blob/main/0022_LiliShop_PrintessEditor_Integration_Guide.md) within the admin panel, allowing for the export of designs as PDF or image files 🎨, with real-time render-status updates powered by **SignalR** while a design is being generated ⚡.
    * View and manage messages received from users via the "Contact Us" page 💬.

---

## 🧪 Quality & Testing:

* Automated end-to-end tests with **Cypress**, covering core flows like registration and login.
* A growing **xUnit** unit test suite covering backend controllers and services.

---

## 💻 Technical Details:

* **Backend Framework:** .NET 10
* **Frontend Framework:** Angular 22
* **Programming Languages:** C#, TypeScript
* **Database:** Microsoft SQL Server with Entity Framework Core for data access 💾.
* **Payment Processing:** **Stripe** for handling online payments, with 3D Secure/SCA support 💸.
* **Caching:** Hybrid caching strategy utilizing **Redis** for performance optimization ⚡.
* **Background Processing:** **Hangfire** for managing background jobs (e.g., email notifications, discount expiration) 🔄.
* **Real-Time Communication:** **SignalR** for pushing live status updates (e.g., the Printess design pipeline) to connected clients.
* **Email Service:** **SendGrid** for transactional email delivery, sent in the recipient's chosen language 📧.
* **Cloud Services:** **Cloudinary** for image storage and management ☁️, hosted on **Azure**.
* **Localization:** 11 languages, including full RTL support, spanning UI, emails, API error messages, and admin-editable business data.
* **[Architecture](https://github.com/jahanalem/LinkedIn2GitHub/blob/main/0026_Refactoring-LiliShop-with-Clean-Architecture.md):** Clean Architecture (Domain, Application, Infrastructure, API) 🏗️.
* **[Security](https://github.com/jahanalem/LinkedIn2GitHub/blob/main/0061_LiliShop-Security-Series-Overview.md):** Self-led white-box security review across 8 OWASP-aligned categories 🛡️.

---

## 🛠️ Tech Stack Summary:

.NET 10, Angular 22, C#, TypeScript, Entity Framework Core, Microsoft SQL Server, **Stripe**, Redis, Hangfire, SignalR, SendGrid, Cloudinary.

---

## 🌐 Website URL:

[https://lilishop-bwdfb5azanh0cfa8.germanywestcentral-01.azurewebsites.net/shop](https://lilishop-bwdfb5azanh0cfa8.germanywestcentral-01.azurewebsites.net/shop)

## License

This project is licensed under the LiliShop Custom License v1.0 - see the [LICENSE.md](https://github.com/jahanalem/LiliShop-frontend-angular/blob/main/LICENSE.md) file for details.
