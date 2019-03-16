import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBookmarkEntity } from './user-bookmark.entity';
import { UserBookmarkInputDTO } from './user-bookmark-input.dto';
import { UserProfileEntity } from '../user-profile/user-profile.entity';

@Injectable()
export class UserBookmarkDataService {
    constructor(
        @InjectRepository(UserBookmarkEntity) private readonly bookmarkRepo: Repository<UserBookmarkEntity>,
        @InjectRepository(UserProfileEntity) private readonly profileRepo: Repository<UserProfileEntity>,
    ) {
    }

   async findByUserId(id: string): Promise<UserBookmarkEntity[]> {
       return await this.bookmarkRepo.find({ where: { id } });
    }

    async findByUserIdAndType(id: string, type: string): Promise<UserBookmarkEntity[]> {
        return await this.bookmarkRepo.find({ where: { id, type } });
    }

    async findByUserIdTypeAndObjectId(id: string, type: string, objectId: string): Promise<UserBookmarkEntity> {
        return await this.bookmarkRepo.find({ where: { id, type, objectId } }).then(res => res[0]);
    }

    async create(input: Partial<UserBookmarkInputDTO>): Promise<UserBookmarkEntity> {
        const profile = await this.profileRepo.findOne(input.id);
        const merged = { ...input, profile };
        const entity = this.bookmarkRepo.create(merged);
        const result = await this.bookmarkRepo.save(entity);
        if (!result) {
            throw new InternalServerErrorException('userbookmark_not_created');
        }
        return result;
    }

    async deleteByUserId(id: string): Promise<UserBookmarkEntity[]> {
        const founds = await this.findByUserId(id);
        if (!founds || !founds.length) {
            throw new NotFoundException('userbookmark_not_found');
        }
        return await this.bookmarkRepo.remove(founds);
    }

    async deleteByUserIdAndType(id: string, type: string): Promise<UserBookmarkEntity[]> {
        const founds = await this.findByUserIdAndType(id, type);
        if (!founds || !founds.length) {
            throw new NotFoundException('userbookmark_not_found');
        }
        return await this.bookmarkRepo.remove(founds);
    }

    async deleteByUserIdTypeAndObjectId(id: string, type: string, objectId: string): Promise<UserBookmarkEntity> {
        const found = await this.findByUserIdTypeAndObjectId(id, type, objectId);
        if (!found) {
            throw new NotFoundException('userbookmark_not_found');
        }
        return await this.bookmarkRepo.remove(found);
    }

    async exists(id: string, type: string, objectId: string): Promise<boolean> {
        const found = await this.findByUserIdTypeAndObjectId(id, type, objectId);
        return !!found;
    }
}
