import { Module } from '@nestjs/common';
import { BarcodeController } from './barCode.controller';
import { DbModule } from '../db/db.module';
import { BarcodePrisma } from './barCode.prisma';

@Module({
  imports: [DbModule],
  controllers: [BarcodeController],
  providers: [BarcodePrisma],
})
export class BarcodeModule {}
