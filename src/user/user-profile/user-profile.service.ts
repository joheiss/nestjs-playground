import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserProfileEntity } from './user-profile.entity';
import { UserProfileInputDTO } from './user-profile-input.dto';
import { ServiceOperation } from '../../shared/services/service-operation';
import { REGEXP_EMAIL, REGEXP_PHONE, REGEXP_URL } from '../../shared/validation/validations.regex';
import { AuthDTO } from '../../auth/auth.dto';
import { Role } from '../../auth/role';
import { UserProfileDataService } from './user-profile.data.service';

@Injectable()
export class UserProfileService {

    constructor(
        private readonly dataService: UserProfileDataService,
    ) {
    }

    async findByUserId(auth: AuthDTO, id: string): Promise<UserProfileEntity> {
        if (!Role.isOwner(id, auth.id) && !Role.isSuper(auth)) {
            throw new UnauthorizedException('userprofile_get_not_allowed');
        }
        return await this.dataService.findByUserId(id);
    }

    async update(auth: AuthDTO, input: Partial<UserProfileInputDTO>): Promise<UserProfileEntity> {
        if (!Role.isOwner(input.id, auth.id) && !Role.isSuper(auth)) {
            throw new UnauthorizedException('userprofile_update_not_allowed');
        }
        this.validateInput(input, ServiceOperation.UPDATE);
        return await this.dataService.update(input);
    }

    async delete(auth: AuthDTO, id: string): Promise<UserProfileEntity> {
        if (!Role.isSuper(auth)) {
            throw new UnauthorizedException('userprofile_delete_not_allowed');
        }
        return await this.dataService.delete(id);
    }

    validateInput(input: Partial<UserProfileInputDTO>, operation?: string): void {
        if (operation === ServiceOperation.CREATE) {
            if (!input.displayName) {
                throw new BadRequestException('userprofile_displayname_invalid');
            }
            if (!input.email) {
                throw new BadRequestException('userprofile_email_invalid');
            }
        }
        if (input.displayName !== undefined && !input.displayName.length) {
            throw new BadRequestException('userprofile_displayname_invalid');
        }
        if (input.email !== undefined && !input.email.match(REGEXP_EMAIL)) {
            throw new BadRequestException('userprofile_email_invalid');
        }
        if (input.phone && !input.phone.match(REGEXP_PHONE)) {
            throw new BadRequestException('userprofile_phone_invalid');
        }
        if (input.imageUrl && input.imageUrl.length && !input.imageUrl.match(REGEXP_URL)) {
            throw new BadRequestException('userprofile_imageurl_invalid');
        }
    }
}
