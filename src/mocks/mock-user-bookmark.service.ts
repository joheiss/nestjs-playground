import { UserBookmarkInputDTO } from '../user/user-bookmark/user-bookmark-input.dto';

export const mockUserBookmarkService = (): any => {
  const toDTO = jest.fn(() => true );
  return {
    findByUserIdTypeAndObjectId: jest.fn(async () => ({ toDTO })),
    findByUserIdAndType: jest.fn(async () => ([{ toDTO }])),
    findByUserId: jest.fn(async () => ([{ toDTO }])),
    findById: jest.fn(async (id: string) => ({ toDTO })),
    create: jest.fn(async (input: Partial<UserBookmarkInputDTO>) => ({ toDTO })),
    delete: jest.fn(async (id: string) => ({ toDTO })),
    deleteByUserIdAndType: jest.fn(async () => ([{ toDTO }])),
    deleteByUserId: jest.fn(async () => ([{ toDTO }])),
  };
};
