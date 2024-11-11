import { Module } from '@nestjs/common';
import { EntryInputController } from './entryinput.controller';
import { DbModule } from '../db/db.module';
import { EntryInputPrisma } from './entryinput.prisma';

@Module({
  imports: [DbModule],
  controllers: [EntryInputController],
  providers: [EntryInputPrisma],
})

export class EntryInputModule {}
