import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { UserProfileDTO } from './user-profile.dto';
import { UserProfileInputDTO } from './user-profile-input.dto';
import { UserProfileService } from './user-profile.service';
import { AuthorizationGuard } from '../../auth/authorization.guard';
import { Roles } from '../../auth/roles.decorator';
import { Auth } from '../../auth/auth.decorator';
import { AuthDTO } from '../../auth/auth.dto';

@Controller('api/userprofiles')
@UseGuards(AuthorizationGuard)
@Roles()
export class UserProfileController {

    constructor(private readonly api: UserProfileService) {
    }

    @Get(':id')
    async getById(
        @Auth() auth: AuthDTO,
        @Param('id') id: string,
    ): Promise<UserProfileDTO> {
        return await this.api.findByUserId(auth, id).then(res => res.toDTO());
    }

    @Put(':id')
    async update(
        @Auth() auth: AuthDTO,
        @Param('id') id: string,
        @Body() input: Partial<UserProfileInputDTO>,
    ): Promise<UserProfileDTO> {
        const profile = { id, ...input } as Partial<UserProfileInputDTO>;
        return await this.api.update(auth, profile).then(res => res.toDTO());
    }
}
