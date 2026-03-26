/**
 * ==============================================================================
 * Meta Conversions API (CAPI) Service
 * ==============================================================================
 *
 * Server-side event tracking for Meta Ads.
 * Sends conversion events directly to Meta's API for accurate attribution.
 *
 * Events tracked:
 * - Lead: When user starts trial scan
 * - CompleteRegistration: When user creates account
 * - StartTrial: When scan completes
 * - Purchase: When user makes a purchase
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as crypto from 'crypto';

interface UserData {
  email?: string;
  phone?: string;
  ip?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
  externalId?: string;
}

interface ScanResults {
  total?: number;
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
}

@Injectable()
export class ConversionsTrackingService {
  private readonly logger = new Logger(ConversionsTrackingService.name);
  private readonly pixelId: string;
  private readonly accessToken: string;
  private readonly apiVersion = 'v21.0';
  private readonly testEventCode: string;
  private readonly eventSourceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.pixelId = this.configService.get<string>('META_PIXEL_ID') || '';
    this.accessToken = this.configService.get<string>('META_ACCESS_TOKEN') || '';
    this.testEventCode = this.configService.get<string>('META_TEST_EVENT_CODE') || '';
    this.eventSourceUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  /**
   * Check if tracking is enabled
   */
  private isEnabled(): boolean {
    return !!(this.pixelId && this.accessToken);
  }

  /**
   * Hash value with SHA256 (required for PII data)
   */
  private hashSHA256(value: string): string | null {
    if (!value) return null;
    return crypto
      .createHash('sha256')
      .update(value.toLowerCase().trim())
      .digest('hex');
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Build user_data object with proper hashing
   */
  private buildUserData(userData: UserData): Record<string, any> {
    const data: Record<string, any> = {};

    if (userData.email) {
      data.em = [this.hashSHA256(userData.email)];
    }
    if (userData.phone) {
      // Normalize phone: remove non-digits, add Brazil country code
      let phone = userData.phone.replace(/\D/g, '');
      if (!phone.startsWith('55')) {
        phone = '55' + phone;
      }
      data.ph = [this.hashSHA256(phone)];
    }
    if (userData.externalId) {
      data.external_id = [this.hashSHA256(userData.externalId)];
    }
    if (userData.ip) {
      data.client_ip_address = userData.ip;
    }
    if (userData.userAgent) {
      data.client_user_agent = userData.userAgent;
    }
    if (userData.fbc) {
      data.fbc = userData.fbc;
    }
    if (userData.fbp) {
      data.fbp = userData.fbp;
    }

    return data;
  }

  /**
   * Send event to Meta Conversions API
   */
  private async sendEvent(eventData: Record<string, any>): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.debug('CAPI disabled: Missing META_PIXEL_ID or META_ACCESS_TOKEN');
      return;
    }

    return new Promise((resolve) => {
      const payload: Record<string, any> = { data: [eventData] };

      if (this.testEventCode) {
        payload.test_event_code = this.testEventCode;
      }

      const postData = JSON.stringify(payload);

      const options = {
        hostname: 'graph.facebook.com',
        path: `/${this.apiVersion}/${this.pixelId}/events`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Authorization': `Bearer ${this.accessToken}`,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode === 200) {
            this.logger.debug(`CAPI event sent: ${eventData.event_name}`);
          } else {
            this.logger.warn(`CAPI response ${res.statusCode}: ${data}`);
          }
          resolve();
        });
      });

      req.on('error', (err) => {
        this.logger.error(`CAPI error: ${err.message}`);
        resolve(); // Don't reject, tracking should not break the app
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Track Lead event - when user starts trial scan
   */
  async trackLead(userData: UserData, customData?: Record<string, any>): Promise<void> {
    const event = {
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: this.generateEventId('lead'),
      action_source: 'website',
      event_source_url: `${this.eventSourceUrl}/scan`,
      user_data: this.buildUserData(userData),
      custom_data: {
        content_name: 'App Trial Started',
        content_category: 'App',
        ...customData,
      },
    };

    await this.sendEvent(event);
  }

  /**
   * Track CompleteRegistration event - when user creates account
   */
  async trackCompleteRegistration(userData: UserData): Promise<void> {
    const event = {
      event_name: 'CompleteRegistration',
      event_time: Math.floor(Date.now() / 1000),
      event_id: this.generateEventId('reg'),
      action_source: 'website',
      event_source_url: `${this.eventSourceUrl}/app`,
      user_data: this.buildUserData(userData),
      custom_data: {
        content_name: 'App Account Created',
        status: 'completed',
      },
    };

    await this.sendEvent(event);
  }

  /**
   * Track StartTrial event - when scan completes
   */
  async trackScanCompleted(userData: UserData, scanResults: ScanResults): Promise<void> {
    const totalVulnerabilities =
      (scanResults.critical || 0) +
      (scanResults.high || 0) +
      (scanResults.medium || 0) +
      (scanResults.low || 0);

    const event = {
      event_name: 'StartTrial',
      event_time: Math.floor(Date.now() / 1000),
      event_id: this.generateEventId('scan'),
      action_source: 'website',
      event_source_url: this.eventSourceUrl,
      user_data: this.buildUserData(userData),
      custom_data: {
        content_name: 'Action Completed',
        content_category: 'App',
        vulnerabilities_found: totalVulnerabilities,
        critical_count: scanResults.critical || 0,
        high_count: scanResults.high || 0,
        medium_count: scanResults.medium || 0,
        low_count: scanResults.low || 0,
      },
    };

    await this.sendEvent(event);
  }

  /**
   * Track Purchase event - when user makes a purchase
   */
  async trackPurchase(
    userData: UserData,
    value: number,
    currency = 'BRL',
    planName?: string,
  ): Promise<void> {
    const event = {
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: this.generateEventId('purchase'),
      action_source: 'website',
      event_source_url: this.eventSourceUrl,
      user_data: this.buildUserData(userData),
      custom_data: {
        value,
        currency,
        content_name: planName || 'App Plan',
        content_type: 'product',
        num_items: 1,
      },
    };

    await this.sendEvent(event);
  }

  /**
   * Track ViewContent event - when user views pricing or other key pages
   */
  async trackViewContent(
    userData: UserData,
    pageName: string,
    pageUrl?: string,
  ): Promise<void> {
    const event = {
      event_name: 'ViewContent',
      event_time: Math.floor(Date.now() / 1000),
      event_id: this.generateEventId('vc'),
      action_source: 'website',
      event_source_url: pageUrl || this.eventSourceUrl,
      user_data: this.buildUserData(userData),
      custom_data: {
        content_name: pageName,
        content_category: 'App',
      },
    };

    await this.sendEvent(event);
  }
}
