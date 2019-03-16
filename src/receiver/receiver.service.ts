import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ReceiverEntity } from './receiver.entity';
import { ReceiverInputDTO } from './receiver-input.dto';
import { AuthDTO } from '../auth/auth.dto';
import { BOType } from '../shared/bo-type';
import { PaginationService } from '../shared/services/pagination.service';
import { REGEXP_COUNTRYCODEISO, REGEXP_EMAIL, REGEXP_PHONE, REGEXP_URL } from '../shared/validation/validations.regex';
import { ReceiverStatus } from './receiver-status';
import { ServiceOperation } from '../shared/services/service-operation';
import { ReceiverDataService } from './receiver.data.service';
import { UserBookmarkDataService } from '../user/user-bookmark/user-bookmark.data.service';
import { OrganizationDataService } from '../organization/organization.data.service';
import { OrganizationService } from '../organization/organization.service';
import { UserBookmarkOptions } from '../user/user-bookmark/user-bookmark-options';

@Injectable()
export class ReceiverService {
    constructor(
        private readonly dataService: ReceiverDataService,
        private readonly paginationService: PaginationService,
        private readonly bookmarkDataService: UserBookmarkDataService,
        private readonly organizationService: OrganizationService,
        private readonly organizationDataService: OrganizationDataService,
    ) {
    }

    async findAll(auth: AuthDTO, page: number, bookmarkOptions?: UserBookmarkOptions): Promise<ReceiverEntity[]> {
        const { take, skip } = await this.paginationService.getSkipAndTake(auth, BOType.RECEIVERS, page);
        const orgIds = await this.organizationDataService.findTreeIds(auth.orgId);
        if (bookmarkOptions.first || bookmarkOptions.only) {
            bookmarkOptions.ids = await this.bookmarkDataService.findByUserIdAndType(auth.id, BOType.RECEIVERS)
                .then(res => res.map(b => b.objectId));
        }
        return await this.dataService.findAll(orgIds, skip, take, bookmarkOptions);
    }

    async findById(auth: AuthDTO, id: string): Promise<ReceiverEntity> {
        const orgIds = await this.organizationDataService.findTreeIds(auth.orgId);
        return await this.dataService.findById(orgIds, id);
    }

    async create(auth: AuthDTO, input: Partial<ReceiverInputDTO>): Promise<ReceiverEntity> {
        this.validateInput(input, ServiceOperation.CREATE);
        const id = await this.nextId();
        input.id = id;
        if (await this.dataService.exists(id)) {
            throw new BadRequestException('receiver_already_exists');
        }
        input.orgId = await this.organizationService.validateOrg(auth, input.orgId);
        return await this.dataService.create(input);
    }

    async update(auth: AuthDTO, id: string, input: Partial<ReceiverInputDTO>): Promise<ReceiverEntity> {
        this.validateInput(input, ServiceOperation.UPDATE);
        if (input.orgId) {
            await this.organizationService.validateOrg(auth, input.orgId);
        }
        const found = await this.dataService.findOne(id);
        if (!found) {
            throw new NotFoundException('receiver_not_found');
        }
        if (found.organization && found.organization.id) {
            await this.organizationService.validateOrg(auth, found.organization.id);
        }
        return this.dataService.update(input);
    }

    async delete(auth: AuthDTO, id: string): Promise<ReceiverEntity> {
        const found = await this.dataService.findOne(id);
        if (!found) {
            throw new NotFoundException('receiver_not_found');
        }
        if (found.organization && found.organization.id) {
            await this.organizationService.validateOrg(auth, found.organization.id);
        }
        return await this.dataService.delete(id);
    }

    private async nextId(): Promise<string> {
        const curr = await this.dataService.nextId();
        return curr && curr.max ? (+curr.max + 1).toString() : '1901';
    }

    private validateInput(input: Partial<ReceiverInputDTO>, operation?: string): void {
        if (operation === ServiceOperation.CREATE) {
            if (!(input.name && input.name.length)) {
                throw new BadRequestException('receiver_name_invalid');
            }
            if (!(input.country && input.country.match(REGEXP_COUNTRYCODEISO))) {
                throw new BadRequestException('receiver_country_invalid');
            }
        }

        if (input.name !== undefined && !input.name.length) {
            throw new BadRequestException('receiver_name_invalid');
        }
        if (input.country !== undefined && !input.country.match(REGEXP_COUNTRYCODEISO)) {
            throw new BadRequestException('receiver_country_invalid');
        }
        if (input.orgId !== undefined && !input.orgId.length) {
            throw new BadRequestException('receiver_org_invalid');
        }
        if (input.status !== undefined && !ReceiverStatus.isValid(input.status)) {
            throw new BadRequestException('receiver_status_invalid');
        }
        if (input.email && !input.email.match(REGEXP_EMAIL)) {
            throw new BadRequestException('receiver_email_invalid');
        }
        if (input.phone && !input.phone.match(REGEXP_PHONE)) {
            throw new BadRequestException('receiver_phone_invalid');
        }
        if (input.fax && !input.fax.match(REGEXP_PHONE)) {
            throw new BadRequestException('receiver_fax_invalid');
        }
        if (input.webSite && !input.webSite.match(REGEXP_URL)) {
            throw new BadRequestException('receiver_website_invalid');
        }
    }
}
