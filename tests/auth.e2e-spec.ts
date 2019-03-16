import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/auth/auth.module';
import * as dotenv from 'dotenv';
import { UserModule } from '../src/user/user.module';
import { SharedModule } from '../src/shared/shared.module';
import { UserInputDTO } from '../src/user/user-input.dto';
import { Role } from '../src/auth/role';
import { OrganizationInputDTO } from '../src/organization/organization-input.dto';
import { OrganizationModule } from '../src/organization/organization.module';
import { UserProfileInputDTO } from '../src/user/user-profile/user-profile-input.dto';
import { UserSettingInputDTO } from '../src/user/user-setting/user-setting-input.dto';
import { BOType } from '../src/shared/bo-type';
import { UserBookmarkInputDTO } from '../src/user/user-bookmark/user-bookmark-input.dto';
import { ReceiverInputDTO } from '../src/receiver/receiver-input.dto';
import { ReceiverModule } from '../src/receiver/receiver.module';
import { TestUtility } from './test-utility';
import { TestUsers } from './test-users';
import { ConfigModule, ConfigService } from 'nestjs-config';
import * as path from 'path';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let receiverId: string;
    let helper: TestUtility;

    beforeAll(async () => {
        console.log('*** SETUP TEST SERVER ***');
        dotenv.config({ path: `${process.env.NODE_ENV}.env` });
        const module = await Test.createTestingModule({
            imports: [
                ConfigModule.load(path.resolve(__dirname, '..', 'src', 'config', '**', '!(*.d).{ts,js}')),
                TypeOrmModule.forRootAsync({
                    useFactory: (config: ConfigService) => config.get('database'),
                    inject: [ConfigService],
                }),
                SharedModule,
                AuthModule,
                UserModule,
                OrganizationModule,
                ReceiverModule,
            ],
        })
            .compile();

        app = module.createNestApplication();
        await app.init();

        helper = new TestUtility(request(app.getHttpServer()));
        await helper.createTestOrgs();
        await helper.createTestUsers();
    });

    describe('AUTH - General Functions', () => {

        let token: string;
        let currentUser: { input: UserInputDTO, token: string };
        let lockedUser: { input: UserInputDTO, token: string };

        currentUser = { input: TestUsers.find(u => u.id.includes('super')), token: undefined };

        describe('GET /api/whoami', () => {

            it('should detect that we are not logged in', async () => {
                const response = await helper.get('/api/whoami', undefined);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/login', () => {
            it('should detect invalid credentials', async () => {
                const credentials = { id: currentUser.input.id, password: 'dontknow' };
                const response = await helper.login(credentials);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should return user and token for valid credentials', async () => {
                const credentials = { id: currentUser.input.id, password: currentUser.input.password };
                const response = await helper.login(credentials);
                expect(response.status).toBe(HttpStatus.OK);
                expect(response.body.id).toEqual(credentials.id);
                token = response.body.token;
            });
            it('should confirm that we are logged in', async () => {
                const response = await helper.get('/api/whoami', token);
                expect(response.status).toBe(HttpStatus.OK);
            });
            it('should detect locked user and reject login', async () => {
                lockedUser = { input: TestUsers.find(u => u.id.includes('locked')), token: undefined };
                const credentials = { id: lockedUser.input.id, password: lockedUser.input.password };
                const response = await helper.login(credentials);
                expect(helper.isNotAllowed(response)).toBeTruthy();
                expect(response.text).toContain('user_locked');
            });
        });
    });

    describe('Super User ...', () => {

        let token: string;
        let currentUser: { input: UserInputDTO, token: string };
        let otherUser: { input: UserInputDTO, token: string };
        let deleteUser: { input: UserInputDTO, token: string };

        beforeEach(async () => {
            currentUser = { input: TestUsers.find(u => u.id.includes('super')), token: undefined };
            otherUser = { input: TestUsers.find(u => u.id.includes('locked')), token: undefined };
            deleteUser = { input: TestUsers.find(u => u.id.includes('delete')), token: undefined };
            const credentials = { id: currentUser.input.id, password: currentUser.input.password };
            const response = await helper.login(credentials);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.id).toEqual(credentials.id);
            token = response.body.token;
        });

        describe('GET /api/users', () => {
            it('should be able to see a full list of users', async () => {
                const response = await helper.get('/api/users', token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/users/:id', () => {
            it('should be able to see a single user', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/users/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/users', () => {
            it('should be able to create a user', async () => {
                const input: UserInputDTO = {
                    id: 'test-user@horsti-test.de',
                    password: `tusr${new Date().toDateString()}`,
                    orgId: 'THQ',
                    roles: [Role.AUDITOR],
                    displayName: 'User Test',
                    email: 'test-user@horsti-test.de',
                };
                const response = await helper.post('/api/users', input, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });
        describe('PUT /api/users/:id', () => {
            it('should be able to update a user', async () => {
                const userId = 'test-user@horsti-test.de';
                const updates: UserInputDTO = {
                    locked: true,
                };
                const response = await helper.put(`/api/users/${userId}`, updates, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });
        describe('DELETE /api/users/:id', () => {
            it('should be able to delete a user', async () => {
                const userId = 'test-user@horsti-test.de';
                const response = await helper.delete(`/api/users/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/userprofiles/:id', () => {
            it('should be able to see the user profile of any user', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/userprofiles/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('PUT /api/userprofiles/:id', () => {
            it('should be able to update his own user profile', async () => {
                const userId = currentUser.input.id;
                const updates: Partial<UserProfileInputDTO> = {
                    displayName: '*Super Star*',
                };
                const response = await helper.put(`/api/userprofiles/${userId}`, updates, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
            it('should be able to update other profiles', async () => {
                const userId = otherUser.input.id;
                const updates: Partial<UserProfileInputDTO> = {
                    displayName: '*Locked*',
                };
                const response = await helper.put(`/api/userprofiles/${userId}`, updates, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/usersettings/:id', () => {
            it('should be able to see the user settings of any user', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/usersettings/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/usersettings/:id/:type', () => {
            it('should be able to see the user settings of any user and type', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/usersettings/${userId}/default`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/usersettings/:id/:type', () => {
            it('should be able to create a user setting for any user and type', async () => {
                const input: UserSettingInputDTO = {
                    id: otherUser.input.id,
                    type: BOType.RECEIVERS,
                    listLimit: 11,
                    bookmarkExpiration: 99,
                };
                const response = await helper.post(`/api/usersettings/${input.id}/${input.type}`, input, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('PUT /api/usersettings/:id/:type', () => {
            it('should be able to update a user setting for any user and type', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const input: Partial<UserSettingInputDTO> = {
                    listLimit: 12,
                    bookmarkExpiration: 77,
                };
                const response = await helper.put(`/api/usersettings/${userId}/${type}`, input, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/usersettings/:id/:type', () => {
            it('should be able to delete a user setting for any user and type', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.delete(`/api/usersettings/${userId}/${type}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/usersettings/:id', () => {
            it('should be able to delete all user setting for any user', async () => {
                const userId = otherUser.input.id;
                const response = await helper.delete(`/api/usersettings/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/userbookmarks/:id', () => {
            it('should be able to see the bookmarks of any user', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/userbookmarks/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/userbookmarks/:id/:type', () => {
            it('should be able to see the bookmarks of any user and type', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.get(`/api/userbookmarks/${userId}/${type}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/userbookmarks/:id/:type/:objectId', () => {
            it('should be able to see the bookmarks of any user, type and object', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const objectId = '1901';
                const response = await helper.get(`/api/userbookmarks/${userId}/${type}/${objectId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/userbookmarks/:id/:type/:objectId', () => {
            it('should be able to create a user bookmark for any user', async () => {
                const input: Partial<UserBookmarkInputDTO> = {
                    id: otherUser.input.id,
                    type: BOType.RECEIVERS,
                    objectId: '1901',
                };
                const response = await helper.post(`/api/userbookmarks`, input, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/userbookmarks/:id/:type/:objectId', () => {
            it('should be able to delete a bookmark for any user', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const objectId = '1901';
                const response = await helper.delete(`/api/userbookmarks/${userId}/${type}/${objectId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/userbookmarks/:id/:type/:objectId', () => {
            it('should be able to delete all bookmarks for any user and type', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.delete(`/api/userbookmarks/${userId}/${type}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/userbookmarks/:id', () => {
            it('should be able to delete all bookmarks for any user', async () => {
                const userId = otherUser.input.id;
                const response = await helper.delete(`/api/userbookmarks/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/organizations', () => {
            it('should be able to see a full list of organizations', async () => {
                const response = await helper.get(`/api/organizations`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/organizations/:id', () => {
            it('should be able to see a single organization', async () => {
                const orgId = 'THQ';
                const response = await helper.get(`/api/organizations/${orgId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/organizations/:id/tree', () => {
            it('should be able to see an organization tree', async () => {
                const orgId = 'THQ';
                const response = await helper.get(`/api/organizations/${orgId}/tree`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/organizations/:id/treeids', () => {
            it('should be able to see a list of organization ids in an organization tree', async () => {
                const orgId = 'THQ';
                const response = await helper.get(`/api/organizations/${orgId}/treeids`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/organizations', () => {
            it('should be able to create an organization', async () => {
                const input: OrganizationInputDTO = {
                    id: 'TST',
                    name: 'Test Test',
                    timezone: 'Europe/Berlin',
                    locale: 'de-DE',
                    currency: 'EUR',
                };
                const response = await helper.post(`/api/organizations`, input, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });
        describe('PUT /api/organizations/:id', () => {
            it('should be able to update an organizations', async () => {
                const orgId = 'TST';
                const updates: Partial<OrganizationInputDTO> = {
                    name: 'Test *UPDATED*',
                };
                const response = await helper.put(`/api/organizations/${orgId}`, updates, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });
        describe('DELETE /api/organizations/:id', () => {
            it('should be able to delete an organization', async () => {
                const orgId = 'TST';
                const response = await helper.delete(`/api/organizations/${orgId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/receivers', () => {
            it('should NOT be able to see a full list of receivers', async () => {
                const response = await helper.get('/api/receivers', token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/receivers/:id', () => {
            it('should NOT be able to see a single receiver', async () => {
                const id = '1901';
                const response = await helper.get(`/api/receivers/${id}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/receivers', () => {
            it('should NOT be able to create a receiver', async () => {
                const input: ReceiverInputDTO = {
                    orgId: currentUser.input.orgId,
                    name: 'Auth Test AG',
                    country: 'DE',
                };
                const response = await helper.post(`/api/receivers`, input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
                receiverId = response.body.id;
            });
        });

        describe('PUT /api/receivers/:id', () => {
            it('should NOT be able to update a receiver', async () => {
                const id = receiverId;
                const updates: Partial<ReceiverInputDTO> = {
                    nameAdd: 'Test *UPDATED*',
                };
                const response = await helper.put(`/api/receivers/${id}`, updates, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/receivers/:id', () => {
            it('should NOT be able to delete a receiver', async () => {
                const id = receiverId;
                const response = await helper.delete(`/api/receivers/${id}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });
    });

    describe('Admin User ...', () => {

        let token: string;
        let currentUser: { input: UserInputDTO, token: string };
        let otherUser: { input: UserInputDTO, token: string };

        beforeEach(async () => {
            // const adminUser = TestUsers.find(u => u.id.includes('admin'));
            // await helper.changeTestUserOrgAssignment(adminUser.id, 'TST');
            currentUser = { input: TestUsers.find(u => u.id.includes('admin')), token: undefined };
            const credentials = { id: currentUser.input.id, password: currentUser.input.password };
            const response = await helper.login(credentials);
            expect(response.status).toBe(HttpStatus.OK);
            token = response.body.token;
            otherUser = { input: TestUsers.find(u => u.id.includes('locked')), token: undefined };
        });

        describe('GET /api/users', () => {
            it('should not be able to see a full list of users', async () => {
                const response = await helper.get('/api/users', token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/users/:id', () => {
            it('should not be able to see other user', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/users/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should not be able to see own user', async () => {
                const userId = currentUser.input.id;
                const response = await helper.get(`/api/users/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/users', () => {
            it('should NOT be able to create a user', async () => {
                const input: UserInputDTO = {
                    id: 'test-user@horsti-test.de',
                    password: `tusr${new Date().toDateString()}`,
                    orgId: 'THQ',
                    roles: [Role.AUDITOR],
                    displayName: 'User Test',
                    email: 'test-user@horsti-test.de',
                };
                const response = await helper.post(`/api/users`, input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });
        describe('PUT /api/users/:id', () => {
            it('should not be able to update a user', async () => {
                const userId = 'test-user@horsti-test.de';
                const updates: UserInputDTO = {
                    locked: true,
                };
                const response = await helper.put(`/api/users/${userId}`, updates, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });
        describe('DELETE /api/users/:id', () => {
            it('should not be able to delete a user', async () => {
                const userId = 'test-user@horsti-test.de';
                const response = await helper.delete(`/api/users/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/userprofiles/:id', () => {
            it('should not be able to see the user profile of other users', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/userprofiles/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should not be able to see his own user profile', async () => {
                const userId = currentUser.input.id;
                const response = await helper.get(`/api/userprofiles/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('PUT /api/userprofiles/:id', () => {
            it('should be able to update his own user profile', async () => {
                const userId = currentUser.input.id;
                const updates: Partial<UserProfileInputDTO> = {
                    displayName: '*Admin Star*',
                };
                const response = await helper.put(`/api/userprofiles/${userId}`, updates, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
            it('should not be able to update other profiles', async () => {
                const userId = otherUser.input.id;
                const updates: Partial<UserProfileInputDTO> = {
                    displayName: '*Locked*',
                };
                const response = await helper.put(`/api/userprofiles/${userId}`, updates, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/usersettings/:id', () => {
            it('should not be able to see the user settings of other users', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/usersettings/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see his own user settings', async () => {
                const userId = currentUser.input.id;
                const response = await helper.get(`/api/usersettings/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/usersettings/:id/:type', () => {
            it('should not be able to see the user settings of other users by user and type', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/usersettings/${userId}/default`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see his own user settings by user and type', async () => {
                const userId = currentUser.input.id;
                const response = await helper.get(`/api/usersettings/${userId}/default`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/usersettings/:id/:type', () => {
            it('should not be able to create a user setting for other users', async () => {
                const input: UserSettingInputDTO = {
                    id: otherUser.input.id,
                    type: BOType.RECEIVERS,
                    listLimit: 11,
                    bookmarkExpiration: 99,
                };
                const response = await helper.post(`/api/usersettings`, input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to create a user setting for himself', async () => {
                const input: UserSettingInputDTO = {
                    id: currentUser.input.id,
                    type: BOType.RECEIVERS,
                    listLimit: 11,
                    bookmarkExpiration: 99,
                };
                const response = await helper.post(`/api/usersettings`, input, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('PUT /api/usersettings/:id/:type', () => {
            it('should not be able to update a user setting forother users', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const input: Partial<UserSettingInputDTO> = {
                    listLimit: 12,
                    bookmarkExpiration: 77,
                };
                const response = await helper.put(`/api/usersettings/${userId}/${type}`, input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to update a user setting for himself', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const input: Partial<UserSettingInputDTO> = {
                    listLimit: 12,
                    bookmarkExpiration: 77,
                };
                const response = await helper.put(`/api/usersettings/${userId}/${type}`, input, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/usersettings/:id/:type', () => {
            it('should not be able to delete a user setting for other users', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.delete(`/api/usersettings/${userId}/${type}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to delete a user setting for himself', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.delete(`/api/usersettings/${userId}/${type}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
            it('should not be able to delete his own default user setting', async () => {
                const userId = currentUser.input.id;
                const type = 'default';
                const response = await helper.delete(`/api/usersettings/${userId}/${type}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/usersettings/:id', () => {
            it('should not be able to delete all (except default) user settings for other users', async () => {
                const userId = otherUser.input.id;
                const response = await helper.delete(`/api/usersettings/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to delete all (except default) of his own user settings', async () => {
                const userId = currentUser.input.id;
                const response = await helper.delete(`/api/usersettings/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/userbookmarks/:id', () => {
            it('should not be able to see the bookmarks of other users', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/userbookmarks/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see his own bookmarks', async () => {
                const userId = currentUser.input.id;
                const response = await helper.get(`/api/userbookmarks/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/userbookmarks/:id/:type', () => {
            it('should not be able to see the bookmarks of other users by user and type', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.get(`/api/userbookmarks/${userId}/${type}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see his own bookmarks of any user and type', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.get(`/api/userbookmarks/${userId}/${type}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/userbookmarks/:id/:type/:objectId', () => {
            it('should not be able to see the bookmarks of other users, by user, type and object', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const objectId = '1901';
                const response = await helper.get(`/api/userbookmarks/${userId}/${type}/${objectId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see his own bookmarks, by user, type and object', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const objectId = '1901';
                const response = await helper.get(`/api/userbookmarks/${userId}/${type}/${objectId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/userbookmarks/:id/:type/:objectId', () => {
            it('should not be able to create a user bookmark for other users', async () => {
                const input: Partial<UserBookmarkInputDTO> = {
                    id: otherUser.input.id,
                    type: BOType.RECEIVERS,
                    objectId: '1901',
                };
                const response = await helper.post(`/api/userbookmarks`, input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to create a user bookmark for himself', async () => {
                const input: Partial<UserBookmarkInputDTO> = {
                    id: currentUser.input.id,
                    type: BOType.RECEIVERS,
                    objectId: '1901',
                };
                const response = await helper.post(`/api/userbookmarks`, input, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/userbookmarks/:id/:type/:objectId', () => {
            it('should not be able to delete a bookmark for other users', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const objectId = '1901';
                const response = await helper.delete(`/api/userbookmarks/${userId}/${type}/${objectId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to delete a bookmark for himself', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const objectId = '1901';
                const response = await helper.delete(`/api/userbookmarks/${userId}/${type}/${objectId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/userbookmarks/:id/:type', () => {
            it('should not be able to delete all bookmarks for other user, by user and type', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.delete(`/api/userbookmarks/${userId}/${type}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to delete all his own bookmarks, by any user and type', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.delete(`/api/userbookmarks/${userId}/${type}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/userbookmarks/:id', () => {
            it('should not be able to delete all bookmarks for other users', async () => {
                const userId = otherUser.input.id;
                const response = await helper.delete(`/api/userbookmarks/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to delete all his own bookmarks', async () => {
                const userId = currentUser.input.id;
                const response = await helper.delete(`/api/userbookmarks/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/organizations', () => {
            it('should be able to see a full list of organizations', async () => {
                const response = await helper.get('/api/organizations', token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/organizations/:id', () => {
            it('should be able to see a single organization', async () => {
                const orgId = 'TST';
                const response = await helper.get(`/api/organizations/${orgId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/organizations/:id/tree', () => {
            it('should be able to see an organization tree', async () => {
                const orgId = 'TST';
                const response = await helper.get(`/api/organizations/${orgId}/tree`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/organizations/:id/treeids', () => {
            it('should be able to see a list of organization ids in an organization tree', async () => {
                const orgId = 'TST';
                const response = await helper.get(`/api/organizations/${orgId}/treeids`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/organizations', () => {
            const input: OrganizationInputDTO = {
                id: 'TSV',
                name: 'Test Root',
                timezone: 'Europe/Berlin',
                locale: 'de-DE',
                currency: 'EUR',
            };
            it('should not be able to create an organization on root level', async () => {
                const response = await helper.post(`/api/organizations`, input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to create an organization below root level', async () => {
                input.parentId = 'TST';
                const response = await helper.post(`/api/organizations`, input, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });
        describe('PUT /api/organizations/:id', () => {
            it('should not be able to update an organization on root level', async () => {
                const updates: Partial<OrganizationInputDTO> = {
                    name: 'Test *UPDATED*',
                };
                const orgId = 'TST';
                const response = await helper.put(`/api/organizations/${orgId}`, updates, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to update an organization below root level', async () => {
                const updates: Partial<OrganizationInputDTO> = {
                    name: 'Test *UPDATED*',
                };
                const orgId = 'TSU';
                const response = await helper.post(`/api/organizations/${orgId}`, updates, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });
        describe('DELETE /api/organizations/:id', () => {
            it('should not be able to delete an organization on root level', async () => {
                const orgId = 'TST';
                const response = await helper.delete(`/api/organizations/${orgId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to delete an organization below root level', async () => {
                const orgId = 'TSU';
                const response = await helper.delete(`/api/organizations/${orgId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/receivers', () => {
            it('should not be able to see a full list of receivers', async () => {
                const response = await helper.get('/api/receivers', token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/receivers/:id', () => {
            it('should not be able to see a single receiver', async () => {
                const id = '1901';
                const response = await helper.get(`/api/receivers/${id}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/receivers', () => {
            it('should not be able to create a receiver', async () => {
                const input: ReceiverInputDTO = {
                    orgId: currentUser.input.orgId,
                    name: 'Auth Test AG',
                    country: 'DE',
                };
                const response = await helper.post(`/api/receivers`, input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
                receiverId = response.body.id;
            });
        });

        describe('PUT /api/receivers/:id', () => {
            it('should not be able to update a receiver', async () => {
                const id = receiverId;
                const updates: Partial<ReceiverInputDTO> = {
                    nameAdd: 'Test *UPDATED*',
                };
                const response = await helper.put(`/api/receivers/${id}`, updates, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/receivers/:id', () => {
            it('should not be able to delete a receiver', async () => {
                const id = receiverId;
                const response = await helper.delete(`/api/receivers/${id}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });
    });

    describe('Sales User ...', () => {

        let token: string;
        let currentUser: { input: UserInputDTO, token: string };
        let otherUser: { input: UserInputDTO, token: string };

        beforeEach(async () => {
            currentUser = { input: TestUsers.find(u => u.id.includes('sales')), token: undefined };
            otherUser = { input: TestUsers.find(u => u.id.includes('locked')), token: undefined };
            const credentials = { id: currentUser.input.id, password: currentUser.input.password };
            const response = await helper.login(credentials);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.id).toEqual(credentials.id);
            token = response.body.token;
        });

        describe('GET /api/users', () => {
            it('should NOT be able to see a full list of users', async () => {
                const response = await helper.get('/api/users', token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/users/:id', () => {
            it('should NOT be able to see other users', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/users/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see own users', async () => {
                const userId = currentUser.input.id;
                const response = await helper.get(`/api/users/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/users', () => {
            it('should not be able to create a user', async () => {
                const input: UserInputDTO = {
                    id: 'test-user@horsti-test.de',
                    password: `tusr${new Date().toDateString()}`,
                    orgId: 'THQ',
                    roles: [Role.AUDITOR],
                    displayName: 'User Test',
                    email: 'test-user@horsti-test.de',
                };
                const response = await helper.post('/api/users', input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });
        describe('PUT /api/users/:id', () => {
            it('should not be able to update a user', async () => {
                const userId = 'test-user@horsti-test.de';
                const updates: UserInputDTO = {
                    locked: true,
                };
                const response = await helper.put(`/api/users/${userId}`, updates, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });
        describe('DELETE /api/users/:id', () => {
            it('should not be able to delete a user', async () => {
                const userId = 'test-user@horsti-test.de';
                const response = await helper.delete(`/api/users/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/userprofiles/:id', () => {
            it('should not be able to see the user profile of another user', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/userprofiles/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see his own user profile', async () => {
                const userId = currentUser.input.id;
                const response = await helper.get(`/api/userprofiles/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('PUT /api/userprofiles/:id', () => {
            it('should be able to update his own user profile', async () => {
                const userId = currentUser.input.id;
                const updates: Partial<UserProfileInputDTO> = {
                    displayName: '*Sales Star*',
                };
                const response = await helper.put(`/api/userprofiles/${userId}`, updates, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
            it('should not be able to update other profiles', async () => {
                const userId = otherUser.input.id;
                const updates: Partial<UserProfileInputDTO> = {
                    displayName: '*Locked*',
                };
                const response = await helper.put(`/api/userprofiles/${userId}`, updates, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/usersettings/:id', () => {
            it('should not be able to see the user settings of any other user', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/userprofiles/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see the his own user settings', async () => {
                const userId = currentUser.input.id;
                const response = await helper.get(`/api/userprofiles/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/usersettings/:id/:type', () => {
            it('should not be able to see the user settings of other users, by user and type', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/usersettings/${userId}/default`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see his own user settings, by user and type', async () => {
                const userId = currentUser.input.id;
                const response = await helper.get(`/api/usersettings/${userId}/default`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/usersettings/:id/:type', () => {
            it('should not be able to create a user setting for any other user and type', async () => {
                const input: UserSettingInputDTO = {
                    id: otherUser.input.id,
                    type: BOType.RECEIVERS,
                    listLimit: 11,
                    bookmarkExpiration: 99,
                };
                const response = await helper.post(`/api/usersettings`, input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to create a user setting for himself by user and type', async () => {
                const input: UserSettingInputDTO = {
                    id: currentUser.input.id,
                    type: BOType.RECEIVERS,
                    listLimit: 11,
                    bookmarkExpiration: 99,
                };
                const response = await helper.post(`/api/usersettings`, input, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('PUT /api/usersettings/:id/:type', () => {
            it('should not be able to update a user setting for other users, by user and type', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const input: Partial<UserSettingInputDTO> = {
                    listLimit: 12,
                    bookmarkExpiration: 77,
                };
                const response = await helper.put(`/api/usersettings/${userId}/${type}`, input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to update his own user setting, by user and type', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const input: Partial<UserSettingInputDTO> = {
                    listLimit: 12,
                    bookmarkExpiration: 77,
                };
                const response = await helper.put(`/api/usersettings/${userId}/${type}`, input, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/usersettings/:id/:type', () => {
            it('should not be able to delete a user setting for other users, by user and type', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.delete(`/api/usersettings/${userId}/${type}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to delete his own user setting, by user and type', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.delete(`/api/usersettings/${userId}/${type}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
            it('should not be able to delete his own default user setting', async () => {
                const userId = currentUser.input.id;
                const type = 'default';
                const response = await helper.delete(`/api/usersettings/${userId}/${type}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/usersettings/:id', () => {
            it('should not be able to delete all user settings for other users', async () => {
                const userId = otherUser.input.id;
                const response = await helper.delete(`/api/usersettings/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to delete all his own user settings - except default', async () => {
                const userId = currentUser.input.id;
                const response = await helper.delete(`/api/usersettings/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/userbookmarks/:id', () => {
            it('should not be able to see the bookmarks of other users', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/userbookmarks/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see his own bookmarks', async () => {
                const userId = currentUser.input.id;
                const response = await helper.get(`/api/userbookmarks/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/userbookmarks/:id/:type', () => {
            it('should not be able to see the bookmarks of other users, by user and type', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.get(`/api/userbookmarks/${userId}/${type}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see his own bookmarks, by user and type', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.get(`/api/userbookmarks/${userId}/${type}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/userbookmarks/:id/:type/:objectId', () => {
            it('should not be able to see the bookmarks of other users, by user, type and object', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const objectId = '1901';
                const response = await helper.get(`/api/userbookmarks/${userId}/${type}/${objectId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see his own bookmarks, by user, type and object', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const objectId = '1901';
                const response = await helper.get(`/api/userbookmarks/${userId}/${type}/${objectId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/userbookmarks/:id/:type/:objectId', () => {
            it('should not be able to create a user bookmark for any other user', async () => {
                const input: Partial<UserBookmarkInputDTO> = {
                    id: otherUser.input.id,
                    type: BOType.RECEIVERS,
                    objectId: '1901',
                };
                const response = await helper.post(`/api/userbookmarks`, input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to create his own bookmark', async () => {
                const input: Partial<UserBookmarkInputDTO> = {
                    id: currentUser.input.id,
                    type: BOType.RECEIVERS,
                    objectId: '1901',
                };
                const response = await helper.post(`/api/userbookmarks`, input, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/userbookmarks/:id/:type/:objectId', () => {
            it('should not be able to delete a bookmark for other users', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const objectId = '1901';
                const response = await helper.delete(`/api/userbookmarks/${userId}/${type}/${objectId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to delete his own bookmark', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const objectId = '1901';
                const response = await helper.delete(`/api/userbookmarks/${userId}/${type}/${objectId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/userbookmarks/:id/:type', () => {
            it('should not be able to delete all bookmarks for other users, by user and type', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.delete(`/api/userbookmarks/${userId}/${type}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to delete all his own bookmarks, by user and type', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.delete(`/api/userbookmarks/${userId}/${type}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/userbookmarks/:id', () => {
            it('should notT be able to delete all bookmarks for other users', async () => {
                const userId = otherUser.input.id;
                const response = await helper.delete(`/api/userbookmarks/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to delete all his own bookmarks', async () => {
                const userId = currentUser.input.id;
                const response = await helper.delete(`/api/userbookmarks/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/organizations', () => {
            it('should not be able to see a full list of organizations', async () => {
                const response = await helper.get(`/api/organizations`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/organizations/:id', () => {
            it('should be able to see a single organization', async () => {
                const orgId = currentUser.input.orgId;
                const response = await helper.get(`/api/organizations/${orgId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/organizations/:id/tree', () => {
            it('should be able to see an organization tree', async () => {
                const orgId = currentUser.input.orgId;
                const response = await helper.get(`/api/organizations/${orgId}/tree`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/organizations/:id/treeids', () => {
            it('should be able to see a list of organization ids in an organization tree', async () => {
                const orgId = currentUser.input.orgId;
                const response = await helper.get(`/api/organizations/${orgId}/treeids`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/organizations', () => {
            it('should not be able to create an organization', async () => {
                const input: OrganizationInputDTO = {
                    id: 'TST',
                    name: 'Test Test',
                    timezone: 'Europe/Berlin',
                    locale: 'de-DE',
                    currency: 'EUR',
                    parentId: 'THQ',
                };
                const response = await helper.post(`/api/organizations`, input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });
        describe('PUT /api/organizations/:id', () => {
            it('should not be able to update an organizations', async () => {
                const orgId = 'TST';
                const updates: Partial<OrganizationInputDTO> = {
                    name: 'Test *UPDATED*',
                };
                const response = await helper.put(`/api/organizations/${orgId}`, updates, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });
        describe('DELETE /api/organizations/:id', () => {
            it('should not be able to delete an organization', async () => {
                const orgId = 'TST';
                const response = await helper.delete(`/api/organizations/${orgId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/receivers', () => {
            it('should be able to see a full list of receivers - within his organization tree', async () => {
                const response = await helper.get('/api/receivers', token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/receivers/:id', () => {
            it('should be able to see a single receiver - within his organization tree', async () => {
                const id = '1901';
                const response = await helper.get(`/api/receivers/${id}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/receivers', () => {
            it('should be able to create a receiver - within his own organization tree', async () => {
                const input: ReceiverInputDTO = {
                    orgId: currentUser.input.orgId,
                    name: 'Auth Test AG',
                    country: 'DE',
                };
                const response = await helper.post(`/api/receivers`, input, token);
                receiverId = response.body.id;
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('PUT /api/receivers/:id', () => {
            it('should be able to update a receiver - within his own organization tree', async () => {
                const id = receiverId;
                const updates: Partial<ReceiverInputDTO> = {
                    nameAdd: 'Test *UPDATED*',
                };
                const response = await helper.put(`/api/receivers/${id}`, updates, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/receivers/:id', () => {
            it('should be able to delete a receiver - within his won organization tree', async () => {
                const id = receiverId;
                const response = await helper.delete(`/api/receivers/${id}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });
    });

    describe('Auditor ...', () => {

        let token: string;
        let currentUser: { input: UserInputDTO, token: string };
        let otherUser: { input: UserInputDTO, token: string };

        beforeEach(async () => {
            currentUser = { input: TestUsers.find(u => u.id.includes('audit')), token: undefined };
            otherUser = { input: TestUsers.find(u => u.id.includes('locked')), token: undefined };
            const credentials = { id: currentUser.input.id, password: currentUser.input.password };
            const response = await helper.login(credentials);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.id).toEqual(credentials.id);
            token = response.body.token;
        });

        describe('GET /api/users', () => {
            it('should NOT be able to see a full list of users', async () => {
                const response = await helper.get('/api/users', token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/users/:id', () => {
            it('should NOT be able to see another user', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/users/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/users', () => {
            it('should NOT be able to create a user', async () => {
                const input: UserInputDTO = {
                    id: 'test-user@horsti-test.de',
                    password: `tusr${new Date().toDateString()}`,
                    orgId: 'THQ',
                    roles: [Role.AUDITOR],
                    displayName: 'User Test',
                    email: 'test-user@horsti-test.de',
                };
                const response = await helper.post('/api/users', input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });
        describe('PUT /api/users/:id', () => {
            it('should NOT be able to update a user', async () => {
                const userId = 'test-user@horsti-test.de';
                const updates: UserInputDTO = {
                    locked: true,
                };
                const response = await helper.put(`/api/users/${userId}`, updates, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });
        describe('DELETE /api/users/:id', () => {
            it('should NOT be able to delete a user', async () => {
                const userId = 'test-user@horsti-test.de';
                const response = await helper.delete(`/api/users/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/userprofiles/:id', () => {
            it('should NOT be able to see the user profile of another user', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/userprofiles/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see his own user profile', async () => {
                const userId = currentUser.input.id;
                const response = await helper.get(`/api/userprofiles/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('PUT /api/userprofiles/:id', () => {
            it('should be able to update his own user profile', async () => {
                const userId = currentUser.input.id;
                const updates: Partial<UserProfileInputDTO> = {
                    displayName: '*Sales Star*',
                };
                const response = await helper.put(`/api/userprofiles/${userId}`, updates, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
            it('should not be able to update other profiles', async () => {
                const userId = otherUser.input.id;
                const updates: Partial<UserProfileInputDTO> = {
                    displayName: '*Locked*',
                };
                const response = await helper.put(`/api/userprofiles/${userId}`, updates, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/usersettings/:id', () => {
            it('should NOT be able to see the user settings of any other user', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/userprofiles/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see the his own user settings', async () => {
                const userId = currentUser.input.id;
                const response = await helper.get(`/api/userprofiles/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/usersettings/:id/:type', () => {
            it('should NOT be able to see the user settings of any other user and type', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/usersettings/${userId}/default`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see his own user settings by user and type', async () => {
                const userId = currentUser.input.id;
                const response = await helper.get(`/api/usersettings/${userId}/default`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/usersettings/:id/:type', () => {
            it('should NOT be able to create a user setting for any other user and type', async () => {
                const input: UserSettingInputDTO = {
                    id: otherUser.input.id,
                    type: BOType.RECEIVERS,
                    listLimit: 11,
                    bookmarkExpiration: 99,
                };
                const response = await helper.post(`/api/usersettings`, input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to create a user setting for himself by user and type', async () => {
                const input: UserSettingInputDTO = {
                    id: currentUser.input.id,
                    type: BOType.RECEIVERS,
                    listLimit: 11,
                    bookmarkExpiration: 99,
                };
                const response = await helper.post(`/api/usersettings`, input, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('PUT /api/usersettings/:id/:type', () => {
            it('should NOT be able to update a user setting for any other user and type', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const input: Partial<UserSettingInputDTO> = {
                    listLimit: 12,
                    bookmarkExpiration: 77,
                };
                const response = await helper.put(`/api/usersettings/${userId}/${type}`, input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to update his own user setting by user and type', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const input: Partial<UserSettingInputDTO> = {
                    listLimit: 12,
                    bookmarkExpiration: 77,
                };
                const response = await helper.put(`/api/usersettings/${userId}/${type}`, input, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/usersettings/:id/:type', () => {
            it('should NOT be able to delete a user setting for any other user and type', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.delete(`/api/usersettings/${userId}/${type}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to delete his own user setting by user and type', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.delete(`/api/usersettings/${userId}/${type}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
            it('should NOT be able to delete his own default user setting', async () => {
                const userId = currentUser.input.id;
                const type = 'default';
                const response = await helper.delete(`/api/usersettings/${userId}/${type}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/usersettings/:id', () => {
            it('should NOT be able to delete all user setting for any other user', async () => {
                const userId = otherUser.input.id;
                const response = await helper.delete(`/api/usersettings/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to delete his own user settings - except default', async () => {
                const userId = currentUser.input.id;
                const response = await helper.delete(`/api/usersettings/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/userbookmarks/:id', () => {
            it('should NOT be able to see the bookmarks of any other user', async () => {
                const userId = otherUser.input.id;
                const response = await helper.get(`/api/userbookmarks/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see his own bookmarks', async () => {
                const userId = currentUser.input.id;
                const response = await helper.get(`/api/userbookmarks/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/userbookmarks/:id/:type', () => {
            it('should NOT be able to see the bookmarks of any other by user and type', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.get(`/api/userbookmarks/${userId}/${type}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see his own bookmarks by user and type', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.get(`/api/userbookmarks/${userId}/${type}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/userbookmarks/:id/:type/:objectId', () => {
            it('should NOT be able to see the bookmarks of any other user by type and object', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const objectId = '1901';
                const response = await helper.get(`/api/userbookmarks/${userId}/${type}/${objectId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to see his own bookmarks by type and object', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const objectId = '1901';
                const response = await helper.get(`/api/userbookmarks/${userId}/${type}/${objectId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/userbookmarks/:id/:type/:objectId', () => {
            it('should NOT be able to create a user bookmark for any other user', async () => {
                const input: Partial<UserBookmarkInputDTO> = {
                    id: otherUser.input.id,
                    type: BOType.RECEIVERS,
                    objectId: '1901',
                };
                const response = await helper.post(`/api/userbookmarks`, input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to create his own bookmark', async () => {
                const input: Partial<UserBookmarkInputDTO> = {
                    id: currentUser.input.id,
                    type: BOType.RECEIVERS,
                    objectId: '1901',
                };
                const response = await helper.post(`/api/userbookmarks`, input, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/userbookmarks/:id/:type/:objectId', () => {
            it('should NOT be able to delete a bookmark for any other user', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const objectId = '1901';
                const response = await helper.delete(`/api/userbookmarks/${userId}/${type}/${objectId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to delete his own bookmark', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const objectId = '1901';
                const response = await helper.delete(`/api/userbookmarks/${userId}/${type}/${objectId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/userbookmarks/:id/:type', () => {
            it('should NOT be able to delete all bookmarks for any other user and type', async () => {
                const userId = otherUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.delete(`/api/userbookmarks/${userId}/${type}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to delete all his own bookmarks by type', async () => {
                const userId = currentUser.input.id;
                const type = BOType.RECEIVERS;
                const response = await helper.delete(`/api/userbookmarks/${userId}/${type}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/userbookmarks/:id', () => {
            it('should NOT be able to delete all bookmarks for any other user', async () => {
                const userId = otherUser.input.id;
                const response = await helper.delete(`/api/userbookmarks/${userId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
            it('should be able to delete all his own bookmarks', async () => {
                const userId = currentUser.input.id;
                const response = await helper.delete(`/api/userbookmarks/${userId}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/organizations', () => {
            it('should NOT be able to see a full list of organizations', async () => {
                const response = await helper.get(`/api/organizations`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/organizations/:id', () => {
            it('should NOT be able to see a single organization', async () => {
                const orgId = currentUser.input.orgId;
                const response = await helper.get(`/api/organizations/${orgId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/organizations/:id/tree', () => {
            it('should NOT be able to see an organization tree', async () => {
                const orgId = currentUser.input.orgId;
                const response = await helper.get(`/api/organizations/${orgId}/tree`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/organizations/:id/treeids', () => {
            it('should NOT be able to see a list of organization ids in an organization tree', async () => {
                const orgId = currentUser.input.orgId;
                const response = await helper.get(`/api/organizations/${orgId}/treeids`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/organizations', () => {
            it('should NOT be able to create an organization', async () => {
                const input: OrganizationInputDTO = {
                    id: 'TST',
                    name: 'Test Test',
                    timezone: 'Europe/Berlin',
                    locale: 'de-DE',
                    currency: 'EUR',
                };
                const response = await helper.post(`/api/organizations`, input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });
        describe('PUT /api/organizations/:id', () => {
            it('should NOT be able to update an organizations', async () => {
                const orgId = 'TST';
                const updates: Partial<OrganizationInputDTO> = {
                    name: 'Test *UPDATED*',
                };
                const response = await helper.put(`/api/organizations/${orgId}`, updates, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });
        describe('DELETE /api/organizations/:id', () => {
            it('should NOT be able to delete an organization', async () => {
                const orgId = 'TST';
                const response = await helper.delete(`/api/organizations/${orgId}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/receivers', () => {
            it('should be able to see a full list of receivers - within his organization tree', async () => {
                const response = await helper.get('/api/receivers', token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('GET /api/receivers/:id', () => {
            it('should be able to see a single receiver - within his organization tree', async () => {
                const id = '1901';
                const response = await helper.get(`/api/receivers/${id}`, token);
                expect(helper.isAllowed(response)).toBeTruthy();
            });
        });

        describe('POST /api/receivers', () => {
            it('should NOT be able to create a receiver - within his own organization tree', async () => {
                const input: ReceiverInputDTO = {
                    orgId: currentUser.input.orgId,
                    name: 'Auth Test AG',
                    country: 'DE',
                };
                const response = await helper.post(`/api/receivers`, input, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('PUT /api/receivers/:id', () => {
            it('should NOT be able to update a receiver - within his own organization tree', async () => {
                const id = receiverId;
                const updates: Partial<ReceiverInputDTO> = {
                    nameAdd: 'Test *UPDATED*',
                };
                const response = await helper.put(`/api/receivers/${id}`, updates, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });

        describe('DELETE /api/receivers/:id', () => {
            it('should NOT be able to delete a receiver - within his won organization tree', async () => {
                const id = receiverId;
                const response = await helper.delete(`/api/receivers/${id}`, token);
                expect(helper.isNotAllowed(response)).toBeTruthy();
            });
        });
    });

    afterAll(async () => {
        await helper.deleteTestOrgs();
        await helper.deleteTestUsers();
        await app.close();
    });
});
