import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserEntity } from './user.entity';
import { OrganizationService } from '../organization/organization.service';
import { OrganizationEntity } from '../organization/organization.entity';
import { UserProfileEntity } from './user-profile/user-profile.entity';
import { UserSettingEntity } from './user-setting/user-setting.entity';
import { UserBookmarkEntity } from './user-bookmark/user-bookmark.entity';
import { UserProfileController } from './user-profile/user-profile.controller';
import { UserSettingController } from './user-setting/user-setting.controller';
import { UserBookmarkController } from './user-bookmark/user-bookmark.controller';
import { UserProfileService } from './user-profile/user-profile.service';
import { UserSettingService } from './user-setting/user-setting.service';
import { UserBookmarkService } from './user-bookmark/user-bookmark.service';
import { PaginationService } from '../shared/services/pagination.service';
import { UserBookmarkDataService } from './user-bookmark/user-bookmark.data.service';
import { UserSettingDataService } from './user-setting/user-setting.data.service';
import { UserProfileDataService } from './user-profile/user-profile.data.service';
import { UserDataService } from './user.data.service';
import { OrganizationDataService } from '../organization/organization.data.service';
import { UserResolver } from './user.resolver';
import { UserProfileResolver } from './user-profile/user-profile.resolver';
import { UserSettingResolver } from './user-setting/user-setting.resolver';
import { UserBookmarkResolver } from './user-bookmark/user-bookmark.resolver';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserEntity,
            UserProfileEntity,
            UserSettingEntity,
            UserBookmarkEntity,
            OrganizationEntity,
        ]),
    ],
    controllers: [
        UserController,
        UserProfileController,
        UserSettingController,
        UserBookmarkController,
    ],
    providers: [
        UserService,
        UserDataService,
        UserResolver,
        UserProfileService,
        UserProfileDataService,
        UserProfileResolver,
        UserSettingService,
        UserSettingDataService,
        UserSettingResolver,
        UserBookmarkService,
        UserBookmarkDataService,
        UserBookmarkResolver,
        OrganizationService,
        OrganizationDataService,
        PaginationService,
    ],
    exports: [
        UserService,
        UserDataService,
        UserProfileService,
        UserProfileDataService,
        UserSettingService,
        UserSettingDataService,
        UserBookmarkService,
        UserBookmarkDataService,
    ],
})
export class UserModule {
}
