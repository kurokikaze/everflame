import { Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { CommonService } from '../common/common.service.js';

@Module({
  providers: [JwtService, CommonService],
  exports: [JwtService],
})
export class JwtModule {}
