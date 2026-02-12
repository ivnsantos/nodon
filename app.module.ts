import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlanosModule } from './planos/planos.module';
import { CuponsModule } from './cupons/cupons.module';
import { AssinaturasModule } from './assinaturas/assinaturas.module';
import { AnamnesesModule } from './anamneses/anamneses.module';
import { TypeOrmConfigService } from './config/typeorm.config';
import { PlanosService } from './planos/planos.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    AuthModule,
    UsersModule,
    PlanosModule,
    CuponsModule,
    AssinaturasModule,
    AnamnesesModule,
  ],
})
export class AppModule {
  constructor(private planosService: PlanosService) {}

  async onModuleInit() {
    try {
      await this.planosService.seedPlanos();
      console.log('✅ Planos inicializados');
    } catch (error) {
    }
  }
}

