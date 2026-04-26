# CNI Lost & Found — Workflow & Data Flow
### เปรียบเทียบ TOR (ข้อกำหนดขอบเขตงาน) vs การทำงานปัจจุบัน

> **TOR อ้างอิง:** ข้อกำหนดขอบเขตงาน จ้างพัฒนาระบบทรัพย์สินที่ถูกพบและสูญหาย ของคลิกเน็กซ์ อินโนเวชั่น V.1.0 (24/04/2569)  
> ระยะเวลาดำเนินงาน: **240 วัน**

| สัญลักษณ์ | ความหมาย |
|-----------|----------|
| ✅ | Implemented — ทำงานได้ครบตาม TOR |
| ⚠️ | Partial — ทำได้บางส่วน |
| ❌ | Not Yet — ยังไม่ได้พัฒนา |

---

## สรุปภาพรวม TOR vs ปัจจุบัน

```mermaid
pie title สถานะ Feature ตาม TOR (จำนวนข้อกำหนด)
    "✅ Implemented" : 28
    "⚠️ Partial" : 7
    "❌ Not Yet" : 6
```

---

## 1. System Architecture

### As-Is (TOR กำหนด — ข้อ 4.3)
> ระบบต้องเป็น **Web-Based Application** ใช้งานผ่าน Web Browser แบบ **Responsive Design**  
> จากคอมพิวเตอร์ Tablet และ Mobile ได้เป็นอย่างน้อย

### To-Be (ปัจจุบัน)

```mermaid
graph TB
    subgraph Client["🖥️ Browser — React 18 + Vite + TailwindCSS"]
        UI["UI Layer\nResponsive Design ✅"]
        CTX["State Layer\nDataContext / AuthContext"]
        SVC["Service Layer\ndataStore.ts"]
    end

    subgraph Storage["💾 Persistence"]
        LS["localStorage\n(fallback offline) ✅"]
        SB["Supabase PostgreSQL\n+ RLS Policies ✅"]
    end

    subgraph Ext["🌐 External"]
        GMAIL["Gmail mailto\n⚠️ ไม่ส่งอัตโนมัติ"]
        RFID["RFID Reader\n⚠️ Simulation เท่านั้น"]
    end

    UI --> CTX --> SVC
    SVC -->|"canUseRemoteDataStore"| SB
    SVC -->|"fallback"| LS
    CTX -.-> GMAIL
    UI -.-> RFID
```

| ข้อ TOR | ข้อกำหนด | สถานะ | หมายเหตุ |
|---------|----------|-------|---------|
| 4.3 | Web-Based Application | ✅ | Vite + React 18 |
| 4.3 | ใช้ผ่าน Web Browser | ✅ | |
| 4.3 | Responsive Design (PC/Tablet/Mobile) | ⚠️ | PC ดี, Mobile ยังไม่ optimize เต็มที่ |

---

## 2. ฟังก์ชันรับแจ้งทรัพย์สินสูญหาย — Lost Report (ข้อ 4.4)

### As-Is (TOR กำหนด)

```mermaid
flowchart LR
    subgraph TOR44["TOR ข้อ 4.4"]
        T1["4.4.1 ประเภท/บรรจุภัณฑ์\n+ สี ขนาด จำนวน รูปถ่าย"]
        T2["4.4.2 บริเวณที่สูญหาย\n+ รายละเอียดเพิ่มเติม"]
        T3["4.4.3 ช่วงวันที่\nช่วงเวลา"]
        T4["4.4.4 ข้อมูลผู้แจ้ง\nชื่อ สัญชาติ โทร อีเมล"]
        T5["4.4.5 หมายเลขการแจ้ง\nอัตโนมัติ"]
    end
```

### To-Be (ปัจจุบัน — `/lost/new`)

