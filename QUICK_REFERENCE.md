# Developer Quick Reference - CNI Lost & Found System

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `PROJECT_OVERVIEW.md` | Complete system overview, features, and architecture |
| `DEVELOPMENT_ROADMAP.md` | Prioritized tasks for Phase 2 and beyond |
| `PHASE1_SUMMARY.md` | What was completed in Phase 1 with validation |
| This file | Quick reference for common tasks |

---

## 🔑 Key Files & Their Purposes

### Authentication & Authorization
- `src/context/AuthContext.tsx` - User login, permissions, session management
- `src/types/index.ts` - Type definitions including User, PermissionMap, UserRole

### Data Management
- `src/context/DataContext.tsx` - All business logic, CRUD operations, master data
- `src/types/index.ts` - Data type definitions (LostReport, FoundReport, etc.)

### Forms
- `src/pages/LostReport/LostReportForm.tsx` - Multi-step form for lost items
- `src/pages/FoundReport/FoundReportForm.tsx` - Multi-step form for found items
- `src/utils/validations.ts` - Reusable validation functions

### Pages
- `src/pages/Dashboard.tsx` - Main dashboard
- `src/pages/LostReport/LostReportList.tsx` - Lost items list
- `src/pages/FoundReport/FoundReportList.tsx` - Found items list
- `src/pages/SearchMatch/SearchMatch.tsx` - Search and match functionality
- `src/pages/PropertyManagement/PropertyList.tsx` - Stored items
- `src/pages/Reports/Reports.tsx` - Analytics and charts
- `src/pages/Admin/Admin.tsx` - Admin panel (users, master data, settings)

### Components
- `src/components/layout/Navbar.tsx` - Top navigation
- `src/components/layout/Sidebar.tsx` - Side navigation
- `src/components/layout/PageWrapper.tsx` - Page container with title/actions
- `src/components/shared/ToastContainer.tsx` - Toast notifications
- `src/components/ui/Modal.tsx` - Modal dialog
- `src/components/ui/PhotoUpload.tsx` - Photo uploader
- `src/components/ui/StatusBadge.tsx` - Status display

---

## 🔐 Test Accounts

```
Admin User:
- Username: admin
- Password: admin123
- Access: All features including admin panel

Staff User:
- Username: staff01
- Password: staff123
- Access: All core features (create reports, search, view)

Viewer User:
- Username: viewer01
- Password: view123
- Access: Read-only (no report creation)
```

---

## 📝 Common Tasks

### Add Validation to a Form Field

```typescript
import { formValidations } from '../../utils/validations';

// For email
<input
  {...register('email', formValidations.email)}
  type="email"
  placeholder="email@example.com"
/>

// For Thai phone
<input
  {...register('phone', formValidations.phoneThai)}
  placeholder="0XX-XXX-XXXX"
/>

// For required field
<input
  {...register('name', { required: 'กรุณากรอกชื่อ' })}
  placeholder="ชื่อ-นามสกุล"
/>
```

### Add a Toast Notification

```typescript
import { useData } from '../../context/DataContext';

function MyComponent() {
  const { addToast } = useData();

  const handleSuccess = () => {
    addToast({
      type: 'success',
      title: 'สำเร็จ',
      message: 'บันทึกข้อมูลเรียบร้อยแล้ว'
    });
  };

  const handleError = () => {
    addToast({
      type: 'error',
      title: 'เกิดข้อผิดพลาด',
      message: 'กรุณาลองใหม่อีกครั้ง'
    });
  };

  return <>...;</
}
```

### Add Audit Log Entry

```typescript
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

function MyComponent() {
  const { user } = useAuth();
  const { addAuditLog } = useData();

  const handleAction = () => {
    // Do something...

    // Log the action
    addAuditLog({
      userId: user?.id ?? '',
      username: user?.username ?? '',
      action: 'CREATE', // or UPDATE, DELETE, SEARCH, etc.
      module: 'My Module',
      detail: 'Description of what was done',
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100' // Replace with actual IP
    });
  };

  return <>...;</
}
```

### Create a New Page with Permission Guard

```typescript
// 1. Add route in App.tsx
<Route element={<PermGuard perm="your_permission" />}>
  <Route path="/your-page" element={<YourPage />} />
</Route>

// 2. Create your page component
import PageWrapper from '../../components/layout/PageWrapper';

export default function YourPage() {
  return (
    <PageWrapper
      title="صفحتك"
      subtitle="وصف صفحتك"
      actions={<button className="btn-primary">إجراء</button>}
    >
      {/* Your content */}
    </PageWrapper>
  );
}

// 3. Add permission to PermissionMap in types/index.ts
export interface PermissionMap {
  lost_report: boolean;
  found_report: boolean;
  search_match: boolean;
  property_management: boolean;
  reports: boolean;
  admin: boolean;
  your_permission: boolean; // Add here
}
```

