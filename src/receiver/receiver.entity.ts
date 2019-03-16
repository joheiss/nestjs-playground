import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ReceiverDTO } from './receiver.dto';
import { ReceiverStatus } from './receiver-status';
import { OrganizationEntity } from '../organization/organization.entity';
import { BOType } from '../shared/bo-type';

@Entity('receivers')
export class ReceiverEntity {
    @PrimaryColumn({ unique: true })
    id: string;
    @Column({ readonly: true, default: BOType.RECEIVERS })
    objectType: string;
    @Column({ default: true })
    isDeletable: boolean;
    @Column({ type: 'int', default: ReceiverStatus.ACTIVE })
    status: number;
    @Column()
    name: string;
    @Column({ nullable: true })
    nameAdd: string;
    @Column({ length: 3 })
    country: string;
    @Column({ length: 10, nullable: true })
    postalCode: string;
    @Column({ nullable: true })
    city: string;
    @Column({ nullable: true })
    street: string;
    @Column({ nullable: true })
    email: string;
    @Column({ nullable: true })
    phone: string;
    @Column({ nullable: true })
    fax: string;
    @Column({ nullable: true })
    webSite: string;
    @CreateDateColumn()
    createdAt: Date;
    @UpdateDateColumn()
    changedAt: Date;

    @Index({ unique: false })
    @ManyToOne(() => OrganizationEntity, organization => organization.receivers)
    organization: OrganizationEntity;

    toDTO(): ReceiverDTO {
        const { isDeletable, createdAt, changedAt, organization, ...dto} = this;
        const orgId = organization ? organization.id : undefined;
        return {...dto, orgId } as ReceiverDTO;
    }
}
