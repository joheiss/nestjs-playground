import { BeforeInsert, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';

import { UserDTO } from './user.dto';
import { OrganizationEntity } from '../organization/organization.entity';
import * as bcrypt from 'bcryptjs';
import { BOType } from '../shared/bo-type';
import { UserProfileEntity } from './user-profile/user-profile.entity';

@Entity('users')
export class UserEntity {
  @PrimaryColumn({ unique: true })
  id: string;
  @Column()
  password: string;
  @Column({ readonly: true, default: BOType.USERS })
  objectType: string;
  @Column({ nullable: true })
  roles: string;
  @Column({ default: false })
  locked: boolean;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  changedAt: Date;

  @OneToOne(() => UserProfileEntity, { cascade: true, nullable: true })
  @JoinColumn()
  profile: UserProfileEntity;

  @Index({ unique: false })
  @ManyToOne(() => OrganizationEntity, organization => organization.users)
  organization: OrganizationEntity;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  toDTO(): UserDTO {
    const { password, createdAt, changedAt, roles, organization, ...dto } = this;
    const rolesArray = roles.split(',').map(r => r.trim());
    const orgId = organization.id || undefined;
    return { ...dto, orgId, roles: rolesArray } as UserDTO;
  }
}
