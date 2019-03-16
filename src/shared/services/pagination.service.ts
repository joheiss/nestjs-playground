import { Injectable } from '@nestjs/common';
import { UserSettingService } from '../../user/user-setting/user-setting.service';
import { UserSettingEntity } from '../../user/user-setting/user-setting.entity';
import { AuthDTO } from '../../auth/auth.dto';

@Injectable()
export class PaginationService {

  constructor(private readonly userSettingService: UserSettingService) {}

  async getSkipAndTake(auth: AuthDTO, type: string, page: number): Promise<{ skip: number, take: number }> {
    const take = page > 0 ? (await this.getUserSettings(auth, type)).listLimit : 0;
    const skip = page > 0 ? (page - 1) * take : 0;
    return { skip, take };
  }

  async getUserSettings(auth: AuthDTO, type: string): Promise<UserSettingEntity> {
    return await this.userSettingService.findByUserIdAndTypeOrDefault(auth, auth.id, type);
  }
}
