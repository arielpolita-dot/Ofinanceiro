import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import {
  AdminUser, AdminSession, ActivityLog, SecureStore,
  Company, CompanyMember, CompanyInvite,
} from './entities';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [AdminUser, AdminSession, ActivityLog, SecureStore, Company, CompanyMember, CompanyInvite],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
