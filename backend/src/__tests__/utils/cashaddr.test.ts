describe('cashaddr utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  test('converts between legacy and cashaddr formats for Bitcoin Cash', () => {
    jest.isolateModules(() => {
      jest.mock('../../../mempool-config.json', () => ({
        MEMPOOL: {
          NETWORK: 'bitcoincash'
        }
      }), { virtual: true });

      const { toCashAddress, toLegacyAddress } = jest.requireActual('../../utils/cashaddr');

      const legacyAddress = '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu';
      const cashAddress = 'qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a';

      expect(toCashAddress(legacyAddress)).toBe(cashAddress);
      expect(toLegacyAddress(cashAddress)).toBe(legacyAddress);
    });
  });
});

