import { ReactNode, useCallback, useRef } from 'react';
import { useStore } from 'effector-react';
import { AnyState, FieldArrayParams, MapFieldArrayCallback, ResultUseFieldArray } from './ts';
import { getIn } from './utils/object-manager';

const useFieldArray = <Values = AnyState>({ fieldArray, name }: FieldArrayParams<Values>): ResultUseFieldArray => {
  const refName = useRef(name);
  refName.current = name;

  const {
    form: { $values },
    push,
    remove,
  } = fieldArray;

  const values = useStore($values);

  const map = useCallback<(fn: MapFieldArrayCallback) => ReactNode[]>(
    (callback: MapFieldArrayCallback) => {
      const results = [];
      const fields = getIn(values, refName.current, []) as any[];
      fields.forEach((field, index) => {
        const callbackResult = callback({
          formItemName: `${refName.current}.${index}`,
          fields,
          field,
          index,
        });
        results.push(callbackResult);
      });
      return results;
    },
    [values],
  ); // todo Fix type

  return {
    map,
    remove: (index: number) => remove({ fieldName: refName.current, index }),
    push: (value: any | any[]) => push({ fieldName: refName.current, value }),
  };
};

export default useFieldArray;
