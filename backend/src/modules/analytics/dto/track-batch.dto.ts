import { ValidateNested, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { TrackAnalyticsEventDto } from './track-event.dto';

export class TrackBatchDto {
  @ValidateNested({ each: true })
  @Type(() => TrackAnalyticsEventDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  events!: TrackAnalyticsEventDto[];
}
