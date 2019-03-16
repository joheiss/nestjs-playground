import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BOType } from '../../shared/bo-type';
import { UserBookmarkDTO } from './user-bookmark.dto';
import { UserProfileEntity } from '../user-profile/user-profile.entity';

@Entity('user_bookmarks')
export class UserBookmarkEntity {
    @PrimaryColumn()
    id: string;
    @PrimaryColumn()
    type: string;
    @PrimaryColumn()
    objectId: string;
    @Column({ readonly: true, default: BOType.USERBOOKMARKS })
    objectType: string;
    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => UserProfileEntity, profile => profile.bookmarks)
    profile: UserProfileEntity;

    toDTO(): UserBookmarkDTO  {
        const { createdAt, ...dto} = this;
        return {...dto } as UserBookmarkDTO;
    }
    toShortDTO(): { type: string, objectId: string }  {
        return { type: this.type, objectId: this.objectId };
    }
}
