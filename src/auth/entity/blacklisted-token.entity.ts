import {
    Entity,
    ManyToOne,
    PrimaryKeyProp,
    Property,
    Unique,
} from '@mikro-orm/core';
import { UserEntity } from '../../users/entities/user.entity';
import { IBlacklistedToken } from '../interfaces/blacklisted-token.interface';

@Entity({ tableName: 'blacklisted_tokens' })
@Unique({ properties: ['tokenId', 'user'] })
export class BlacklistedTokenEntity implements IBlacklistedToken {
    @Property({
        primary: true,
        columnType: 'uuid',
    })
    public tokenId: string;

    @ManyToOne({
        entity: () => UserEntity,
        deleteRule: 'cascade',
        primary: true,
    })
    public user: UserEntity;

    @Property({ onCreate: () => new Date() })
    public createdAt: Date;

    [PrimaryKeyProp]: [string, number];
}
