import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/sqlite';
import { CommonService } from '../common/common.service';
import { UserEntity } from './entities/user.entity';
import { isNull, isUndefined } from 'src/common/utils/validation.util';
import { compare, hash } from 'bcrypt';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ChangeEmailDto } from './dtos/change-email.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly usersRepository: EntityRepository<UserEntity>,
        private readonly entityManager: EntityManager,
        private readonly commonService: CommonService,
    ) { }

    public async create(
        email: string,
        name: string,
        password: string,
    ): Promise<UserEntity> {
        const formattedEmail = email.toLowerCase();
        await this.checkEmailUniqueness(formattedEmail);
        const formattedName = this.commonService.formatName(name);
        const user = this.usersRepository.create({
            email: formattedEmail,
            name: formattedName,
            username: await this.generateUsername(formattedName),
            password: await hash(password, 10),
        });
        await this.commonService.saveEntity(this.entityManager, user, true);
        return user;
    }

    // ...

    private async checkEmailUniqueness(email: string): Promise<void> {
        const count = await this.usersRepository.count({ email });

        if (count > 0) {
            throw new ConflictException('Email already in use');
        }
    }

    /**
     * Generate Username
     *
     * Generates a unique username using a point slug based on the name
     * and if it's already in use, it adds the usernames count to the end
     */
    private async generateUsername(name: string): Promise<string> {
        const pointSlug = this.commonService.generatePointSlug(name);
        const count = await this.usersRepository.count({
            username: {
                $like: `${pointSlug}%`,
            },
        });

        if (count > 0) {
            return `${pointSlug}${count}`;
        }

        return pointSlug;
    }

    private userById(id: number): Promise<UserEntity> {
        return this.findOneById(id);
    }

    public async findOneById(id: number): Promise<UserEntity> {
        const user = await this.usersRepository.findOne({ id });
        this.commonService.checkEntityExistence(user, 'User');
        return user;
    }

    public async findOneByEmail(email: string): Promise<UserEntity> {
        const user = await this.usersRepository.findOne({
            email: email.toLowerCase(),
        });
        this.throwUnauthorizedException(user);
        return user;
    }

    // necessary for password reset
    public async uncheckedUserByEmail(email: string): Promise<UserEntity> {
        return this.usersRepository.findOne({
            email: email.toLowerCase(),
        });
    }

    private throwUnauthorizedException(
        user: undefined | null | UserEntity,
    ): void {
        if (isUndefined(user) || isNull(user)) {
            throw new UnauthorizedException('Invalid credentials');
        }
    }

    public async findOneByCredentials(
        id: number,
        version: number,
    ): Promise<UserEntity> {
        const user = await this.usersRepository.findOne({ id });
        this.throwUnauthorizedException(user);

        if (user.credentials.version !== version) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return user;
    }

    public async findOneByUsername(
        username: string,
        forAuth = false,
    ): Promise<UserEntity> {
        const user = await this.usersRepository.findOne({
            username: username.toLowerCase(),
        });

        if (forAuth) {
            this.throwUnauthorizedException(user);
        } else {
            this.commonService.checkEntityExistence(user, 'User');
        }

        return user;
    }

    public async update(userId: number, dto: UpdateUserDto): Promise<UserEntity> {
        const user = await this.findOneById(userId);
        const { name, username } = dto;

        if (!isUndefined(name) && !isNull(name)) {
            if (name === user.name) {
                throw new BadRequestException('Name must be different');
            }

            user.name = this.commonService.formatName(name);
        }
        if (!isUndefined(username) && !isNull(username)) {
            const formattedUsername = dto.username.toLowerCase();

            if (user.username === formattedUsername) {
                throw new BadRequestException('Username should be different');
            }

            await this.checkUsernameUniqueness(formattedUsername);
            user.username = formattedUsername;
        }

        await this.commonService.saveEntity(this.entityManager, user);
        return user;
    }

    private async checkUsernameUniqueness(username: string): Promise<void> {
        const count = await this.usersRepository.count({ username });

        if (count > 0) {
            throw new ConflictException('Username already in use');
        }
    }

    public async updateEmail(
        userId: number,
        dto: ChangeEmailDto,
    ): Promise<UserEntity> {
        const user = await this.userById(userId);
        const { email, password } = dto;

        if (!(await compare(password, user.password))) {
            throw new BadRequestException('Invalid password');
        }

        const formattedEmail = email.toLowerCase();
        await this.checkEmailUniqueness(formattedEmail);
        user.credentials.updateVersion();
        user.email = formattedEmail;
        await this.commonService.saveEntity(this.entityManager, user);
        return user;
    }

    public async updatePassword(
        userId: number,
        password: string,
        newPassword: string,
    ): Promise<UserEntity> {
        const user = await this.userById(userId);

        if (!(await compare(password, user.password))) {
            throw new BadRequestException('Wrong password');
        }
        if (await compare(newPassword, user.password)) {
            throw new BadRequestException('New password must be different');
        }

        user.credentials.updatePassword(user.password);
        user.password = await hash(newPassword, 10);
        await this.commonService.saveEntity(this.entityManager, user);
        return user;
    }

    public async resetPassword(
        userId: number,
        version: number,
        password: string,
    ): Promise<UserEntity> {
        const user = await this.findOneByCredentials(userId, version);
        user.credentials.updatePassword(user.password);
        user.password = await hash(password, 10);
        await this.commonService.saveEntity(this.entityManager, user);
        return user;
    }

    public async remove(userId: number): Promise<UserEntity> {
        const user = await this.findOneById(userId);
        await this.commonService.removeEntity(this.entityManager, user);
        return user;
    }

}
