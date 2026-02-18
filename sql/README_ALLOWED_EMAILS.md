# allowed_emails table

1) Run `sql/create_allowed_emails.sql` in the Supabase SQL editor to create the `allowed_emails` table.

2) Populate the table manually in Supabase UI, or use the script in `scripts/import-allowed-emails.js`.

3) To import with the script locally, set environment variables and run:

```powershell
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
node scripts/import-allowed-emails.js
```

The script reads `scripts/allowed-emails.txt`.

Notes:
- The script uses `upsert` so existing emails won't be duplicated.
- SERVICE_ROLE key must be kept secret; do not commit it to the repo.
