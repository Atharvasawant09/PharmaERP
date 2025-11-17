# 🏥 PharmaERP - AI-Powered Pharmacy Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/Angular-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.io/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)

A full-stack enterprise pharmacy ERP system with AI-powered prescription analysis, inventory management, and sales tracking.

## 🌟 Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Manager, SalesAgent)
- Secure password hashing with bcrypt

### 📦 Inventory Management
- Product CRUD operations
- Real-time stock tracking
- Low stock alerts (< 50 units)
- Expiry date monitoring (90-day alerts)
- Batch number tracking

### 🛒 Sales Management
- Multi-item sales transactions
- Multiple payment methods (Cash, Card, UPI)
- Automatic stock deduction
- Customer management
- Sales history with filtering

### 🤖 AI-Powered Features ⭐
- **Prescription OCR** - Extract text from prescription images
- **Medicine Identification** - AI identifies medicines using Groq LLM
- **Alternative Suggestions** - Smart recommendations for out-of-stock items
- **Composition Matching** - Find generic equivalents

### 📊 Analytics & Reports
- Real-time dashboard with KPIs
- Weekly sales charts (Chart.js)
- Top-selling products analysis
- Date-range filtering
- CSV export
- **PDF invoice generation** 📄

### 💻 Technical Features
- Responsive UI (Bootstrap 5)
- RESTful API architecture
- Database transactions for data integrity
- Error handling & validation
- Professional PDF invoices

---

## 🏗️ Architecture

PharmaERP/
├── backend/ # Node.js + Express + TypeScript
│ ├── src/
│ │ ├── controllers/
│ │ ├── services/
│ │ ├── routes/
│ │ ├── middlewares/
│ │ ├── config/
│ │ └── models/
│ └── uploads/ # Prescription images
├── frontend/ # Angular 18
│ └── src/
│ ├── app/
│ │ ├── components/
│ │ ├── services/
│ │ ├── guards/
│ │ └── models/
│ └── environments/
└── database/ # MySQL Schema
└── schema.sql

text

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- Angular CLI 18
- Groq API Key (for AI features)

### 1. Clone Repository

git clone https://github.com/YOUR_USERNAME/PharmaERP.git
cd PharmaERP

text

### 2. Database Setup

Login to MySQL
mysql -u root -p

Create database and user
CREATE DATABASE PharmaERP;
CREATE USER 'pharma_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON PharmaERP.* TO 'pharma_user'@'localhost';
FLUSH PRIVILEGES;

Import schema
mysql -u pharma_user -p PharmaERP < database/schema.sql

text

### 3. Backend Setup

cd backend

Install dependencies
npm install

Create .env file
cp .env.example .env

Edit .env with your credentials:
DB_HOST=localhost
DB_USER=pharma_user
DB_PASSWORD=your_secure_password
DB_NAME=PharmaERP
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key
PORT=5000
Create uploads directory
mkdir -p uploads/prescriptions

Run development server
npm run dev

text

Backend will run on: `http://localhost:5000`

### 4. Frontend Setup

cd frontend

Install dependencies
npm install

Run development server
ng serve

text

Frontend will run on: `http://localhost:4200`

---

## 🔑 Environment Variables

### Backend (.env)

Database Configuration
DB_HOST=localhost
DB_USER=pharma_user
DB_PASSWORD=your_secure_password
DB_NAME=PharmaERP
DB_PORT=3306

JWT Configuration
JWT_SECRET=your_256_bit_secret_key
JWT_EXPIRES_IN=24h

Groq AI Configuration
GROQ_API_KEY=gsk_your_groq_api_key

Server Configuration
PORT=5000
NODE_ENV=development

text

⚠️ **NEVER commit the .env file to Git!**

---

## 👤 Default Users

After running schema.sql:

| Email | Password | Role |
|-------|----------|------|
| admin@pharma.com | admin123 | Admin |
| manager@pharma.com | manager123 | Manager |
| agent@pharma.com | agent123 | SalesAgent |

⚠️ **Change passwords in production!**

---

## 📸 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### AI Prescription Analysis
![AI Prescription](docs/screenshots/ai-prescription.png)

