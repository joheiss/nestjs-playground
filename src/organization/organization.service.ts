import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { OrganizationEntity } from './organization.entity';
import { OrganizationInputDTO } from './organization-input.dto';
import { BOType } from '../shared/bo-type';
import { AuthDTO } from '../auth/auth.dto';
import { PaginationService } from '../shared/services/pagination.service';
import { ServiceOperation } from '../shared/services/service-operation';
import { OrganizationStatus } from './organization-status';
import { Role } from '../auth/role';
import { OrganizationDataService } from './organization.data.service';
import { UserBookmarkDataService } from '../user/user-bookmark/user-bookmark.data.service';
import { UserBookmarkOptions } from '../user/user-bookmark/user-bookmark-options';

@Injectable()
export class OrganizationService {

    constructor(
        private readonly dataService: OrganizationDataService,
        private readonly paginationService: PaginationService,
        private readonly bookmarkDataService: UserBookmarkDataService,
    ) {
    }

    async findAll(auth: AuthDTO, page: number, bookmarkOptions: UserBookmarkOptions): Promise<OrganizationEntity[]> {
        const { take, skip } = await this.paginationService.getSkipAndTake(auth, BOType.ORGANIZATIONS, page);
        if (bookmarkOptions.first || bookmarkOptions.only) {
            bookmarkOptions.ids = await this.bookmarkDataService.findByUserIdAndType(auth.id, BOType.ORGANIZATIONS)
                .then(res => res.map(b => b.objectId));
        }
        return await this.dataService.findAll(skip, take, bookmarkOptions);
    }

    async findById(id: string): Promise<OrganizationEntity> {
        return await this.dataService.findById(id);
    }

    async findTree(parent: string): Promise<any> {
       return await this.dataService.findTree(parent);
    }

    async findTreeIds(parent: string): Promise<string[]> {
        return await this.dataService.findTreeIds(parent);
    }

    async create(auth: AuthDTO, input: Partial<OrganizationInputDTO>): Promise<OrganizationEntity> {
        this.validateInput(input, ServiceOperation.CREATE);
        if (!Role.isSuper(auth) && !input.parentId) {
            throw new UnauthorizedException('org_parent_not_allowed');
        }
        if (input.parentId) {
            await this.validateOrg(auth, input.parentId);
        }
        return await this.dataService.create(input);
    }

    async update(auth: AuthDTO, input: Partial<OrganizationInputDTO>): Promise<OrganizationEntity> {
        this.validateInput(input, ServiceOperation.UPDATE);
        const withRelations = true;
        const found = await this.dataService.findOne(input.id, withRelations);
        if (!found) {
            throw new NotFoundException('org_not_found');
        }
        if (!Role.isSuper(auth) && !input.parentId && !found.parent) {
            throw new UnauthorizedException('org_parent_not_allowed');
        }
        await this.validateOrg(auth, input.id);
        if (input.parentId !== undefined && (found.parent && input.parentId !== found.parent.id || !found.parent)) {
            await this.validateOrg(auth, input.parentId);
        }
        return this.dataService.update(input);
    }

    async delete(auth: AuthDTO, id: string): Promise<OrganizationEntity> {
        await this.validateOrg(auth, id);
        const withRelations = true;
        const found = await this.dataService.findOne(id, withRelations);
        if (!found) {
            throw new NotFoundException('org_not_found');
        }
        if (!found.parent && !Role.isSuper(auth)) {
            throw new UnauthorizedException('org_delete_not_allowed');
        }
        return this.dataService.delete(id);
    }

    async validateOrg(auth: AuthDTO, inputOrgId: string): Promise<string> {
        if (inputOrgId) {
            if (!Role.isSuper(auth)) {
                const orgIds = await this.findTreeIds(auth.orgId);
                if (!orgIds.some(o => o === inputOrgId)) {
                    throw new UnauthorizedException('org_not_allowed');
                }
            }
        } else {
            inputOrgId = auth.orgId;
        }
        return inputOrgId;
    }

    private validateInput(input: Partial<OrganizationInputDTO>, operation: string): void {
        if (operation === ServiceOperation.CREATE) {
            if (!(input.id && input.id.length && !input.id.startsWith(' '))) {
                throw new BadRequestException('org_id_invalid');
            }
            if (!(input.name && input.name.length && !input.name.startsWith(' '))) {
                throw new BadRequestException('org_name_invalid');
            }
        } else if (operation === ServiceOperation.UPDATE) {
            if (input.id !== undefined && (input.id.length === 0 || input.id.startsWith(' '))) {
                throw new BadRequestException('org_id_invalid');
            }
            if (input.name !== undefined && (input.name.length === 0 || input.name.startsWith(' '))) {
                throw new BadRequestException('org_name_invalid');
            }
        }
        if (input.status !== undefined && !OrganizationStatus.isValid(input.status)) {
            throw new BadRequestException('org_status_invalid');
        }
    }
}
