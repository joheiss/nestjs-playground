import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UserEntity } from './user.entity';
import { FindManyOptions, In, Not, Repository } from 'typeorm';
import { UserInputDTO } from './user-input.dto';
import { UserSettingEntity } from './user-setting/user-setting.entity';
import { UserProfileEntity } from './user-profile/user-profile.entity';
import { AuthDTO } from '../auth/auth.dto';
import { UserBookmarkEntity } from './user-bookmark/user-bookmark.entity';
import { UserBookmarkOptions } from './user-bookmark/user-bookmark-options';
import { OrganizationEntity } from '../organization/organization.entity';

@Injectable()
export class UserDataService {

    constructor(
        @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
        @InjectRepository(UserProfileEntity) private readonly profileRepo: Repository<UserProfileEntity>,
        @InjectRepository(UserSettingEntity) private readonly settingRepo: Repository<UserSettingEntity>,
        @InjectRepository(UserBookmarkEntity) private readonly bookmarkRepo: Repository<UserBookmarkEntity>,
        @InjectRepository(OrganizationEntity) private readonly organizationRepo: Repository<OrganizationEntity>,
    ) {
    }

    async exists(id: string | undefined): Promise<boolean> {
        const found = await this.userRepo.findOne(id, { relations: ['organization'] });
        return !!found;
    }

    async findAll(skip?: number, take?: number, bookmarkOptions?: UserBookmarkOptions): Promise<UserEntity[]> {
        if (bookmarkOptions.first || bookmarkOptions.only) {
            return await this.findBookmarked(skip, take, bookmarkOptions);
        }
        let findOptions: FindManyOptions<UserEntity> = { relations: ['organization', 'profile'] };
        if (take > 0) {
            findOptions = { ...findOptions, skip, take };
        }
        return this.userRepo.find(findOptions);
    }

    async findBookmarked(skip: number, take: number, bookmarkOptions: UserBookmarkOptions): Promise<UserEntity[]> {
        let bookmarked: UserEntity[];
        const baseFindOptions: FindManyOptions<UserEntity> = { relations: ['organization'] };
        if (bookmarkOptions.ids) {
            const bookmarkFindOptions = {
                ...baseFindOptions,
                where: { id: In([...bookmarkOptions.ids]) }, skip, take,
            };
            bookmarked = await this.userRepo.find(bookmarkFindOptions);
        }
        if (bookmarkOptions.only || (take > 0 && take <= bookmarked.length)) {
            return bookmarked;
        }
        const takeMore = take > 0 ? take - bookmarked.length : 0;
        let moreFindOptions = baseFindOptions;
        if (bookmarkOptions.ids) {
            moreFindOptions = {
                ...moreFindOptions,
                where: { id: Not(In([...bookmarkOptions.ids])) },
            };
        }
        moreFindOptions = { ...moreFindOptions, skip, take: takeMore };
        const more = await this.userRepo.find(moreFindOptions);
        return [...bookmarked, ...more];
    }

    async findById(id: string): Promise<UserEntity> {
        const result = await this.userRepo.findOne(id, { relations: ['organization', 'profile'] });
        if (!result) {
            throw new NotFoundException('user_not_found');
        }
        return result;
    }

    async create(input: Partial<UserInputDTO>): Promise<UserEntity> {
        if (await this.exists(input.id)) {
            throw new BadRequestException('user_already_exists');
        }
        const setting = await this.buildUserSettingEntity(input);
        const entity = await this.buildUserEntity(input, [setting]);
        const result = await this.userRepo.save(entity);
        if (!result) {
            throw new InternalServerErrorException('user_not_created');
        }
        return result;
    }

    async update(id: string, input: Partial<UserInputDTO>): Promise<UserEntity> {
        const found = await this.findById(id);
        let organization = found.organization;
        if (input.orgId && input.orgId !== found.organization.id) {
            organization = await this.organizationRepo.findOne(input.orgId);
            if (!organization) {
                throw new BadRequestException(`user_org_not_found#${input.orgId}`);
            }
        }
        const roles = input.roles ? input.roles.join(', ') : found.roles;
        const locked = input.locked;
        const updates = { ...found, organization, roles, locked } as UserEntity;
        if (input.password) {
            updates.password = input.password;
        }
        const entity = this.userRepo.create(updates);
        const result = await this.userRepo.save(entity);
        if (!result) {
            throw new InternalServerErrorException('user_update_failed');
        }
        return result;
    }

    async delete(id: string): Promise<any> {
        const found = await this.findById(id);
        await this.userRepo.remove(found);
        if (found.profile) {
            await this.profileRepo.remove(found.profile);
        }
        return found;
    }

    private async buildUserEntity(input: Partial<UserInputDTO>, settings?: UserSettingEntity[]): Promise<UserEntity> {
        const roles = input.roles ? input.roles.join(', ') : undefined;
        const profile = await this.buildUserProfileEntity(input, settings);
        const { id, password, orgId, locked } = input;
        let organization;
        if (orgId) {
            organization = await this.organizationRepo.findOne(orgId);
        }
        const merged = { id, password, organization, roles, profile, locked };
        return this.userRepo.create(merged);
    }

    private async buildUserProfileEntity(input: Partial<UserInputDTO>, settings?: UserSettingEntity[]): Promise<UserProfileEntity> {
        const { displayName, email, phone, imageUrl } = input;
        const profile = { id: input.id, displayName, email, phone, imageUrl } as UserProfileEntity;
        if (settings) {
            profile.settings = settings;
        }
        const entity = this.profileRepo.create(profile);
        return await this.profileRepo.save(entity);
    }

    private async buildUserSettingEntity(input: Partial<UserInputDTO>): Promise<UserSettingEntity> {
        const entity = this.settingRepo.create({ id: input.id, type: 'default' });
        return await this.settingRepo.save(entity);
    }
}
