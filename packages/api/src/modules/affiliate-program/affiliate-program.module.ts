import { Module } from '@nestjs/common';
import { AffiliateProgramController } from './affiliate-program.controller';
import { AffiliateProgramService } from './affiliate-program.service';

@Module({
  controllers: [AffiliateProgramController],
  providers: [AffiliateProgramService],
  exports: [AffiliateProgramService],
})
export class AffiliateProgramModule {}
