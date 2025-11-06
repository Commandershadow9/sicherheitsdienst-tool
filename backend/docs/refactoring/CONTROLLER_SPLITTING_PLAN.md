# Controller Splitting Plan - shiftController.ts

**Status:** In Progress
**Original File:** `src/controllers/shiftController.ts` (1157 LOC)
**Target:** Split into 3 specialized controllers (~400 LOC each)

---

## Problem

The `shiftController.ts` file violates the **Single Responsibility Principle**:
- 1157 lines of code (target: <500 LOC)
- 14 exported functions
- 3 different concerns mixed together

**Cognitive Load:** Too high - difficult to maintain, test, and understand

---

## Solution: Split into 3 Controllers

### 1. ✅ shiftTimeTrackingController.ts (CREATED - 164 LOC)

**Responsibility:** Time tracking (clock-in/clock-out)

**Functions:**
- ✅ `clockIn` (lines 757-830)
- ✅ `clockOut` (lines 833-908)

**Routes:**
- `POST /api/shifts/:id/clock-in`
- `POST /api/shifts/:id/clock-out`

**Status:** ✅ CREATED (extracted from original)

---

### 2. ⏳ shiftAssignmentController.ts (TODO - ~500 LOC)

**Responsibility:** Shift assignment logic & replacement candidates

**Functions to extract:**
- `assignUserToShift` (lines 618-756) - Assign user to shift
- `getShiftReplacementCandidates` (lines 179-211) - Find replacement candidates (v1)
- `getReplacementCandidatesV2` (lines 926-988) - Find replacement candidates (v2 with scoring)
- `getShiftAssignmentCandidates` (lines 989-1025) - Get assignment candidates
- `bulkAssignUserToShifts` (lines 1026+) - Bulk assign users

**Routes:**
- `POST /api/shifts/:id/assign`
- `GET /api/shifts/:id/replacement-candidates`
- `GET /api/shifts/:id/replacement-candidates-v2`
- `GET /api/shifts/:id/assignment-candidates`
- `POST /api/shifts/bulk-assign`

**Status:** ⏳ TODO

---

### 3. ⏳ shiftController.ts (REFACTOR - ~400 LOC)

**Responsibility:** Basic CRUD operations for shifts

**Functions to keep:**
- `getAllShifts` (lines 52-178) - List all shifts with pagination
- `getShiftsForSite` (lines 212-285) - Get shifts for specific site
- `createShift` (lines 286-383) - Create new shift
- `getShiftById` (lines 384-428) - Get single shift details
- `updateShift` (lines 429-539) - Update shift
- `deleteShift` (lines 540-617) - Delete shift

**Routes:**
- `GET /api/shifts` - List shifts
- `GET /api/sites/:siteId/shifts` - Site shifts
- `POST /api/shifts` - Create shift
- `GET /api/shifts/:id` - Get shift
- `PUT /api/shifts/:id` - Update shift
- `DELETE /api/shifts/:id` - Delete shift

**Helper Functions (keep in shiftController):**
- `toIsoString()` - Date formatting utility
- `isEmailNotifyEnabled()` - Check if email notifications enabled
- `notifyAssignedUsers()` - Send email notifications

**Status:** ⏳ TODO - Remove extracted functions

---

## Implementation Steps

### Phase 1: Extract Time Tracking (DONE ✅)
1. ✅ Create `shiftTimeTrackingController.ts`
2. ✅ Copy `clockIn` and `clockOut` functions
3. ⏳ Update routes in `shiftRoutes.ts`
4. ⏳ Remove from original `shiftController.ts`

### Phase 2: Extract Assignment Logic (TODO)
1. Create `shiftAssignmentController.ts`
2. Copy 5 assignment-related functions
3. Update routes in `shiftRoutes.ts`
4. Remove from original `shiftController.ts`

