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
import { Role } from '../src/auth/role';
import * as dotenv from 'dotenv';
import { ConfigModule, ConfigService } from 'nestjs-config';
import * as path from 'path';

describe('UserController (e2e)', () => {
    let app: INestApplication;
    let helper: TestUtility;
    let token: string;

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
        const currentUser = TestUsers.find(u => u.id.includes('super'));
        const credentials = { id: currentUser.id, password: currentUser.password };
        const response = await helper.login(credentials);
        expect(response.status).toBe(HttpStatus.OK);
        token = response.body.token;
    });

    describe('GET /api/users', () => {
        it('should return a list of users', async () => {
            const response = await helper.get('/api/users', token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/users/:id', () => {
        it('should return a single user', async () => {
            const id = TestUsers.find(u => u.id.includes('locked')).id;
            const response = await helper.get(`/api/users/${id}`, token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.id).toEqual(id);
        });
    });

    describe('POST /api/users', () => {

        let input: UserInputDTO;

        beforeEach(() => {
            input = {
                id: 'test-new@horsti-test.de',
                password: `tnew${new Date().toDateString()}`,
                orgId: 'TST',
                roles: [Role.TESTER],
                displayName: 'New Test',
                email: 'test-new@horsti-test.de',
            };
        });

        it('should create a user', async () => {
            const response = await helper.post(`/api/users`, input, token);
            expect(response.status).toBe(HttpStatus.CREATED);
            expect(response.body).toEqual(expect.objectContaining({ id: input.id }));
        });

        it('should throw an error - if id is missing', async () => {
            delete input.id;
            const response = await helper.post(`/api/users`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if id is too short', async () => {
            input.id = 'me';
            const response = await helper.post(`/api/users`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if password is missing', async () => {
            delete input.password;
            const response = await helper.post(`/api/users`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if password is too short', async () => {
            input.password = 'short';
            const response = await helper.post(`/api/users`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if org id is missing', async () => {
            delete input.orgId;
            const response = await helper.post(`/api/users`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if display name is missing', async () => {
            delete input.displayName;
            const response = await helper.post(`/api/users`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if email is missing', async () => {
            delete input.email;
            const response = await helper.post(`/api/users`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if email is invalid', async () => {
            input.email = '**INVALID**';
            const response = await helper.post(`/api/users`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if phone is invalid', async () => {
            input.phone = '**INVALID**';
            const response = await helper.post(`/api/users`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if imageUrl is invalid', async () => {
            input.imageUrl = '**INVALID**';
            const response = await helper.post(`/api/users`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('PUT /api/users/:id', () => {

        let input: UserInputDTO;
        let id: string;

        beforeEach(() => {
            id = 'test-new@horsti-test.de';
            input = {
                password: `tnew${new Date().toDateString()}`,
                orgId: 'TST',
                roles: [Role.TESTER],
                displayName: 'New Test',
                email: 'test-new@horsti-test.de',
            };
        });

        it('should update a user', async () => {
            input.locked = true;
            const response = await helper.put(`/api/users/${id}`, input, token);
            expect(response.status).toBe(HttpStatus.OK);
            await expect(response.body).toEqual(expect.objectContaining({ locked: input.locked }));
        });

        it('should throw an error - if organization is empty', async () => {
            input.orgId = '';
            const response = await helper.put(`/api/users/${id}`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if organization is invalid', async () => {
            input.orgId = '**INVALID**';
            const response = await helper.put(`/api/users/${id}`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if displayName is empty', async () => {
            input.displayName = '';
            const response = await helper.put(`/api/users/${id}`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if email is empty', async () => {
            input.email = '';
            const response = await helper.put(`/api/users/${id}`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if email is invalid', async () => {
            input.email = '**INVALID**';
            const response = await helper.put(`/api/users/${id}`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if phone is invalid', async () => {
            input.phone = '**INVALID**';
            const response = await helper.put(`/api/users/${id}`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if imageUrl is invalid', async () => {
            input.imageUrl = '**INVALID**';
            const response = await helper.put(`/api/users/${id}`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('DELETE /api/users/:id', () => {
        it('should delete a user', async () => {
            const id = 'test-new@horsti-test.de';
            const response = await helper.delete(`/api/users/${id}`, token);
            expect(response.status).toBe(HttpStatus.OK);
        });
    });

    afterAll(async () => {
        await helper.deleteTestUsers();
        await helper.deleteTestOrgs();
        await app.close();
    });
});