```mermaid
flowchart TD
    A([Staff เปิด /lost/new]) --> B

    subgraph FORM["LostReportForm — 1 หน้า"]
        B["ประเภทสิ่งของ / สี / ขนาด\nจำนวน / คำอธิบาย / รูปถ่าย ✅"]
        C["บริเวณที่สูญหาย\n+ หมายเหตุบริเวณ ✅"]
        D["ช่วงวันที่ (from–to)\nช่วงเวลา (from–to) ✅"]
        E["ชื่อ / สัญชาติ / โทร / อีเมล ✅\n(อีเมลบังคับ)"]
    end

    B --> C --> D --> E
    E --> VAL{Validate ครบ?}
    VAL -->|"ไม่ครบ"| E
    VAL -->|"ผ่าน"| GEN["สร้าง trackingNo\nLST-YYYYMMDD-XXXX ✅"]
    GEN --> SAVE["status = 'open'\nbันทึก localStorage + Supabase ✅"]
    SAVE --> AUDIT["Audit Log: CREATE_LOST ✅"]
    SAVE --> MATCH{Auto-match?}
    MATCH -->|"พบ"| TOAST["🔔 Toast แจ้งเตือน ✅"]
    MATCH -->|"ไม่พบ"| END([จบ])

    style GEN fill:#3B82F6,color:#fff
    style SAVE fill:#10B981,color:#fff
    style TOAST fill:#F59E0B,color:#fff
```

| ข้อ TOR | ข้อกำหนด | สถานะ | หมายเหตุ |
|---------|----------|-------|---------|
| 4.4.1 | เลือกประเภท + สี ขนาด จำนวน รูปถ่าย | ✅ | |
| 4.4.2 | เลือกบริเวณ + รายละเอียดเพิ่มเติม | ✅ | |
| 4.4.3 | ช่วงวันที่ + ช่วงเวลา | ✅ | |
| 4.4.4 | ชื่อ สัญชาติ โทร อีเมล | ✅ | อีเมลเป็น required field |
| 4.4.5 | หมายเลขการแจ้งอัตโนมัติ | ✅ | format `LST-YYYYMMDD-XXXX` |

---

## 3. ฟังก์ชันนำส่งทรัพย์สินหลงลืม — Found Report (ข้อ 4.5)

### As-Is (TOR กำหนด)

```mermaid
flowchart LR
    subgraph TOR45["TOR ข้อ 4.5"]
        T1["4.5.1 รหัสอัตโนมัติ\n+ จับคู่ RFID Sticker"]
        T2["4.5.2 ประเภท + สี ขนาด\nจำนวน รูปถ่าย"]
        T3["4.5.3 บริเวณที่พบ\n+ รายละเอียดเพิ่มเติม"]
        T4["4.5.4 วันที่และเวลา"]
        T5["4.5.5 รูปถ่าย ≤ 8 รูป\nต่อ 1 ชิ้น"]
        T6["4.5.6 ข้อมูลผู้นำส่ง\nชื่อ สัญชาติ โทร อีเมล"]
        T7["4.5.7 แบบฟอร์มนำส่ง\n(ลงนาม + พิมพ์/อีเมล)"]
        T8["4.5.8 แจ้งเตือน\nหากพบข้อมูลใกล้เคียง"]
    end
```

### To-Be (ปัจจุบัน — `/found/new` และ `/found/:id/intake`)

```mermaid
flowchart TD
    A([Staff เปิด /found/new]) --> STEP1

    subgraph STEP1["Step 1 — รายละเอียดสิ่งของ"]
        S1["RFID Scan ⚠️ (simulation)\nหมวดหมู่ / สี / ขนาด\nจำนวน / คำอธิบาย"]
        S1P["รูปถ่าย ≤ 8 รูป ✅\n(PhotoUpload component)"]
    end

    subgraph STEP2["Step 2 — สถานที่"]
        S2["บริเวณที่พบ + หมายเหตุ ✅\nStorage Location ✅"]
    end

    subgraph STEP3["Step 3 — วันเวลา"]
        S3["วันที่ + เวลาที่พบ ✅"]
    end

    subgraph STEP4["Step 4 — ผู้นำส่ง"]
        S4["ชื่อ / สัญชาติ / โทร / อีเมล ✅"]
        S4S["✍️ Finder Signature ✅\n(base64 data-url)"]
    end

    STEP1 --> STEP2 --> STEP3 --> STEP4

    STEP4 --> CALC["คำนวณ expiresAt\ncreatedAt + retentionDays ✅"]
    CALC --> GEN["สร้าง foundCode\nFND-YYYYMMDD-XXXX ✅"]
    GEN --> SAVE["status = 'stored'\nbันทึก localStorage + Supabase ✅"]
    SAVE --> AUDIT["Audit Log: CREATE_FOUND ✅"]
    SAVE --> MATCH{Auto-match\nตรวจสอบ?}
    MATCH -->|"พบ"| MODAL["🔔 Modal + รายการที่ตรงกัน ✅\n📧 Gmail button ⚠️"]
    MATCH -->|"ไม่พบ"| END([จบ])

    subgraph INTAKE["ฟอร์มนำส่ง /found/:id/intake"]
        IFM["HandoverForm.tsx\nแบบฟอร์มครบ ✅\nFinder sig (read-only) ✅\nRecipient sig ✅"]
        IPRINT["พิมพ์/ส่งอีเมลฟอร์ม ❌\n(ยังไม่มี PDF export)"]
    end

    SAVE -.->|"เปิดเพื่อส่งมอบ"| INTAKE

    style GEN fill:#3B82F6,color:#fff
    style SAVE fill:#10B981,color:#fff
    style MODAL fill:#F59E0B,color:#fff
    style IPRINT fill:#EF4444,color:#fff
```

