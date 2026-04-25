# CNI Lost & Found Management System

## 📋 Project Overview

This is a **Lost & Found Management System** built for ClickNext Innovation (CNI). It's a web application that helps organizations manage lost and found items, track their movement through the facility, and facilitate return to rightful owners.

**Tech Stack:**
- **Frontend Framework:** React 18 + TypeScript
- **Routing:** React Router v6
- **UI Framework:** Tailwind CSS + Lucide React icons
- **Forms:** React Hook Form
- **Charting:** Recharts
- **Build Tool:** Vite
- **Date Utilities:** date-fns
- **Utilities:** clsx

---

## 🎯 Core Features

### 1. **Authentication & Authorization**
- Role-based access control (Admin, Staff, Viewer)
- User management system
- Session timeout (configurable, default 30 minutes)
- Mock authentication with test accounts
- Permission-based route guards

**Test Accounts:**
| Username | Password | Role | Permissions |
|----------|----------|------|------------|
| admin | admin123 | Admin | All features including admin panel |
| staff01 | staff123 | Staff | All core features |
| viewer01 | view123 | Viewer | Read-only, no report creation |

### 2. **Lost Report Management**
- Create lost item reports with detailed information
- Track lost items with:
  - Tracking number (auto-generated: LST-YYYYMMDD-XXXX)
  - Category, color, size, quantity
  - Lost date/time range and area location
  - Reporter information (name, nationality, phone, email)
  - Status tracking (open → matched → closed)
  - Photo uploads

### 3. **Found Report Management**
- Register found items with:
  - Found code (auto-generated: FND-YYYYMMDD-XXXX)
  - RFID tag tracking
  - Category, color, size, quantity
  - Finder information
  - Storage location assignment
  - Automatic expiration based on item category (1-365 days)
  - Status tracking (stored → matched → returned/expired)
  - Photo uploads

### 4. **Search & Match System**
- Automatically suggest matches based on:
  - Item category
  - Color
  - Location where item was found/lost
- Manual matching capability
- Handover form for returning items to owners

### 5. **Property Management**
- Track all stored items
- Monitor storage locations and capacity
- View expiration dates
- Status visibility (stored, matched, returned, expired)

### 6. **Reports & Analytics**
- Dashboard with key metrics
- Charting capabilities
- Audit logging

### 7. **Admin Panel**
- User management (create, edit, delete users)
- System settings configuration
- Audit log viewing
- Master data management (categories, areas, storage locations)

---

## 📁 Project Structure

