import { mockDependency } from '../../test/mock-dependency';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
    }).useMocker(mockDependency).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
