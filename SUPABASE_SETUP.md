# Connect The Sushi Home to Supabase

## 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com). In the project dashboard,
open **SQL Editor**, paste the contents of `supabase-schema.sql`, and run it.

If you ran an earlier version of the SQL, run the updated file again. No customer
account is needed. Visitors can submit orders, and anyone can read or submit
reviews. Orders remain private; view them in the Supabase dashboard's **Table
Editor → orders**. Website visitors are recorded in **Table Editor → visits**
once per browser/device, even if they return after several days. A random ID is
kept in that browser's local storage and a unique database constraint prevents
duplicate visit rows. Refreshing or opening another tab won't add a visit.
Different browsers/devices, or clearing browser storage, will be counted
separately. No IP address or email is stored for visit counting. Re-run this
updated SQL to add the visitor ID, unique index, and safe `record_visit` function
to an existing visits table. The function avoids exposing visit records to
public reads.

## 2. Add the public project settings

In the project dashboard, open **Project Settings → API** and copy the Project URL
and the **publishable** key (or legacy `anon` key). Put them in `supabase-config.js`:

```js
window.SUPABASE_CONFIG = {
  url: "https://YOUR-PROJECT.supabase.co",
  anonKey: "YOUR-PUBLISHABLE-OR-ANON-KEY"
};
```

The publishable/anon key is intended for browser use and is restricted by the
row-level security policies in the SQL schema. **Never put a `service_role` key
in this file**; it bypasses row-level security.

## 3. Run the site

From the project folder, run `node serve.js`, then open
`http://localhost:3000/` (not the `index.html` file URL). Clicking **Send order
on WhatsApp** saves the order to Supabase and opens a prefilled WhatsApp message.
The website cannot detect whether the message is actually sent.

Anonymous visitors can submit orders and reviews under the included row-level
security policies. Before using this publicly, consider adding CAPTCHA or
server-side rate limiting to prevent spam. Keep the Supabase `service_role`
secret out of browser code.
