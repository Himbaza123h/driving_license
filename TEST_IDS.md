# Test National IDs for DLV Burundi

Use these test National IDs to test the authentication flow:

## 13-Digit Format (From Database setup.sql)
- `1198700123456` - Jean Baptiste NIYONGABO
- `1199200234567` - Marie Claire NZEYIMANA  
- `1199500345678` - Pierre HAKIZIMANA
- `1198800456789` - Esperance NDAYISHIMIYE
- `1199700567890` - Emmanuel BIGIRIMANA

## Testing Instructions
1. Go to http://localhost:3002/apply
2. Select a license type
3. Click "Continue"
4. Enter any of the 13-digit National IDs above
5. Click "Send OTP"
6. Enter any 6-digit code (e.g., 123456) for the OTP
7. The system should authenticate and proceed

## Notes
- The validation now accepts 13-digit National IDs (as per setup.sql)
- In development mode, any 6-digit OTP will work
- The backend uses Supabase with dummy citizen data from setup.sql
