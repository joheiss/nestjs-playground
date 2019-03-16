import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserSettingEntity } from './user-setting.entity';
import { UserSettingInputDTO } from './user-setting-input.dto';
import { ServiceOperation } from '../../shared/services/service-operation';
import { AuthDTO } from '../../auth/auth.dto';
import { Role } from '../../auth/role';
import { UserSettingDataService } from './user-setting.data.service';

@Injectable()
export class UserSettingService {
    constructor(
        private readonly dataService: UserSettingDataService,
    ) {
    }

    async findByUserId(auth: AuthDTO, id: string): Promise<UserSettingEntity[]> {
        if (!Role.isOwner(id, auth.id) && !Role.isSuper(auth)) {
            throw new UnauthorizedException('usersetting_get_not_allowed');
        }
        return await this.dataService.findByUserId(id);
    }

    async findByUserIdAndType(auth: AuthDTO, id: string, type: string): Promise<UserSettingEntity> {
        if (!Role.isOwner(id, auth.id) && !Role.isSuper(auth)) {
            throw new UnauthorizedException('usersetting_get_not_allowed');
        }
        const result = await this.dataService.findByUserIdAndType(id, type);
        if (!result) {
            throw new NotFoundException('usersetting_not_found');
        }
        return result;
    }

    async findByUserIdAndTypeOrDefault(auth: AuthDTO, id: string, type: string): Promise<UserSettingEntity> {
        if (!Role.isOwner(id, auth.id) && !Role.isSuper(auth)) {
            throw new UnauthorizedException('usersetting_get_not_allowed');
        }
        return await this.dataService.findByUserIdAndTypeOrDefault(id, type);
    }

    async create(auth: AuthDTO, input: UserSettingInputDTO): Promise<UserSettingEntity> {
        if (!Role.isOwner(input.id, auth.id) && !Role.isSuper(auth)) {
            throw new UnauthorizedException('usersetting_create_not_allowed');
        }
        this.validateInput(input, ServiceOperation.CREATE);
        if (await this.dataService.exists(input.id, input.type)) {
            throw new BadRequestException('usersetting_already_exists');
        }
        return await this.dataService.create(input);
    }

    async update(auth: AuthDTO, input: UserSettingInputDTO): Promise<UserSettingEntity> {
        if (!Role.isOwner(input.id, auth.id) && !Role.isSuper(auth)) {
            throw new UnauthorizedException('usersetting_update_not_allowed');
        }
        this.validateInput(input, ServiceOperation.UPDATE);
        return await this.dataService.update(input);
    }

    async deleteByUserId(auth: AuthDTO, id: string): Promise<UserSettingEntity[]> {
        if (!Role.isOwner(id, auth.id) && !Role.isSuper(auth)) {
            throw new UnauthorizedException('usersetting_delete_not_allowed');
        }
        return await this.dataService.deleteByUserId(id);
    }

    async deleteByUserIdAndType(auth: AuthDTO, id: string, type: string): Promise<UserSettingEntity> {
        if (!Role.isOwner(id, auth.id) && !Role.isSuper(auth)) {
            throw new UnauthorizedException('usersetting_delete_not_allowed');
        }
        if (type === 'default' && !Role.isSuper(auth)) {
            throw new UnauthorizedException('usersetting_delete_not_allowed');
        }
        return await this.dataService.deleteByUserIdAndType(id, type);
    }

    private validateInput(input: Partial<UserSettingInputDTO>, operation: string): void {
        if (operation === ServiceOperation.CREATE) {
            if (!(input.id && input.id.length)) {
                throw new BadRequestException('usersetting_id_invalid');
            }
            if (!(input.type && input.type.length)) {
                throw new BadRequestException('usersetting_type_invalid');
            }
        }
        if (input.listLimit !== undefined && !(input.listLimit >= 0)) {
            throw new BadRequestException('usersetting_listlimit_invalid');
        }
        if (input.bookmarkExpiration !== undefined && !(input.bookmarkExpiration >= 0)) {
            throw new BadRequestException('usersetting_bookmarkexpiration_invalid');
        }
    }
}
