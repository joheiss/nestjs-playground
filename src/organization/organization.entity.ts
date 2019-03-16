import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, Tree, TreeChildren, TreeParent, UpdateDateColumn } from 'typeorm';
import { OrganizationDTO } from './organization.dto';
import { ReceiverEntity } from '../receiver/receiver.entity';
import { UserEntity } from '../user/user.entity';
import { OrganizationStatus } from './organization-status';
import { BOType } from '../shared/bo-type';

@Entity('organizations')
@Tree('materialized-path')
export class OrganizationEntity {
  @PrimaryColumn({ unique: true })
  id: string;
  @Column({ readonly: true, default: BOType.ORGANIZATIONS })
  objectType: string;
  @Column({ default: true })
  isDeletable: boolean;
  @Column({ type: 'int', default: OrganizationStatus.ACTIVE })
  status: number;
  @Column()
  name: string;
  @Column({ nullable: true})
  timezone: string;
  @Column({ nullable: true})
  currency: string;
  @Column({ nullable: true})
  locale: string;
  @TreeChildren()
  children: OrganizationEntity[];
  @TreeParent()
  parent: OrganizationEntity;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  changedAt: Date;

  @OneToMany(() => UserEntity, user => user.organization)
  users: UserEntity[];

  @OneToMany(() => ReceiverEntity, receiver => receiver.organization)
  receivers: ReceiverEntity[];

  toDTO(withTree = false): OrganizationDTO {
    const { isDeletable, createdAt, changedAt, parent, children, ...dto} = this;
    let tree: OrganizationDTO[];
    const parentId = parent ? parent.id : undefined;
    if (withTree && children && children.length > 0) {
      tree = children.map(c => c.toDTO(withTree));
      return { ...dto, parentId, children: tree } as OrganizationDTO;
    }
    return { ...dto, parentId } as OrganizationDTO;
  }
}
