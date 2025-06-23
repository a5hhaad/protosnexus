# Interview Data Persistence Fix

## Issue
Interview data scheduled through the calendar was not persisting after a page refresh. The data would be lost because it wasn't being saved to the database.

## Root Cause
The database schema in `api/candidates.js` was missing columns for interview-related data:
- `interview` (TIMESTAMP)
- `interview_type` (VARCHAR)
- `company` (VARCHAR) 
- `remarks` (TEXT)

## Solution
1. **Updated Database Schema**: Added new columns to the candidates table with ALTER TABLE statements for existing databases
2. **Updated API Methods**:
   - GET: Include interview fields in response mapping
   - POST: Handle interview fields when creating candidates
   - PUT: Handle interview fields when updating candidates, with change tracking
3. **Updated Frontend**: Ensure interview fields are preserved when loading data from API

## Technical Changes

### Database Schema (`api/candidates.js`)
```sql
-- Added to CREATE TABLE statement
interview TIMESTAMP,
interview_type VARCHAR(100),
company VARCHAR(255),
remarks TEXT

-- Added ALTER TABLE for existing databases
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS interview TIMESTAMP,
ADD COLUMN IF NOT EXISTS interview_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS remarks TEXT
```

### API Response Mapping
```javascript
// GET method now includes
interview: row.interview ? row.interview.toISOString() : null,
interviewType: row.interview_type,
company: row.company,
remarks: row.remarks
```

### API Update Logic
```javascript
// PUT method now handles
interview = $8, interview_type = $9, company = $10, remarks = $11
```

### Frontend Data Loading
```javascript
// loadCandidatesFromAPI now preserves
interview: candidate.interview || null,
interviewType: candidate.interviewType || null,
remarks: candidate.remarks || ''
```

## Testing
1. Schedule an interview through the calendar
2. Refresh the page
3. Verify interview data persists and displays correctly
4. Check that upcoming interviews list shows scheduled interviews
5. Verify calendar highlights dates with interviews

## Result
Interview data now properly persists to the database and is retained after page refreshes. The complete interview scheduling workflow works correctly in both regular and shared modes.
