import { mockDependency } from '../../test/mock-dependency';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from './jwt.service';

describe('JwtService', () => {
  let service: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtService],
    }).useMocker(mockDependency).compile();

    service = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
