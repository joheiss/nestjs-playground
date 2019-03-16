import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserEntity } from '../user/user.entity';

import { AuthDTO } from './auth.dto';
import { AuthInputDTO } from './auth-input.dto';

import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { WhoAmIDTO } from './who-am-i.dto';
import { AuthDataService } from './auth.data.service';

@Injectable()
export class AuthService {

    constructor(private readonly dataService: AuthDataService) {
    }

    async whoAmI(id: string): Promise<WhoAmIDTO> {
        return await this.dataService.whoAmI(id).then(res => this.toWhoAmIDTO(res));
    }

    async login(credential: AuthInputDTO): Promise<AuthDTO> {
        this.validateInput(credential);
        const found = await this.dataService.findUser(credential.id);
        if (!found) {
            throw new UnauthorizedException('login_failed');
        }
        if (found.locked) {
            throw new UnauthorizedException('user_locked');
        }
        const valid = await this.isPasswordValid(found, credential.password);
        if (!valid) {
            throw new UnauthorizedException('login_failed');
        }
        return this.toDTO(found);
    }

    private async isPasswordValid(user: UserEntity, password: string): Promise<boolean> {
        return await bcrypt.compare(password, user.password);
    }

    private getToken(user: UserEntity): string {
        const { id, organization, roles } = user;
        const rolesArray = roles.split(',').map(r => r.trim());
        const orgId = organization.id;
        const secret = process.env.SECRET || '';
        return jwt.sign({ id, orgId, roles: rolesArray }, secret, { expiresIn: '1d' });
    }

    private toDTO(user: UserEntity): AuthDTO {
        const { password, createdAt, changedAt, objectType, roles, organization, ...dto } = user;
        const rolesArray = roles.split(',').map((r: string) => r.trim());
        const orgId = organization.id;
        const token = this.getToken(user);
        return { ...dto, orgId, roles: rolesArray, token };
    }

    private toWhoAmIDTO(data: UserEntity): WhoAmIDTO {
        const { password, createdAt, changedAt, objectType, roles, organization, profile, ...user } = data;
        const rolesArray = roles ? roles.split(',').map((r: string) => r.trim()) : [];
        const orgId = organization.id;
        const { displayName, email, phone, imageUrl, settings, bookmarks } = profile;
        const settingsDTO = settings ? settings.map(s => s.toShortDTO()) : [];
        const bookmarksDTO = bookmarks ? bookmarks.map(b => b.toShortDTO()) : [];
        return { ...user, orgId, roles: rolesArray, displayName, email, phone, imageUrl, settings: settingsDTO, bookmarks: bookmarksDTO };
    }

    private validateInput(input: AuthInputDTO): void {
        if (!(input.id && input.id.length >= 8)) {
            throw new BadRequestException('user_id_invalid');
        }
        if (!(input.password && input.password.length >= 8)) {
            throw new BadRequestException('user_password_invalid');
        }
    }
}
