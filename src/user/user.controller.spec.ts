import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { mockUserService } from '../mocks/mock-user.service';
import { UserInputDTO } from './user-input.dto';
import { AuthDTO } from '../auth/auth.dto';

describe('User Controller', () => {
  let controller: UserController;
  let service: UserService;
  let auth: AuthDTO;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService() },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  beforeEach(() => {
      auth = {
          id: 'tester1@horsti.de',
          orgId: 'THQ',
          roles: ['super'],
      };
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/users (getAll)', () => {
    it('should call user service findAll', async () => {
      const spy = jest.spyOn(service, 'findAll');
      const page = 1;
      await expect(controller.getAll(auth, page)).resolves.toBeTruthy();
      await expect(spy).toHaveBeenCalled();
    });
  });

  describe('GET /api/users/:id (getOne)', () => {
    it('should call user service findById', async () => {
      const spy = jest.spyOn(service, 'findById');
      const id =  'tester1@horsti.de';
      await expect(controller.getOne(auth, id)).resolves.toBeTruthy();
      await expect(spy).toHaveBeenCalled();
    });
  });

  describe('POST /api/users (create)', () => {
    let input: Partial<UserInputDTO>;

    beforeEach(() => {
      input = {
        id: 'tester9@horsti.de',
        password: 'Hansi123',
        orgId: 'THQ',
        roles: ['tester'],
        displayName: 'Testi Tester9',
        email: 'tester9@horsti.de',
        phone: '+49 777 7654321',
        imageUrl: 'https://www.jovisco.de/images/myimage.png',
      };
    });

    it('should call user service create', async () => {
      const spy = jest.spyOn(service, 'create');
      await expect(controller.create(auth, input)).resolves.toBeTruthy();
      await expect(spy).toHaveBeenCalled();
    });
  });

  describe('PUT /api/users/:id (update)', () => {
    let input: Partial<UserInputDTO>;
    let id: string;
    beforeEach(() => {
      id = 'tester9@horsti.de';
      input = {
        password: 'Hansi123',
        orgId: 'THQ',
        roles: ['tester'],
        displayName: 'Testi Tester9',
        email: 'tester9@horsti.de',
        phone: '+49 777 7654321',
        imageUrl: 'https://www.jovisco.de/images/myimage.png',
      };
    });
    it('should call user service update', async () => {
      const spy = jest.spyOn(service, 'update');
      await expect(controller.update(auth, id, input)).resolves.toBeTruthy();
      await expect(spy).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/users/:id (delete)', () => {
    it('should call user service delete', async () => {
      const spy = jest.spyOn(service, 'delete');
      const id = 'tester9@horsti.de';
      await expect(controller.delete(auth, id)).resolves.toBeTruthy();
      await expect(spy).toHaveBeenCalled();
    });
  });
});
