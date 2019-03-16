export const mockUserSettingService = (): any => {
  const toDTO = jest.fn(() => true);
  return {
    findByUserId: jest.fn(async (id: string) => ([{ toDTO }])),
    findByUserIdAndType: jest.fn(async (id: string, type: string) => ({ toDTO })),
    findByUserIdAndTypeOrDefault: jest.fn(async (id: string, type: string) => (
      { id, type: 'default', listLimit: 10, bookmarkExpiration: 90, toDTO }
    )),
    create: jest.fn(async (id: string, type: string) => ({ toDTO })),
    update: jest.fn(async (id: string, type: string) => ({ toDTO })),
    deleteByUserId: jest.fn(async (id: string) => ([{ toDTO }])),
    deleteByUserIdAndType: jest.fn(async (id: string, type: string) => ({ toDTO })),
    validateInput: jest.fn(() => true),
  };
};
