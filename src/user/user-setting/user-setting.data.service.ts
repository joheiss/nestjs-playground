import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettingEntity } from './user-setting.entity';
import { UserSettingInputDTO } from './user-setting-input.dto';
import { UserProfileEntity } from '../user-profile/user-profile.entity';

@Injectable()
export class UserSettingDataService {
    constructor(
        @InjectRepository(UserSettingEntity) private readonly settingRepo: Repository<UserSettingEntity>,
        @InjectRepository(UserProfileEntity) private readonly profileRepo: Repository<UserProfileEntity>,
    ) {
    }

    async findByUserId(id: string): Promise<UserSettingEntity[]> {
        return await this.settingRepo.find({ where: { id } });
    }

    async findByUserIdAndType(id: string, type: string): Promise<UserSettingEntity> {
        return await this.settingRepo.find({ where: { id, type } })
            .then(res => res && res.length ? res[0] : undefined);
    }

    async findByUserIdAndTypeOrDefault(id: string, type: string): Promise<UserSettingEntity> {
        let result = await this.findByUserIdAndType(id, type);
        if (!result) {
            result = await this.findByUserIdAndType(id, 'default');
        }
        return result;
    }

    async create(input: UserSettingInputDTO): Promise<UserSettingEntity> {
        const profile = await this.profileRepo.findOne(input.id);
        const merged = { ...input, profile };
        const entity = this.settingRepo.create(merged);
        const result = await this.settingRepo.save(entity);
        if (!result) {
            throw new InternalServerErrorException('usersetting_update_failed');
        }
        return result;
    }

    async update(input: UserSettingInputDTO): Promise<UserSettingEntity> {
        const found = await this.findByUserIdAndType(input.id, input.type);
        if (!found) {
            throw new NotFoundException('usersetting_not_found');
        }
        const updates = { ...found, ...input };
        const entity = this.settingRepo.create(updates);
        const result = await this.settingRepo.save(entity);
        if (!result) {
            throw new InternalServerErrorException('usersetting_update_failed');
        }
        return result;
    }

    async deleteByUserId(id: string): Promise<UserSettingEntity[]> {
        const founds = await this.findByUserId(id);
        if (!founds || !founds.length) {
            throw new NotFoundException('usersetting_not_found');
        }
        const toBeRemoved = founds.filter(s => s.type !== 'default');
        return this.settingRepo.remove(toBeRemoved);
    }

    async deleteByUserIdAndType(id: string, type: string): Promise<UserSettingEntity> {
        const found = await this.findByUserIdAndType(id, type);
        if (!found) {
            throw new NotFoundException('usersetting_not_found');
        }
        return this.settingRepo.remove(found);
    }

    async exists(id: string, type: string): Promise<boolean> {
        const found = await this.findByUserIdAndType(id, type);
        return !!found;
    }
}
