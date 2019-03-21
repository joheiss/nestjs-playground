import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { OrganizationEntity } from './organization.entity';
import { UserSettingEntity } from '../user/user-setting/user-setting.entity';
import { UserSettingService } from '../user/user-setting/user-setting.service';
import { UserProfileService } from '../user/user-profile/user-profile.service';
import { UserProfileEntity } from '../user/user-profile/user-profile.entity';
import { UserBookmarkEntity } from '../user/user-bookmark/user-bookmark.entity';
import { UserBookmarkService } from '../user/user-bookmark/user-bookmark.service';
import { PaginationService } from '../shared/services/pagination.service';
import { OrganizationDataService } from './organization.data.service';
import { UserBookmarkDataService } from '../user/user-bookmark/user-bookmark.data.service';
import { UserProfileDataService } from '../user/user-profile/user-profile.data.service';
import { UserSettingDataService } from '../user/user-setting/user-setting.data.service';
import { OrganizationResolver } from './organization.resolver';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            OrganizationEntity,
            UserProfileEntity,
            UserSettingEntity,
            UserBookmarkEntity,
        ]),
    ],
    controllers: [
        OrganizationController,
    ],
    providers: [
        OrganizationService, OrganizationDataService,
        OrganizationResolver,
        UserProfileService, UserProfileDataService,
        UserSettingService, UserSettingDataService,
        UserBookmarkService, UserBookmarkDataService,
        PaginationService,
    ],
    exports: [
        OrganizationService,
        OrganizationDataService,
    ],
})
export class OrganizationModule {
}
