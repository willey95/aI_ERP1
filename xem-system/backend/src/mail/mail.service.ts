import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;
  private readonly logger = new Logger(MailService.name);
  private readonly mailEnabled: boolean;

  constructor(private configService: ConfigService) {
    // Check if mail is enabled
    this.mailEnabled = this.configService.get('MAIL_ENABLED') === 'true';

    if (this.mailEnabled) {
      // Create nodemailer transporter
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST'),
        port: this.configService.get('SMTP_PORT'),
        secure: this.configService.get('SMTP_SECURE') === 'true', // true for 465, false for other ports
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
      });

      this.logger.log('Mail service initialized');
    } else {
      this.logger.warn('Mail service is disabled. Set MAIL_ENABLED=true to enable.');
    }
  }

  async sendExecutionRequestNotification(data: {
    to: string;
    recipientName: string;
    requestNumber: string;
    projectName: string;
    budgetItem: string;
    amount: number;
    purpose: string;
    requestedBy: string;
  }) {
    const subject = `[XEM] New Execution Request - ${data.requestNumber}`;
    const html = this.getExecutionRequestTemplate(data);

    return this.sendMail(data.to, subject, html);
  }

  async sendApprovalResultNotification(data: {
    to: string;
    recipientName: string;
    requestNumber: string;
    projectName: string;
    amount: number;
    status: 'APPROVED' | 'REJECTED';
    approverName: string;
    comments?: string;
  }) {
    const subject = `[XEM] Execution Request ${data.status} - ${data.requestNumber}`;
    const html = this.getApprovalResultTemplate(data);

    return this.sendMail(data.to, subject, html);
  }

  async sendBudgetTransferNotification(data: {
    to: string;
    recipientName: string;
    projectName: string;
    sourceItem: string;
    targetItem: string;
    amount: number;
    reason: string;
    createdBy: string;
  }) {
    const subject = `[XEM] Budget Transfer Request - ${data.projectName}`;
    const html = this.getBudgetTransferTemplate(data);

    return this.sendMail(data.to, subject, html);
  }

  async sendBudgetThresholdAlert(data: {
    to: string;
    recipientName: string;
    projectName: string;
    budgetItem: string;
    executionRate: number;
    remainingBeforeExec: number;
  }) {
    const subject = `[XEM] ⚠️ Budget Threshold Alert - ${data.projectName}`;
    const html = this.getBudgetThresholdTemplate(data);

    return this.sendMail(data.to, subject, html);
  }

  private async sendMail(to: string, subject: string, html: string) {
    if (!this.mailEnabled) {
      this.logger.log(`[MAIL DISABLED] Would send email to ${to}: ${subject}`);
      return { success: false, message: 'Mail service is disabled' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM'),
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return { success: false, error: error.message };
    }
  }

  private getExecutionRequestTemplate(data: {
    recipientName: string;
    requestNumber: string;
    projectName: string;
    budgetItem: string;
    amount: number;
    purpose: string;
    requestedBy: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .label { font-weight: bold; color: #4a5568; }
    .value { color: #2d3748; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #718096; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Execution Request</h1>
      <p>새로운 집행 품의가 도착했습니다</p>
    </div>
    <div class="content">
      <p>안녕하세요, ${data.recipientName}님</p>
      <p>새로운 집행 품의가 귀하의 승인을 기다리고 있습니다.</p>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #667eea;">Execution Request Details</h3>
        <div class="info-row">
          <span class="label">Request #:</span>
          <span class="value">${data.requestNumber}</span>
        </div>
        <div class="info-row">
          <span class="label">Project:</span>
          <span class="value">${data.projectName}</span>
        </div>
        <div class="info-row">
          <span class="label">Budget Item:</span>
          <span class="value">${data.budgetItem}</span>
        </div>
        <div class="info-row">
          <span class="label">Amount:</span>
          <span class="value" style="font-size: 18px; font-weight: bold; color: #667eea;">₩${data.amount.toLocaleString()}</span>
        </div>
        <div class="info-row">
          <span class="label">Purpose:</span>
          <span class="value">${data.purpose}</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="label">Requested By:</span>
          <span class="value">${data.requestedBy}</span>
        </div>
      </div>

      <p style="text-align: center;">
        <a href="${this.configService.get('FRONTEND_URL')}/approvals" class="button">
          View in XEM System
        </a>
      </p>

      <p style="color: #718096; font-size: 14px;">
        이 품의를 검토하고 승인 또는 반려하려면 위 버튼을 클릭하여 시스템에 로그인하세요.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} XEM - Execution & Expenditure Management</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getApprovalResultTemplate(data: {
    recipientName: string;
    requestNumber: string;
    projectName: string;
    amount: number;
    status: 'APPROVED' | 'REJECTED';
    approverName: string;
    comments?: string;
  }): string {
    const statusColor = data.status === 'APPROVED' ? '#48bb78' : '#f56565';
    const statusText = data.status === 'APPROVED' ? '승인되었습니다' : '반려되었습니다';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${statusColor}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor}; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .label { font-weight: bold; color: #4a5568; }
    .value { color: #2d3748; }
    .status-badge { display: inline-block; padding: 8px 16px; background: ${statusColor}; color: white; border-radius: 20px; font-weight: bold; }
    .button { display: inline-block; padding: 12px 24px; background: ${statusColor}; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #718096; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Execution Request ${data.status}</h1>
      <p>집행 품의가 ${statusText}</p>
    </div>
    <div class="content">
      <p>안녕하세요, ${data.recipientName}님</p>
      <p>귀하의 집행 품의가 처리되었습니다.</p>

      <div class="info-box">
        <div style="text-align: center; margin-bottom: 20px;">
          <span class="status-badge">${data.status}</span>
        </div>

        <div class="info-row">
          <span class="label">Request #:</span>
          <span class="value">${data.requestNumber}</span>
        </div>
        <div class="info-row">
          <span class="label">Project:</span>
          <span class="value">${data.projectName}</span>
        </div>
        <div class="info-row">
          <span class="label">Amount:</span>
          <span class="value" style="font-size: 18px; font-weight: bold;">₩${data.amount.toLocaleString()}</span>
        </div>
        <div class="info-row">
          <span class="label">Approved By:</span>
          <span class="value">${data.approverName}</span>
        </div>
        ${data.comments ? `
        <div class="info-row" style="border-bottom: none;">
          <span class="label">Comments:</span>
          <span class="value">${data.comments}</span>
        </div>
        ` : ''}
      </div>

      <p style="text-align: center;">
        <a href="${this.configService.get('FRONTEND_URL')}/executions" class="button">
          View Details
        </a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} XEM - Execution & Expenditure Management</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getBudgetTransferTemplate(data: {
    recipientName: string;
    projectName: string;
    sourceItem: string;
    targetItem: string;
    amount: number;
    reason: string;
    createdBy: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5576c; }
    .transfer-visual { background: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .arrow { text-align: center; font-size: 24px; color: #f5576c; margin: 10px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .label { font-weight: bold; color: #4a5568; }
    .value { color: #2d3748; }
    .button { display: inline-block; padding: 12px 24px; background: #f5576c; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #718096; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Budget Transfer Request</h1>
      <p>예산 전용 요청</p>
    </div>
    <div class="content">
      <p>안녕하세요, ${data.recipientName}님</p>
      <p>새로운 예산 전용 요청이 도착했습니다.</p>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #f5576c;">Project: ${data.projectName}</h3>

        <div class="transfer-visual">
          <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
            <strong>From:</strong> ${data.sourceItem}
          </div>
          <div class="arrow">↓ ₩${data.amount.toLocaleString()}</div>
          <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 10px;">
            <strong>To:</strong> ${data.targetItem}
          </div>
        </div>

        <div class="info-row">
          <span class="label">Reason:</span>
          <span class="value">${data.reason}</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="label">Created By:</span>
          <span class="value">${data.createdBy}</span>
        </div>
      </div>

      <p style="text-align: center;">
        <a href="${this.configService.get('FRONTEND_URL')}/budget/transfers" class="button">
          Review Transfer
        </a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} XEM - Execution & Expenditure Management</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getBudgetThresholdTemplate(data: {
    recipientName: string;
    projectName: string;
    budgetItem: string;
    executionRate: number;
    remainingBeforeExec: number;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .warning-box { background: #fffaf0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ed8936; }
    .progress-bar { background: #e2e8f0; height: 30px; border-radius: 15px; overflow: hidden; margin: 20px 0; }
    .progress-fill { background: linear-gradient(90deg, #ed8936 0%, #dd6b20 100%); height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .label { font-weight: bold; color: #4a5568; }
    .value { color: #2d3748; }
    .button { display: inline-block; padding: 12px 24px; background: #ed8936; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #718096; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Budget Threshold Alert</h1>
      <p>예산 임계값 경고</p>
    </div>
    <div class="content">
      <p>안녕하세요, ${data.recipientName}님</p>
      <p><strong>주의:</strong> 프로젝트 예산이 임계값을 초과했습니다.</p>

      <div class="warning-box">
        <h3 style="margin-top: 0; color: #ed8936;">Project: ${data.projectName}</h3>
        <h4 style="color: #4a5568;">Budget Item: ${data.budgetItem}</h4>

        <div class="progress-bar">
          <div class="progress-fill" style="width: ${data.executionRate}%;">
            ${data.executionRate.toFixed(1)}%
          </div>
        </div>

        <div class="info-row">
          <span class="label">Execution Rate:</span>
          <span class="value" style="color: #dd6b20; font-size: 18px; font-weight: bold;">${data.executionRate.toFixed(2)}%</span>
        </div>
        <div class="info-row" style="border-bottom: none;">
          <span class="label">Remaining Budget (Before Exec):</span>
          <span class="value" style="font-weight: bold;">₩${data.remainingBeforeExec.toLocaleString()}</span>
        </div>
      </div>

      <p style="background: #fff5f5; padding: 15px; border-radius: 6px; border-left: 3px solid #fc8181;">
        <strong>권장사항:</strong> 예산 집행률이 높습니다. 남은 예산을 확인하고 필요시 예산 전용을 검토하세요.
      </p>

      <p style="text-align: center;">
        <a href="${this.configService.get('FRONTEND_URL')}/budget" class="button">
          View Budget Details
        </a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} XEM - Execution & Expenditure Management</p>
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}
