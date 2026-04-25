# RFID Search - Quick Start Guide

## For Users (Staff)

### 🎯 Quick Search by RFID Tag

1. **Go to Search & Match page**
   - Click "ค้นหา / จับคู่ทรัพย์สิน" in main menu
   - Or visit: `/search-match`

2. **Type RFID Tag in Search Box**
   ```
   Example searches:
   - RFID-A001
   - RFID-A002
   - A001 (shorthand)
   - rfid-a (prefix search)
   ```

3. **Look for Blue Highlight**
   - Matching items have a **blue ring border** ✨
   - RFID tag shows with **blue background** 🔵
   - Non-matching items appear normal

4. **Select and Match**
   - Click the item to select it
   - Then select a lost report
   - Click "จับคู่รายการนี้" to match

---

## 📊 Example Searches

### Search Task 1: Find iPhone
```
Step 1: Go to Search & Match
Step 2: Type: "RFID-A001"
Result: Shows Samsung Galaxy S24 (FND-20260420-0001)
Visual: Blue ring around item, RFID tag highlighted
Step 3: Click to select item for matching
```

### Search Task 2: Find Wallet
```
Step 1: Type: "RFID-A002"
Result: Shows brown wallet (FND-20260421-0001)
Visual: Blue highlight on matching RFID tag
```

### Search Task 3: Partial Search
```
Step 1: Type: "A00"
Result: Shows all items A001, A002, A003, A004
Visual: All matching items highlighted
```

### Search Task 4: Combined Filter
```
Step 1: Type: "RFID-A001"
Step 2: Select Category: "Electronics"
Step 3: Select Area: "ชั้น 1 - ประตูทางเข้าหลัก"
Result: Shows RFID-A001 if it matches all filters
```

---

## ⚡ Performance Tips

1. **Exact Search is Faster**
   - Use full tag: "RFID-A001" (fastest)
   - Partial works: "A001" (quick)
   - Prefix works: "RFID-A" (may return multiple)

2. **Use Category/Area Filters**
   - Narrows results automatically
   - Makes results easier to scan
   - Works together with RFID search

3. **Case Doesn't Matter**
   - "RFID-A001" = "rfid-a001" = "RfId-A001"
   - Type what's comfortable

---

## 🔍 What's Different from Before?

| Before | After |
|--------|-------|
| 🔎 Keyword search only | ✅ RFID tag search added |
| 🏷️ Category filter | ✅ Category filter (unchanged) |
| 📍 Area filter | ✅ Area filter (unchanged) |
| 📝 Search by description | ✅ Search by description (unchanged) |
| — | ✨ **NEW: Visual RFID highlight** |
| — | ✨ **NEW: RFID reader ready** |

---

## 🎓 Step-by-Step Example

### Complete Search Workflow

```
1️⃣  Navigate to Search & Match
    → Click "ค้นหา / จับคู่ทรัพย์สิน" in main menu

2️⃣  Customer says: "My tag is RFID-A002"
    → You type in search box: "RFID-A002"
    → You see results with blue highlight

3️⃣  Look for matching lost report
    → Search area shows lost items on left
    → Found items on right
    → Customer says: "I lost my wallet in restaurant"

4️⃣  Select both items
    → Click found item with RFID-A002 (right side)
    → Click lost item from customer (left side)
    → Both are now highlighted/selected

5️⃣  Confirm match
    → Blue bar appears at top
    → Click "จับคู่รายการนี้" button
    → System confirms match
    → Item status changes to "matched"

6️⃣  Return to customer
    → Arrange return appointment
    → Note in audit log
```

---

## ❓ FAQ - Quick Answers

**Q: How do I search for RFID?**
A: Type the tag in the search box (e.g., "RFID-A001")

**Q: Does case matter?**
A: No, all searches are case-insensitive.

**Q: Can I search for partial tag?**
A: Yes! "A001" will find "RFID-A001"

**Q: How do I see all stored items?**
A: Leave search box empty, all stored items will show.

**Q: What if no results show?**
A: Check:
- Is the tag spelled correctly?
- Is the item status "stored"? (matched items won't show)
- Are category/area filters blocking the result?

**Q: Can I combine RFID search with filters?**
A: Yes! Search by RFID + filter by Category + filter by Area

---

## 🎯 Real-World Usage Scenarios

### Scenario 1: Customer Return
```
Customer: "I'm here to pick up my phone"
Staff:   "Do you have the tag number?"
Customer: "It says RFID-A001"
Staff:   [types "RFID-A001"]
Staff:   "Found it! Here's your Samsung Galaxy..."
```

### Scenario 2: Storage Verification
```
Manager: "Check all items in ตู้ A-01"
Staff:   [filters by storage location or area]
Staff:   [sees items: RFID-A001, RFID-A002, etc.]
Staff:   [marks as verified in system]
```

### Scenario 3: Quick Lookup
```
Incoming call: "Do you have my item RFID-A003?"
Staff:   [searches "RFID-A003"]
Staff:   "Yes, we have it - lunch box from Apr 23"
Caller:  "Great, I'll come pick it up tomorrow"
```

---

## 🔧 Troubleshooting

### Problem: Search not working
**Solution:**
1. Check search box has focus (cursor visible)
2. Make sure you typed the tag correctly
3. Try just the number (e.g., "A001" instead of "RFID-A001")

### Problem: Can't find an item
**Solution:**
1. Item might not be "stored" status
   - Matched items: Hidden from results
   - Returned items: Hidden from results
   - Expired items: Hidden from results
2. Check category/area filters - they might block results
3. Check item is in right floor/zone

### Problem: Too many results
**Solution:**
1. Use category filter
2. Use area filter
3. Be more specific with search (e.g., "RFID-A001" not "RFID-A")

---

## 📱 Mobile-Friendly

This feature works great on:
- ✅ Desktop computers
- ✅ Tablets
- ✅ Mobile phones
- ✅ Smartphones in portrait mode

The search box and filters stack vertically on small screens for easy access.

---

## 🚀 What's Coming Next?

### Phase 2 Enhancements
- 📱 RFID scanner hardware integration
- 🔄 Batch RFID operations
- 🎨 Print RFID tags
- 📊 RFID reports and analytics

---

**Ready to use? Start with any of the example searches above!**

For detailed documentation, see: `RFID_SEARCH_FEATURE.md`