```
lost-found-app/
├── src/
│   ├── App.tsx                 # Main app with routing & guards
│   ├── main.tsx                # Entry point
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx      # Top navigation bar
│   │   │   ├── Sidebar.tsx     # Side navigation
│   │   │   └── PageWrapper.tsx # Reusable page container with title/actions
│   │   ├── shared/
│   │   │   └── ToastContainer.tsx # Toast notifications
│   │   └── ui/
│   │       ├── Modal.tsx           # Reusable modal component
│   │       ├── PhotoUpload.tsx     # Photo upload UI
│   │       └── StatusBadge.tsx     # Status display badges
│   ├── context/
│   │   ├── AuthContext.tsx     # Authentication & user management
│   │   └── DataContext.tsx     # Data state & operations
│   ├── pages/
│   │   ├── Dashboard.tsx       # Overview dashboard
│   │   ├── Login.tsx           # Login page
│   │   ├── Admin/
│   │   │   └── Admin.tsx       # Admin panel
│   │   ├── FoundReport/
│   │   │   ├── FoundReportForm.tsx
│   │   │   ├── FoundReportList.tsx
│   │   │   └── HandoverForm.tsx
│   │   ├── LostReport/
│   │   │   ├── LostReportForm.tsx
│   │   │   └── LostReportList.tsx
│   │   ├── PropertyManagement/
│   │   │   └── PropertyList.tsx
│   │   ├── Reports/
│   │   │   └── Reports.tsx
│   │   └── SearchMatch/
│   │       └── SearchMatch.tsx
│   ├── styles/
│   │   └── globals.css         # Global styles
│   └── types/
│       └── index.ts            # TypeScript type definitions
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

---

## 🔐 Authentication & Authorization

### Roles & Permissions

```typescript
// Permission Map
{
  lost_report: boolean;      // Create/view lost reports
  found_report: boolean;     // Create/view found reports
  search_match: boolean;     // Search and match reports
  property_management: boolean; // View stored properties
  reports: boolean;          // View reports & analytics
  admin: boolean;            // Admin panel access
}
```

### Route Protection
- `/login` - Public (no auth required)
- `/` - Protected (requires authentication)
- Feature routes like `/lost`, `/found`, `/search`, etc. - Permission-gated
- `/admin` - Admin only

---

## 📊 Data Models

### LostReport
```typescript
{
  id: string;
  trackingNo: string;           // LST-YYYYMMDD-XXXX
  categoryId: string;           // Property category
  color: string;
  size: string;
  qty: number;
  description: string;
  photos: string[];
  lostAreaId: string;
  lostAreaNote: string;
  lostDateFrom: string;
  lostDateTo: string;
  lostTimeFrom: string;
  lostTimeTo: string;
  reporter: Person;
  status: 'open' | 'matched' | 'closed';
  matchedFoundId?: string;      // When matched with a found item
  createdAt: string;
  createdBy: string;
}
```

### FoundReport
```typescript
{
  id: string;
  foundCode: string;            // FND-YYYYMMDD-XXXX
  rfidTag: string;
  categoryId: string;
  color: string;
  size: string;
  qty: number;
  description: string;
  photos: string[];
  foundAreaId: string;
  foundAreaNote: string;
  foundDate: string;
  foundTime: string;
  finder: Person;
  storageLocationId: string;
  status: 'stored' | 'matched' | 'returned' | 'expired' | 'pending_return';
  expiresAt: string;            // Auto-calculated from category retention days
  matchedLostId?: string;       // When matched with a lost report
  returnAppointment?: string;
  createdAt: string;
  createdBy: string;
}
```

### Master Data
- **PropertyCategory** - Types of items (Cards, Keys, Bags, Electronics, Food, Clothing, Jewelry, etc.)
- **Area** - Building locations (floors, zones, specific areas)
- **StorageLocation** - Where items are stored (cabinets, rooms, etc.)

---

## 🔄 Key Workflows

### 1. Lost Item Reporting
1. User fills lost report form with item details
2. System generates tracking number
3. Report goes to "open" status
4. System automatically suggests matches from found items

### 2. Found Item Registration
1. User fills found report form
2. System generates found code & RFID tag
3. Assigns storage location
4. Calculates expiration date based on category
5. Automatically suggests matches from lost reports

### 3. Matching & Return
1. Staff searches and matches lost ↔ found items
2. Updates status to "matched"
3. Schedules handover/return appointment
4. Generates handover form
5. Mark as "returned" after successful handover

### 4. Expiration Management
- Food items: 1 day retention
- Other items: 365 days retention
- Auto-expire items when retention period ends

---

## 🏪 Master Data

### Categories (with Thai names)
- 🪪 บัตร/เอกสาร (Cards/Documents) - 365 days
- 🔑 พวงกุญแจ (Keys) - 365 days
- 👜 กระเป๋า (Bags) - 365 days
- 📱 อุปกรณ์อิเล็กทรอนิกส์ (Electronics) - 365 days
- 🍱 อาหาร/เครื่องดื่ม (Food/Beverage) - 1 day
- 👔 เสื้อผ้า/แฟชั่น (Clothing) - 365 days
- 💍 เครื่องประดับ (Jewelry) - 365 days
- 📦 อื่นๆ (Others) - 365 days

### Areas
- Floors: 1, 2, 3, 4, B1, B2
- Specific locations like entrance, activity area, restrooms, food courts, cinema, parking, etc.

### Storage Locations
- Individual cabinets (A-01, A-02, B-01, etc.)
- Storage rooms
- Refrigerated storage (for food items)

---

## 🎨 UI Components

### Layout Components
- **Navbar** - Top navigation with user info and logout
- **Sidebar** - Navigation menu (toggleable on mobile)
- **PageWrapper** - Standard page container with title, subtitle, and action buttons

### UI Components
- **Modal** - Reusable modal dialog
- **PhotoUpload** - File upload interface
- **StatusBadge** - Visual status indicators
- **ToastContainer** - Notification system (success, error, warning, info)

---

## 🔄 State Management

### AuthContext
- Current user information
- Authentication status
- Login/logout functions
- User management (for admin)
- System settings
- Session timeout handling

### DataContext
- Lost reports list
- Found reports list
- Master data (categories, areas, storage locations)
- Audit logs
- Toast notifications
- CRUD operations for all entities
- Auto-matching logic

---

## 🔍 Key Features Deep Dive

### Auto-Matching Algorithm
When a new found item is registered, the system suggests matches based on:
1. Same category
2. Matching color
3. Same area where item was found/lost

### Session Management
- Monitors user activity (mouse, keyboard, touch, scroll)
- Auto-logout after configured timeout (default: 30 minutes)
- Resets timer on each user interaction

### Internationalization
- Thai language throughout the app
- Bilingual categories (Thai + English names)
- Date formatting with date-fns

---

## 🚀 Getting Started

### Development
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
npm run preview
```

### Test Accounts
- **Admin:** admin / admin123
- **Staff:** staff01 / staff123
- **Viewer:** viewer01 / view123

---

## 📝 Notes for Development

1. **Mock Data:** All data is stored in memory using React Context. For production, integrate with a backend API.
2. **Storage:** User data is persisted in localStorage for demonstration.
3. **Photo Uploads:** Currently UI-only, needs backend integration for actual file storage.
4. **RFID Tags:** Manually entered, could be integrated with actual RFID readers.
5. **Audit Logging:** Basic logging implemented, ready for database integration.

---

## 🎯 Future Enhancements

- Backend API integration (Express, Node.js, etc.)
- Real database (PostgreSQL, MongoDB, etc.)
- Photo storage and retrieval
- RFID reader integration
- Email notifications
- SMS notifications
- Advanced analytics
- Export reports (PDF, Excel)
- Multi-language support UI
- Mobile app

