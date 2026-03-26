import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService, AuditSummary } from './email.service';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('EmailService', () => {
  let service: EmailService;

  const configValues: Record<string, string> = {
    AUTHIFY_URL: 'https://api.auth.test.com',
    AUTHIFY_API_KEY: 'test-api-key',
    FRONTEND_URL: 'https://app.test.com',
  };

  const mockConfigService = {
    get: jest.fn((key: string) => configValues[key]),
  };

  const baseSummary: AuditSummary = {
    critical: 2,
    high: 5,
    medium: 10,
    low: 3,
    secure: 50,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  describe('sendScanCompletedEmail', () => {
    it('should send email successfully and return true', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const result = await service.sendScanCompletedEmail(
        'user@test.com',
        'My Project',
        baseSummary,
        'report-123',
      );

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.auth.test.com/emails/send');
      expect(options.method).toBe('POST');
      expect(options.headers['x-api-key']).toBe('test-api-key');

      const body = JSON.parse(options.body);
      expect(body.to).toBe('user@test.com');
      expect(body.subject).toContain('CRITICO');
      expect(body.html).toContain('My Project');
      expect(body.text).toContain('My Project');
      expect(body.metadata.type).toBe('scan_completed');
    });

    it('should return false when API key is not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'AUTHIFY_API_KEY') return undefined;
        return configValues[key] as any;
      });

      const result = await service.sendScanCompletedEmail(
        'user@test.com',
        'Project',
        baseSummary,
      );

      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return false when API returns error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      // Restore config
      mockConfigService.get.mockImplementation((key: string) => configValues[key]);

      const result = await service.sendScanCompletedEmail(
        'user@test.com',
        'Project',
        baseSummary,
      );

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network timeout'));
      mockConfigService.get.mockImplementation((key: string) => configValues[key]);

      const result = await service.sendScanCompletedEmail(
        'user@test.com',
        'Project',
        baseSummary,
      );

      expect(result).toBe(false);
    });

    it('should throw when AUTHIFY_URL not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'AUTHIFY_URL') return undefined;
        return configValues[key] as any;
      });

      const result = await service.sendScanCompletedEmail('u@t.com', 'P', baseSummary);
      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should build subject with CRITICO for critical vulnerabilities', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      mockConfigService.get.mockImplementation((key: string) => configValues[key]);

      await service.sendScanCompletedEmail('u@t.com', 'Proj', {
        critical: 3, high: 0, medium: 0, low: 0, secure: 10,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.subject).toContain('[CRITICO]');
      expect(body.subject).toContain('3');
    });

    it('should build subject with ALERTA for high (no critical)', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await service.sendScanCompletedEmail('u@t.com', 'Proj', {
        critical: 0, high: 5, medium: 0, low: 0, secure: 10,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.subject).toContain('[ALERTA]');
    });

    it('should build subject for medium/low only', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await service.sendScanCompletedEmail('u@t.com', 'Proj', {
        critical: 0, high: 0, medium: 3, low: 1, secure: 10,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.subject).toContain('Vulnerabilidades encontradas');
    });

    it('should build subject for no vulnerabilities', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await service.sendScanCompletedEmail('u@t.com', 'Proj', {
        critical: 0, high: 0, medium: 0, low: 0, secure: 50,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.subject).toContain('Nenhuma vulnerabilidade');
    });

    it('should use trial scan link when trialScanId provided', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await service.sendScanCompletedEmail('u@t.com', 'P', baseSummary, undefined, 'trial-1');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.html).toContain('/scan/trial-1/result');
      expect(body.html).toContain('utm_source=email');
    });

    it('should use report link when reportId provided', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await service.sendScanCompletedEmail('u@t.com', 'P', baseSummary, 'rep-1');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.html).toContain('/projects/reports/rep-1');
    });

    it('should use default frontend URL when not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'FRONTEND_URL') return undefined;
        return configValues[key] as any;
      });
      mockFetch.mockResolvedValue({ ok: true });

      await service.sendScanCompletedEmail('u@t.com', 'P', baseSummary);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.html).toContain('http://localhost:5173');
    });

    it('should include text content with correct format', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      mockConfigService.get.mockImplementation((key: string) => configValues[key]);

      await service.sendScanCompletedEmail('u@t.com', 'TestProj', baseSummary);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).toContain('SCAN DE SEGURANCA FINALIZADO');
      expect(body.text).toContain('Projeto: TestProj');
      expect(body.text).toContain('Critica(s)');
      expect(body.text).toContain('ATENCAO');
    });

    it('should show PARABENS in text when no issues', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      await service.sendScanCompletedEmail('u@t.com', 'P', {
        critical: 0, high: 0, medium: 0, low: 0, secure: 10,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).toContain('PARABENS');
    });
  });

  describe('sendCompanyInviteEmail', () => {
    beforeEach(() => {
      mockConfigService.get.mockImplementation((key: string) => configValues[key]);
    });

    it('should send invite email successfully', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const result = await service.sendCompanyInviteEmail(
        'invite@test.com', 'Acme Corp', 'Diego', 'https://app.test.com/invite/abc',
      );

      expect(result).toBe(true);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.auth.test.com/emails/send');
      const body = JSON.parse(options.body);
      expect(body.to).toBe('invite@test.com');
      expect(body.subject).toContain('Acme Corp');
      expect(body.metadata.type).toBe('company_invite');
    });

    it('should return false when API key not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'AUTHIFY_API_KEY') return undefined;
        return configValues[key] as any;
      });

      const result = await service.sendCompanyInviteEmail(
        'invite@test.com', 'Acme', 'Diego', 'https://link',
      );

      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return false on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false, status: 500,
        text: () => Promise.resolve('Server Error'),
      });

      const result = await service.sendCompanyInviteEmail(
        'invite@test.com', 'Acme', 'Diego', 'https://link',
      );

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network fail'));

      const result = await service.sendCompanyInviteEmail(
        'invite@test.com', 'Acme', 'Diego', 'https://link',
      );

      expect(result).toBe(false);
    });
  });
});