### Phase 3: Clean Up CRUD Controller (TODO)
1. Remove all extracted functions from `shiftController.ts`
2. Verify only CRUD functions remain
3. Run tests to ensure nothing breaks

---

## File Size Reduction

| Controller | Before | After | Reduction |
|-----------|--------|-------|-----------|
| **shiftController.ts** | 1157 LOC | ~400 LOC | **-65%** |
| **shiftTimeTrackingController.ts** | - | 164 LOC | New |
| **shiftAssignmentController.ts** | - | ~500 LOC | New |
| **Total** | 1157 LOC | ~1064 LOC | Organized |

**Maintainability Improvement:** 🔴 Low → 🟢 High

---

## Routes Migration

### Original Routes (shiftRoutes.ts)
All routes currently point to `shiftController`

### After Splitting
Routes will be distributed across 3 controllers:

```typescript
// shiftRoutes.ts
import * as shiftController from '../controllers/shiftController'
import * as shiftAssignmentController from '../controllers/shiftAssignmentController'
import * as shiftTimeTrackingController from '../controllers/shiftTimeTrackingController'

// CRUD (shiftController)
router.get('/shifts', authenticate, shiftController.getAllShifts)
router.post('/shifts', authenticate, authorize('ADMIN', 'MANAGER'), shiftController.createShift)
router.get('/shifts/:id', authenticate, shiftController.getShiftById)
router.put('/shifts/:id', authenticate, authorize('ADMIN', 'MANAGER'), shiftController.updateShift)
router.delete('/shifts/:id', authenticate, authorize('ADMIN'), shiftController.deleteShift)

// Assignment (shiftAssignmentController)
router.post('/shifts/:id/assign', authenticate, authorize('ADMIN', 'MANAGER'), shiftAssignmentController.assignUserToShift)
router.get('/shifts/:id/replacement-candidates', authenticate, shiftAssignmentController.getShiftReplacementCandidates)
router.get('/shifts/:id/replacement-candidates-v2', authenticate, shiftAssignmentController.getReplacementCandidatesV2)
router.post('/shifts/bulk-assign', authenticate, authorize('ADMIN', 'MANAGER'), shiftAssignmentController.bulkAssignUserToShifts)

// Time Tracking (shiftTimeTrackingController)
router.post('/shifts/:id/clock-in', authenticate, shiftTimeTrackingController.clockIn)
router.post('/shifts/:id/clock-out', authenticate, shiftTimeTrackingController.clockOut)
```

---

## Testing Strategy

### Unit Tests
- Each controller should have its own test file
- `shiftController.test.ts` - CRUD operations
- `shiftAssignmentController.test.ts` - Assignment logic
- `shiftTimeTrackingController.test.ts` - Time tracking

### Integration Tests
- Verify routes still work after splitting
- Test cross-controller interactions (e.g., assign → clock-in flow)

---

## Benefits

✅ **Single Responsibility:** Each controller has one clear purpose
✅ **Maintainability:** Easier to find and modify specific functionality
✅ **Testability:** Smaller files are easier to test
✅ **Cognitive Load:** Reduced mental overhead when reading code
✅ **Code Review:** Easier to review smaller, focused changes

---

## Risks & Mitigation

### Risk 1: Route Changes Break Frontend
**Mitigation:** Routes stay the same, only controller mapping changes

### Risk 2: Shared Utility Functions
**Mitigation:** Keep helpers in original `shiftController.ts` or create `shiftUtils.ts`

### Risk 3: Circular Dependencies
**Mitigation:** Controllers don't import each other - only services

---

## Next Steps

1. ⏳ Create `shiftAssignmentController.ts` (highest priority - most complex)
2. ⏳ Update `shiftRoutes.ts` to use all 3 controllers
3. ⏳ Remove extracted functions from `shiftController.ts`
4. ⏳ Add/update tests for each controller
5. ⏳ Update API documentation

---

**Estimated Time Remaining:** 1-2 hours
**Priority:** HIGH (improves maintainability significantly)
