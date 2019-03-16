import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { UserDTO } from './user.dto';
import { UserService } from './user.service';
import { UserInputDTO } from './user-input.dto';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { Roles } from '../auth/roles.decorator';
import { Auth } from '../auth/auth.decorator';
import { BookmarkOptionsPipe } from './user-bookmark/user-bookmark-options.pipe';
import { Role } from '../auth/role';
import { AuthDTO } from '../auth/auth.dto';
import { UserBookmarkOptions } from './user-bookmark/user-bookmark-options';

@Controller('api/users')
@UseGuards(AuthorizationGuard)
@Roles()
export class UserController {

    constructor(private readonly api: UserService) {
    }

    @Get()
    @Roles(Role.SUPER, Role.ADMIN)
    async getAll(
        @Auth() auth: AuthDTO,
        @Query('page') page: number = 1,
        @Query('bookmarks', new BookmarkOptionsPipe()) bookmarkOptions?: UserBookmarkOptions,
    ): Promise<UserDTO[]> {
        return this.api.findAll(auth, page, bookmarkOptions).then(res => res.map(u => u.toDTO()));
    }

    @Get(':id')
    async getOne(@Auth() auth: AuthDTO, @Param('id') id: string): Promise<UserDTO> {
        return await this.api.findById(auth, id).then(res => res.toDTO());
    }

    @Post()
    @Roles(Role.SUPER)
    async create(@Auth() auth: AuthDTO, @Body() input: Partial<UserInputDTO>): Promise<UserDTO> {
        return await this.api.create(auth, input).then(res => res.toDTO());
    }

    @Put(':id')
    @Roles(Role.SUPER)
    async update(@Auth() auth: AuthDTO, @Param('id') id: string, @Body() input: Partial<UserInputDTO>): Promise<UserDTO> {
        return await this.api.update(auth, id, input).then(res => res.toDTO());
    }

    @Delete(':id')
    @Roles(Role.SUPER)
    async delete(@Auth() auth: AuthDTO, @Param('id') id: string): Promise<UserDTO> {
        return await this.api.delete(auth, id).then(res => res.toDTO());
    }
}
