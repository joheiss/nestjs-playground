import { Test, TestingModule } from '@nestjs/testing';
import { AuthDTO } from '../../auth/auth.dto';
import { BOType } from '../../shared/bo-type';
import { UserSettingController } from './user-setting.controller';
import { UserSettingService } from './user-setting.service';
import { mockUserSettingService } from '../../mocks/mock-user-setting.service';
import { UserSettingInputDTO } from './user-setting-input.dto';

describe('User Setting Controller', () => {
    let controller: UserSettingController;
    let service: UserSettingService;
    let auth: AuthDTO;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserSettingController],
            providers: [
                { provide: UserSettingService, useValue: mockUserSettingService() },
            ],
        }).compile();

        controller = module.get<UserSettingController>(UserSettingController);
        service = module.get<UserSettingService>(UserSettingService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    beforeEach(() => {
        auth = {
            id: 'tester1@horsti.de',
            orgId: 'THQ',
            roles: ['tester'],
        };
    });

    describe('GET /api/usersettings/:id (getByUserId)', () => {
        it('should call user setting service findByUserId and return the result', async () => {
            const spy3 = jest.spyOn(service, 'findByUserId');
            const id = auth.id;
            await expect(controller.getByUserId(auth, id)).resolves.toBeTruthy();
            await expect(spy3).toHaveBeenCalled();
        });
    });

    describe('GET /api/userbookmarks/:id/:type (getByUserAndType)', () => {
        it('should call user bookmark service findByUserIdAndType and return bookmarks', async () => {
            const spy3 = jest.spyOn(service, 'findByUserIdAndType');
            const id = auth.id;
            const type = BOType.RECEIVERS;
            await expect(controller.getByUserAndType(auth, id, type)).resolves.toBeTruthy();
            await expect(spy3).toHaveBeenCalled();
        });
    });

    describe('POST /api/usersettings/:id/:type (create)', () => {
        let input: Partial<UserSettingInputDTO>;
        let id: string;
        let type: string;
        beforeEach(() => {
            id = 'tester1@horsti.de';
            type = BOType.RECEIVERS;
            input = {
                id,
                type,
                listLimit: 12,
                bookmarkExpiration: 30,
            };
        });
        it('should call user setting service create and return result', async () => {
            const spy2 = jest.spyOn(service, 'create');
            await expect(controller.create(auth, input)).resolves.toBeTruthy();
            await expect(spy2).toHaveBeenCalled();
        });
    });

    describe('PUT /api/usersettings/:id/:type (create)', () => {
        let input: Partial<UserSettingInputDTO>;
        let id: string;
        let type: string;
        beforeEach(() => {
            id = 'tester1@horsti.de';
            type = BOType.RECEIVERS;
            input = {
                listLimit: 99,
                bookmarkExpiration: 100,
            };
        });
        it('should call user setting service update and return result', async () => {
            const spy2 = jest.spyOn(service, 'update');
            await expect(controller.update(auth, id, type, input)).resolves.toBeTruthy();
            await expect(spy2).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/usersettings/:id/:type (deleteByUserAndType)', () => {
        let id: string;
        let type: string;
        beforeEach(() => {
            id = 'tester1@horsti.de';
            type = BOType.RECEIVERS;
        });
        it('should call user bookmark service delete and return result', async () => {
            const spy2 = jest.spyOn(service, 'deleteByUserIdAndType');
            await expect(controller.deleteByUserAndType(auth, id, type)).resolves.toBeTruthy();
            await expect(spy2).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/usersettings/:id (deleteByUser)', () => {
        let id: string;
        beforeEach(() => {
            id = 'tester1@horsti.de';
        });
        it('should call user setting service delete and return result', async () => {
            const spy3 = jest.spyOn(service, 'deleteByUserId');
            await expect(controller.deleteByUser(auth, id)).resolves.toBeTruthy();
            await expect(spy3).toHaveBeenCalled();
        });
    });
});
