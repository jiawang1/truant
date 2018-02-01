import { expect } from 'chai';
import { serialize } from '../../src/troop/SimpleQuery';

const mockJson = [
  {
    id: 'student_unit!1',
    collapsed: false,
    itemTypeId: 22
  },
  {
    id: 'test!1',
    levelTest: { id: 'student_levelTest!1', collapsed: true },
    children: [
      {
        id: 'student_unit!1',
        collapsed: true
      },
      {
        id: 'student_unit!2',
        collapsed: true
      }
    ]
  },
  {
    id: 'student_levelTest!1',
    collapsed: false,
    itemTypeId: 21
  },

  {
    id: 'student_unit!2',
    collapsed: false,
    itemTypeId: 23
  },
  {
    id: 'user!current',
    collapsed: false,
    itemTypeId: 24
  }
];

describe('unit test for simplequery', () => {
  it('verify serialize method', () => {
    const oCache = serialize(mockJson);
    expect(oCache['test!1'].levelTest.itemTypeId).is.equals(21);
    expect(oCache['student_levelTest!1'].itemTypeId).is.equals(21);
    expect(oCache['user!current'].itemTypeId).is.equals(24);
    expect(oCache['test!1'].children.map(unit => unit.itemTypeId)).to.eql([22, 23]);
  });
});
