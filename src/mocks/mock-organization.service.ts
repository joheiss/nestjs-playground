import { OrganizationInputDTO } from '../organization/organization-input.dto';

export const mockOrganizationService = (): any => {
  const toDTO = jest.fn(() => true );
  return {
    findAll: jest.fn(async () => ([{ toDTO }])),
    findById: jest.fn(async (id: string) => ({ toDTO })),
    findTree: jest.fn(async (parent: string) => ({ toDTO })),
    findTreeIds: jest.fn(async (parent: string) => ({ toDTO })),
    create: jest.fn(async (input: Partial<OrganizationInputDTO>) => ({ toDTO })),
    update: jest.fn(async (input: Partial<OrganizationInputDTO>) => ({ toDTO })),
    delete: jest.fn(async (id: string) => ({ toDTO })),
    getUserSettings: jest.fn(async (userId: string) => ({ toDTO })),
  };
};