| ข้อ TOR | ข้อกำหนด | สถานะ | หมายเหตุ |
|---------|----------|-------|---------|
| 4.5.1 | รหัสอัตโนมัติ `FND-YYYYMMDD-XXXX` | ✅ | |
| 4.5.1 | จับคู่กับ RFID Sticker | ⚠️ | เก็บ rfidTag ได้ แต่ scan เป็น simulation |
| 4.5.2 | ประเภท + สี ขนาด จำนวน รูปถ่าย | ✅ | |
| 4.5.3 | บริเวณที่พบ + รายละเอียดเพิ่มเติม | ✅ | |
| 4.5.4 | วันที่และเวลา | ✅ | |
| 4.5.5 | รูปถ่าย ≤ 8 รูป ต่อ 1 ชิ้น | ✅ | PhotoUpload จำกัด 8 รูป |
| 4.5.6 | ชื่อ สัญชาติ โทร อีเมล (ผู้นำส่ง) | ✅ | |
| 4.5.7 | แบบฟอร์มนำส่ง — ลงนาม (Finder + Recipient) | ✅ | HandoverForm.tsx |
| 4.5.7 | สั่งพิมพ์/ส่งอีเมลแบบฟอร์มนำส่ง | ❌ | ไม่มี PDF export / ส่งอีเมลจริง |
| 4.5.8 | แจ้งเตือนหากพบข้อมูลใกล้เคียง (หน้าจอ) | ✅ | Toast + Modal |
| 4.5.8 | แจ้งเตือนทางอีเมลอัตโนมัติ | ❌ | มีแค่ Gmail mailto button |

---

## 4. ฟังก์ชันค้นหา/จับคู่ — Search & Match (ข้อ 4.6)

### As-Is (TOR กำหนด)
> ค้นหาจาก **ประเภท บริเวณ รายละเอียด วันที่/ช่วงเวลา** และแสดงรายละเอียดที่เกี่ยวข้อง

### To-Be (ปัจจุบัน — `/search`)

```mermaid
flowchart TD
    A([Staff เปิด /search]) --> FILTER

    subgraph FILTER["ตัวกรอง ✅"]
        F1["🔍 Keyword search"]
        F2["📦 หมวดหมู่"]
        F3["📍 บริเวณ"]
        F4["📅 วันที่ ❌\n(ยังไม่มีกรอง date range)"]
    end

    FILTER --> PANELS

    subgraph PANELS["Dual Panel"]
        LP["📋 Lost Reports\nstatus = 'open' เท่านั้น ✅"]
        FP["📦 Found Reports\nstatus = 'stored' เท่านั้น ✅\n+ RFID highlight ✅"]
    end

    LP -->|"เลือก"| SCORE
    FP -->|"เลือก"| SCORE

    SCORE["🧮 Match Scoring\n+3 หมวดหมู่ตรง\n+2 สีตรง\n+2 บริเวณตรง\n+1 ขนาดตรง ✅"]

    SCORE --> BAR["Selection Bar ✅"]
    BAR --> CONFIRM["Modal ยืนยัน ✅"]
    CONFIRM --> MATCH["matchReports()\nLost → matched\nFound → matched ✅"]
    MATCH --> AUDIT["Audit Log: MATCH ✅"]
    MATCH --> SYNC["Sync Supabase ✅"]
    MATCH --> POST["Post-match Modal\n📧 Email (mailto) ⚠️\n📄 ไปหน้า Handover ✅"]

    style SCORE fill:#3B82F6,color:#fff
    style MATCH fill:#10B981,color:#fff
    style F4 fill:#EF4444,color:#fff
```

