import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';

import { UserEntity } from './user.entity';
import { UserInputDTO } from './user-input.dto';
import { PaginationService } from '../shared/services/pagination.service';
import { BOType } from '../shared/bo-type';
import { ServiceOperation } from '../shared/services/service-operation';
import { AuthDTO } from '../auth/auth.dto';
import { Role } from '../auth/role';
import { UserBookmarkDataService } from './user-bookmark/user-bookmark.data.service';
import { UserDataService } from './user.data.service';
import { UserProfileService } from './user-profile/user-profile.service';

@Injectable()
export class UserService {

    constructor(
        private readonly paginationService: PaginationService,
        private readonly dataService: UserDataService,
        private readonly bookmarkDataService: UserBookmarkDataService,
        private readonly profileService: UserProfileService,
    ) {
    }

    async findAll(auth: AuthDTO, page: number, bookmarkOptions?: any): Promise<UserEntity[]> {
        if (!Role.isSuper(auth)) {
            throw new UnauthorizedException('user_get_not_allowed');
        }
        const { take, skip } = await this.paginationService.getSkipAndTake(auth, BOType.USERS, page);
        if (bookmarkOptions.first || bookmarkOptions.only) {
            bookmarkOptions.ids = await this.bookmarkDataService.findByUserIdAndType(auth.id, BOType.RECEIVERS)
                .then(res => res.map(b => b.objectId));
        }
        return await this.dataService.findAll(skip, take, bookmarkOptions);
    }

    async findById(auth: AuthDTO, id: string): Promise<UserEntity> {
        if (!Role.isOwner(id, auth.id) && !Role.isSuper(auth)) {
            throw new UnauthorizedException('user_get_not_allowed');
        }
        return await this.dataService.findById(id);
    }

    async create(auth: AuthDTO, input: Partial<UserInputDTO>): Promise<UserEntity> {
        if (!Role.isSuper(auth)) {
            throw new UnauthorizedException('user_create_not_allowed');
        }
        this.validateInput(input, ServiceOperation.CREATE);
        return await this.dataService.create(input);
    }

    async update(auth: AuthDTO, id: string, input: Partial<UserInputDTO>): Promise<UserEntity> {
        if (!Role.isSuper(auth)) {
            throw new UnauthorizedException('user_update_not_allowed');
        }
        this.validateInput(input, ServiceOperation.UPDATE);
        return await this.dataService.update(id, input);
    }

    async delete(auth: AuthDTO, id: string): Promise<any> {
        if (!Role.isSuper(auth)) {
            throw new UnauthorizedException('user_delete_not_allowed');
        }
        return await this.dataService.delete(id);
    }

    private validateInput(input: Partial<UserInputDTO>, operation: string): void {
        if (operation === ServiceOperation.CREATE) {
            if (!(input.id && input.id.length >= 8)) {
                throw new BadRequestException('user_id_invalid');
            }
            if (!input.password) {
                throw new BadRequestException('user_password_invalid');
            }
            if (!input.orgId) {
                throw new BadRequestException('user_org_invalid');
            }
            this.profileService.validateInput(input, ServiceOperation.CREATE);
        }

        if (input.password !== undefined && input.password.length < 8) {
            throw new BadRequestException('user_password_invalid');
        }
        if (input.orgId !== undefined && !input.orgId.length) {
            throw new BadRequestException('user_org_invalid');
        }
        this.profileService.validateInput(input, ServiceOperation.UPDATE);
    }
}
