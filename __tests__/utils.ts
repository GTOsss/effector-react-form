import { removeFromInlineMap } from '../src/utils/object-manager';
import { getInTs } from '../src/utils/object-manager';

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

    const user = {
      email: 'test',
      profile: {
        username: 'test',
        a: {
          b: {
            c: {
              d: {
                e: {
                  f: 'f',
                },
              },
            },
          },
        },
      },
    };

    const result1 = getInTs(user, 'profile'); // variable for test ts (!)
    expect(result1).toStrictEqual({
      username: 'test',
      a: {
        b: {
          c: {
            d: {
              e: {
                f: 'f',
              },
            },
          },
        },
      },
    });

    const result2 = getInTs(user, 'profile', 'username'); // variable for test ts (!)
    expect(result2).toBe('test');

    const result3 = getInTs(user, 'profile', 'a'); // variable for test ts (!)
    expect(result3).toStrictEqual({
      b: {
        c: {
          d: {
            e: {
              f: 'f',
            },
          },
        },
      },
    });

    const result4 = getInTs(user, 'profile', 'a', 'b'); // variable for test ts (!)
    expect(result4).toStrictEqual({
      c: {
        d: {
          e: {
            f: 'f',
          },
        },
      },
    });

    const result5 = getInTs(user, 'profile', 'a', 'b', 'c'); // variable for test ts (!)
    expect(result5).toStrictEqual({
      d: {
        e: {
          f: 'f',
        },
      },
    });

    const result6 = getInTs(user, 'profile', 'a', 'b', 'c', 'd'); // variable for test ts (!)
    expect(result6).toStrictEqual({
      e: {
        f: 'f',
      },
    });

    const result7 = getInTs(user, 'profile', 'a', 'b', 'c', 'd', 'e'); // variable for test ts (!)
    expect(result7).toStrictEqual({
      f: 'f',
    });

    const result8 = getInTs(user, 'profile', 'a', 'b', 'c', 'd', 'e', 'f'); // variable for test ts (!)
    expect(result8).toBe('f');
  });
});
