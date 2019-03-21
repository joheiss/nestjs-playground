import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/auth/auth.module';
import * as dotenv from 'dotenv';
import { UserModule } from '../src/user/user.module';
import { SharedModule } from '../src/shared/shared.module';
import { UserInputDTO } from '../src/user/user-input.dto';
import { OrganizationModule } from '../src/organization/organization.module';
import { ReceiverModule } from '../src/receiver/receiver.module';
import { TestUtility } from './test-utility';
import { TestUsers } from './test-users';
import { ConfigModule, ConfigService } from 'nestjs-config';
import * as path from 'path';
import { GraphQLDateTime } from 'graphql-iso-date';
import { Role } from '../src/auth/role';

describe('Auth GraphQL (e2e)', () => {
    let app: INestApplication;
    let helper: TestUtility;

    beforeAll(async () => {
        console.log('*** SETUP TEST SERVER ***');
        dotenv.config({ path: `${process.env.NODE_ENV}.env` });
        const module = await Test.createTestingModule({
            imports: [
                ConfigModule.load(path.resolve(__dirname, '..', 'src', 'config', '**', '!(*.d).{ts,js}')),
                GraphQLModule.forRootAsync({
                    useFactory: () => ({
                        typePaths: ['./**/*.graphql'],
                        resolvers: { GraphQLDateTime },
                        context: ({ req }) => ({ req }),
                    }),
                }),
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

        currentUser = { input: TestUsers.find(u => u.id.includes('super')), token: undefined };

        describe('whoAmI', () => {
            it('should detect that we are not logged in', async () => {
                const response = await helper.runGql({
                    query: `{ whoAmI { id orgId roles locked displayName email phone } }`,
                }, undefined);
                expect(helper.gqlIsNotAllowed(response)).toBeTruthy();
            });
        });

        describe('login', () => {
            it('should detect invalid credentials', async () => {
                const credentials = { id: currentUser.input.id, password: 'dontknow' };
                const response = await helper.gqlLogin(credentials);
                expect(helper.gqlIsNotAllowed(response)).toBeTruthy();
            });
            it('should return user and token for valid credentials', async () => {
                const credentials = { id: currentUser.input.id, password: currentUser.input.password };
                const response = await helper.gqlLogin(credentials);
                expect(helper.gqlIsOK(response)).toBeTruthy();
                expect(response.body.data.login.id).toEqual(credentials.id);
                expect(response.body.data.login.token).toBeTruthy();
                token = response.body.data.login.token;
            });
            it('should confirm that we are logged in', async () => {
                const response = await helper.runGql({
                    query: `{ whoAmI { id orgId roles locked displayName email phone } }`,
                }, token);
                expect(helper.gqlIsOK(response)).toBeTruthy();
                expect(response.body.data.whoAmI.id).toEqual(currentUser.input.id);
            });
            it('should detect locked user and reject login', async () => {
                const lockedUser = { input: TestUsers.find(u => u.id.includes('locked')), token: undefined };
                const credentials = { id: lockedUser.input.id, password: lockedUser.input.password };
                const response = await helper.gqlLogin(credentials);
                expect(helper.gqlIsNotAllowed(response)).toBeTruthy();
                const error = helper.parseGqlErrors(response);
                expect(error.message).toContain('user_locked');
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
            const response = await helper.gqlLogin(credentials);
            expect(helper.gqlIsOK(response)).toBeTruthy();
            token = response.body.data.login.token;
        });

        describe('GQL users', () => {
            it('should be able to see a full list of users', async () => {
                const response = await helper.runGql({ query: `{ users { id orgId roles } }` }, token);
                expect(helper.gqlIsOK(response)).toBeTruthy();
            });
        });

        describe('GQL createUser', () => {
            it('should be able to create a user', async () => {
                const input: UserInputDTO = {
                    id: 'test-user@horsti-test.de',
                    password: process.env.TEST_PASSWORD,
                    orgId: 'TST',
                    roles: [Role.AUDITOR],
                    displayName: 'User Test',
                    email: 'test-user@horsti-test.de',
                };
                const response = await helper.gqlCreateUser(input, token);
                expect(helper.gqlIsOK(response)).toBeTruthy();
            });
        });

        describe('GQL updateUser', () => {
            it('should be able to update a user', async () => {
                const userId = 'test-user@horsti-test.de';
                const updates: UserInputDTO = {
                    locked: true,
                };
                const response = await helper.gqlUpdateUser(userId, updates, token);
                expect(helper.gqlIsOK(response)).toBeTruthy();
            });
        });

        describe('GQL deleteUser', () => {
            it('should be able to delete a user', async () => {
                const userId = deleteUser.input.id;
                const response = await helper.gqlDeleteUser(userId, token);
                expect(helper.gqlIsOK(response)).toBeTruthy();
            });
        });
    });

    afterAll(async () => {
        await helper.deleteTestUsers();
        await helper.deleteTestOrgs();
        await app.close();
    });
});
