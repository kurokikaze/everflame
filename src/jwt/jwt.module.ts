import { Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { CommonService } from 'src/common/common.service';

@Module({
  providers: [JwtService, CommonService],
  exports: [JwtService],
})
export class JwtModule {}
