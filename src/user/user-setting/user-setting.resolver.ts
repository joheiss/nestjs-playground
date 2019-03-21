import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { AuthDTO } from '../../auth/auth.dto';
import { GqlAuthorizationGuard } from '../../auth/gql-authorization.guard';
import { UseGuards } from '@nestjs/common';
import { GqlAuth } from '../../auth/gql-auth.decorator';
import { UserSettingService } from './user-setting.service';
import { UserSettingDTO } from './user-setting.dto';
import { UserSettingInputDTO } from './user-setting-input.dto';

@Resolver('UserSettings')
export class UserSettingResolver {
    constructor(private readonly userSettingService: UserSettingService) {
    }

    @Query()
    @UseGuards(GqlAuthorizationGuard)
    async userSettings(@GqlAuth() auth: AuthDTO,
                       @Args('userId') userId: string,
    ): Promise<UserSettingDTO[]> {
        return await this.userSettingService.findByUserId(auth, userId).then(res => res.map(s => s.toDTO()));
    }

    @Query()
    @UseGuards(GqlAuthorizationGuard)
    async userSetting(@GqlAuth() auth: AuthDTO,
                      @Args('userId') userId: string,
                      @Args('type') type: string): Promise<UserSettingDTO> {
        return await this.userSettingService.findByUserIdAndType(auth, userId, type).then(res => res.toDTO());
    }

    @Mutation('createUserSetting')
    @UseGuards(GqlAuthorizationGuard)
    async create(@GqlAuth() auth: AuthDTO,
                 @Args('input') input: Partial<UserSettingInputDTO>,
    ): Promise<UserSettingDTO> {
        const setting = { ...input } as UserSettingInputDTO;
        return await this.userSettingService.create(auth, setting).then(res => res.toDTO());
    }

    @Mutation('updateUserSetting')
    @UseGuards(GqlAuthorizationGuard)
    async update(@GqlAuth() auth: AuthDTO,
                 @Args('userId') userId: string,
                 @Args('type') type: string,
                 @Args('input') input: Partial<UserSettingInputDTO>,
    ): Promise<UserSettingDTO> {
        const updates = { ...input, id: userId, type } as UserSettingInputDTO;
        return await this.userSettingService.update(auth, updates).then(res => res.toDTO());
    }

    @Mutation('deleteUserSettings')
    @UseGuards(GqlAuthorizationGuard)
    async deleteUserSettings(@GqlAuth() auth: AuthDTO,
                             @Args('userId') userId: string,
    ): Promise<UserSettingDTO[]> {
        return await this.userSettingService.deleteByUserId(auth, userId).then(res => res.map(s => s.toDTO()));
    }

    @Mutation('deleteUserSetting')
    @UseGuards(GqlAuthorizationGuard)
    async deleteUserSetting(@GqlAuth() auth: AuthDTO,
                            @Args('userId') userId: string,
                            @Args('type') type?: string,
    ): Promise<UserSettingDTO> {
        return await this.userSettingService.deleteByUserIdAndType(auth, userId, type).then(res => res.toDTO());
    }
}
