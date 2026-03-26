/**
 * AdminService - Administration Service
 *
 * Provides dashboard statistics using company data.
 *
 * @module admin
 * @see {@link AdminController} for HTTP endpoints
 */
import { Injectable } from '@nestjs/common';
import { CompanyService } from '../company/company.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly companyService: CompanyService,
  ) {}

  /** Returns general system stats for a user. */
  async getStats(userId: string) {
    const totalCompanies = await this.companyService.count(userId);
    return { totalCompanies };
  }

  /** Returns admin dashboard data. */
  async getDashboard(userId: string) {
    const stats = await this.getStats(userId);
    const companies = await this.companyService.findAllByUser(userId);

    return {
      stats,
      recentCompanies: companies.slice(0, 5),
    };
  }
}
