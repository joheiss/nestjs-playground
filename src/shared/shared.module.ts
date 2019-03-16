import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpErrorFilter } from './error-handling/http-error.filter';
import { LoggingInterceptor } from './logging/logging.interceptor';
import { UserSettingEntity } from '../user/user-setting/user-setting.entity';
import { PaginationService } from './services/pagination.service';
import { UserSettingService } from '../user/user-setting/user-setting.service';
import { UserProfileEntity } from '../user/user-profile/user-profile.entity';
import { UserProfileService } from '../user/user-profile/user-profile.service';
import { UserSettingDataService } from '../user/user-setting/user-setting.data.service';
import { UserProfileDataService } from '../user/user-profile/user-profile.data.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserProfileEntity,
            UserSettingEntity,
        ]),
    ],
    controllers: [],
    providers: [
        { provide: APP_FILTER, useClass: HttpErrorFilter },
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
