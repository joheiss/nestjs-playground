import { Body, Controller, Delete, Get, Param, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthorizationGuard } from '../../auth/authorization.guard';
import { Roles } from '../../auth/roles.decorator';
import { Auth } from '../../auth/auth.decorator';
import { UserBookmarkDTO } from './user-bookmark.dto';
import { UserBookmarkInputDTO } from './user-bookmark-input.dto';
import { AuthDTO } from '../../auth/auth.dto';
import { UserBookmarkService } from './user-bookmark.service';
import { Role } from '../../auth/role';

@Controller('api/userbookmarks')
@UseGuards(AuthorizationGuard)
@Roles()
export class UserBookmarkController {

    constructor(private readonly api: UserBookmarkService) {
    }

    @Get(':id/:type/:objectId')
    async getByUserTypeAndObjectId(
        @Auth() auth: AuthDTO,
        @Param('id') id: string,
        @Param('type') type: string,
        @Param('objectId') objectId: string,
    ): Promise<UserBookmarkDTO> {
        return await this.api.findByUserIdTypeAndObjectId(auth, id, type, objectId).then(res => res ? res.toDTO() : undefined);
    }

    @Get(':id/:type')
    async getByUserAndType(
        @Auth() auth: AuthDTO,
        @Param('id') id: string,
        @Param('type') type: string,
    ): Promise<UserBookmarkDTO[]> {
        return await this.api.findByUserIdAndType(auth, id, type).then(res => res.map(r => r.toDTO()));
    }

    @Get(':id')
    async getByUserId(
        @Auth() auth: AuthDTO,
        @Param('id') id: string,
    ): Promise<UserBookmarkDTO[]> {
        return await this.api.findByUserId(auth, id).then(res => res.map(r => r.toDTO()));
    }

    @Post()
    async create(
        @Auth() auth: AuthDTO,
        @Body() input: Partial<UserBookmarkInputDTO>,
    ): Promise<UserBookmarkDTO> {
        return await this.api.create(auth, input).then(res => res.toDTO());
    }

    @Delete(':id/:type/:objectId')
    async deleteByUserTypeAndObjectId(
        @Auth() auth: AuthDTO,
        @Param('id') id: string,
        @Param('type') type: string,
        @Param('objectId') objectId: string,
    ): Promise<UserBookmarkDTO> {
        return await this.api.deleteByUserIdTypeAndObjectId(auth, id, type, objectId)
            .then(res => res ? res.toDTO() : undefined);
    }

    @Delete(':id/:type')
    async deleteByUserAndType(
        @Auth() auth: AuthDTO,
        @Param('id') id: string,
        @Param('type') type: string,
    ): Promise<UserBookmarkDTO[]> {
        return await this.api.deleteByUserIdAndType(auth, id, type).then(res => res.map(r => r.toDTO()));
    }

    @Delete(':id')
    async deleteByUserId(
        @Auth() auth: AuthDTO,
        @Param('id') id: string,
    ): Promise<UserBookmarkDTO[]> {
        return await this.api.deleteByUserId(auth, id).then(res => res.map(r => r.toDTO()));
    }
}