### Working with Master Data

```typescript
import { useData } from '../../context/DataContext';

function MyComponent() {
  const { masterData } = useData();

  // Access categories
  const categories = masterData.categories;

  // Access areas
  const areas = masterData.areas;

  // Access storage locations
  const storageLocations = masterData.storageLocations;

  // Add a new category
  const { addCategory } = useData();
  addCategory({
    id: 'c99',
    name: 'ประเภทใหม่',
    nameEn: 'New Category',
    retentionDays: 30,
    icon: '📦'
  });

  return <>...;</
}
```

---

## 🎯 Common Patterns

### Multi-Step Form Pattern

```typescript
import { useForm } from 'react-hook-form';

const STEPS = ['Step 1', 'Step 2', 'Step 3'];

export default function MyForm() {
  const [step, setStep] = useState(0);
  const { register, handleSubmit, formState: { errors }, trigger } = useForm();

  const STEP_FIELDS = [
    ['field1', 'field2'],
    ['field3'],
    ['field4', 'field5']
  ];

  const nextStep = async () => {
    const ok = await trigger(STEP_FIELDS[step]);
    if (ok) setStep(s => s + 1);
  };

  const onSubmit = (data) => {
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {step === 0 && <div>{/* Step 1 fields */}</div>}
      {step === 1 && <div>{/* Step 2 fields */}</div>}
      {step === 2 && <div>{/* Step 3 fields */}</div>}

      <button onClick={nextStep}>Next</button>
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Data List with Status Badge Pattern

```typescript
import StatusBadge from '../../components/ui/StatusBadge';

export default function ItemList() {
  const { items } = useData();

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.id} className="card p-4 flex items-center justify-between">
          <div>
            <div className="font-semibold">{item.name}</div>
            <div className="text-sm text-gray-500">{item.description}</div>
          </div>
          <StatusBadge status={item.status} />
        </div>
      ))}
    </div>
  );
}
```

---

## 🔧 Tailwind CSS Classes Used

### Common Button Classes
```html
<!-- Primary button -->
<button class="btn-primary">Primary</button>

<!-- Secondary button -->
<button class="btn-secondary">Secondary</button>

<!-- Card -->
<div class="card p-6">Content</div>

<!-- Form input -->
<input class="form-input" />

<!-- Form label -->
<label class="form-label">Label</label>
```

---

## 🎨 Color Scheme

- **Primary Color:** `primary` (brand color)
- **Success:** Green (#10b981)
- **Error:** Red (#ef4444)
- **Warning:** Amber (#f59e0b)
- **Info:** Blue (#3b82f6)
- **Background:** Gray-50
- **Text:** Gray-900 (dark), Gray-600 (medium), Gray-400 (light)

---

## 📊 Data Flow

```
User Input (Form)
    ↓
Validation (React Hook Form + validations.ts)
    ↓
useData() Context
    ↓
Update State & Mock Data
    ↓
Audit Log (addAuditLog)
    ↓
Toast Notification (addToast)
    ↓
UI Update
```

---

## ⚠️ Important Notes

1. **All data is in memory** - Data is lost on page refresh. For production, integrate with backend API.
2. **User data persists** - Authentication token is stored in localStorage.
3. **Mock data included** - Replace with API calls when backend is ready.
4. **Timestamps are ISO format** - Ready for server-side processing.
5. **Thai language** - All UI text is in Thai; English translations in names.
6. **Responsive design** - Mobile-first approach with Tailwind CSS.

---

## 🚀 To Run the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

---

## 📞 API Integration Ready

When you're ready to integrate with a backend, replace the mock data in:

1. **Authentication** - Replace mock users with API calls in `AuthContext.tsx`
2. **Data Operations** - Replace mock operations with API calls in `DataContext.tsx`
3. **Master Data** - Load from API instead of hardcoded constants
4. **Audit Logs** - Send to backend API for persistence

All type definitions are already prepared for this.

---

## 🔗 Related Documentation

- [Project Overview](./PROJECT_OVERVIEW.md)
- [Development Roadmap](./DEVELOPMENT_ROADMAP.md)
- [Phase 1 Summary](./PHASE1_SUMMARY.md)

