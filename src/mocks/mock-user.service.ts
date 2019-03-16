import { UserInputDTO } from '../user/user-input.dto';

export const mockUserService = (): any => {
  const toDTO = jest.fn(() => true );
  return {
    findAll: jest.fn(async () => ([{ toDTO }])),
    findById: jest.fn(async (id: string) => ({ toDTO })),
    create: jest.fn(async (input: Partial<UserInputDTO>) => ({ toDTO })),
    update: jest.fn(async (input: Partial<UserInputDTO>) => ({ toDTO })),
    delete: jest.fn(async (id: string) => ({ toDTO })),
  };
};
