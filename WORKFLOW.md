# CNI Lost & Found — System Workflow (Current)

---

## 1. Main System Flow

```mermaid
flowchart TB
    START([ผู้ใช้เข้าสู่ระบบ]) --> LOGIN[/Login Page\]

    LOGIN -->|username + password ถูกต้อง| SESSION[บันทึก Session\nlocalStorage]
    LOGIN -->|มี session active| SESSION
    SESSION --> DASH[📊 Dashboard]

    DASH -->|เมนู| NAV

    subgraph NAV["Navigation (Role-based)"]
        direction LR
        N1[📋 แจ้งสูญหาย]
        N2[📦 บันทึกหลงลืม]
        N3[🔍 ค้นหา / จับคู่]
        N4[🏠 จัดการทรัพย์สิน]
        N5[📈 รายงาน]
        N6[⚙️ Admin]
    end

    NAV --> LOST_WF
    NAV --> FOUND_WF
    NAV --> MATCH_WF
    NAV --> PROP_WF
    NAV --> ADMIN_WF

    %% RFID always accessible from Navbar
    NAVBAR[📡 ปุ่ม RFID\nใน Navbar] -.->|เปิด modal| RFID_WF

    DASH -.-> NAVBAR

    subgraph LOST_WF["📋 Lost Report Workflow"]
        direction TB
        LR1[รายการแจ้งสูญหาย] --> LR2[กรอกฟอร์ม\nประเภท / สี / บริเวณ\nวันที่ / ผู้แจ้ง]
        LR2 --> LR3[บันทึก → สร้าง\nTracking No\nLST-YYYYMMDD-XXXX]
        LR3 --> LR4[สถานะ: open]
        LR4 --> LR5{พบทรัพย์สิน\nที่ตรงกัน?}
        LR5 -->|ใช่ จับคู่แล้ว| LR6[สถานะ: matched]
        LR5 -->|ไม่พบ| LR4
        LR6 --> LR7[สถานะ: closed\nหลังคืนสำเร็จ]
    end

    subgraph FOUND_WF["📦 Found Report Workflow"]
        direction TB
        FR1[บันทึกทรัพย์สินหลงลืม] --> FR2[กรอกฟอร์ม\nRFID Tag / ประเภท / สี\nบริเวณที่พบ / ที่จัดเก็บ]
        FR2 --> FR2b[ลายเซ็นผู้ส่งมอบ\nSignaturePad]
        FR2b --> FR3[บันทึก → สร้าง\nFound Code\nFND-YYYYMMDD-XXXX]
        FR3 --> FR4[สถานะ: stored]
        FR3 --> FR3a[ระบบตรวจ\nauto-match]
        FR3a -->|พบรายการใกล้เคียง| FR3b[แสดง Match Candidates]
        FR3b --> FR4
        FR4 --> FR5[แสดงใบรับ + Email Draft\nถึงผู้นำส่ง]
    end

    subgraph MATCH_WF["🔍 Search & Match Workflow"]
        direction TB
        SM1[ค้นหา keyword\nประเภท / บริเวณ / วันที่] --> SM2[แสดงรายการ\nสูญหาย + หลงลืม\nแบบ 2 คอลัมน์]
        SM2 --> SM3[เลือก Lost + Found\nที่ต้องการจับคู่]
        SM3 --> SM4[คำนวณ Match Score\n0-8 คะแนน]
        SM4 --> SM5{ยืนยันจับคู่?}
        SM5 -->|Confirm| SM6[matchReports\nอัปเดตทั้ง 2 รายการ]
        SM6 --> SM7[Lost: matched\nFound: matched]
        SM7 --> SM8[ส่ง Email\nแจ้งเจ้าของ]
    end

    SM8 --> HANDOVER_WF
    LR6 --> HANDOVER_WF

    subgraph HANDOVER_WF["📝 Handover & Return Workflow"]
        direction TB
        HV1[HandoverForm\n/found/:id/handover] --> HV2[นัดวันคืนทรัพย์สิน\nappointmentDate + Time]
        HV2 --> HV3[สถานะ: pending_return\nบันทึกนัดหมาย]
        HV3 --> HV4[ส่ง Email ถึงผู้แจ้ง\nพร้อม Claim URL]

        HV4 --> HV5[/ClaimResponse Page\n/claim/:foundId/:lostId\]
        HV5 --> HV6{ผู้แจ้งตอบสนอง}
        HV6 -->|นัดรับคืน| HV7[กำหนดวันเวลา\nสถานะ: pending_return]
        HV6 -->|ไม่ใช่ของฉัน| HV8[สถานะ: rejected_return\nกลับ stored]
        HV6 -->|ขอให้ทำลาย| HV9[สถานะ: disposal_requested]

        HV7 --> HV10[เจ้าหน้าที่ยืนยัน\nลายเซ็นผู้รับ]
        HV10 --> HV11[สถานะ: returned\nบันทึก returnedAt]
        HV8 --> HV12[กลับ: stored]
    end

    subgraph RFID_WF["📡 RFID Scanner Workflow"]
        direction TB
        RF1[สแกน / กรอก RFID Tag] --> RF2{พบ Found Report?}
        RF2 -->|พบ| RF3[แสดงรายละเอียด\nทรัพย์สิน]
        RF2 -->|ไม่พบ| RF4[แสดง Error Toast]
        RF3 --> RF5[Quick Menu]
        RF5 --> RF6[จับคู่กับ\nLost Report]
        RF5 --> RF7[เปลี่ยนสถานะ\nreturned / expired]
        RF5 --> RF8[ไปหน้า Handover Form]
        RF5 --> RF9[เปิดหน้าค้นหา]
    end

    subgraph PROP_WF["🏠 Property Management Workflow"]
        direction TB
        PM1[รายการทรัพย์สินทั้งหมด] --> PM2[กรอง\nสถานะ / keyword]
        PM2 --> PM3{แท็บ}
        PM3 -->|ทั้งหมด| PM4[All Found Reports]
        PM3 -->|หมดอายุ| PM5[Expired Items]
        PM4 --> PM6[อัปเดตสถานะ\nนัดคืน / คืนแล้ว]
        PM5 --> PM7[จัดการของหมดอายุ\nทำลาย / จัดเก็บต่อ]
    end

    subgraph ADMIN_WF["⚙️ Admin Workflow"]
        direction LR
        AD1[ผู้ใช้งาน\nCRUD] 
        AD2[กลุ่ม & สิทธิ์\nCRUD]
        AD3[ข้อมูลหลัก\nประเภท / บริเวณ / ที่จัดเก็บ]
        AD4[RFID Reader Config\nhardware settings]
        AD5[Workstations\nกำหนด reader ต่อเครื่อง]
        AD6[ประวัติการใช้งาน\nAudit Log]
        AD7[ตั้งค่าระบบ\nSession / องค์กร]
    end
```

