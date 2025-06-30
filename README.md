I have single-handedly developed this project from scratch. Welcome to LiliShop! 🛍️

**Project Name:** LiliShop

**Core Technologies:** .NET 9, Angular 20

LiliShop is a modern e-commerce platform developed with .NET 9 and Angular 20, designed to provide a seamless shopping experience for users and robust management capabilities for administrators.

---

## 🚀 User Features:

* **Product Discovery:**
    * Browse and view a comprehensive product catalog 📖.
    * Filter products by brand, type, and size  फिल्टर.
    * Isolate products with active discounts 💰.
    * Search for specific products by name 🔍.
    * Sort products by price (ascending/descending) and alphabetically ⇅.
* **Purchasing & Account Management:**
    * Securely purchase products using **Stripe** (supporting payment methods like Mastercard) 💳.
    * Access a detailed history of completed orders 📜.
    * Register for an account using a traditional username/password combination or via Google social login 👤.
    * Confirm registration through an email verification link ✅.
    * Utilize a password recovery feature for forgotten passwords 🔑.
    * Log out from all active sessions on different devices for enhanced security 🔒.
* **Notifications & Communication:**
    * Subscribe to products to receive email notifications when their price drops 🔔.
    * Manage product subscriptions on a dedicated page with an easy unsubscribe option ⚙️.
    * Contact the website administrators directly through a "Contact Us" page ✉️.
* **Compliance:**
    * View the website's Cookie Policy and choose to accept or reject cookies 🍪.

---

## 🛠️ Admin Features:

* **Product & Catalog Management:**
    * Full CRUD (Create, Read, Update, Delete) capabilities for products ✨.
    * View, search (by name), and sort the product list using various data columns 📊.
    * Assign one or more images to each product, with images hosted on **Cloudinary** 🖼️.
    * Manage product brands and types with full CRUD functionality 🏷️.
* **User & Access Management:**
    * View a list of all registered users, with search (by name) and sort functionalities 👥.
    * View a list of users subscribed to product price drop notifications 🧐.
    * Grant varying access permissions to users, including the ability to create other administrators with full or limited privileges 🛡️.
* **Discount System:**
    * **Single Product Discounts:** Apply time-limited discounts to individual products. The discounted price is automatically displayed during the promotional period and reverts to the original price upon expiration ⏳.
    * **Group Discounts:** A sophisticated system for defining discounts applicable to specific **product brands** or **product types** within defined timeframes. These are managed via an intuitive admin interface.
        * *Priority Note:* Single-product discounts take precedence over group discounts.
        * *Future Enhancements:* Size-based and per-product conditions within group discounts, along with a unified single and group discount system, are planned for future development.
* **Content & Communication Management:**
    * Integrate the [**Printess Editor**](https://github.com/jahanalem/LinkedIn2GitHub/blob/main/0022_LiliShop_PrintessEditor_Integration_Guide.md) within the admin panel, allowing for the export of designs as PDF or image files 🎨.
    * View and manage messages received from users via the "Contact Us" page 💬.

---

## 💻 Technical Details:

* **Backend Framework:** .NET 9
* **Frontend Framework:** Angular 20
* **Programming Languages:** C#, TypeScript
* **Database:** Microsoft SQL Server with Entity Framework Core for data access 💾.
* **Payment Processing:** **Stripe** for handling online payments 💸.
* **Caching:** Hybrid caching strategy utilizing **Redis** for performance optimization ⚡.
* **Background Processing:** **Hangfire** for managing background jobs (e.g., email notifications, discount expiration) 🔄.
* **Email Service:** **SendGrid** for transactional email delivery 📧.
* **Cloud Services:** **Cloudinary** for image storage and management ☁️.
* **[Architecture](https://github.com/jahanalem/LinkedIn2GitHub/blob/main/0026_Refactoring-LiliShop-with-Clean-Architecture.md):** Clean Architecture (Domain, Application, Infrastructure, API) 🏗️.

---

## 🛠️ Tech Stack Summary:

.NET 9, Angular 20, C#, TypeScript, Entity Framework Core, Microsoft SQL Server, **Stripe**, Redis, Hangfire, SendGrid, Cloudinary.

---

## 🌐 Website URL:

[https://lilishop-bwdfb5azanh0cfa8.germanywestcentral-01.azurewebsites.net/shop](https://lilishop-bwdfb5azanh0cfa8.germanywestcentral-01.azurewebsites.net/shop)

## License

This project is licensed under the LiliShop Custom License v1.0 - see the [LICENSE.md](https://github.com/jahanalem/LiliShop-frontend-angular/blob/main/LICENSE.md) file for details.

