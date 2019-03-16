import { Column, CreateDateColumn, Entity, JoinTable, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { UserProfileDTO } from './user-profile.dto';
import { BOType } from '../../shared/bo-type';
import { UserBookmarkEntity } from '../user-bookmark/user-bookmark.entity';
import { UserSettingEntity } from '../user-setting/user-setting.entity';

@Entity('user_profiles')
export class UserProfileEntity {
    @PrimaryColumn()
    id: string;
    @Column({ readonly: true, default: BOType.USERPROFILES })
    objectType: string;
    @Column({nullable: true})
    displayName: string;
    @Column({nullable: true})
    email: string;
    @Column({nullable: true})
    phone: string;
    @Column({nullable: true})
    imageUrl: string;
    @CreateDateColumn()
    createdAt: Date;
    @UpdateDateColumn()
    changedAt: Date;

    @OneToMany(() => UserSettingEntity, setting => setting.profile, { cascade: true })
    settings: UserSettingEntity[];

    @OneToMany(() => UserBookmarkEntity, bookmark => bookmark.profile, { cascade: true })
    bookmarks: UserBookmarkEntity[];

    toDTO(): UserProfileDTO  {
        const { createdAt, changedAt, ...dto} = this;
        return {...dto } as UserProfileDTO;
    }
}
