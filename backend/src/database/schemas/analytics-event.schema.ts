import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AnalyticsEventDocument = HydratedDocument<AnalyticsEvent>;

@Schema({ collection: 'analytics_events', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class AnalyticsEvent {
  @Prop({ required: true, index: true })
  sessionId!: string;

  @Prop({ index: true })
  visitorId?: string;

  @Prop({ required: true, index: true })
  eventName!: string;

  @Prop({ type: Object })
  eventData?: Record<string, unknown>;

  @Prop()
  page?: string;

  @Prop()
  referrer?: string;

  @Prop()
  hostname?: string;

  @Prop({ index: true })
  scanId?: string;

  @Prop()
  funnelVariant?: string;

  @Prop()
  utmSource?: string;

  @Prop()
  utmMedium?: string;

  @Prop()
  utmCampaign?: string;

  @Prop()
  utmContent?: string;

  @Prop()
  utmTerm?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  language?: string;

  @Prop()
  screenWidth?: number;

  @Prop()
  screenHeight?: number;
}

export const AnalyticsEventSchema = SchemaFactory.createForClass(AnalyticsEvent);

AnalyticsEventSchema.index({ sessionId: 1, created_at: 1 });
AnalyticsEventSchema.index({ eventName: 1, created_at: 1 });
AnalyticsEventSchema.index({ scanId: 1, created_at: 1 });
