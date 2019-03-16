import { Repository } from 'typeorm';
import { BOType } from '../shared/bo-type';
import { ReceiverStatus } from '../receiver/receiver-status';
import { ReceiverEntity } from '../receiver/receiver.entity';
import { mockOrganizationData } from './mock-organization.repository';

const toDTO = jest.fn(() => ({ id: 'ANY', name: 'Anything', country: 'DE', orgId: 'THQ' }));

export const mockReceiverRepository = (): any => {
  const selectQueryBuilder = {
    select: jest.fn(() => selectQueryBuilder ),
    getRawOne: jest.fn(() => ({ max: 1910 })),
    where: jest.fn(() => selectQueryBuilder ),
    andWhere: jest.fn(() => selectQueryBuilder ),
    innerJoinAndSelect: jest.fn(() => selectQueryBuilder ),
    getMany: jest.fn(() => mockReceiverData().filter(r => r.organization.id === 'THQ')),
    getOne: jest.fn(() => mockReceiverData().find(r => r.id === '1901' && r.organization.id === 'THQ')),
    skip: jest.fn(() => selectQueryBuilder ),
    take: jest.fn(() => selectQueryBuilder ),
  };
  return {
    createQueryBuilder: jest.fn(() => selectQueryBuilder),
    find: jest.fn(async () => {
      return mockReceiverData();
    }),
    findOne: jest.fn(async (id) => {
      return mockReceiverData().find(r => r.id === id);
    }),
    create: jest.fn(async (receiver) => {
      return {
        ...receiver,
        objectType: BOType.RECEIVERS,
        isDeletable: true,
        status: ReceiverStatus.ACTIVE,
        createdAt: Date.now(),
        changedAt: Date.now(),
        toDTO,
      };
    }),
    update: jest.fn(async (receiver) => {
      return {
        ...receiver,
        objectType: BOType.RECEIVERS,
        isDeletable: true,
        status: ReceiverStatus.ACTIVE,
        createdAt: Date.now(),
        changedAt: Date.now(),
        toDTO,
      };
    }),
    remove: jest.fn(async (entity) => mockReceiverData().find(r => r.id === entity.id)),
    save: jest.fn(async (entity) => ({ toDTO })),
  } as unknown as Repository<ReceiverEntity>;
};

export const mockReceiverData = (count: number = 3) => {
  const today = new Date();
  const receiver1: ReceiverEntity =  {
    id: '1901',
    objectType: BOType.RECEIVERS,
    isDeletable: true,
    status: ReceiverStatus.ACTIVE,
    name: 'Test AG',
    nameAdd: undefined,
    country: 'DE',
    postalCode: '77777',
    city: 'Testingen',
    street: 'Testallee 7',
    email: 'info@testag.de',
    phone: '+49 777 7654321',
    fax: '+49 777 7654329',
    webSite: 'https://www.testag.de',
    createdAt: today,
    changedAt: today,
    organization: mockOrganizationData(1)[0],
    toDTO,
  };
  const receiver2 = { ...receiver1, id: '1902', name: 'BugFix GmbH' };
  const receiver3 = { ...receiver1, id: '1903', name: 'TDD OHG' };
  const data = [receiver1, receiver2, receiver3];
  return data.slice(0, count);
};
