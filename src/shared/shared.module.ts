import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { UserSettingEntity } from '../user/user-setting/user-setting.entity';
import { PaginationService } from './services/pagination.service';
import { UserSettingService } from '../user/user-setting/user-setting.service';
import { UserProfileEntity } from '../user/user-profile/user-profile.entity';
import { UserProfileService } from '../user/user-profile/user-profile.service';
import { UserSettingDataService } from '../user/user-setting/user-setting.data.service';
import { UserProfileDataService } from '../user/user-profile/user-profile.data.service';
import { HttpGqlErrorFilter } from './error-handling/http-gql-error.filter';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserProfileEntity,
            UserSettingEntity,
        ]),
    ],
    controllers: [],
    providers: [
        // { provide: APP_FILTER, useClass: HttpErrorFilter },
        { provide: APP_FILTER, useClass: HttpGqlErrorFilter },
        // { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
        PaginationService,
        UserSettingService,
        UserSettingDataService,
        UserProfileService,
        UserProfileDataService,
    ],
    exports: [
        PaginationService,
    ],
})
export class SharedModule {
}
