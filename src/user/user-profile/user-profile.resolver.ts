import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { AuthDTO } from '../../auth/auth.dto';
import { GqlAuthorizationGuard } from '../../auth/gql-authorization.guard';
import { UseGuards } from '@nestjs/common';
import { GqlAuth } from '../../auth/gql-auth.decorator';
import { UserProfileService } from './user-profile.service';
import { UserProfileDTO } from './user-profile.dto';
import { UserProfileInputDTO } from './user-profile-input.dto';

@Resolver('UserProfiles')
export class UserProfileResolver {
    constructor(private readonly userProfileService: UserProfileService) {
    }

    @Query()
    @UseGuards(GqlAuthorizationGuard)
    async userProfile(@GqlAuth() auth: AuthDTO,
                      @Args('id') id: string): Promise<UserProfileDTO> {
        return await this.userProfileService.findByUserId(auth, id)
            .then(res => res.toDTO());
    }

    @Mutation('updateUserProfile')
    @UseGuards(GqlAuthorizationGuard)
    async update(@GqlAuth() auth: AuthDTO,
                 @Args('id') id: string,
                 @Args('input') input: Partial<UserProfileInputDTO>,
    ): Promise<UserProfileDTO> {
        const profile = { id, ...input } as Partial<UserProfileInputDTO>;
        return await this.userProfileService.update(auth, profile).then(res => res.toDTO());
    }
}