| ข้อ TOR | ข้อกำหนด | สถานะ | หมายเหตุ |
|---------|----------|-------|---------|
| 4.6.1 | ค้นหาจากประเภทของทรัพย์สิน | ✅ | |
| 4.6.1 | ค้นหาจากบริเวณที่พบ | ✅ | |
| 4.6.1 | ค้นหาจากรายละเอียดทรัพย์สิน | ✅ | keyword search |
| 4.6.1 | ค้นหาจากวันที่/ช่วงเวลาที่พบ | ❌ | ยังไม่มี date range filter |
| 4.6.2 | แสดงรายละเอียดที่เกี่ยวข้อง | ✅ | dual panel + scoring |

---

## 5. ฟังก์ชันการจัดการข้อมูลทรัพย์สิน — Property Management (ข้อ 4.7)

### As-Is (TOR กำหนด)

```mermaid
flowchart LR
    subgraph TOR47["TOR ข้อ 4.7"]
        T1["4.7.1 แสดง/แก้ไขข้อมูล\n(รายละเอียด สถานะ สถานที่จัดเก็บ)"]
        T2["4.7.2 บันทึกวันที่นัดส่งมอบคืน"]
        T3["4.7.3 แสดง/แก้ไขข้อมูล\nทรัพย์สินที่ต้องการส่งมอบคืน"]
        T4["4.7.4 แสดงรายการที่หมดอายุ"]
    end
```

### To-Be (ปัจจุบัน — `/property`)

```mermaid
flowchart TD
    A([Staff เปิด /property]) --> TABS

    subgraph TABS["2 Tabs"]
        T1["📦 ทรัพย์สินทั้งหมด ✅\n(search + status filter)"]
        T2["⏰ หมดอายุ ✅\n(expired tab)"]
    end

    T1 --> ROW["แต่ละรายการ"]
    ROW --> MODAL["Modal จัดการ ✅"]

    subgraph MODAL_CONTENT["Modal Actions"]
        M1["ดูรายละเอียดครบถ้วน ✅"]
        M2["เปลี่ยนสถานะ ✅\nstored/matched/returned\nexpired/disposal_requested"]
        M3["บันทึกนัดหมาย (วันเวลา) ✅\nstatus → pending_return"]
        M4["ลิงก์ไปหน้า Handover ✅"]
    end

    MODAL --> MODAL_CONTENT

    subgraph STATUS_CHANGE["เมื่อเปลี่ยนสถานะ"]
        SC1["returned → บันทึก returnedAt ✅"]
        SC2["Sync Supabase ✅"]
        SC3["Audit Log ✅"]
    end

    M2 --> STATUS_CHANGE

    style M3 fill:#10B981,color:#fff
    style M4 fill:#3B82F6,color:#fff
```

| ข้อ TOR | ข้อกำหนด | สถานะ | หมายเหตุ |
|---------|----------|-------|---------|
| 4.7.1 | แสดง/แก้ไขข้อมูล (รายละเอียด สถานะ สถานที่) | ✅ | |
| 4.7.2 | บันทึกวันที่นัดส่งมอบคืน | ✅ | returnAppointment field |
| 4.7.3 | แสดง/แก้ไขข้อมูลที่ต้องส่งมอบคืน | ✅ | filter pending_return |
| 4.7.4 | แสดงรายการทรัพย์สินที่หมดอายุ | ✅ | Expired tab |

---

## 6. ฟังก์ชันแบบฟอร์มนำส่ง/ส่งมอบคืน — Handover Form (ข้อ 4.5.7)

### As-Is (TOR กำหนด)
> สร้างแบบฟอร์มนำส่งทรัพย์สินหลงลืม ประกอบด้วยข้อมูลผู้นำส่ง รายละเอียดทรัพย์สิน วันที่ เวลา บริเวณ  
> ให้**ผู้นำส่งและผู้รับลงนามร่วมกัน** + สั่งพิมพ์หรือส่งอีเมลได้

### To-Be (ปัจจุบัน — `/found/:id/handover`)

