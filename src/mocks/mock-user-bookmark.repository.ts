import { Repository } from 'typeorm';
import { BOType } from '../shared/bo-type';
import { UserBookmarkEntity } from '../user/user-bookmark/user-bookmark.entity';
import { mockUserProfileData } from './mock-user-profile.repository';

const toDTO = jest.fn(() => ({ id: 'ANY', name: 'Anything' }));

export const mockUserBookmarkRepository = (): any => {
  const bookmarks = mockUserBookmarkData();
  return {
    create: jest.fn(async (bookmark) => {
      return {
        ...bookmark,
        objectType: BOType.USERBOOKMARKS,
        createdAt: Date.now(),
        toDTO,
      };
    }),
    find: jest.fn(async (options: any) => {
      const id = options.where.id;
      const type = options.where.type;
      const objectId = options.where.objectId;
      if (type && objectId) {
        return await bookmarks.filter(b => b.id === id && b.type === type && b.objectId === objectId);
      }
      if (type) {
        return await bookmarks.filter(b => b.id === id && b.type === type);
      }
      return await bookmarks.filter(b => b.id === id );
    }),
    remove: jest.fn(async (entity) => entity),
    save: jest.fn(async (entity) => entity),
  } as unknown as Repository<UserBookmarkEntity>;
};

export const mockUserBookmarkData = (): UserBookmarkEntity[] => {
  const today = new Date();
  let id: string = 'tester1@horsti.de';
  let profile;
  const tester1: UserBookmarkEntity =  {
    id,
    type: BOType.RECEIVERS,
    objectId: '1901',
    objectType: BOType.USERBOOKMARKS,
    createdAt: today,
    profile: undefined,
    toDTO:  jest.fn(() => ({ id: this.id, type: this.type, objectId: this.objectId, objectType: BOType.USERBOOKMARKS })),
    toShortDTO: jest.fn(() => ({ type: this.type, objectId: this.objectId })),
  };
  id = 'tester2@horsti.de';
  profile = undefined;
  const tester2 = {...tester1, id, profile: undefined  } as UserBookmarkEntity;
  id = 'tester3@horsti.de';
  profile = undefined;
  const tester3 = {...tester1, id, profile: undefined } as UserBookmarkEntity;
  const data = [tester1, tester2, tester3];
  return data;
};
