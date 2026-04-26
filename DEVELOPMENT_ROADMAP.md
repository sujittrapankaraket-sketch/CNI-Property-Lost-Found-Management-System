# Development Roadmap - CNI Lost & Found System

## ✅ Completed Features

- [x] Authentication & Authorization (Role-based access)
- [x] Lost Report Form (Multi-step with validation)
- [x] Found Report Form (Multi-step with validation, email+phone required)
- [x] Lost Report List & Management
- [x] Found Report List & Management
- [x] Search & Match System (Auto-matching + RFID search)
- [x] **Search date range filter** (date-from / date-to บน dual panel)
- [x] Property Management Dashboard
- [x] Reports & Analytics — รายวัน/รายเดือน/รายปี + Date range filter
- [x] Admin Panel (User, **Groups**, Master Data, Audit Logs, Settings)
- [x] **User Groups CRUD + Group Permissions** (TOR 4.9.1.2, 4.9.1.3)
- [x] **Audit Log date range filter** (auditDateFrom / auditDateTo)
- [x] Toast Notifications System
- [x] Session Timeout Management (configurable)
- [x] Audit Logging (full Supabase sync)
- [x] Supabase backend integration (all modules)
- [x] Handover Form (dual signature — Finder + Recipient)
- [x] ClaimResponse public page (ไม่ต้อง login)
- [x] Validation utility library (`src/utils/validations.ts`)

---

## 🔧 Recent Updates (Phase 1–2 completed)

### Email & Validation
- ✅ Email field **REQUIRED** บน Lost Report + Found Report
- ✅ Phone field **REQUIRED** (Thai format: 0XX-XXX-XXXX) บน Found Report
- ✅ Validation utility: `src/utils/validations.ts`

### Reports Enhancement
- ✅ Period selector: รายวัน / รายเดือน / รายปี
- ✅ Date range filter บนทุก tab รวมถึง User Activity

### Admin Enhancement
- ✅ Groups tab: CRUD กลุ่มผู้ใช้ + assign permissions (TOR 4.9.1.2–4.9.1.3)
- ✅ Audit Log date range filter (calendar inputs)

### Search Enhancement
- ✅ Date range filter บน SearchMatch page

---

## 🚀 Priority Development Tasks (Phase 2 — อัปเดต 2026-04-26)

### High Priority (Critical — TOR Gap)

#### 1. PDF Export ใบส่งมอบ (TOR 4.5.7) 🔴
- [ ] Generate handover receipt PDF จาก HandoverForm
- [ ] ใส่ลายเซ็นทั้ง 2 ฝ่าย + ข้อมูลครบ
- [ ] ปุ่ม "พิมพ์" / "บันทึก PDF"

**Recommended packages:** `jspdf`, `html2canvas`  
**File to modify:** `src/pages/FoundReport/HandoverForm.tsx`

---

#### 2. Email ส่งจริงอัตโนมัติ (TOR 4.5.7-8) 🔴
- [ ] Supabase Edge Function สำหรับส่งอีเมล
- [ ] Template: แจ้งพบของตรงกัน + link ClaimResponse
- [ ] Template: ยืนยันรับของคืน + แนบ PDF ใบส่งมอบ
- [ ] ส่งอัตโนมัติเมื่อ match / return

**Note:** Gmail mailto ทำงานอยู่แล้ว (`src/utils/gmail.ts`) แต่ต้องการ SMTP จริง

---

### Medium Priority (TOR & UX)

#### 3. Mobile Responsiveness (TOR 4.3) 🟡
- [ ] Test + optimize ทุก page บน mobile
- [ ] Touch-friendly form inputs (multi-step forms)
- [ ] Responsive tables → card layout บน mobile

---

#### 4. Password Hashing (Security) 🟡
- [ ] Hash password ด้วย bcrypt ก่อนบันทึก Supabase
- [ ] Verify hash เมื่อ login

**Note:** ปัจจุบัน plaintext ใน Supabase

---

### Low Priority (Nice to Have)

#### 5. Excel Export รายงาน 🟢
- [ ] Export Lost/Found Reports → Excel
- [ ] Export Audit Logs → Excel

**Recommended package:** `xlsx`

---

#### 6. RFID Hardware Integration 🟢
- [ ] เชื่อมต่อ RFID reader จริง (Web Serial API หรือ WebSocket)
- [ ] Auto-populate rfidTag เมื่อ scan
- [ ] ปัจจุบัน: simulation เท่านั้น (`src/components/ui/RFIDScanner.tsx`)

---

#### 7. Performance & UX 🟢
- [ ] Pagination บน report lists
- [ ] Lazy loading รูปภาพ
- [ ] Loading skeleton states

---

## 📊 Phase 2 Priority Matrix (อัปเดต 2026-04-26)

```
          │ Impact
          │  High
──────────┼──────────────────────
Effort:   │  PDF Export │ Email
Low–Med   │  ใบส่งมอบ  │ SMTP จริง
          │             │
──────────┼──────────────────────
          │ RFID HW     │ Mobile
High      │ Integration │ Optimize
          │             │
```

**Suggested Order of Implementation:**
1. PDF Export ใบส่งมอบ (TOR critical gap)
2. Email ส่งจริง via Supabase Edge Function
3. Mobile responsive improvement
4. Password hashing (security)
5. Excel export รายงาน
6. RFID hardware integration

---

## 🔗 Integration Points Ready

The system is already prepared for:
- ✅ Backend API integration (DataContext can be replaced with API calls)
- ✅ Database integration (all data structures are defined)
- ✅ Authentication tokens (prepared for JWT)
- ✅ Error handling (toast system ready)
- ✅ Audit logging (structure ready for database)

---

## 📝 Notes

- All timestamps are already in ISO format (ready for server)
- User data is validated and typed
- Error messages are in Thai
- UI components are reusable and modular
- Mock data can be easily replaced with API calls

---

## 🎯 Success Metrics

Track these to measure progress:
- ✓ All forms validate email correctly
- ✓ Export features working for all report types
- ✓ Email notifications sent successfully
- ✓ Page load time < 2 seconds
- ✓ Mobile responsiveness score > 90
- ✓ Audit logs capturing all actions
- ✓ Zero console errors in production build

