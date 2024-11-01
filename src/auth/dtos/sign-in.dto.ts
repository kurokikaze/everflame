import { IsString } from 'class-validator';
import { PasswordsDto } from './passwords.dto';

export abstract class SignInDto extends PasswordsDto {
    @IsString()
    public emailOrUsername!: string;

    @IsString()
    public password!: string;
}
