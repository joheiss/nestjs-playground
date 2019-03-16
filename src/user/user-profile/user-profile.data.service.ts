import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileEntity } from './user-profile.entity';
import { UserProfileInputDTO } from './user-profile-input.dto';

@Injectable()
export class UserProfileDataService {

    constructor(
        @InjectRepository(UserProfileEntity) private readonly profileRepo: Repository<UserProfileEntity>,
    ) {
    }

    async findByUserId(id: string): Promise<UserProfileEntity> {
        const result = await this.profileRepo.findOne(id);
        if (!result) {
            throw new NotFoundException('userprofile_not_found');
        }
        return result;
    }

    async update(input: Partial<UserProfileInputDTO>): Promise<UserProfileEntity> {
        const found = await this.findByUserId(input.id);
        const merged = { ...found, ...input };
        const entity = this.profileRepo.create(merged);
        const result = await this.profileRepo.save(entity);
        if (!result) {
            throw new BadRequestException('userprofile_update_failed');
        }
        return result;
    }

    async delete(id: string): Promise<UserProfileEntity> {
        const found = await this.findByUserId(id);
        return this.profileRepo.remove(found);
    }
}
