import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { UserBookmarkOptions } from '../user/user-bookmark/user-bookmark-options';
import { AuthDTO } from '../auth/auth.dto';
import { GqlAuthorizationGuard } from '../auth/gql-authorization.guard';
import { UseGuards } from '@nestjs/common';
import { BookmarkOptionsPipe } from '../user/user-bookmark/user-bookmark-options.pipe';
import { GqlAuth } from '../auth/gql-auth.decorator';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role';
import { UserService } from './user.service';
import { UserDTO } from './user.dto';
import { UserInputDTO } from './user-input.dto';

@Resolver('Users')
export class UserResolver {
    constructor(private readonly userService: UserService) {
    }

    @Query()
    @UseGuards(GqlAuthorizationGuard)
    @Roles(Role.SUPER, Role.ADMIN)
    async users(@GqlAuth() auth: AuthDTO,
                @Args('page') page: number = 1,
                @Args('bookmarks', new BookmarkOptionsPipe()) bookmarkOptions?: UserBookmarkOptions): Promise<UserDTO[]> {
        return await this.userService.findAll(auth, page, bookmarkOptions)
            .then(res => res.map(o => o.toDTO()));
    }

    @Query()
    @UseGuards(GqlAuthorizationGuard)
    async user(@GqlAuth() auth: AuthDTO,
               @Args('id') id: string): Promise<UserDTO> {
        return await this.userService.findById(auth, id)
            .then(res => res.toDTO());
    }

    @Mutation('createUser')
    @UseGuards(GqlAuthorizationGuard)
    @Roles(Role.SUPER)
    async create(@GqlAuth() auth: AuthDTO,
                 @Args('input') input: Partial<UserInputDTO>,
    ): Promise<UserDTO> {
        return await this.userService.create(auth, input).then(res => res.toDTO());
    }

    @Mutation('updateUser')
    @UseGuards(GqlAuthorizationGuard)
    @Roles(Role.SUPER)
    async update(@GqlAuth() auth: AuthDTO,
                 @Args('id') id: string,
                 @Args('input') input: Partial<UserInputDTO>,
    ): Promise<UserDTO> {
        return await this.userService.update(auth, id, input).then(res => res.toDTO());
    }

    @Mutation('deleteUser')
    @UseGuards(GqlAuthorizationGuard)
    @Roles(Role.SUPER)
    async delete(@GqlAuth() auth: AuthDTO,
                 @Args('id') id: string,
    ): Promise<UserDTO> {
        return await this.userService.delete(auth, id).then(res => res.toDTO());
    }
}
