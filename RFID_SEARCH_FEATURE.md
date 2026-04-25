# RFID Search Feature Documentation

## Overview
The RFID Search feature enables users to quickly locate stored properties using their RFID tag identifiers through the Search & Match page. This feature is now integrated into the main search input field.

**Date Added:** April 26, 2026
**Status:** ✅ Implemented and Ready for Use

---

## Feature Details

### What is RFID Search?
RFID (Radio Frequency Identification) tags are unique identifiers assigned to each found and stored property. The search feature now allows staff to:
1. Search for properties by their RFID tag (e.g., `RFID-A001`)
2. Locate items quickly without remembering descriptions
3. Get visual feedback when RFID tag is matched

### Search Capabilities

#### Before Enhancement
- 🔍 Search by keyword (description)
- 🏷️ Filter by category
- 📍 Filter by area

#### After Enhancement (New)
- 🏷️ **Search by RFID Tag** (NEW!)
- 🔍 Search by keyword (description) - unchanged
- 🔷 Filter by category - unchanged
- 📍 Filter by area - unchanged

---

## How to Use

### 1. Access Search & Match Page
```
Navigation: Main Menu → Search & Match
Or: Direct URL → /search-match
```

### 2. Search by RFID Tag
**In the search input field**, type the RFID tag:
```
Example: RFID-A001
Example: RFID-A002
Example: rfid-a003 (case-insensitive)
```

### 3. Visual Feedback
When an RFID tag matches:
- ✨ **Blue ring border** appears around the matching found item
- 🔵 **RFID tag is highlighted** with blue background and bold text
- 🎯 The matched item stands out from other results

### 4. Combine with Other Filters
```
Search: "RFID-A001" + Category: "Electronics" + Area: "ชั้น 1"
→ Shows only electronics from Floor 1 with tag RFID-A001
```

---

## Technical Implementation

### Code Changes

#### 1. Enhanced Filter Logic (SearchMatch.tsx)
**Before:**
```typescript
const filterItems = <T extends { description: string; categoryId: string }>(
  items: T[], areaKey: keyof T
) => items.filter(r => {
  const q = keyword.toLowerCase();
  const matchQ = !q || 
    r.description.toLowerCase().includes(q) || 
    getCatName(r.categoryId).toLowerCase().includes(q);
  // ... rest of filter
});
```

**After:**
```typescript
const filterItems = <T extends { description: string; categoryId: string; rfidTag?: string }>(
  items: T[], areaKey: keyof T
) => items.filter(r => {
  const q = keyword.toLowerCase();
  const rfidTag = (r.rfidTag as string | undefined) || '';
  const matchQ = !q || 
    r.description.toLowerCase().includes(q) || 
    getCatName(r.categoryId).toLowerCase().includes(q) ||
    rfidTag.toLowerCase().includes(q);  // ← NEW: RFID search
  // ... rest of filter
});
```

**Key Change:** Added RFID tag to the match condition with case-insensitive comparison

#### 2. Search Input Placeholder Update
**Before:**
```tsx
placeholder="ค้นหาด้วยคำสำคัญ..."
```

**After:**
```tsx
placeholder="ค้นหาด้วยคำสำคัญ / RFID Tag..."
```

#### 3. Visual Highlight for RFID Matches
**New Logic in Found Items Display:**
```typescript
const isRfidMatch = keyword.toLowerCase() && 
  r.rfidTag.toLowerCase().includes(keyword.toLowerCase());

// Applied styles:
- Ring indicator: ring-2 ring-blue-400 (when matched)
- RFID tag highlight: text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded
```

---

## RFID Tag Format

### Current Format
```
RFID-AAAA

Where:
- Prefix: "RFID-" (always)
- Suffix: Alphanumeric identifier (A001, A002, A003, etc.)
```

### Examples from System
| foundCode | rfidTag |
|-----------|---------|
| FND-20260420-0001 | RFID-A001 |
| FND-20260421-0001 | RFID-A002 |
| FND-20260423-0001 | RFID-A003 |
| FND-20260425-0001 | RFID-A004 |

### Search Examples
```
User Input          Result
─────────────────   ──────────────────────────────────────
"RFID-A001"        → Shows property with RFID-A001
"A001"             → Shows property with RFID-A001 (partial match)
"rfid"             → Shows all properties (all start with RFID)
"RFID-A"           → Shows RFID-A001, RFID-A002, RFID-A003, RFID-A004
```

---

## Use Cases

### 1. Quick Lookup by RFID Reader
**Scenario:** Staff scans RFID tag at storage location
```
1. Scanner reads: RFID-A002
2. Staff enters in search: "RFID-A002"
3. System displays matching found item (wallet)
4. Verify property information
5. Process return or handling
```

### 2. Storage Management
**Scenario:** Inventory check of stored items
```
1. Check storage location "ตู้ A-01"
2. Search for "RFID-A00" (prefix search)
3. See all items in range A001-A009
4. Verify all items accounted for
```

### 3. Property Search by Code
**Scenario:** Customer provides RFID code
```
1. Customer: "My item has tag RFID-A003"
2. Staff enters: "RFID-A003"
3. System shows: Found report FND-20260423-0001 (Lunch box)
4. Verify details match customer description
5. Process return appointment
```

---

## Benefits

