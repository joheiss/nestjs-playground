import { UserProfileInputDTO } from '../user/user-profile/user-profile-input.dto';

export const mockUserProfileService = (): any => {
  const toDTO = jest.fn(() => true );
  return {
    findById: jest.fn(async (id: string) => ({ toDTO })),
    update: jest.fn(async (input: Partial<UserProfileInputDTO>) => ({ toDTO })),
    validateInput: jest.fn(() => true),
  };
};
