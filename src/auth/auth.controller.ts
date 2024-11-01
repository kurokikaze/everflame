import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { isUndefined } from 'util';
import { Public } from 'src/decorators/public.decorator';
import { Origin } from 'src/decorators/origin.decorator';
import { IMessage } from 'src/types/imessage.interface';
import { SignUpDto } from './dtos/sign-up.dto';
import { SignInDto } from './dtos/sign-in.dto';
import { AuthResponseMapper } from './mappers/auth-response.mapper';

@Controller('api/auth')
export class AuthController {
    private readonly cookiePath = '/api/auth';
    private readonly cookieName: string;
    private readonly refreshTime: number;
    private readonly testing: boolean;

    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
        private readonly configService: ConfigService,
    ) {
        this.cookieName = this.configService.get<string>('REFRESH_COOKIE');
        this.refreshTime = this.configService.get<number>('jwt.refresh.time');
        this.testing = this.configService.get<string>('NODE_ENV') !== 'production';
    }

    private refreshTokenFromReq(req: Request): string {
        const token: string | undefined = req.signedCookies[this.cookieName];

        if (isUndefined(token)) {
            throw new UnauthorizedException();
        }

        return token;
    }

    private saveRefreshCookie(res: Response, refreshToken: string): Response {
        return res.cookie(this.cookieName, refreshToken, {
            secure: !this.testing,
            httpOnly: true,
            signed: true,
            path: this.cookiePath,
            expires: new Date(Date.now() + this.refreshTime * 1000),
        });
    }

    @Public()
    @Post('/sign-up')
    public async signUp(
        @Origin() origin: string | undefined,
        @Body() signUpDto: SignUpDto,
    ): Promise<IMessage> {
        return this.authService.signUp(signUpDto, origin);
    }

    @Public()
    @Post('/sign-in')
    public async signIn(
        @Res() res: Response,
        @Origin() origin: string | undefined,
        @Body() signInDto: SignInDto,
    ): Promise<void> {
        const result = await this.authService.signIn(signInDto, origin);
        this.saveRefreshCookie(res, result.refreshToken)
            .status(HttpStatus.OK)
            .json(AuthResponseMapper.map(result));
    }

    @Public()
    @Post('/refresh-access')
    public async refreshAccess(
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<void> {
        const token = this.refreshTokenFromReq(req);
        const result = await this.authService.refreshTokenAccess(
            token,
            req.headers.origin,
        );
        this.saveRefreshCookie(res, result.refreshToken)
            .status(HttpStatus.OK)
            .json(AuthResponseMapper.map(result));
    }

    @Post('/logout')
    @HttpCode(HttpStatus.OK)
    public async logout(
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<void> {
        const token = this.refreshTokenFromReq(req);
        const message = await this.authService.logout(token);
        res
            .clearCookie(this.cookieName, { path: this.cookiePath })
            .status(HttpStatus.OK)
            .json(message);
    }

    /*
    @Public()
    @Post('/confirm-email')
    public async confirmEmail(
        @Body() confirmEmailDto: ConfirmEmailDto,
        @Res() res: Response,
    ): Promise<void> {
        const result = await this.authService.confirmEmail(confirmEmailDto);
        this.saveRefreshCookie(res, result.refreshToken)
            .status(HttpStatus.OK)
            .json(AuthResponseMapper.map(result));
    }
    */
}
