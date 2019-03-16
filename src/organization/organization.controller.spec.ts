import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { mockOrganizationService } from '../mocks/mock-organization.service';
import { OrganizationInputDTO } from './organization-input.dto';
import { UserSettingService } from '../user/user-setting/user-setting.service';
import { mockUserSettingService } from '../mocks/mock-user-setting.service';
import { AuthDTO } from '../auth/auth.dto';
import { Role } from '../auth/role';

describe('Organization Controller', () => {
    let controller: OrganizationController;
    let service: OrganizationService;
    let auth: AuthDTO;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [OrganizationController],
            providers: [
                { provide: OrganizationService, useValue: mockOrganizationService() },
                { provide: UserSettingService, useValue: mockUserSettingService() },
            ],
        }).compile();

        controller = module.get<OrganizationController>(OrganizationController);
        service = module.get<OrganizationService>(OrganizationService);
    });

    beforeEach(() => {
        auth = {
            id: 'test-super@horsti-test.de',
            orgId: 'THQ',
            roles: [Role.SUPER, Role.ADMIN, Role.SALESUSER],
        };
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('GET /api/organizations/ (getAll)', () => {
        it('should call OrganizationService.findAll', async () => {
            const spy = jest.spyOn(service, 'findAll');
            const page = 1;
            await expect(controller.getAll(auth, page)).resolves.toBeTruthy();
            await expect(spy).toHaveBeenCalled();
        });
    });

    describe('GET /api/organizations/:id (getOne)', () => {
        it('should call OrganizationService.findById', async () => {
            const spy = jest.spyOn(service, 'findById');
            await expect(controller.getOne('THQ')).resolves.toBeTruthy();
            await expect(spy).toHaveBeenCalled();
        });
    });

    describe('GET /api/organizations/:id/tree (getAllByParent)', () => {
        it('should call OrganizationService.findTree', async () => {
            const spy = jest.spyOn(service, 'findTree');
            await expect(controller.getAllByParent('THQ')).resolves.toBeTruthy();
            await expect(spy).toHaveBeenCalled();
        });
    });

    describe('GET /api/organizations/:id/treeids (getAllIdsByParent)', () => {
        it('should call OrganizationService.findTreeIds', async () => {
            const spy = jest.spyOn(service, 'findTreeIds');
            await expect(controller.getAllIdsByParent('THQ')).resolves.toBeTruthy();
            await expect(spy).toHaveBeenCalled();
        });
    });

    describe('POST /api/organizations/ (create)', () => {
        it('should call OrganizationService.create', async () => {
            const spy = jest.spyOn(service, 'create');
            const input: Partial<OrganizationInputDTO> = {
                id: 'THQ',
                name: 'Test HQ',
                timezone: 'Europe/Berlin',
                currency: 'EUR',
                locale: 'de-DE',
            };
            await expect(controller.create(auth, input)).resolves.toBeTruthy();
            await expect(spy).toHaveBeenCalled();
        });
    });

    describe('PUT /api/organizations/id (update)', () => {
        it('should call OrganizationService.update', async () => {
            const spy = jest.spyOn(service, 'update');
            const input: Partial<OrganizationInputDTO> = {
                name: 'Test HQ *UPDATED*',
            };
            await expect(controller.update(auth, 'THQ', input)).resolves.toBeTruthy();
            await expect(spy).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/organizations/id (delete)', () => {
        it('should call OrganizationService.delete', async () => {
            const spy = jest.spyOn(service, 'delete');
            await expect(controller.delete(auth, 'THQ')).resolves.toBeTruthy();
            await expect(spy).toHaveBeenCalled();
        });
    });
});
