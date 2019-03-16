import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ReceiverService } from './receiver.service';
import { ReceiverDTO } from './receiver.dto';
import { ReceiverInputDTO } from './receiver-input.dto';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { Roles } from '../auth/roles.decorator';
import { Auth } from '../auth/auth.decorator';
import { AuthDTO } from '../auth/auth.dto';
import { BookmarkOptionsPipe } from '../user/user-bookmark/user-bookmark-options.pipe';
import { Role } from '../auth/role';
import { UserBookmarkOptions } from '../user/user-bookmark/user-bookmark-options';

@Controller('api/receivers')
@UseGuards(AuthorizationGuard)
export class ReceiverController {

    constructor(private readonly api: ReceiverService) {
    }

    @Get()
    @Roles(Role.SALESUSER, Role.AUDITOR)
    async getAll(@Auth() auth: AuthDTO,
                 @Query('page') page: number = 1,
                 @Query('bookmarks', new BookmarkOptionsPipe()) bookmarkOptions?: UserBookmarkOptions,
    ): Promise<ReceiverDTO[]> {
        return await this.api.findAll(auth, page, bookmarkOptions).then(res => res.map(r => r.toDTO()));
    }

    @Get(':id')
    @Roles(Role.SALESUSER, Role.AUDITOR)
    async getOne(@Auth() auth: AuthDTO, @Param('id') id: string): Promise<ReceiverDTO> {
        return await this.api.findById(auth, id).then(res => res.toDTO());
    }

    @Post()
    @Roles(Role.SALESUSER)
    async create(@Auth() auth: AuthDTO, @Body() input: Partial<ReceiverInputDTO>): Promise<ReceiverDTO> {
        return await this.api.create(auth, input).then(res => res.toDTO());
    }

    @Put(':id')
    @Roles(Role.SALESUSER)
    async update(@Auth() auth: AuthDTO, @Param('id') id: string, @Body() input: Partial<ReceiverInputDTO>): Promise<ReceiverDTO> {
        return await this.api.update(auth, id, input).then(res => res.toDTO());
    }

    @Delete(':id')
    @Roles(Role.SALESUSER)
    async delete(@Auth() auth: AuthDTO, @Param('id') id: string): Promise<ReceiverDTO> {
        return await this.api.delete(auth, id).then(res => res.toDTO());
    }
}
