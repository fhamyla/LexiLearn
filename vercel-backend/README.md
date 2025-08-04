# Vercel Backend Setup

This backend handles OTP email sending for LexiLearn using Gmail SMTP.

## Setup Instructions

### Gmail Setup

1. **Enable 2-Step Verification** on your Google account:
   - Go to your Google Account settings
   - Navigate to Security
   - Enable 2-Step Verification if not already enabled

2. **Generate an App Password:**
   - Go to Google Account → Security → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password (not your regular Gmail password)

3. **Add environment variables to Vercel:**
   ```
   GMAIL_EMAIL=your-email@gmail.com
   GMAIL_PASSWORD=your-16-character-app-password
   ```

## Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the environment variables in Vercel dashboard:
   - Go to Settings → Environment Variables
   - Add `GMAIL_EMAIL` and `GMAIL_PASSWORD`
4. Deploy

## Testing

After deployment, your API endpoint will be:
`https://your-project-name.vercel.app/api/send-otp`

Send a POST request with:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

## Troubleshooting

- Make sure you're using the **App Password**, not your regular Gmail password
- Ensure 2-Step Verification is enabled on your Google account
- Check that the environment variables are correctly set in Vercel
- Gmail has daily sending limits (500 emails/day for regular accounts) 