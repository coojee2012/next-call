import { WhiteListMiddleware } from './white-list.middleware';

describe('WhiteListMiddleware', () => {
  it('should be defined', () => {
    expect(new WhiteListMiddleware()).toBeDefined();
  });
});
