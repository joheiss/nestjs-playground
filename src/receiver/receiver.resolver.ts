import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { UserBookmarkOptions } from '../user/user-bookmark/user-bookmark-options';
import { AuthDTO } from '../auth/auth.dto';
import { GqlAuthorizationGuard } from '../auth/gql-authorization.guard';
import { UseGuards } from '@nestjs/common';
import { BookmarkOptionsPipe } from '../user/user-bookmark/user-bookmark-options.pipe';
import { GqlAuth } from '../auth/gql-auth.decorator';
import { ReceiverService } from './receiver.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role';
import { ReceiverDTO } from './receiver.dto';
import { ReceiverInputDTO } from './receiver-input.dto';

@Resolver('Receivers')
export class ReceiverResolver {
    constructor(private readonly receiverService: ReceiverService) {
    }

    @Query()
    @UseGuards(GqlAuthorizationGuard)
    @Roles(Role.SALESUSER, Role.AUDITOR)
    async receivers(@GqlAuth() auth: AuthDTO,
                    @Args('page') page: number = 1,
                    @Args('bookmarks', new BookmarkOptionsPipe()) bookmarkOptions?: UserBookmarkOptions): Promise<ReceiverDTO[]> {
        return await this.receiverService.findAll(auth, page, bookmarkOptions)
            .then(res => res.map(o => o.toDTO()));
    }

    @Query()
    @UseGuards(GqlAuthorizationGuard)
    @Roles(Role.SALESUSER, Role.AUDITOR)
    async receiver(@GqlAuth() auth: AuthDTO,
                   @Args('id') id: string): Promise<ReceiverDTO> {
        return await this.receiverService.findById(auth, id)
            .then(res => res.toDTO());
    }

    @Mutation('createReceiver')
    @UseGuards(GqlAuthorizationGuard)
    @Roles(Role.SALESUSER)
    async create(@GqlAuth() auth: AuthDTO,
                 @Args('input') input: Partial<ReceiverInputDTO>,
    ): Promise<ReceiverDTO> {
        return await this.receiverService.create(auth, input).then(res => res.toDTO());
    }

    @Mutation('updateReceiver')
    @UseGuards(GqlAuthorizationGuard)
    @Roles(Role.SALESUSER)
    async update(@GqlAuth() auth: AuthDTO,
                 @Args('id') id: string,
                 @Args('input') input: Partial<ReceiverInputDTO>,
    ): Promise<ReceiverDTO> {
        return await this.receiverService.update(auth, id, input).then(res => res.toDTO());
    }

    @Mutation('deleteReceiver')
    @UseGuards(GqlAuthorizationGuard)
    @Roles(Role.SALESUSER)
    async delete(@GqlAuth() auth: AuthDTO,
                 @Args('id') id: string,
    ): Promise<ReceiverDTO> {
        return await this.receiverService.delete(auth, id).then(res => res.toDTO());
    }
}
