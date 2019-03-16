import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../user/user.entity';
import { mockOrganizationData } from './mock-organization.repository';
import { BOType } from '../shared/bo-type';
import { mockUserProfileData } from './mock-user-profile.repository';

const toDTO = jest.fn(() => ({ id: 'ANY', name: 'Anything' }));

export const mockUserRepository = (): any => {
  const selectQueryBuilder = {
    where: jest.fn(() => selectQueryBuilder ),
    innerJoinAndSelect: jest.fn(() => selectQueryBuilder ),
    leftJoinAndSelect: jest.fn(() => selectQueryBuilder ),
    getOne: jest.fn(async () => (await mockUserData()).find(r => r.id === 'tester1@horsti.de')),
  };
  return {
    createQueryBuilder: jest.fn(() => selectQueryBuilder),
    find: jest.fn(async () => {
      return await mockUserData();
    }),
    findOne: jest.fn(async (id) => {
      return (await mockUserData()).find(o => o.id === id);
    }),
    create: jest.fn(async (user) => {
      return {
        ...user,
        objectType: BOType.USERS,
        isDeletable: true,
        createdAt: Date.now(),
        changedAt: Date.now(),
        toDTO,
      };
    }),
    update: jest.fn(async (user) => {
      return {
        ...user,
        objectType: BOType.USERS,
        isDeletable: true,
        createdAt: Date.now(),
        changedAt: Date.now(),
        toDTO,
      };
    }),
    remove: jest.fn(async (entity) => (await mockUserData()).find(o => o.id === entity.id)),
    save: jest.fn(async (entity) => ({ toDTO })),
  } as unknown as Repository<UserEntity>;
};

const mockUserData = (async (count: number = 3) => {
  const today = new Date();
  const profile = mockUserProfileData().find(p => p.id === 'tester1@horsti.de');
  const tester1: UserEntity =  {
    id: 'tester1@horsti.de',
    password: await bcrypt.hash('Testi123', 10),
    objectType: BOType.USERS,
    roles: 'tester',
    locked: false,
    createdAt: today,
    changedAt: today,
    organization: mockOrganizationData(1)[0],
    profile,
    toDTO,
    hashPassword: jest.fn(),
  };
  const tester2 = { ...tester1, id: 'tester2@horsti.de', password: await bcrypt.hash('Testi123', 10) };
  const tester3 = { ...tester1, id: 'tester3@horsti.de', password: await bcrypt.hash('Testi123', 10), locked: true };
  const data = [tester1, tester2, tester3];
  return data.slice(0, count);
});
