import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { SharedModule } from '../src/shared/shared.module';
import { UserModule } from '../src/user/user.module';
import { TestUtility } from './test-utility';
import { TestUsers } from './test-users';
import { UserInputDTO } from '../src/user/user-input.dto';
import * as dotenv from 'dotenv';
import { OrganizationModule } from '../src/organization/organization.module';
import { ConfigModule, ConfigService } from 'nestjs-config';
import * as path from 'path';

describe('UserProfileController (e2e)', () => {
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

    describe('GET /api/userprofiles/:id', () => {
        it('should return a single user profile', async () => {
            const id = currentUser.id;
            const response = await helper.get(`/api/userprofiles/${id}`, token);
            expect(response.status).toBe(HttpStatus.OK);
            expect(response.body.id).toEqual(id);
        });
    });

    describe('PUT /api/users/:id', () => {

        let input: UserInputDTO;
        let id: string;

        beforeEach(() => {
            id = currentUser.id;
            input = {
                displayName: 'New Test',
                email: id,
                phone: '+49 777 7654321',
                imageUrl: 'https://www.horsti.de/files/users/test-super/images/photo.png',
            };
        });

        it('should update a user profile', async () => {
            const response = await helper.put(`/api/userprofiles/${id}`, input, token);
            expect(response.status).toBe(HttpStatus.OK);
            await expect(response.body).toEqual(expect.objectContaining({ email: input.email }));
        });

        it('should throw an error - if display name is empty', async () => {
            input.displayName = '';
            const response = await helper.put(`/api/userprofiles/${id}`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if email is empty', async () => {
            input.email = '';
            const response = await helper.put(`/api/userprofiles/${id}`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if email is invalid', async () => {
            input.email = 'invalid.invalid.de';
            const response = await helper.put(`/api/userprofiles/${id}`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if phone is invalid', async () => {
            input.phone = '**INVALID**';
            const response = await helper.put(`/api/userprofiles/${id}`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
        it('should throw an error - if imageUrl is invalid', async () => {
            input.imageUrl = '**INVALID**';
            const response = await helper.put(`/api/userprofiles/${id}`, input, token);
            expect(response.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    afterAll(async () => {
        await helper.deleteTestUsers();
        await helper.deleteTestOrgs();
        await app.close();
    });

});
