import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { OrganizationModule } from '../src/organization/organization.module';
import { SharedModule } from '../src/shared/shared.module';
import { UserModule } from '../src/user/user.module';
import { TestUtility } from './test-utility';
import { TestUsers } from './test-users';
import { UserInputDTO } from '../src/user/user-input.dto';
import { UserSettingInputDTO } from '../src/user/user-setting/user-setting-input.dto';
import { BOType } from '../src/shared/bo-type';
import * as dotenv from 'dotenv';
import { ConfigModule, ConfigService } from 'nestjs-config';
import * as path from 'path';

describe('UserSettingController (e2e)', () => {
    let app: INestApplication;
    let helper: TestUtility;
    let token: string;
    let currentUser: UserInputDTO;

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
            ],
        })
            .compile();

        app = module.createNestApplication();
        await app.init();

        helper = new TestUtility(request(app.getHttpServer()));
        await helper.createTestOrgs();
        await helper.createTestUsers();
        currentUser = TestUsers.find(u => u.id.includes('sales'));
        const credentials = { id: currentUser.id, password: currentUser.password };
        const response = await helper.login(credentials);
        expect(response.status).toBe(HttpStatus.OK);
        token = response.body.token;
    });

    describe('GET /api/usersettings/:id', () => {
        it('should return a list of user settings for the logged in user', async () => {
            const id = currentUser.id;
            const response = await helper.get(`/api/usersettings/${id}`, token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('GET /api/usersettings/:id/:type', () => {
        it('should return a single user settings for the logged in user and the given type', async () => {
            const id = currentUser.id;
            const type = 'default';
            const response = await helper.get(`/api/usersettings/${id}/${type}`, token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body).toEqual(expect.objectContaining({ id, type }));
        });
        it('should throw an error - if user setting does not exist', async () => {
            const id = currentUser.id;
            const type = 'nonsense';
            const response = await helper.get(`/api/usersettings/${id}/${type}`, token);
            expect(response.status).toBe(HttpStatus.NOT_FOUND);
        });
    });

    describe('POST /api/usersettings', () => {

        let input: UserSettingInputDTO;

        beforeEach(() => {
            input = {
                id: currentUser.id,
                type: BOType.RECEIVERS,
                listLimit: 5,
                bookmarkExpiration: 20,
            };
        });

        it('should create a user setting', async () => {
            const response = await helper.post(`/api/usersettings`, input, token);
            expect(response.status).toBe(HttpStatus.CREATED);
            expect(response.body).toEqual(expect.objectContaining({ id: input.id }));
        });

        it('should throw an error - if id is missing', async () => {
            delete input.id;
            const response = await helper.post(`/api/usersettings`, input, token);
            expect(helper.isOK(response)).toBeFalsy();
        });
        it('should throw an error - if id does not exist', async () => {
            input.id = 'me';
            const response = await helper.post(`/api/usersettings`, input, token);
            expect(helper.isOK(response)).toBeFalsy();
        });
        it('should throw an error - if type is missing', async () => {
            delete input.type;
            const response = await helper.post(`/api/usersettings`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if list limit is invalid', async () => {
            input.listLimit = -99;
            const response = await helper.post(`/api/usersettings`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if bookmark expiration is invalid', async () => {
            input.bookmarkExpiration = -99;
            const response = await helper.post(`/api/usersettings`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('PUT /api/usersettings/:id/:type', () => {

        let input: Partial<UserSettingInputDTO>;
        let id: string;
        let type: string;

        beforeEach(() => {
            id = currentUser.id;
            type = BOType.RECEIVERS;
            input = {
                listLimit: 3,
                bookmarkExpiration: 7,
            };
        });

        it('should update a user setting', async () => {
            const response = await helper.put(`/api/usersettings/${id}/${type}`, input, token);
            expect(response.status).toBe(HttpStatus.OK);
            await expect(response.body).toEqual(expect.objectContaining({ listLimit: input.listLimit }));
        });
        it('should throw an error - if list limit is invalid', async () => {
            input.listLimit = -99;
            const response = await helper.put(`/api/usersettings/${id}/${type}`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if bookmark expiration is invalid', async () => {
            input.bookmarkExpiration = -99;
            const response = await helper.put(`/api/usersettings/${id}/${type}`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if user setting does not exist', async () => {
            type = 'nonsense';
            const response = await helper.put(`/api/usersettings/${id}/${type}`, input, token);
            expect(response.status).toBe(HttpStatus.NOT_FOUND);
        });
    });

    describe('DELETE /api/usersettings/:id/:type', () => {
        it('should delete a user setting', async () => {
            const id = currentUser.id;
            const type = BOType.RECEIVERS;
            const response = await helper.delete(`/api/usersettings/${id}/${type}`, token);
            expect(response.status).toBe(HttpStatus.OK);
        });
    });

    describe('DELETE /api/usersettings/:id', () => {
        it('should delete all user settings for the logged in user - except default', async () => {
            const id = currentUser.id;
            const input = {
                id,
                type: BOType.ORGANIZATIONS,
                listLimit: 2,
                bookmarkExpiration: 5,
            };
            let response = await helper.post(`/api/usersettings`, input, token);
            expect(response.status).toBe(HttpStatus.CREATED);
            response = await helper.delete(`/api/usersettings/${id}`, token);
            expect(response.status).toBe(HttpStatus.OK);
            const type = 'default';
            response = await helper.get(`/api/usersettings/${id}/${type}`, token);
            expect(response.status).toBe(HttpStatus.OK);
        });
    });

    afterAll(async () => {
        await helper.deleteTestUsers();
        await helper.deleteTestOrgs();
        await app.close();
    });
});
