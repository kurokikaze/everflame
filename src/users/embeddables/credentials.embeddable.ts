import { Embeddable, Property } from '@mikro-orm/core';
import dayjs from 'dayjs';
import { ICredentials } from '../interfaces/credentials.interface';

@Embeddable()
export class CredentialsEmbeddable implements ICredentials {
    @Property({ default: 0 })
    public version = 0;

    @Property({ default: '' })
    public lastPassword = '';

    @Property({ default: dayjs().unix() })
    public passwordUpdatedAt: number = dayjs().unix();

    @Property({ default: dayjs().unix() })
    public updatedAt: number = dayjs().unix();

    public updatePassword(password: string): void {
        this.version++;
        this.lastPassword = password;
        const now = dayjs().unix();
        this.passwordUpdatedAt = now;
        this.updatedAt = now;
    }

    public updateVersion(): void {
        this.version++;
        this.updatedAt = dayjs().unix();
    }
}
