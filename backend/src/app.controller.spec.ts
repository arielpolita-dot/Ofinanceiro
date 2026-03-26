import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return ok status', () => {
      const result = controller.root();

      expect(result).toEqual({ status: 'ok' });
    });

    it('should always return status "ok"', () => {
      const result1 = controller.root();
      const result2 = controller.root();

      expect(result1.status).toBe('ok');
      expect(result2.status).toBe('ok');
    });

    it('should return object with exactly one key', () => {
      const result = controller.root();

      expect(Object.keys(result)).toHaveLength(1);
      expect(Object.keys(result)).toEqual(
        expect.arrayContaining(['status']),
      );
    });
  });
});