---

## 2. Property Status State Machine

```mermaid
stateDiagram-v2
    [*] --> stored : บันทึก Found Report

    stored --> matched : จับคู่กับ Lost Report\n(SearchMatch / RFIDScanner)

    matched --> pending_return : นัดวันคืน\n(HandoverForm)

    pending_return --> returned : ยืนยันรับคืน + ลายเซ็น\n(HandoverForm / ClaimResponse)

    pending_return --> rejected_return : ผู้แจ้งปฏิเสธ\n(ClaimResponse)

    rejected_return --> stored : คืนสถานะจัดเก็บ

    stored --> expired : หมดอายุ\n(เจ้าหน้าที่ / ระบบ)

    stored --> disposal_requested : ขอทำลาย\n(ClaimResponse / Admin)

    disposal_requested --> returned : ยืนยันทำลาย / คืนแล้ว

    matched --> returned : คืนโดยตรง\n(RFIDScanner)

    returned --> [*]
    expired --> [*]

    note right of stored
        RFID Tag พร้อมสแกน
        auto-match หลังบันทึก
    end note

    note right of pending_return
        ส่ง Email พร้อม Claim URL
        ผู้แจ้งยืนยันผ่านลิงก์
    end note
```

---

## 3. Data Architecture

```mermaid
flowchart LR
    subgraph CLIENT["🖥️ Browser / Device"]
        direction TB
        subgraph APP["React App"]
            AC[AuthContext\nผู้ใช้ / Session / สิทธิ์]
            DC[DataContext\nรายการ / Master Data\nRFID / Workstation]
        end

        subgraph LS["localStorage"]
            LS1[cni_lost_reports]
            LS2[cni_found_reports]
            LS3[cni_audit_logs]
            LS4[cni_rfid_readers]
            LS5[cni_workstations]
            LS6[cni_device_id]
            LS7[cni_token\nUser Session]
        end

        DC <-->|read/write\n safe try-catch| LS
        AC <-->|read/write\n safe try-catch| LS7
    end

    subgraph SUPABASE["☁️ Supabase (optional)"]
        direction TB
        SB1[(lost_reports)]
        SB2[(found_reports)]
        SB3[(audit_logs)]
        SB4[(property_categories)]
        SB5[(areas)]
        SB6[(storage_locations)]
        SB7[(users)]
        SB8[(user_groups)]
        SB9[(system_settings)]
        SB10[(rfid_readers)]
        SB11[(workstations)]
    end

    DC -->|upsert on change\nsilent fail| SB1
    DC -->|upsert on change\nsilent fail| SB2
    DC -->|insert on create\nsilent fail| SB3
    DC -->|upsert on change| SB4
    DC -->|upsert on change| SB5
    DC -->|upsert on change| SB6
    DC -->|upsert on change| SB10
    DC -->|upsert on register| SB11

    AC -->|loadUsers\nupsertUser| SB7
    AC -->|loadUserGroups\nupsertUserGroup| SB8
    AC -->|loadSystemSettings\nsaveSystemSettings| SB9

    DC -->|loadRemoteAppState\non mount 10s timeout| SUPABASE

    SUPABASE -->|canUseRemoteDataStore = false\nfallback to localStorage| LS
```

