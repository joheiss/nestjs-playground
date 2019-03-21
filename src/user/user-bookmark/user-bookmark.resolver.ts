import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { AuthDTO } from '../../auth/auth.dto';
import { GqlAuthorizationGuard } from '../../auth/gql-authorization.guard';
import { UseGuards } from '@nestjs/common';
import { GqlAuth } from '../../auth/gql-auth.decorator';
import { UserBookmarkService } from './user-bookmark.service';
import { UserBookmarkDTO } from './user-bookmark.dto';
import { UserBookmarkInputDTO } from './user-bookmark-input.dto';

@Resolver('UserBookmarks')
export class UserBookmarkResolver {
    constructor(private readonly userBookmarkService: UserBookmarkService) {
    }

    @Query()
    @UseGuards(GqlAuthorizationGuard)
    async userBookmarks(@GqlAuth() auth: AuthDTO,
                        @Args('userId') userId: string,
                        @Args('type') type?: string,
    ): Promise<UserBookmarkDTO[]> {
        if (type) {
            return await this.userBookmarkService.findByUserIdAndType(auth, userId, type).then(res => res.map(b => b.toDTO()));
        }
        return await this.userBookmarkService.findByUserId(auth, userId).then(res => res.map(s => s.toDTO()));
    }

    @Query()
    @UseGuards(GqlAuthorizationGuard)
    async userBookmark(@GqlAuth() auth: AuthDTO,
                       @Args('userId') userId: string,
                       @Args('type') type: string,
                       @Args('objectId') objectId: string): Promise<UserBookmarkDTO> {
        return await this.userBookmarkService.findByUserIdTypeAndObjectId(auth, userId, type, objectId).then(res => res.toDTO());
    }

    @Mutation('createUserBookmark')
    @UseGuards(GqlAuthorizationGuard)
    async create(@GqlAuth() auth: AuthDTO,
                 @Args('input') input: Partial<UserBookmarkInputDTO>,
    ): Promise<UserBookmarkDTO> {
        return await this.userBookmarkService.create(auth, input).then(res => res.toDTO());
    }

    @Mutation('deleteUserBookmarks')
    @UseGuards(GqlAuthorizationGuard)
    async deleteUserBookmarks(@GqlAuth() auth: AuthDTO,
                              @Args('userId') userId: string,
                              @Args('type') type?: string,
    ): Promise<UserBookmarkDTO[]> {
        if (type) {
            return await this.userBookmarkService.deleteByUserIdAndType(auth, userId, type).then(res => res.map(s => s.toDTO()));
        }
        return await this.userBookmarkService.deleteByUserId(auth, userId).then(res => res.map(s => s.toDTO()));
    }

    @Mutation('deleteUserBookmark')
    @UseGuards(GqlAuthorizationGuard)
    async deleteUserBookmark(@GqlAuth() auth: AuthDTO,
                             @Args('userId') userId: string,
                             @Args('type') type: string,
                             @Args('objectId') objectId: string,
    ): Promise<UserBookmarkDTO> {
        return await this.userBookmarkService.deleteByUserIdTypeAndObjectId(auth, userId, type, objectId).then(res => res.toDTO());
    }
}
