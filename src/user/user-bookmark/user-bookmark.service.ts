import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserBookmarkEntity } from './user-bookmark.entity';
import { UserBookmarkInputDTO } from './user-bookmark-input.dto';
import { ServiceOperation } from '../../shared/services/service-operation';
import { Role } from '../../auth/role';
import { AuthDTO } from '../../auth/auth.dto';
import { UserBookmarkDataService } from './user-bookmark.data.service';

@Injectable()
export class UserBookmarkService {
    constructor(
        private readonly dataService: UserBookmarkDataService,
    ) {
    }

   async findByUserId(auth: AuthDTO, id: string): Promise<UserBookmarkEntity[]> {
        if (!Role.isOwner(id, auth.id) && !Role.isSuper(auth)) {
            throw new UnauthorizedException('userbookmark_get_not_allowed');
        }
        return await this.dataService.findByUserId(id);
    }

    async findByUserIdAndType(auth: AuthDTO, id: string, type: string): Promise<UserBookmarkEntity[]> {
        if (!Role.isOwner(id, auth.id) && !Role.isSuper(auth)) {
            throw new UnauthorizedException('userbookmark_get_not_allowed');
        }
        return await this.dataService.findByUserIdAndType(id, type);
    }

    async findByUserIdTypeAndObjectId(auth: AuthDTO, id: string, type: string, objectId: string): Promise<UserBookmarkEntity> {
        if (!Role.isOwner(id, auth.id) && !Role.isSuper(auth)) {
            throw new UnauthorizedException('userbookmark_get_not_allowed');
        }
        const result = await this.dataService.findByUserIdTypeAndObjectId(id, type, objectId);
        if (!result) {
            throw new NotFoundException('userbookmark_not_found');
        }
        return result;
    }

    async create(auth: AuthDTO, input: Partial<UserBookmarkInputDTO>): Promise<UserBookmarkEntity> {
        if (!Role.isOwner(input.id, auth.id) && !Role.isSuper(auth)) {
            throw new UnauthorizedException('userbookmark_create_not_allowed');
        }
        this.validateInput(input, ServiceOperation.CREATE);
        if (await this.dataService.exists(input.id, input.type, input.objectId)) {
            throw new BadRequestException('userbookmark_already_exists');
        }
        return await this.dataService.create(input);
    }

    async deleteByUserId(auth: AuthDTO, id: string): Promise<UserBookmarkEntity[]> {
        if (!Role.isOwner(id, auth.id) && !Role.isSuper(auth)) {
            throw new UnauthorizedException('userbookmark_delete_not_allowed');
        }
        return await this.dataService.deleteByUserId(id);
    }

    async deleteByUserIdAndType(auth: AuthDTO, id: string, type: string): Promise<UserBookmarkEntity[]> {
        if (!Role.isOwner(id, auth.id) && !Role.isSuper(auth)) {
            throw new UnauthorizedException('userbookmark_delete_not_allowed');
        }
        return await this.dataService.deleteByUserIdAndType(id, type);
    }

    async deleteByUserIdTypeAndObjectId(auth: AuthDTO, id: string, type: string, objectId: string): Promise<UserBookmarkEntity> {
        if (!Role.isOwner(id, auth.id) && !Role.isSuper(auth)) {
            throw new UnauthorizedException('userbookmark_delete_not_allowed');
        }
        return await this.dataService.deleteByUserIdTypeAndObjectId(id, type, objectId);
    }

    private validateInput(input: Partial<UserBookmarkInputDTO>, operation: string): void {
        if (operation === ServiceOperation.CREATE) {
            if (!(input.id && input.id.length)) {
                throw new BadRequestException('userbookmark_id_not_allowed');
            }
            if (!(input.type && input.type.length)) {
                throw new BadRequestException('userbookmark_type_not_allowed');
            }
            if (!(input.objectId && input.objectId.length)) {
                throw new BadRequestException('userbookmark_objectid_not_allowed');
            }
        }
    }
}
