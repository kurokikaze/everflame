import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserEntity } from './entities/user.entity';
import { CommonService } from 'src/common/common.service';

@Module({
    imports: [MikroOrmModule.forFeature([UserEntity])],
    providers: [UsersService, CommonService],
    exports: [UsersService]
})
export class UsersModule {

}
