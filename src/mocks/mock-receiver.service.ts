import { ReceiverInputDTO } from '../receiver/receiver-input.dto';

export const mockReceiverService = (): any => {
  const toDTO = jest.fn(() => true );
  return {
    findAll: jest.fn(async () => ([{ toDTO }])),
    findById: jest.fn(async (id: string) => ({ toDTO })),
    create: jest.fn(async (input: Partial<ReceiverInputDTO>) => ({ toDTO })),
    update: jest.fn(async (input: Partial<ReceiverInputDTO>) => ({ toDTO })),
    delete: jest.fn(async (id: string) => ({ toDTO })),
    getUserSettings: jest.fn(async (userId: string) => ({ toDTO })),
  };
};