### Sales History
![Sales History](docs/screenshots/sales-history.png)

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MySQL 8.0
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **AI/ML:** Groq SDK, Tesseract.js (OCR)
- **File Upload:** Multer
- **Image Processing:** Sharp

### Frontend
- **Framework:** Angular 18
- **UI Library:** Bootstrap 5
- **Icons:** Font Awesome 6
- **Charts:** Chart.js
- **PDF Generation:** jsPDF
- **HTTP Client:** Angular HttpClient
- **Notifications:** ngx-toastr

### DevOps
- **Version Control:** Git
- **Package Manager:** npm
- **Build Tool:** Webpack (Angular CLI)
- **Linting:** ESLint
- **Formatting:** Prettier

---

## 📁 Project Structure

PharmaERP/
├── backend/
│ ├── src/
│ │ ├── controllers/
│ │ │ ├── auth.controller.ts
│ │ │ ├── customer.controller.ts
│ │ │ ├── product.controller.ts
│ │ │ ├── sales.controller.ts
│ │ │ └── prescription.controller.ts
│ │ ├── services/
│ │ │ └── aiPrescription.service.ts
│ │ ├── middlewares/
│ │ │ └── auth.middleware.ts
│ │ ├── routes/
│ │ ├── config/
│ │ │ ├── database.ts
│ │ │ └── upload.ts
│ │ └── server.ts
│ ├── uploads/
│ ├── .env.example
│ ├── .gitignore
│ ├── package.json
│ └── tsconfig.json
├── frontend/
│ ├── src/
│ │ ├── app/
│ │ │ ├── components/
│ │ │ │ ├── auth/
│ │ │ │ ├── dashboard/
│ │ │ │ ├── products/
│ │ │ │ ├── sales/
│ │ │ │ └── prescription/
│ │ │ ├── services/
│ │ │ ├── guards/
│ │ │ ├── models/
│ │ │ └── app.routes.ts
│ │ └── environments/
│ ├── .gitignore
│ ├── package.json
│ └── angular.json
├── database/
│ └── schema.sql
├── docs/
│ └── screenshots/
├── .gitignore
├── README.md
└── LICENSE

text

---

## 🧪 Testing

### Backend API Testing

Using curl
curl -X POST http://localhost:5000/api/auth/login
-H "Content-Type: application/json"
-d '{"email":"admin@pharma.com","password":"admin123"}'

Using Postman
Import collection from: docs/postman_collection.json

text

### Frontend Testing

cd frontend
ng test

text

---

## 📊 Database Schema

### Tables
- **Users** - User authentication & roles
- **Customers** - Customer information
- **Products** - Medicine inventory
- **SalesHeader** - Sale transactions
- **SalesLine** - Sale line items

See full schema: [database/schema.sql](database/schema.sql)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---


## 👨‍💻 Author

**Atharva**
- GitHub: [@YOUR_USERNAME](https://github.com/Atharvasawant09)

---

## 🙏 Acknowledgments

- [Groq](https://groq.com/) - Fast AI inference
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR engine
- [Chart.js](https://www.chartjs.org/) - Beautiful charts
- [Bootstrap](https://getbootstrap.com/) - UI framework
- [Font Awesome](https://fontawesome.com/) - Icons

---

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@pharmaerp.com

---

## 🗺️ Roadmap

- [ ] Multi-branch support
- [ ] SMS notifications
- [ ] Barcode scanning
- [ ] Supplier management
- [ ] Purchase orders
- [ ] Batch expiry reminders
- [ ] Mobile app (React Native)

---

**⭐ If you find this project useful, please give it a star!**

5. CREATE .env.example FILES
backend/.env.example:
text
# Database Configuration
DB_HOST=localhost
DB_USER=pharma_user
DB_PASSWORD=your_password_here
DB_NAME=PharmaERP
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_256_bit_secret_key_here
JWT_EXPIRES_IN=24h

# Groq AI Configuration (Get from: https://console.groq.com/)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
6. CREATE UPLOAD DIRECTORY PLACEHOLDERS
bash
# In backend folder
mkdir -p uploads/prescriptions

# Create .gitkeep files to preserve directory structure
echo "" > uploads/.gitkeep
echo "" > uploads/prescriptions/.gitkeep
