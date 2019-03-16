import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class AuthDataService {

    constructor(@InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>) {
    }

    async findUser(id: string): Promise<UserEntity> {
        const found = await this.userRepo.findOne(id, { relations: ['organization'] });
        if (!found) {
            throw new UnauthorizedException('login_failed');
        }
        return found;
    }

    async whoAmI(id: string): Promise<any> {
        return await this.userRepo
            .createQueryBuilder('user')
            .innerJoinAndSelect('user.organization', 'organization')
            .innerJoinAndSelect('user.profile', 'profile')
            .leftJoinAndSelect('profile.settings', 'settings')
            .leftJoinAndSelect('profile.bookmarks', 'bookmarks')
            .where('user.id = :id', { id })
            .getOne()
            .then(res => {
                if (!res) {
                    throw new NotFoundException('user_not_found');
                }
                return res;
            });
    }
}