| Benefit | Impact |
|---------|--------|
| **Faster Lookup** | Reduces search time from minutes to seconds |
| **Accurate Matching** | RFID tags are unique, prevents mix-ups |
| **RFID Reader Integration** | Supports future barcode/RFID scanner hardware |
| **Workflow Efficiency** | Staff can quickly locate items during returns |
| **Inventory Management** | Easy to verify storage locations |
| **Customer Service** | Faster property retrieval for waiting customers |

---

## Future Enhancements

### Phase 2 Planned Features
1. **RFID Hardware Integration**
   - Connect RFID reader/scanner hardware
   - Auto-populate search field with scanned tags
   - Real-time property lookup

2. **Batch RFID Operations**
   - Check-in multiple items by RFID
   - Transfer items between storage locations
   - Generate RFID inventory reports

3. **RFID Label Generation**
   - Print RFID tags during property intake
   - Assign unique RFID per item
   - Track RFID assignment in audit logs

4. **Advanced RFID Search**
   - Search by RFID range (RFID-A001 to RFID-A010)
   - RFID history and movement tracking
   - RFID deactivation for returned items

---

## Testing Guide

### Test Case 1: Basic RFID Search
```
Steps:
1. Navigate to Search & Match page
2. Enter search: "RFID-A001"
3. Expected: Shows FND-20260420-0001 (Samsung Galaxy S24)
4. Visual: Blue ring border and highlighted RFID tag
```

### Test Case 2: Partial RFID Search
```
Steps:
1. Enter search: "A00"
2. Expected: Shows all items starting with A00 (A001, A002, A003, A004)
3. Visual: All matching items highlighted
```

### Test Case 3: Case-Insensitive Search
```
Steps:
1. Enter search: "rfid-a001"
2. Expected: Same result as "RFID-A001"
3. Visual: RFID tag highlighted
```

### Test Case 4: Combined Filters
```
Steps:
1. Enter search: "RFID-A001"
2. Select Category: "Electronics"
3. Expected: Shows only if FND-20260420-0001 is Electronics category
```

### Test Case 5: No Results
```
Steps:
1. Enter search: "RFID-Z999"
2. Expected: Empty result set with "ไม่พบรายการ" message
```

---

## Integration Points

### Current Integration
- ✅ SearchMatch.tsx - Main search component
- ✅ Search input field
- ✅ FoundReport type (includes rfidTag field)
- ✅ Visual styling (Tailwind CSS)

### Related Files
- `src/pages/SearchMatch/SearchMatch.tsx` - Updated with RFID search logic
- `src/types/index.ts` - FoundReport interface (already has rfidTag)
- `src/context/DataContext.tsx` - Mock data includes RFID tags

---

## Performance Considerations

### Search Performance
- **String matching:** O(n) complexity (acceptable for <1000 items)
- **Case normalization:** Lowercase conversion on input (minimal overhead)
- **Real-time filtering:** Updates as user types
- **No API calls:** All client-side filtering

### Optimization for Future
```typescript
// When scaling to 10,000+ items:
- Consider: Full-text search library (e.g., fuse.js)
- Consider: Server-side RFID filtering
- Consider: RFID index database
```

---

## Troubleshooting

### Issue: RFID tag not highlighting
**Solution:** Check that:
1. RFID tag format matches exactly (case-insensitive search works)
2. Item status is "stored" (other statuses may be filtered out)
3. Search box has focus and text is entered

### Issue: No results for known RFID
**Solution:** Verify:
1. Item status = "stored" (matched, returned, or expired items are filtered)
2. RFID tag spelling is correct
3. Filters (Category/Area) are set to allow the item

### Issue: Too many results
**Solution:**
1. Add category filter to narrow results
2. Add area filter to narrow results
3. Use more specific RFID code

---

## FAQ

**Q: Can I search by partial RFID?**
A: Yes! "A001" will match "RFID-A001". Any substring will match.

**Q: Is the search case-sensitive?**
A: No, it's case-insensitive. "rfid-a001" and "RFID-A001" both work.

**Q: Will this work with RFID scanners?**
A: Yes, this is designed to integrate with RFID scanners in Phase 2.

**Q: What happens if two items have the same RFID?**
A: Each FoundReport gets a unique RFID tag. Duplicates should not occur in normal operation.

**Q: Can I search by just the number (A001)?**
A: Yes! Substring matching works. "A001" will find "RFID-A001".

---

## Audit & Logging

RFID searches are NOT currently logged in audit trails. To enable logging:

```typescript
// Add to SearchMatch.tsx when RFID search is used
addAuditLog({
  userId: user?.id ?? '',
  username: user?.username ?? '',
  action: 'RFID_SEARCH',
  module: 'Search & Match',
  detail: `ค้นหาด้วย RFID: ${keyword}`,
  timestamp: new Date().toISOString(),
  ipAddress: '192.168.1.100',
});
```

---

## Conclusion

The RFID Search feature is now fully integrated into the Search & Match page, enabling staff to quickly locate properties by their unique RFID identifiers. This feature sets the foundation for future RFID hardware integration and batch operations in Phase 2 development.

**Status:** ✅ Ready for User Testing
**Next Step:** Follow testing procedures in PHASE1_VERIFICATION_CHECKLIST.md Section: "RFID Search Testing"

