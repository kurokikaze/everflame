import { ConflictException, Controller, Get } from '@nestjs/common';
import { errorMonitor } from 'events';
import { AuthService } from 'src/auth/auth.service';

@Controller('user')
export class UserController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @Get('testRegister')
    async testRegister() {
        try {
            await this.authService.signUp({
                email: 'test1@example.com',
                name: 'testUser',
                password1: 'testPass',
                password2: 'testPass'
            })
        } catch (error) {
            if (error instanceof ConflictException) {
                return error;
                // return {
                //     success: false,
                //     type: 'email-already-in-use',
                //     message: error.message
                // }
            } else {
                return {
                    success: false,
                    message: error.message
                }
            }
        }
        return { success: true }
    }
}
