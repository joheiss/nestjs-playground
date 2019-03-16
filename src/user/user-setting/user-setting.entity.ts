import { Column, CreateDateColumn, Entity, JoinTable, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { UserSettingDTO } from './user-setting.dto';
import { BOType } from '../../shared/bo-type';
import { UserProfileEntity } from '../user-profile/user-profile.entity';

@Entity('user_settings')
export class UserSettingEntity {
  @PrimaryColumn()
  id: string;
  @PrimaryColumn({ default: 'default' })
  type: string;
  @Column({ readonly: true, default: BOType.USERSETTINGS })
  objectType: string;
  @Column('int', { default: 10 })
  listLimit: number;
  @Column('int', { default: 90 })
  bookmarkExpiration: number;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  changedAt: Date;

  @ManyToOne(() => UserProfileEntity, profile => profile.settings)
  profile: UserProfileEntity;

  toDTO(): UserSettingDTO {
    const { createdAt, changedAt, ...dto } = this;
    return { ...dto } as UserSettingDTO;
  }

  toShortDTO(): { type: string, listLimit: number, bookmarkExpiration: number } {
    return { type: this.type, listLimit: this.listLimit, bookmarkExpiration: this.bookmarkExpiration };
  }
}
