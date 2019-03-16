import { Repository } from 'typeorm';
import { BOType } from '../shared/bo-type';
import { UserProfileEntity } from '../user/user-profile/user-profile.entity';
import { mockUserSettingData } from './mock-user-setting.repository';
import { mockUserBookmarkData } from './mock-user-bookmark.repository';

const toDTO = jest.fn(() => ({ id: 'ANY', name: 'Anything' }));

export const mockUserProfileRepository = (): any => {
  return {
    create: jest.fn(async (profile) => {
      return {
        ...profile,
        objectType: BOType.USERPROFILES,
        createdAt: Date.now(),
        changedAt: Date.now(),
        toDTO,
      };
    }),
    find: jest.fn(async (options: any) => {
      const id = options.where.id;
      return await mockUserProfileData().filter(s => s.id === id);
    }),
    findOne: jest.fn(async (id) => {
      return (await mockUserProfileData()).find(p => p.id === id);
    }),
    save: jest.fn(async (entity) => ({ toDTO })),
  } as unknown as Repository<UserProfileEntity>;
};

export const mockUserProfileData = () => {
  const today = new Date();
  let id = 'tester1@horsti.de';
  const tester1: UserProfileEntity =  {
    id,
    objectType: BOType.USERPROFILES,
    displayName: 'Testi Tester1',
    email: id,
    phone: '+49 777 7654321',
    imageUrl: undefined,
    createdAt: today,
    changedAt: today,
    settings: mockUserSettingData().filter(s => s.id === id),
    bookmarks: mockUserBookmarkData().filter(b => b.id === id),
    toDTO: jest.fn(() => ({
      id: this.id, objectType: this.objectType, displayName: this.displayName, email: this.email,
      phone: this.phone, imageUrl: this.imageUrl,
    })),
  };
  id = 'tester2@horsti.de';
  const tester2 = { ...tester1, id, displayName: 'Testi Tester2', email: id } as UserProfileEntity;
  id = 'tester3@horsti.de';
  const tester3 = { ...tester1, id, displayName: 'Testi Tester3', email: id } as UserProfileEntity;
  const data = [tester1, tester2, tester3];
  return data;
};
