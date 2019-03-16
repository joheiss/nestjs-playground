import { Body, Controller, Delete, Get, Param, Post, Put, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationInputDTO } from './organization-input.dto';
import { OrganizationDTO } from './organization.dto';
import { AuthorizationGuard } from '../auth/authorization.guard';
import { Roles } from '../auth/roles.decorator';
import { Auth } from '../auth/auth.decorator';
import { AuthDTO } from '../auth/auth.dto';
import { BookmarkOptionsPipe } from '../user/user-bookmark/user-bookmark-options.pipe';
import { Role } from '../auth/role';
import { UserBookmarkOptions } from '../user/user-bookmark/user-bookmark-options';

@Controller('api/organizations')
@UseGuards(AuthorizationGuard)
export class OrganizationController {

    constructor(private readonly api: OrganizationService) {
    }

    @Get()
    @Roles(Role.SUPER, Role.ADMIN)
    getAll(@Auth() auth: AuthDTO,
           @Query('page') page: number = 1,
           @Query('bookmarks', new BookmarkOptionsPipe()) bookmarkOptions?: UserBookmarkOptions,
    ): Promise<OrganizationDTO[]> {
        return this.api.findAll(auth, page, bookmarkOptions).then(res => res.map(o => o.toDTO()));
    }

    @Get(':id')
    @Roles(Role.SUPER, Role.ADMIN, Role.SALESUSER)
    async getOne(@Param('id') id: string): Promise<OrganizationDTO> {
        return await this.api.findById(id).then(res => res.toDTO());
    }

    @Get(':id/tree')
    @Roles(Role.SUPER, Role.ADMIN, Role.SALESUSER)
    async getAllByParent(@Param('id') id: string): Promise<any> {
        return await this.api.findTree(id).then(res => res.toDTO(true));
    }

    @Get(':id/treeids')
    @Roles(Role.SUPER, Role.ADMIN, Role.SALESUSER)
    async getAllIdsByParent(@Param('id') id: string): Promise<string[]> {
        return await this.api.findTreeIds(id);
    }

    @Post()
    @Roles(Role.SUPER, Role.ADMIN)
    async create(@Auth() auth: AuthDTO, @Body() input: Partial<OrganizationInputDTO>): Promise<OrganizationDTO> {
        return await this.api.create(auth, input).then(res => res.toDTO());
    }

    @Put(':id')
    @Roles(Role.SUPER, Role.ADMIN)
    async update(@Auth() auth: AuthDTO, @Param('id') id: string, @Body() input: Partial<OrganizationInputDTO>): Promise<OrganizationDTO> {
        const organization = { id, ...input } as Partial<OrganizationInputDTO>;
        return await this.api.update(auth, organization).then(res => res.toDTO());
    }

    @Delete(':id')
    @Roles(Role.SUPER, Role.ADMIN)
    async delete(@Auth() auth: AuthDTO, @Param('id') id: string): Promise<OrganizationDTO> {
        const organization = await this.api.findById(id).then(res => res.toDTO());
        return await this.api.delete(auth, id).then(res => res.toDTO());
    }
}