```mermaid
flowchart TD
    A([เปิด /found/:id/handover]) --> DOC

    subgraph DOC["📄 HandoverForm Document"]
        D1["รายละเอียดสิ่งของ\nFound Code / RFID / หมวดหมู่\nStorage / พื้นที่ / วันเวลา ✅"]
        D2["ข้อมูลผู้นำส่ง (Finder) ✅\nชื่อ สัญชาติ โทร อีเมล"]
        D3["✍️ ลายเซ็นผู้นำส่ง (read-only) ✅\nถ่ายไว้ตั้งแต่ Step 4 Intake"]
        D4["ข้อมูลผู้แจ้งหาย (Lost Reporter) ✅"]
        D5["✍️ ลายเซ็นผู้รับคืน ✅\n(เซ็นใหม่เมื่อรับของ)"]
    end

    subgraph SIDEBAR["Sidebar Actions"]
        SA["📅 นัดหมาย → pending_return ✅"]
        SB["📧 Email (mailto) ⚠️"]
        SC["✅ ยืนยันส่งคืนแล้ว\n(ต้องมีลายเซ็นผู้รับก่อน) ✅"]
    end

    DOC --> VALIDATE{มีลายเซ็นผู้รับ?}
    VALIDATE -->|"ยังไม่มี"| WARN["⚠️ Toast Warning ✅"]
    WARN --> D5

    VALIDATE -->|"มีแล้ว"| RETURN["status → 'returned'\nrecipientSignature บันทึก ✅\nreturnedAt = ISO timestamp ✅"]
    RETURN --> SYNC["Sync Supabase ✅"]
    RETURN --> LOCK["🔒 Document read-only ✅"]

    subgraph MISSING["❌ ยังขาด"]
        NP["PDF Export ใบส่งมอบ"]
        NE["ส่งอีเมลฟอร์มอัตโนมัติ"]
    end

    style RETURN fill:#10B981,color:#fff
    style WARN fill:#F59E0B,color:#fff
    style MISSING fill:#FEE2E2
```

---

## 7. ฟังก์ชันการจัดทำรายงานและสถิติ — Reports & Statistics (ข้อ 4.8)

### As-Is (TOR กำหนด)
- **4.8.1** รายงานสถิติแจ้งหาย — รายวัน/เดือน/ปี แยกตามประเภท หรือบริเวณ
- **4.8.2** รายงานสถิตินำส่ง — รายวัน/เดือน/ปี แยกตามประเภท หรือบริเวณ
- **4.8.3** รายงานการปฏิบัติงาน — กรองจาก username/ช่วงเวลา แสดงการรับแจ้ง/นำส่ง/ส่งมอบ

### To-Be (ปัจจุบัน — `/reports`)

```mermaid
flowchart TD
    DATA["lostReports + foundReports + auditLogs\n(จาก DataContext)"] --> CALC

    CALC["useMemo คำนวณ stats\n6 เดือนย้อนหลัง ⚠️\n(ยังไม่มี รายวัน/รายปี)"]

    subgraph TABS["4 Tabs"]
        T1["📊 ภาพรวม ✅\nBar Chart: lost/found/returned\nต่อเดือน (6 เดือน)"]
        T2["📦 ของพบ ✅\n6 summary cards\nReturn rate %\nPie chart ประเภท/บริเวณ ✅"]
        T3["📋 แจ้งหาย ✅\nStatus distribution\nCategory breakdown ✅\nArea breakdown ✅"]
        T4["👥 User Activity ✅\nรายงานต่อเจ้าหน้าที่\nAudit action counts"]
    end

    CALC --> T1 & T2 & T3 & T4

    subgraph MISSING["❌ ยังขาด"]
        M1["กรองรายวัน / รายปี"]
        M2["Date range filter"]
        M3["Export Excel / PDF"]
    end
```

| ข้อ TOR | ข้อกำหนด | สถานะ | หมายเหตุ |
|---------|----------|-------|---------|
| 4.8.1 | สถิติแจ้งหาย รายเดือน | ✅ | 6 เดือนย้อนหลัง |
| 4.8.1 | สถิติแจ้งหาย รายวัน/รายปี | ❌ | |
| 4.8.1 | แยกตามประเภท/บริเวณ | ✅ | |
| 4.8.2 | สถิตินำส่ง รายเดือน | ✅ | |
| 4.8.2 | สถิตินำส่ง รายวัน/รายปี | ❌ | |
| 4.8.2 | แยกตามประเภท/บริเวณ | ✅ | |
| 4.8.3 | รายงานการปฏิบัติงาน (username) | ✅ | User Activity tab |
| 4.8.3 | กรองจากช่วงเวลา | ❌ | ดูเฉพาะ 6 เดือนล่าสุด |
| 4.8.3 | แสดงรับแจ้ง/นำส่ง/ส่งมอบ | ✅ | |

