import { OrganizationEntity } from '../organization/organization.entity';
import { Repository } from 'typeorm';
import { OrganizationStatus } from '../organization/organization-status';
import { BOType } from '../shared/bo-type';

const toDTO = jest.fn((withTree = false) => ({ id: 'ANY', name: 'Anything' }));

export const mockOrganizationRepository = (): any => {
  const manager = {
    getTreeRepository: jest.fn(() => manager),
    findDescendantsTree: jest.fn(async (root: OrganizationEntity) =>  mockOrganizationData().find(o => o.id === root.id))
  };
  return {
    manager,
    find: jest.fn(async () => {
      return mockOrganizationData();
    }),
    findOne: jest.fn(async (id) => {
      return mockOrganizationData().find(o => o.id === id);
    }),
    create: jest.fn(async (organization) => {
      return {
        ...organization,
        objectType: 'organizations',
        isDeleteable: true,
        status: OrganizationStatus.ACTIVE,
        children: [],
        createdAt: Date.now(),
        changedAt: Date.now(),
        toDTO,
      };
    }),
    update: jest.fn(async (organization) => {
      return {
        ...organization,
        objectType: 'organizations',
        isDeletable: true,
        status: OrganizationStatus.ACTIVE,
        children: [],
        createdAt: Date.now(),
        changedAt: Date.now(),
        toDTO,
      };
    }),
    remove: jest.fn(async (entity) => mockOrganizationData().find(o => o.id === entity.id)),
    save: jest.fn(async (entity) => ({ toDTO })),
  } as unknown as Repository<OrganizationEntity>;
};

export const mockOrganizationData = (count: number = 3) => {
  const today = new Date();
  const orgTDE: OrganizationEntity =  {
    id: 'TDE', objectType: BOType.ORGANIZATIONS, status: OrganizationStatus.ACTIVE, isDeletable: true, name: 'Test DE', timezone: 'Europe/Berlin',
    currency: 'EUR', locale: 'de-DE', children: [], parent: undefined, users: [], receivers: [], createdAt: today, changedAt: today, toDTO,
  };
  const orgTEU: OrganizationEntity =  {
    id: 'TEU', objectType: BOType.ORGANIZATIONS, status: OrganizationStatus.ACTIVE, isDeletable: true, name: 'Test EU', timezone: 'Europe/Berlin',
    currency: 'EUR', locale: 'de-DE', children: [orgTDE], parent: undefined, users: [], receivers: [], createdAt: today, changedAt: today, toDTO,
  };
  const orgTHQ: OrganizationEntity =  {
    id: 'THQ', objectType: BOType.ORGANIZATIONS, status: OrganizationStatus.ACTIVE, isDeletable: true, name: 'Test HQ', timezone: 'Europe/Berlin',
    currency: 'EUR', locale: 'de-DE', children: [orgTEU], parent: undefined, users: [], receivers: [], createdAt: today, changedAt: today, toDTO,
  };
  orgTDE.parent = orgTEU;
  orgTEU.parent = orgTHQ;
  const data = [orgTHQ, orgTEU, orgTDE];
  return data.slice(0, count);
};
