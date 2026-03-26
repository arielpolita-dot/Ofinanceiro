/**
 * ==============================================================================
 * AnalyticsEvent Entity - Eventos de Analytics do Frontend
 * ==============================================================================
 *
 * Armazena todos os eventos de analytics disparados pelo frontend.
 * Substitui o Umami como solucao de analytics interna.
 *
 * ## Tabela: `app_analytics_events`
 *
 * ## Campos Principais
 *
 * | Campo           | Tipo      | Descricao                              |
 * |-----------------|-----------|----------------------------------------|
 * | id              | UUID      | ID unico do evento                     |
 * | sessionId       | VARCHAR   | ID da sessao do usuario                |
 * | eventName       | VARCHAR   | Nome do evento (funnel_*, cta_*, etc.) |
 * | eventData       | JSONB     | Dados customizados do evento           |
 * | page            | VARCHAR   | URL/path da pagina                     |
 * | referrer        | VARCHAR   | Pagina anterior                        |
 *
 * @module database/entities
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Dados do evento (flexivel para qualquer tipo de evento)
 */
export interface AnalyticsEventData {
  // Identificadores
  scan_id?: string;
  checkout_session_id?: string;
  project_id?: string;
  report_id?: string;

  // Vulnerabilidades
  total_vulns?: number;
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;

  // Pagamento
  value?: number;
  currency?: string;
  payment_status?: string;

  // Formulario
  first_field?: string;
  has_backend?: boolean;
  has_whatsapp?: boolean;
  form_started?: boolean;
  email_filled?: boolean;
  frontend_filled?: boolean;
  backend_filled?: boolean;
  whatsapp_filled?: boolean;

  // Navegacao
  reason?: string;
  from_email?: boolean;
  just_paid?: boolean;

  // Tempo
  time_on_page?: number;

  // Erros
  error?: string;
  detail?: string;
  retries?: number;

  // Generico
  [key: string]: unknown;
}

/**
 * Entidade de eventos de analytics.
 * @table app_analytics_events
 */
@Entity('app_analytics_events')
@Index(['sessionId', 'createdAt'])
@Index(['eventName', 'createdAt'])
@Index(['scanId', 'createdAt'])
@Index(['createdAt'])
@Index(['visitorId'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Identificacao da sessao/visitante
  @Column({ name: 'session_id', type: 'varchar', length: 100 })
  sessionId!: string;

  @Column({ name: 'visitor_id', type: 'varchar', length: 100, nullable: true })
  visitorId!: string | null;

  // Evento
  @Column({ name: 'event_name', type: 'varchar', length: 100 })
  eventName!: string;

  @Column({ name: 'event_data', type: 'jsonb', nullable: true })
  eventData!: AnalyticsEventData | null;

  // Contexto da pagina
  @Column({ type: 'varchar', length: 500, nullable: true })
  page!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  referrer!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hostname!: string | null;

  // Scan relacionado (para facilitar queries de funil)
  @Column({ name: 'scan_id', type: 'varchar', length: 100, nullable: true })
  scanId!: string | null;

  // UTM params
  @Column({ name: 'utm_source', type: 'varchar', length: 100, nullable: true })
  utmSource!: string | null;

  @Column({ name: 'utm_medium', type: 'varchar', length: 100, nullable: true })
  utmMedium!: string | null;

  @Column({ name: 'utm_campaign', type: 'varchar', length: 100, nullable: true })
  utmCampaign!: string | null;

  @Column({ name: 'utm_content', type: 'varchar', length: 100, nullable: true })
  utmContent!: string | null;

  @Column({ name: 'utm_term', type: 'varchar', length: 100, nullable: true })
  utmTerm!: string | null;

  // Dispositivo/Browser
  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent!: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  language!: string | null;

  @Column({ name: 'screen_width', type: 'integer', nullable: true })
  screenWidth!: number | null;

  @Column({ name: 'screen_height', type: 'integer', nullable: true })
  screenHeight!: number | null;

  // Funnel variant (A/B testing: original, video, pro)
  @Column({ name: 'funnel_variant', type: 'varchar', length: 20, nullable: true })
  funnelVariant!: string | null;

  // Timestamp
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;
}