---

## 8. ฟังก์ชันผู้ดูแลระบบ — Admin (ข้อ 4.9)

### As-Is (TOR กำหนด — ข้อ 4.9.1 การกำหนดสิทธิ์)

```mermaid
flowchart LR
    subgraph TOR491["TOR ข้อ 4.9.1"]
        T1["(1) สร้าง/ลบ/แก้ไข Username"]
        T2["(2) กำหนดกลุ่มผู้ใช้งาน"]
        T3["(3) สิทธิ์รายบุคคล\nและรายกลุ่ม"]
        T4["(4) สิทธิ์เข้าดู/แก้ไข\nรายละเอียดทรัพย์สิน"]
        T5["(5) ตรวจสอบประวัติ\n(username/ช่วงวันเวลา)"]
        T6["(6) Session Timeout\nอัตโนมัติ + ปรับได้"]
    end
```

### To-Be (ปัจจุบัน — `/admin`)

```mermaid
flowchart TD
    ADMIN(["/admin — Admin role เท่านั้น"]) --> TABS

    subgraph TABS["Admin Tabs"]
        U["👥 Users\nCRUD: สร้าง/แก้ไข/ลบ ✅\nกำหนด role ✅\nกำหนด permissions รายบุคคล ✅"]
        M["🗂️ Master Data ✅\nประเภท / บริเวณ / Storage"]
        AL["📋 Audit Logs ✅\nกรอง action/user\nDate range ❌"]
        S["⚙️ Settings ✅\nOrganization name\nSession timeout (นาที)"]
    end

    U -->|"save"| SU["upsertUser() → Supabase ✅"]
    U -->|"delete"| DU["deleteUserRecord() → Supabase ✅"]
    M -->|"save"| SM["upsertCategory/Area/Storage() ✅"]
    AL -->|"load"| LA["loadAuditLogs() ← Supabase ✅"]
    S -->|"save"| SS["saveSystemSettings() → Supabase ✅"]

    subgraph SESSION["Session Timeout"]
        ST["useEffect + setTimeout ✅\nออกอัตโนมัติเมื่อ idle\nปรับเวลาได้ใน Settings ✅"]
    end

    subgraph MISSING["❌/⚠️ ยังขาด"]
        G1["กลุ่มผู้ใช้งาน (User Groups)\ngroupId มีใน DB แต่ยังไม่ใช้งาน"]
        G2["สิทธิ์รายกลุ่ม\n(ปัจจุบันมีแค่รายบุคคล)"]
        G3["กรอง Audit Log\nตามช่วงวันเวลา"]
    end

    style ST fill:#10B981,color:#fff
    style MISSING fill:#FEE2E2
```

| ข้อ TOR | ข้อกำหนด | สถานะ | หมายเหตุ |
|---------|----------|-------|---------|
| 4.9.1(1) | สร้าง/ลบ/แก้ไข Username | ✅ | |
| 4.9.1(2) | กำหนดกลุ่มผู้ใช้งาน | ⚠️ | `groupId` เก็บใน DB แต่ UI ยังไม่ใช้ |
| 4.9.1(3) | สิทธิ์รายบุคคล | ✅ | PermissionMap 6 สิทธิ์ |
| 4.9.1(3) | สิทธิ์รายกลุ่ม | ❌ | ยังไม่ implement group permissions |
| 4.9.1(4) | สิทธิ์เข้าดู/แก้ไขทรัพย์สิน | ✅ | PermGuard บน routes |
| 4.9.1(5) | ประวัติการใช้งาน (username) | ✅ | Audit Logs tab |
| 4.9.1(5) | กรองตามช่วงวันเวลา | ⚠️ | กรอง action/user ได้ แต่ date range ไม่มี |
| 4.9.1(6) | Session Timeout อัตโนมัติ | ✅ | |
| 4.9.1(6) | ปรับเวลา Session Timeout ได้ | ✅ | Settings |

