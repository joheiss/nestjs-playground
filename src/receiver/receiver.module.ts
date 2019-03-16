import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiverController } from './receiver.controller';
import { ReceiverService } from './receiver.service';
import { ReceiverEntity } from './receiver.entity';
import { OrganizationEntity } from '../organization/organization.entity';
import { OrganizationService } from '../organization/organization.service';
import { UserSettingEntity } from '../user/user-setting/user-setting.entity';
import { UserProfileEntity } from '../user/user-profile/user-profile.entity';
import { UserProfileService } from '../user/user-profile/user-profile.service';
import { UserBookmarkEntity } from '../user/user-bookmark/user-bookmark.entity';
import { UserBookmarkService } from '../user/user-bookmark/user-bookmark.service';
import { PaginationService } from '../shared/services/pagination.service';
import { UserSettingService } from '../user/user-setting/user-setting.service';
import { ReceiverDataService } from './receiver.data.service';
import { UserBookmarkDataService } from '../user/user-bookmark/user-bookmark.data.service';
import { OrganizationDataService } from '../organization/organization.data.service';
import { UserProfileDataService } from '../user/user-profile/user-profile.data.service';
import { UserSettingDataService } from '../user/user-setting/user-setting.data.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ReceiverEntity,
            OrganizationEntity,
            UserProfileEntity,
            UserSettingEntity,
            UserBookmarkEntity,
        ]),
    ],
    controllers: [
        ReceiverController,
    ],
    providers: [
        ReceiverService, ReceiverDataService,
        UserProfileService, UserProfileDataService,
        UserSettingService, UserSettingDataService,
        UserBookmarkService, UserBookmarkDataService,
        OrganizationService, OrganizationDataService,
        PaginationService,
    ],
    exports: [
        ReceiverService,
        ReceiverDataService,
    ],
})
export class ReceiverModule {
}
