import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthorizationGuard } from '../../auth/authorization.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserSettingService } from './user-setting.service';
import { Auth } from '../../auth/auth.decorator';
import { UserSettingDTO } from './user-setting.dto';
import { UserSettingInputDTO } from './user-setting-input.dto';
import { AuthDTO } from '../../auth/auth.dto';

@Controller('api/usersettings')
@UseGuards(AuthorizationGuard)
@Roles()
export class UserSettingController {

    constructor(private readonly api: UserSettingService) {
    }

    @Get(':id/:type')
    async getByUserAndType(
        @Auth() auth: AuthDTO,
        @Param('id') id: string,
        @Param('type') type: string,
    ): Promise<UserSettingDTO> {
        return await this.api.findByUserIdAndType(auth, id, type)
            .then(res => res.toDTO());
    }

    @Get(':id')
    async getByUserId(
        @Auth() auth: AuthDTO,
        @Param('id') id: string,
    ): Promise<UserSettingDTO[]> {
        return await this.api.findByUserId(auth, id).then(res => res.map(r => r.toDTO()));
    }

    @Post()
    async create(
        @Auth() auth: AuthDTO,
        @Body() input: Partial<UserSettingInputDTO>,
    ): Promise<UserSettingDTO> {
        const setting = { ...input } as UserSettingInputDTO;
        return await this.api.create(auth, setting).then(res => res.toDTO());
    }

    @Put(':id/:type')
    async update(
        @Auth() auth: AuthDTO,
        @Param('id') id: string,
        @Param('type') type: string,
        @Body() input: Partial<UserSettingInputDTO>,
    ): Promise<UserSettingDTO> {
        const setting = { id, type, ...input } as UserSettingInputDTO;
        return await this.api.update(auth, setting).then(res => res.toDTO());
    }

    @Delete(':id/:type')
    async deleteByUserAndType(
        @Auth() auth: AuthDTO,
        @Param('id') id: string,
        @Param('type') type: string,
    ): Promise<UserSettingDTO> {
        return await this.api.deleteByUserIdAndType(auth, id, type).then(res => res.toDTO());
    }

    @Delete(':id')
    async deleteByUser(
        @Auth() auth: AuthDTO,
        @Param('id') id: string,
    ): Promise<UserSettingDTO[]> {
        return await this.api.deleteByUserId(auth, id).then(res => res.map(r => r.toDTO()));
    }
}
