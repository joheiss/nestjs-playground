import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthInputDTO } from './auth-input.dto';
import { AuthDTO } from './auth.dto';
import { AuthorizationGuard } from './authorization.guard';
import { Roles } from './roles.decorator';
import { Auth } from './auth.decorator';
import { WhoAmIDTO } from './who-am-i.dto';

@Controller('api')
export class AuthController {

    constructor(private readonly authService: AuthService) {
    }

    @UseGuards(AuthorizationGuard)
    @Roles()
    @Get('whoami')
    async whoAmI(@Auth('id') id: string): Promise<WhoAmIDTO> {
        return await this.authService.whoAmI(id);
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() credential: AuthInputDTO): Promise<AuthDTO> {
        return await this.authService.login(credential);
    }
}
