/**
 * ==============================================================================
 * CommonModule - Modulo Global de Servicos Compartilhados
 * ==============================================================================
 *
 * Modulo que exporta servicos utilitarios usados em toda a aplicacao.
 * Marcado como @Global() para evitar imports repetidos em cada modulo.
 *
 * ## Servicos Incluidos
 *
 * | Servico           | Responsabilidade                        |
 * |-------------------|----------------------------------------|
 * | EncryptionService | Criptografia/descriptografia de dados  |
 *
 * ## Uso
 *
 * O modulo e importado uma vez no AppModule. Os servicos ficam
 * disponiveis automaticamente em qualquer modulo da aplicacao.
 *
 * ```typescript
 * // Qualquer service pode injetar diretamente
 * constructor(private readonly encryptionService: EncryptionService) {}
 * ```
 *
 * @module common
 */
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncryptionService } from './services/encryption.service';
import { SecureStoreService } from './services/secure-store.service';
import { EmailService } from './services/email.service';
import { ConversionsTrackingService } from './services/conversions-tracking.service';
import { AuthGuard } from './guards/auth.guard';
import { OptionalAuthGuard } from './guards/optional-auth.guard';
import { SecureStore } from '../database/entities/secure-store.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SecureStore])],
  providers: [
    EncryptionService,
    SecureStoreService,
    EmailService,
    ConversionsTrackingService,
    AuthGuard,
    OptionalAuthGuard,
  ],
  exports: [
    EncryptionService,
    SecureStoreService,
    EmailService,
    ConversionsTrackingService,
    AuthGuard,
    OptionalAuthGuard,
  ],
})
export class CommonModule {}
