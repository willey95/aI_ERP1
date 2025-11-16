# Email Notification Setup Guide

This guide explains how to configure and use the email notification system in the XEM application.

## Overview

The XEM system includes an automated email notification service that sends notifications for:
- **Execution Requests**: Notify approvers when new execution requests are created
- **Approval Results**: Notify requesters when their execution requests are approved or rejected
- **Budget Transfers**: Notify approvers when budget transfer requests are created
- **Budget Threshold Alerts**: Warning emails when budget execution rate exceeds thresholds

## Configuration

### 1. Enable Email Service

Edit `/home/user/aI_ERP1/xem-system/backend/.env`:

```env
MAIL_ENABLED=true
```

### 2. Configure SMTP Settings

#### For Gmail:

1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to Google Account Settings → Security → 2-Step Verification → App Passwords
   - Create a new app password for "Mail"
3. Update `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM="XEM System <noreply@xem.com>"
```

#### For Other SMTP Providers:

**Office 365:**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
```

**Outlook.com:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

**Custom SMTP Server:**
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=465
SMTP_SECURE=true  # Use true for port 465 (SSL), false for port 587 (TLS)
```

### 3. Set Frontend URL

Make sure `FRONTEND_URL` is correctly set in `.env`:

```env
FRONTEND_URL="http://localhost:5173"  # Development
# or
FRONTEND_URL="https://xem.yourcompany.com"  # Production
```

This URL is used in email links to redirect users back to the application.

## Email Templates

The system includes professionally designed HTML email templates:

### 1. Execution Request Notification
Sent to approvers when a new execution request is created.
- Request details (number, project, amount, purpose)
- Direct link to approval dashboard
- Gradient purple header design

### 2. Approval Result Notification
Sent to requesters when their execution request is processed.
- Approval status (APPROVED/REJECTED)
- Approver name and comments
- Green header for approved, red for rejected

### 3. Budget Transfer Notification
Sent to approvers when a budget transfer request is created.
- Visual representation of transfer (from → to)
- Transfer amount and reason
- Pink gradient header

### 4. Budget Threshold Alert
Sent when budget execution rate exceeds warning thresholds (e.g., >75%).
- Visual progress bar showing execution rate
- Remaining budget amount
- Recommendations for action
- Orange warning design

## Usage in Code

The `MailService` is automatically available via dependency injection. Here's how to use it:

```typescript
import { MailService } from '../mail/mail.service';

@Injectable()
export class YourService {
  constructor(private mailService: MailService) {}

  async someMethod() {
    // Send execution request notification
    await this.mailService.sendExecutionRequestNotification({
      to: 'approver@company.com',
      recipientName: 'John Approver',
      requestNumber: 'EXE-2025-001',
      projectName: 'Seoul Metro Project',
      budgetItem: 'Labor Costs',
      amount: 50000000,
      purpose: 'Monthly labor payment',
      requestedBy: 'Kim Staff',
    });

    // Send approval result
    await this.mailService.sendApprovalResultNotification({
      to: 'requester@company.com',
      recipientName: 'Kim Staff',
      requestNumber: 'EXE-2025-001',
      projectName: 'Seoul Metro Project',
      amount: 50000000,
      status: 'APPROVED',
      approverName: 'John Approver',
      comments: 'Approved for payment',
    });

    // Send budget transfer notification
    await this.mailService.sendBudgetTransferNotification({
      to: 'approver@company.com',
      recipientName: 'John Approver',
      projectName: 'Seoul Metro Project',
      sourceItem: 'Materials > Steel',
      targetItem: 'Labor > Engineers',
      amount: 10000000,
      reason: 'Budget reallocation due to design changes',
      createdBy: 'Kim Staff',
    });

    // Send budget threshold alert
    await this.mailService.sendBudgetThresholdAlert({
      to: 'manager@company.com',
      recipientName: 'Park Manager',
      projectName: 'Seoul Metro Project',
      budgetItem: 'Materials > Concrete',
      executionRate: 85.5,
      remainingBudget: 15000000,
    });
  }
}
```

## Testing

### 1. Test Email Configuration

Create a simple test endpoint to verify SMTP settings:

```typescript
// In any controller
@Get('test-email')
async testEmail() {
  await this.mailService.sendExecutionRequestNotification({
    to: 'your-test-email@example.com',
    recipientName: 'Test User',
    requestNumber: 'TEST-001',
    projectName: 'Test Project',
    budgetItem: 'Test Item',
    amount: 1000000,
    purpose: 'Testing email configuration',
    requestedBy: 'System Admin',
  });
  return { message: 'Test email sent' };
}
```

### 2. Check Logs

Monitor backend logs for email sending status:

```bash
tail -f backend.log | grep "Email sent"
```

### 3. Disable for Development

If you don't want to send real emails during development:

```env
MAIL_ENABLED=false
```

Emails will be logged to console instead of being sent.

## Troubleshooting

### Error: "Invalid login"
- Check SMTP_USER and SMTP_PASS are correct
- For Gmail, ensure you're using an App Password, not your regular password
- Verify 2-factor authentication is enabled

### Error: "Connection refused"
- Check SMTP_HOST and SMTP_PORT are correct
- Verify firewall isn't blocking SMTP ports (587, 465)
- Try different SMTP_SECURE settings (true/false)

### Emails not arriving
- Check spam/junk folder
- Verify SMTP_FROM email address is valid
- Check recipient email address is correct
- Review backend logs for errors

### Gmail blocking sign-in
- Enable "Less secure app access" (not recommended)
- Use App Passwords instead (recommended)
- Check Google account security settings

## Production Recommendations

1. **Use a dedicated email service** (SendGrid, AWS SES, Mailgun) instead of personal Gmail
2. **Set up SPF and DKIM records** for your domain to improve deliverability
3. **Monitor email sending rates** to avoid hitting provider limits
4. **Implement retry logic** for failed email sends
5. **Add email templates customization** per company branding
6. **Log all email sends** for audit purposes
7. **Set up email rate limiting** to prevent abuse

## Integration Points

The email system is currently integrated with:

### ApprovalService
- Sends notification when execution request moves to approval workflow

### ExecutionService
- Sends result notification when request is approved/rejected

### BudgetTransferService
- Sends notification when budget transfer is created
- Sends notification when transfer is approved/rejected

### Future Integrations
- Budget threshold monitoring (automated cron job)
- Daily/weekly summary reports
- Deadline reminders
- System announcements

## Example Email Previews

All emails are responsive and include:
- Professional HTML design with gradients
- Company branding (XEM logo/name)
- Clear call-to-action buttons
- Tabular data presentation
- Mobile-friendly layout
- Korean language support (UTF-8)

### Template Structure
```
┌─────────────────────────────┐
│  Header (Gradient bg)       │
│  - Title                    │
│  - Subtitle (Korean)        │
└─────────────────────────────┘
┌─────────────────────────────┐
│  Content Area               │
│  - Greeting                 │
│  - Information Box          │
│    - Details table          │
│  - Action Button            │
│  - Additional notes         │
└─────────────────────────────┘
┌─────────────────────────────┐
│  Footer                     │
│  - Copyright                │
│  - Disclaimer               │
└─────────────────────────────┘
```

## Support

For issues or questions about the email system:
1. Check backend logs for error messages
2. Verify SMTP configuration in `.env`
3. Test with a simple email service like Gmail first
4. Contact system administrator for production SMTP access
