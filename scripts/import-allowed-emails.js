/*
Simple script to import allowed emails into Supabase using the project's Supabase client.
Usage: node scripts/import-allowed-emails.js
It reads `scripts/allowed-emails.txt` (one email per line) and inserts them into `allowed_emails`.

Requirements: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment when running locally.
*/

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const EMAILS_FILE = path.join(__dirname, 'allowed-emails.txt');

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // needs elevated rights to insert maybe

  if (!supabaseUrl || !supabaseKey) {
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  if (!fs.existsSync(EMAILS_FILE)) {
    console.error('No allowed-emails.txt found in scripts/');
    process.exit(1);
  }

  const lines = fs.readFileSync(EMAILS_FILE, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  console.log(`Found ${lines.length} emails to import`);

  for (const email of lines) {
    const { data, error } = await supabase
      .from('allowed_emails')
      .upsert({ email }, { onConflict: ['email'] });

    if (error) {
      console.error('Error inserting', email, error.message || error);
    } else {
      console.log('Upserted', email);
    }
  }

  console.log('Done');
}

main().catch(err => { console.error(err); process.exit(1); });
