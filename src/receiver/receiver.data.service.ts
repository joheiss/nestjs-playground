import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReceiverEntity } from './receiver.entity';
import { ReceiverInputDTO } from './receiver-input.dto';
import { UserBookmarkEntity } from '../user/user-bookmark/user-bookmark.entity';
import { OrganizationEntity } from '../organization/organization.entity';
import { UserBookmarkOptions } from '../user/user-bookmark/user-bookmark-options';

@Injectable()
export class ReceiverDataService {

    constructor(
        @InjectRepository(ReceiverEntity) private readonly receiverRepo: Repository<ReceiverEntity>,
        @InjectRepository(UserBookmarkEntity) private readonly bookmarkRepo: Repository<UserBookmarkEntity>,
        @InjectRepository(OrganizationEntity) private readonly organizationRepo: Repository<OrganizationEntity>,
    ) {
    }

    async exists(id: string): Promise<boolean> {
        return !!(await this.receiverRepo.findOne(id));
    }

    async findAll(orgIds: string[], skip?: number, take?: number, bookmarkOptions?: UserBookmarkOptions): Promise<ReceiverEntity[]> {
        if (bookmarkOptions.first || bookmarkOptions.only) {
            return await this.findBookmarked(orgIds, skip, take, bookmarkOptions);
        }
        let query = this.receiverRepo
            .createQueryBuilder('receiver')
            .innerJoinAndSelect('receiver.organization', 'organization', 'organization.id IN (:...orgIds)', { orgIds });
        if (take > 0) {
            query = query.skip(skip).take(take);
        }
        return await query.getMany();
    }

    async findBookmarked(orgIds: string[], skip: number, take: number, bookmarkOptions: UserBookmarkOptions): Promise<ReceiverEntity[]> {
        const baseQuery = this.receiverRepo
            .createQueryBuilder('receiver')
            .innerJoinAndSelect('receiver.organization', 'organization', 'organization.id IN (:...orgIds)', { orgIds });
        let bookmarkedQuery = baseQuery;
        if (bookmarkOptions.ids) {
            bookmarkedQuery = bookmarkedQuery
                .where('receiver.id IN (:...bookmarkedIds)', { bookmarkedIds: bookmarkOptions.ids });
        }
        let bookmarked: ReceiverEntity[];
        if (take) {
            bookmarkedQuery = bookmarkedQuery.skip(skip).take(take);
        }
        bookmarked = await bookmarkedQuery.getMany();
        if (bookmarkOptions.only || (take > 0 && take <= bookmarked.length)) {
            return bookmarked;
        }
        let moreQuery = baseQuery;
        const takeMore = take - bookmarked.length;
        if (bookmarkOptions.ids) {
            moreQuery = moreQuery
                .where('receiver.id NOT IN (:...bookmarkedIds)', { bookmarkedIds: bookmarkOptions.ids });
        }
        if (take) {
            moreQuery = moreQuery.skip(skip).take(takeMore);
        }
        const more = await moreQuery.getMany();
        return [...bookmarked, ...more];
    }

    async findById(orgIds: string[], id: string): Promise<ReceiverEntity> {
        const result = await this.receiverRepo
            .createQueryBuilder('receiver')
            .innerJoinAndSelect('receiver.organization', 'organization', 'organization.id IN (:...orgIds)', { orgIds })
            .where('receiver.id = :id', { id })
            .getOne();
        if (!result) {
            throw new NotFoundException('receiver_not_found');
        }
        return result;
    }

    async findOne(id: string): Promise<ReceiverEntity> {
        return await this.receiverRepo.findOne(id, { relations: ['organization'] });
    }

    async create(input: Partial<ReceiverInputDTO>): Promise<ReceiverEntity> {
        const organization = await this.organizationRepo.findOne(input.orgId);
        delete input.orgId;
        const entity = this.receiverRepo.create({ ...input, organization });
        const result = await this.receiverRepo.save(entity);
        if (!result) {
            throw new InternalServerErrorException('receiver_not_created');
        }
        return result;
    }

    async update(input: Partial<ReceiverInputDTO>): Promise<ReceiverEntity> {
        const found = await this.findOne(input.id);
        if (!found) {
            throw new NotFoundException('receiver_not_found');
        }
        const updates = { ...found, ...input };
        if (input.orgId) {
            updates.organization = await this.organizationRepo.findOne(input.orgId);
            delete input.orgId;
        }
        const entity = this.receiverRepo.create(updates);
        const result = await this.receiverRepo.save(entity);
        if (!result) {
            throw new InternalServerErrorException('receiver_update_failed');
        }
        return result;
    }

    async delete(id: string, ignoreRelations = false): Promise<ReceiverEntity> {
        const found = await this.receiverRepo.findOne(id);
        if (!found) {
            throw new NotFoundException('receiver_not_found');
        }
        return await this.receiverRepo.remove(found);
    }

    async nextId(): Promise<any> {
        return await this.receiverRepo
            .createQueryBuilder('receiver')
            .select('max(receiver.id)')
            .getRawOne();
    }
}
