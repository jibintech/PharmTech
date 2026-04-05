# PharmTech 💊

PharmTech is a comprehensive, full-stack Pharmacy Management and Billing System. Designed with a modern, responsive user interface, it streamlines pharmacy operations, from inventory management to prescription processing and billing. The application is localized for the Indian market, featuring integrated GST calculations, Rupee formatting, and payment Selection support.

## 🚀 Key Features

- **Advanced Billing Interface**: A high-density, optimized point-of-sale (POS) cart system allowing continuous addition of medicines without vertical scrolling.
- **Smart Prescription Scanning**: Integrated OCR (Optical Character Recognition) via OCR.space supporting automatic text extraction from scanned prescription images (JPG/JPEG).
- **Inventory Management**: Seamless medicine inventory tracking with built-in duplicate detection and smooth data seeding.
- **PDF Receipt Generation**: Generates professional PDF invoices to act as a reliable fallback for thermal printers.
- **Localized for India**: Native support for GST brackets, Indian Rupee (₹), and UPI payment modes.
- **Admin Console**: A dedicated management dashboard with secure authentication and cohesive modern "green-themed" UI components.

## 🛠️ Technology Stack

**Frontend:**
- React (bootstrapped with Vite)
- Modern UI/UX implementation with focused, consistent themes

**Backend:**
- Spring Boot (Java)
- RESTful APIs for modular service integration
- JWT Token-based Authentication

**Database:**
- MySQL (with dedicated database credentials and automated data seeding capabilities)

## 📦 Project Structure

- `/frontend` - Contains the React/Vite web application and user interfaces.
- `/backend` - Contains the Spring Boot server, API logic, configuration, and security implementations.
- `/database` - Contains SQL schemas and any necessary data seeding scripts.