---

## 4. Email Notification Flow

```mermaid
sequenceDiagram
    participant S as เจ้าหน้าที่
    participant APP as React App
    participant EMAIL as Email Client\n(mailto / Gmail)
    participant R as ผู้แจ้งสูญหาย

    Note over S,R: 📧 Scenario A — Found Intake Receipt (ถึงผู้นำส่งของ)

    S->>APP: บันทึก Found Report
    APP->>APP: buildFoundIntakeReceiptEmail()
    APP->>S: แสดง Email Draft Card
    S->>EMAIL: กด "ส่งจากเครื่อง" (mailto)\nหรือ "Gmail Web"
    EMAIL->>R: Email ใบรับทรัพย์สิน

    Note over S,R: 📧 Scenario B — Match Notification (ถึงเจ้าของที่แจ้งสูญหาย)

    S->>APP: จับคู่ Found ↔ Lost\n(SearchMatch หรือ HandoverForm)
    APP->>APP: buildLostReporterMatchEmail()\n+ buildClaimResponseUrl()
    APP->>S: แสดง Email Draft
    S->>EMAIL: ส่ง Email พร้อม Claim URL
    EMAIL->>R: แจ้งพบทรัพย์สิน + ลิงก์ยืนยัน

    R->>APP: คลิกลิงก์ /claim/:foundId/:lostId
    APP->>R: แสดง ClaimResponse Page

    alt ยืนยันรับคืน
        R->>APP: เลือกวัน+เวลา → กด ยืนยัน
        APP->>APP: status → pending_return
    else ไม่ใช่ของฉัน
        R->>APP: กด "ไม่ใช่ของฉัน"
        APP->>APP: status → rejected_return
    else ขอให้ทำลาย
        R->>APP: กด "ขอให้ทำลาย" + เหตุผล
        APP->>APP: status → disposal_requested
    end
```

---

## 5. RFID Hardware Integration

```mermaid
flowchart LR
    subgraph HARDWARE["🔌 RFID Hardware"]
        HW1[Keyboard Emulation\nUSB HID]
        HW2[USB Serial\nCOM Port / ttyUSB]
        HW3[TCP/IP Network]
        HW4[Bluetooth]
    end

    subgraph CONFIG["⚙️ Admin → RFID Tab"]
        direction TB
        CFG1[RFIDReaderConfig\nชื่อ / บริเวณ / connection type\nport / baud / IP / BT]
        CFG2[WorkstationConfig\ndeviceId / ชื่อสถานี\nreader ที่กำหนด]
    end

    HARDWARE -->|ส่ง tag string| BROWSER

    subgraph BROWSER["🖥️ Browser"]
        direction TB
        B1[Input field\nautoFocus]
        B2[onKeyDown Enter\nหรือกดปุ่มค้นหา]
        B1 --> B2
    end

    BROWSER --> SCANNER[RFIDScanner Component\nค้นหาใน foundReports\nโดย rfidTag]

    CONFIG -->|activeReaderId\nderived from workstation| NAVBAR_BTN[Navbar Button\nแสดงชื่อ reader\nที่กำหนดไว้]
    NAVBAR_BTN --> SCANNER

    subgraph PERSIST["💾 Persistence"]
        direction TB
        P1[localStorage\ncni_rfid_readers\ncni_workstations\ncni_device_id]
        P2[Supabase\nrfid_readers\nworkstations]
    end

    CONFIG <-->|sync| PERSIST
```
