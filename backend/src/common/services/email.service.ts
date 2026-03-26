/**
 * EmailService - Sends transactional emails via Ohanax API.
 * Template building is delegated to email-templates.ts.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuditSummary,
  buildScanCompleteHtml,
  buildTextContent,
  buildCompanyInviteHtml,
  buildCompanyInviteText,
} from './email-templates';

export { AuditSummary } from './email-templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  /** Returns the email API endpoint URL. */
  private get emailApiUrl(): string {
    const authifyUrl = this.configService.get<string>('AUTHIFY_URL');
    if (!authifyUrl) {
      throw new Error('AUTHIFY_URL is not configured');
    }
    return `${authifyUrl}/emails/send`;
  }

  /** Sends a scan-completed notification email. */
  async sendScanCompletedEmail(
    to: string,
    projectName: string,
    summary: AuditSummary,
    reportId?: string,
    trialScanId?: string,
  ): Promise<boolean> {
    try {
      const apiKey = this.configService.get<string>('AUTHIFY_API_KEY');
      if (!apiKey) {
        this.logger.warn('AUTHIFY_API_KEY not configured, skipping email');
        return false;
      }

      const totalIssues = summary.critical + summary.high + summary.medium + summary.low;
      const subject = this.buildSubject(projectName, summary);
      const reportLink = this.buildReportLink(reportId, trialScanId);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(this.emailApiUrl, {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          html: buildScanCompleteHtml({ projectName, summary, totalIssues, reportLink }),
          text: buildTextContent({ projectName, summary, totalIssues }),
          metadata: { type: 'scan_completed', projectName, reportId, trialScanId, totalIssues },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to send email: ${response.status} - ${errorText}`);
        return false;
      }

      this.logger.log(`Scan completion email sent to ${to} for project ${projectName}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending email to ${to}: ${(error as Error).message}`);
      return false;
    }
  }

  /** Builds email subject based on scan severity. */
  private buildSubject(projectName: string, summary: AuditSummary): string {
    if (summary.critical > 0) {
      return `[CRITICO] Scan Finalizado: ${projectName} - ${summary.critical} vulnerabilidade(s) critica(s) encontrada(s)`;
    }
    if (summary.high > 0) {
      return `[ALERTA] Scan Finalizado: ${projectName} - ${summary.high} vulnerabilidade(s) de alta severidade`;
    }
    if (summary.medium > 0 || summary.low > 0) {
      return `Scan Finalizado: ${projectName} - Vulnerabilidades encontradas`;
    }
    return `Scan Finalizado: ${projectName} - Nenhuma vulnerabilidade encontrada`;
  }

  /** Sends a company invite email. */
  async sendCompanyInviteEmail(
    to: string,
    companyName: string,
    inviterName: string,
    acceptUrl: string,
  ): Promise<boolean> {
    try {
      const apiKey = this.configService.get<string>('AUTHIFY_API_KEY');
      if (!apiKey) {
        this.logger.warn('AUTHIFY_API_KEY not configured, skipping email');
        return false;
      }

      const subject = `Voce foi convidado para ${companyName}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(this.emailApiUrl, {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          html: buildCompanyInviteHtml({ companyName, inviterName, acceptUrl }),
          text: buildCompanyInviteText({ companyName, inviterName, acceptUrl }),
          metadata: { type: 'company_invite', companyName },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to send invite email: ${response.status} - ${errorText}`);
        return false;
      }

      this.logger.log(`Company invite email sent to ${to} for ${companyName}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending invite email to ${to}: ${(error as Error).message}`);
      return false;
    }
  }

  /** Builds the report link with UTM params. */
  private buildReportLink(reportId?: string, trialScanId?: string): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const utmParams = 'utm_source=email&utm_medium=scan_result&utm_campaign=scan_completed';

    if (trialScanId) return `${frontendUrl}/scan/${trialScanId}/result?paid=true&${utmParams}`;
    if (reportId) return `${frontendUrl}/projects/reports/${reportId}?${utmParams}`;
    return `${frontendUrl}?${utmParams}`;
  }
}
