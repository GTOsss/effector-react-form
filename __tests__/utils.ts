import { removeFromInlineMap } from '../src/utils/object-manager';

describe('utils', () => {
  test('removeFromInlineMap', () => {
    const fieldInline = {
      'a.b.c': { _type: 'fieldMeta' },
      'a.b.e': { _type: 'fieldMeta' },
      d: { _type: 'fieldMeta' },
    };

    expect(removeFromInlineMap(fieldInline, 'a.b.e')).toStrictEqual({
      'a.b.c': { _type: 'fieldMeta' },
      d: { _type: 'fieldMeta' },
    });

    const fieldInlineB = {
      'a.b[0]': { _type: 'fieldMeta', value: '0' },
      'a.b[1]': { _type: 'fieldMeta', value: '1' },
      'a.b[2]': { _type: 'fieldMeta', value: '2' },
      d: { _type: 'fieldMeta' },
    };

    expect(removeFromInlineMap(fieldInlineB, 'a.b[1]')).toStrictEqual({
      'a.b.0': { _type: 'fieldMeta', value: '0' },
      'a.b.1': { _type: 'fieldMeta', value: '2' },
      d: { _type: 'fieldMeta' },
    });
  });
});
