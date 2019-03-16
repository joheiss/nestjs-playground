import { Test, TestingModule } from '@nestjs/testing';
import { UserProfileController } from './user-profile.controller';
import { UserProfileService } from './user-profile.service';
import { mockUserProfileService } from '../../mocks/mock-user-profiles.service';
import { AuthDTO } from '../../auth/auth.dto';
import { UserProfileInputDTO } from './user-profile-input.dto';

describe('User Profile Controller', () => {
  let controller: UserProfileController;
  let service: UserProfileService;
  let auth: AuthDTO;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserProfileController],
      providers: [
        { provide: UserProfileService, useValue: mockUserProfileService() },
      ],
    }).compile();

    controller = module.get<UserProfileController>(UserProfileController);
    service = module.get<UserProfileService>(UserProfileService);
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

  describe('GET /api/userprofiles/:id (getById)', () => {
    it('should call user profile service findById and return a profile', async () => {
      const spy3 = jest.spyOn(service, 'findById');
      const id = auth.id;
      await expect(controller.getById(auth, id)).resolves.toBeTruthy();
      await expect(spy3).toHaveBeenCalled();
    });
  });

  describe('PUT /api/userprofiles/:id (update)', () => {
    let input: Partial<UserProfileInputDTO>;
    let id: string;
    beforeEach(() => {
      id = 'tester1@horsti.de';
      input = {
        displayName: 'Updated Tester9',
        email: 'tester1@horsti.de',
        phone: '+49 777 7654321',
        imageUrl: 'https://www.jovisco.de/images/myimage.png',
      };
    });
    it('should call user profile service update', async () => {
      const spy = jest.spyOn(service, 'update');
      await expect(controller.update(auth, id, input)).resolves.toBeTruthy();
      await expect(spy).toHaveBeenCalled();
    });
  });
});