### As-Is (TOR กำหนด — ข้อ 4.9.2 Master Data)

| ข้อ TOR | ข้อกำหนด | สถานะ | หมายเหตุ |
|---------|----------|-------|---------|
| 4.9.2(1) | ประเภททรัพย์สิน (Property Category) | ✅ | CRUD + ชื่อ TH/EN + icon |
| 4.9.2(2) | อายุการจัดเก็บ (อาหาร 1วัน / อื่นๆ 1ปี) | ✅ | `retentionDays` per category |
| 4.9.2(3) | บริเวณที่สูญหาย/พบ | ✅ | Areas CRUD |
| 4.9.2(4) | สถานที่จัดเก็บ | ✅ | StorageLocations CRUD |

---

## 9. Status State Machine (สถานะทรัพย์สิน)

```mermaid
stateDiagram-v2
    direction LR

    [*] --> stored : 📥 Found Intake\n(FND-XXXXXX สร้าง)

    stored --> matched : 🔗 Staff จับคู่\nmatchReports()
    stored --> expired : ⏰ เกิน expiresAt

    matched --> pending_return : ✅ ผู้แจ้งหายยืนยันรับ\n(ClaimResponse)
    matched --> stored : ❌ ผู้แจ้งหายปฏิเสธ\n(ไม่ใช่ของฉัน)
    matched --> disposal_requested : 🚫 ผู้แจ้งหายสละสิทธิ์

    pending_return --> returned : ✍️ เซ็นรับ + ยืนยัน\n(HandoverForm)
    pending_return --> rejected_return : 🚫 ไม่มาตามนัด

    rejected_return --> stored : ↩️ คืนเข้า stock
    rejected_return --> disposal_requested : 🗑️ ดำเนินการทำลาย

    disposal_requested --> expired : ✅ ดำเนินการแล้ว

    returned --> [*] : ✅ สิ้นสุด
    expired --> [*] : ✅ สิ้นสุด
```

```mermaid
stateDiagram-v2
    direction LR
    note right of open : Lost Report\nStatus Flow

    [*] --> open : 📝 ผู้ใช้แจ้งหาย\n(LST-XXXXXX สร้าง)
    open --> matched : 🔗 Staff จับคู่
    matched --> open : ❌ ผู้แจ้งหายปฏิเสธ
    matched --> closed : 🚫 สละสิทธิ์\nหรือส่งคืนสำเร็จ
    closed --> [*]
```

---

## 10. Data Flow — Frontend ↔ Storage

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant CTX as DataContext
    participant DS as dataStore.ts
    participant LS as localStorage
    participant SB as Supabase DB

    Note over CTX,SB: App Startup — โหลดข้อมูล
    CTX->>DS: loadRemoteAppState()
    DS->>SB: SELECT lost_reports, found_reports,<br/>audit_logs, categories, areas, storage_locations
    SB-->>CTX: mapped objects → set state

    Note over U,SB: สร้าง Found Report
    U->>CTX: addFoundReport(data)
    CTX->>CTX: generate foundCode + expiresAt
    CTX->>LS: setItem('cni_found_reports')
    CTX->>DS: upsertFoundReport(report)
    DS->>SB: UPSERT found_reports<br/>(normalized cols + payload JSONB)
    CTX-->>U: {report, matches[]}

    Note over U,SB: จับคู่ Lost + Found
    U->>CTX: matchReports(lostId, foundId)
    CTX->>LS: update both
    CTX->>DS: upsertLostReport + upsertFoundReport
    DS->>SB: UPSERT 2 rows

    Note over U,SB: ยืนยันส่งคืน (HandoverForm)
    U->>CTX: updateFoundReport(id,<br/>{status:'returned',<br/>recipientSignature, returnedAt})
    CTX->>LS: update
    CTX->>DS: upsertFoundReport(updated)
    DS->>SB: UPDATE found_reports<br/>recipient_signature, returned_at
