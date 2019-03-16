import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { OrganizationEntity } from './organization.entity';
import { OrganizationInputDTO } from './organization-input.dto';
import { UserBookmarkOptions } from '../user/user-bookmark/user-bookmark-options';

@Injectable()
export class OrganizationDataService {

    constructor(
        @InjectRepository(OrganizationEntity) private readonly organizationRepo: Repository<OrganizationEntity>,
    ) {
    }
    async findAll(skip?: number, take?: number, bookmarkOptions?: UserBookmarkOptions): Promise<OrganizationEntity[]> {
        if (bookmarkOptions.first || bookmarkOptions.only) {
            return await this.findBookmarked(skip, take, bookmarkOptions);
        }
        return await this.organizationRepo.find({ skip, take, relations: ['parent'] });
    }

    async findBookmarked(skip: number, take: number, bookmarkOptions: UserBookmarkOptions): Promise<OrganizationEntity[]> {
        let bookmarked: OrganizationEntity[];
        if (bookmarkOptions.ids) {
            bookmarked = await this.organizationRepo.find({
                where: { id: In([...bookmarkOptions.ids]) },
                skip,
                take,
            });
        }
        if (bookmarkOptions.only || (take > 0 && take <= bookmarked.length)) {
            return bookmarked;
        }
        const takeMore = take > 0 ? take - bookmarked.length : 0;
        let findOptions: {};
        if (bookmarkOptions.ids) {
            findOptions = { where: { id: Not(In([...bookmarkOptions.ids])) }, skip, take: takeMore };
        } else {
            findOptions = { skip, take: takeMore };
        }
        const more = await this.organizationRepo.find(findOptions);
        return [...bookmarked, ...more];
    }

    async findById(id: string): Promise<OrganizationEntity> {
        const result = await this.organizationRepo.findOne(id, { relations: ['parent'] });
        if (!result) {
            throw new NotFoundException('org_not_found');
        }
        return result;
    }

    async findOne(id, withRelations = false): Promise<OrganizationEntity> {
        if (withRelations) {
            return await this.organizationRepo.findOne(id, {
                relations: ['receivers', 'users', 'parent', 'children'],
            });
        }
        return await this.organizationRepo.findOne(id);
    }

    async findTree(parent: string): Promise<OrganizationEntity> {
        const root = await this.organizationRepo.findOne(parent);
        if (!root) {
            throw new NotFoundException('org_root_not_found');
        }
        return await this.organizationRepo.manager
            .getTreeRepository(OrganizationEntity)
            .findDescendantsTree(root);
    }

    async findTreeIds(parent: string): Promise<string[]> {
        const orgIds: string[] = [];
        const tree = await this.findTree(parent);
        if (!tree) {
            throw new NotFoundException('org_tree_not_found');
        }
        return this.flattenTree(orgIds, tree);
    }

    async create(input: Partial<OrganizationInputDTO>): Promise<OrganizationEntity> {
        const found = await this.organizationRepo.findOne(input.id);
        if (found) {
            throw new BadRequestException('org_already_exists');
        }
        const { parentId } = input;
        delete input.parentId;
        const entity = this.organizationRepo.create(input);
        if (parentId) {
            entity.parent = await this.validateParent(input.id, parentId);
        }
        const result = await this.organizationRepo.save(entity);
        if (!result) {
            throw new InternalServerErrorException('org_create_failed');
        }
        return result;
    }

    async update(input: Partial<OrganizationInputDTO>): Promise<OrganizationEntity> {
        const found = await this.organizationRepo.findOne(input.id, { relations: ['parent'] });
        if (!found) {
            throw new NotFoundException('org_not_found');
        }
        const { parentId } = input;
        delete input.parentId;
        const entity = this.organizationRepo.create({ ...found, ...input });
        if (parentId !== undefined && ((found.parent && parentId !== found.parent.id)  || !found.parent)) {
            const parent = await this.validateParent(input.id, parentId);
            parent ? entity.parent = parent : delete entity.parent;
        }
        const result = await this.organizationRepo.save(entity);
        if (!result) {
            throw new InternalServerErrorException('org_update_failed');
        }
        return result;
    }

    async delete(id: string, ignoreRelations = false): Promise<OrganizationEntity> {
        const withRelations = true;
        const found = await this.findOne(id, withRelations);
        if (!found) {
            throw new NotFoundException('org_not_found');
        }
        if (!ignoreRelations && (found.children.length || found.users.length || found.receivers.length)) {
            throw new BadRequestException('org_cannot_delete');
        }
        return this.organizationRepo.remove(found);
    }

    private flattenTree(result: string[], tree: any): string[] {
        if (tree) {
            result.push(tree.id);
        }
        if (tree.children) {
            tree.children.forEach((child: any) => this.flattenTree(result, child));
        }
        return result;
    }

    async validateParent(id: string, parentId: string): Promise<OrganizationEntity | undefined> {
        if (!parentId) {
            return undefined;
        }
        const parent = await this.organizationRepo.findOne(parentId);
        if (!parent) {
            throw new BadRequestException('org_parent_not_found');
        }
        if (parentId === id) {
            throw new BadRequestException('org_parent_self_ref');
        }
        let tree;
        try {
            tree = await this.findTreeIds(id);
        } catch (ex) {
            tree = [];
        }
        if (tree.findIndex(o => o === parentId) > 0) {
            throw new BadRequestException('org_parent_circular_ref');
        }
        return parent;
    }
}
