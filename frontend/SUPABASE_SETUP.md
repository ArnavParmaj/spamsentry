# Supabase History Table Setup

## 📋 Table Schema

### Attributes

| Column       | Type         | Description                          | Required | Default             |
| ------------ | ------------ | ------------------------------------ | -------- | ------------------- |
| `id`         | UUID         | Primary key, auto-generated          | ✅       | `gen_random_uuid()` |
| `user_id`    | UUID         | Foreign key to `auth.users`          | ✅       | -                   |
| `text`       | TEXT         | The message/content that was scanned | ✅       | -                   |
| `result`     | VARCHAR(50)  | Prediction result ("SPAM" or "HAM")  | ✅       | -                   |
| `confidence` | DECIMAL(5,2) | ML model confidence (0.00 to 1.00)   | ✅       | -                   |
| `is_spam`    | BOOLEAN      | Quick flag for filtering             | ✅       | `false`             |
| `created_at` | TIMESTAMPTZ  | When the scan was performed          | ❌       | `NOW()`             |

### Example Row

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "user-uuid-from-auth-users",
  "text": "URGENT: Click here to claim your prize!",
  "result": "SPAM",
  "confidence": 0.89,
  "is_spam": true,
  "created_at": "2026-02-16T01:44:00.000Z"
}
```

## 🔒 Security Features

### Row Level Security (RLS) Policies

1. **VIEW**: Users can only see their own scan history
2. **INSERT**: Users can only create scans for themselves
3. **DELETE**: Users can only delete their own scans
4. **UPDATE**: Users can only modify their own scans (optional)

This ensures complete data isolation between users.

## 🚀 How to Create the Table

### Method 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire SQL from `database_schema.sql`
5. Click **Run** or press `Ctrl+Enter`
6. Verify success in the **Table Editor**

### Method 2: Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref nkgvxspqrzvflqmroeny

# Run the migration
supabase db execute -f database_schema.sql
```

## ✅ Verification Steps

After running the SQL, verify in the Supabase Dashboard:

### 1. Check Table Structure

- Go to **Table Editor** → `history`
- Verify all 7 columns exist
- Check data types match

### 2. Check RLS is Enabled

- Go to **Authentication** → **Policies**
- Look for `history` table
- Verify 4 policies are active:
  - ✅ Users can view own history
  - ✅ Users can insert own history
  - ✅ Users can delete own history
  - ✅ Users can update own history

### 3. Check Indexes

- Go to **Database** → **Indexes**
- Verify these indexes exist:
  - `idx_history_user_id`
  - `idx_history_created_at`
  - `idx_history_is_spam`

## 🔗 How It's Used in the App

### Scanner.tsx (Saving Results)

```typescript
const { error } = await supabase.from("history").insert([
  {
    text: message,
    result: prediction.prediction, // "SPAM" or "HAM"
    confidence: prediction.confidence, // 0.85
    is_spam: prediction.is_spam, // true/false
    user_id: user.id, // Auto from auth
  },
]);
```

### Dashboard.tsx (Fetching History)

```typescript
const { data, error } = await supabase
  .from("history")
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false });
```

### Dashboard.tsx (Deleting Entry)

```typescript
const { error } = await supabase.from("history").delete().eq("id", id);
```

## 📊 Sample Data

After scanning a few messages, your table will look like:

| text                                | result | confidence | is_spam | created_at |
| ----------------------------------- | ------ | ---------- | ------- | ---------- |
| "URGENT click here free winner"     | SPAM   | 0.89       | true    | 2 min ago  |
| "Hey, how are you today?"           | HAM    | 0.92       | false   | 5 min ago  |
| "Click to verify your account now!" | SPAM   | 0.78       | true    | 10 min ago |

## 🎯 Next Steps

1. ✅ Run the SQL in Supabase Dashboard
2. ✅ Verify RLS policies are active
3. ✅ Test by creating a user and scanning text
4. ✅ Check Dashboard to see saved history
