import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { OrganizationService } from './organization.service';
import { UserBookmarkOptions } from '../user/user-bookmark/user-bookmark-options';
import { AuthDTO } from '../auth/auth.dto';
import { GqlAuthorizationGuard } from '../auth/gql-authorization.guard';
import { UseGuards } from '@nestjs/common';
import { BookmarkOptionsPipe } from '../user/user-bookmark/user-bookmark-options.pipe';
import { GqlAuth } from '../auth/gql-auth.decorator';
import { OrganizationDTO } from './organization.dto';
import { OrganizationInputDTO } from './organization-input.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role';

@Resolver('Organizations')
export class OrganizationResolver {
    constructor(private readonly organizationService: OrganizationService) {
    }

    @Query()
    @UseGuards(GqlAuthorizationGuard)
    @Roles(Role.SUPER, Role.ADMIN)
    async organizations(@GqlAuth() auth: AuthDTO,
                        @Args('page') page: number = 1,
                        @Args('bookmarks', new BookmarkOptionsPipe()) bookmarkOptions?: UserBookmarkOptions) {
        return await this.organizationService.findAll(auth, page, bookmarkOptions)
            .then(res => res.map(o => o.toDTO()));
    }

    @Query()
    @UseGuards(GqlAuthorizationGuard)
    @Roles(Role.SUPER, Role.ADMIN, Role.SALESUSER)
    async organization(@GqlAuth() auth: AuthDTO,
                       @Args('id') id: string): Promise<OrganizationDTO> {
        return await this.organizationService.findById(id)
            .then(res => res.toDTO());
    }

    @Query()
    @UseGuards(GqlAuthorizationGuard)
    @Roles(Role.SUPER, Role.ADMIN, Role.SALESUSER)
    async organizationTree(@GqlAuth() auth: AuthDTO,
                           @Args('id') id: string): Promise<any> {
        return await this.organizationService.findTree(id)
            .then(res => res.toDTO(true));
    }

    @Query()
    @UseGuards(GqlAuthorizationGuard)
    @Roles(Role.SUPER, Role.ADMIN, Role.SALESUSER)
    async organizationTreeIds(@GqlAuth() auth: AuthDTO,
                              @Args('id') id: string): Promise<any> {
        return await this.organizationService.findTreeIds(id);
    }

    @Mutation('createOrganization')
    @UseGuards(GqlAuthorizationGuard)
    @Roles(Role.SUPER, Role.ADMIN)
    async create(@GqlAuth() auth: AuthDTO,
                 @Args('input') input: Partial<OrganizationInputDTO>,
    ): Promise<OrganizationDTO> {
        return await this.organizationService.create(auth, input).then(res => res.toDTO());
    }

    @Mutation('updateOrganization')
    @UseGuards(GqlAuthorizationGuard)
    @Roles(Role.SUPER, Role.ADMIN)
    async update(@GqlAuth() auth: AuthDTO,
                 @Args('id') id: string,
                 @Args('input') input: Partial<OrganizationInputDTO>,
    ): Promise<OrganizationDTO> {
        const updates: Partial<OrganizationInputDTO> = { ...input, id };
        return await this.organizationService.update(auth, updates).then(res => res.toDTO());
    }

    @Mutation('deleteOrganization')
    @UseGuards(GqlAuthorizationGuard)
    @Roles(Role.SUPER, Role.ADMIN)
    async delete(@GqlAuth() auth: AuthDTO,
                 @Args('id') id: string,
    ): Promise<OrganizationDTO> {
        return await this.organizationService.delete(auth, id).then(res => res.toDTO());
    }
}
