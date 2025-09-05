# Supabase Setup Guide for McDonald's Task Scheduler

This guide will help you set up Supabase as the database backend for your McDonald's Task Scheduler application.

## 🚀 Quick Setup Steps

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Sign in to your account
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: `mcdonalds-task-scheduler`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"

### 2. Get Your Project Credentials
1. Once your project is created, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://abcdefghij.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIs...`)

### 3. Set Up Environment Variables
1. In your project root, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### 4. Set Up Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql` from your project
3. Paste it into the SQL Editor
4. Click **Run** to execute the schema

### 5. Deploy to Vercel
1. In your Vercel dashboard, go to your project settings
2. Add the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy your application

## ✅ Verification

After setup, your application will:
- ✅ Automatically detect Supabase and use it for storage
- ✅ Persist data across sessions and users
- ✅ Show "🎯 Using Supabase for data storage" in the logs
- ✅ Store employee schedules, assignments, and day parts reliably

## 🔧 Database Schema

The setup creates a single table `mcd_data` with:
- `category`: Data type (schedules, assignments, dayparts)
- `filename`: Identifier (usually date: 2025-01-01)
- `data`: JSON data containing the actual information
- Automatic timestamps and indexing for performance

## 🛡️ Security

The default setup allows all operations for development. For production:
1. Review the Row Level Security (RLS) policies in `supabase-schema.sql`
2. Consider implementing user authentication
3. Customize access policies based on your needs

## 📊 Monitoring

In your Supabase dashboard you can:
- View and edit data in the **Table Editor**
- Monitor usage in **Reports**
- Set up real-time subscriptions if needed
- Create backups and manage data

## 🆘 Troubleshooting

### "Supabase connection test failed"
- Check your environment variables are correct
- Verify your project URL and API key
- Ensure your Supabase project is active

### "Failed to store employee data"
- Check the database schema is properly set up
- Verify RLS policies allow your operations
- Check the browser console for detailed error messages

### "Using temporary memory storage"
- This means Supabase connection failed
- Follow the setup steps above
- Check environment variables in Vercel settings

## 💡 Benefits of Supabase

- ✅ **Persistent Storage**: Data survives between sessions
- ✅ **Real-time Updates**: Multiple users can collaborate
- ✅ **Automatic Backups**: Built-in data protection
- ✅ **Scalable**: Grows with your needs
- ✅ **Free Tier**: Great for getting started
