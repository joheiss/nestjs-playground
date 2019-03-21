import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserEntity } from '../user/user.entity';
import { AuthDataService } from './auth.data.service';
import { AuthResolver } from './auth.resolver';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity]),
    ],
    controllers: [
        AuthController,
    ],
    providers: [
        AuthService,
        AuthDataService,
        AuthResolver,
    ],
    exports: [
        AuthService,
        AuthDataService,
    ],
})
export class AuthModule {
}