```

---

## 11. Route / Screen Map

```mermaid
graph LR
    subgraph PUB["🌐 Public"]
        LG["/login"]
        CL["/claim/:foundId/:lostId\nClaimResponse — ไม่ต้อง login"]
    end

    subgraph AUTH["🔐 Protected (ต้อง login)"]
        DB["/\nDashboard"]
        LL["/lost\nรายการแจ้งหาย"]
        LN["/lost/new\nฟอร์มแจ้งหาย"]
        FL["/found\nรายการของได้"]
        FN["/found/new\nฟอร์มรับของ (4 steps)"]
        FI["/found/:id/intake\nIntake Form"]
        FH["/found/:id/handover\nฟอร์มส่งมอบ ✍️✍️"]
        SR["/search\nค้นหา & จับคู่"]
        PM["/property\nจัดการทรัพย์สิน"]
        RP["/reports\nรายงานและสถิติ"]
        AD["/admin\nAdmin Panel"]
    end

    LG --> DB
    DB --- LL & FL & SR & PM & RP & AD
    LL --> LN
    FL --> FN --> FI --> FH
    SR --> FH
    PM --> FH
    CL -.->|"link จาก Email"| FH
```

---

## 12. Gap Analysis — สรุปทุกข้อตาม TOR

```mermaid
flowchart LR
    subgraph DONE["✅ Implemented (28 ข้อ)"]
        D1["Lost Report Form\n4.4.1–4.4.5 ครบ"]
        D2["Found Report Form\n4.5.1–4.5.6 ครบ"]
        D3["Handover Form\nลายเซ็น 2 ฝ่าย"]
        D4["Auto-match\n+ Toast/Modal"]
        D5["Property Management\n4.7.1–4.7.4 ครบ"]
        D6["Reports รายเดือน\nCategory/Area breakdown"]
        D7["Admin: User CRUD\nMaster Data, Audit Log"]
        D8["Session Timeout\n+ ปรับได้"]
        D9["Supabase sync\nทุก module"]
    end

    subgraph PARTIAL["⚠️ Partial (7 ข้อ)"]
        P1["RFID — simulation\nไม่มี hardware จริง (4.5.1)"]
        P2["Email — mailto เท่านั้น\nไม่ส่งอัตโนมัติ (4.5.7-8)"]
        P3["Search วันที่\nยังไม่มี date filter (4.6.1)"]
        P4["User Groups — groupId มี\nแต่ UI ยังไม่ใช้ (4.9.1.2)"]
        P5["Audit Log filter\nยังไม่มี date range (4.9.1.5)"]
        P6["Responsive — PC ดี\nMobile ยังไม่สมบูรณ์ (4.3)"]
        P7["Reports — รายเดือน 6 เดือน\nยังไม่มีรายวัน/รายปี (4.8.1-2)"]
    end

    subgraph GAP["❌ Not Yet (6 ข้อ)"]
        G1["PDF Export\nใบส่งมอบ + รายงาน (4.5.7)"]
        G2["อีเมลส่งจริง\nอัตโนมัติ (4.5.7-8)"]
        G3["User Group Permissions\nสิทธิ์รายกลุ่ม (4.9.1.3)"]
        G4["Reports รายวัน/รายปี\n+ Date range filter (4.8.1-2)"]
        G5["Search date range\nfilter (4.6.1)"]
        G6["Password Hashing\nbcrypt (security)"]
    end
```

---

## 13. Phase 2 — แผนพัฒนาต่อตาม Priority

```mermaid
gantt
    title Phase 2 — Remaining TOR Features
    dateFormat  YYYY-MM-DD
    section 🔴 High
    PDF Export ใบส่งมอบ         :p1, 2026-05-01, 14d
    Email ส่งจริง (Edge Func)    :p2, after p1, 14d
    Reports รายวัน/รายปี        :p3, 2026-05-01, 10d

    section 🟡 Medium
    Date Range Filter (Search+Reports) :p4, after p2, 7d
    User Groups & Group Permissions    :p5, after p2, 14d
    Audit Log Date Filter              :p6, after p4, 5d
    Mobile Responsive Improve          :p7, 2026-05-15, 10d

    section 🟢 Low
    RFID Hardware Integration  :p8, after p5, 21d
    Password Hashing           :p9, after p2, 5d
    Excel Export               :p10, after p3, 7d
```

---

> **หมายเหตุ:** TOR ไม่ได้ระบุ Public Claim Response (`/claim`) แต่ระบบได้พัฒนาเพิ่มเติมเพื่อรองรับ UX ที่ดีขึ้น — ให้ผู้แจ้งหายตัดสินใจผ่าน link โดยไม่ต้อง login
