import { ReactNode, useCallback, useRef, useMemo } from 'react';
import { useUnit } from 'effector-react';
import { AnyState, FieldArrayParams, MapFieldArrayCallback, ResultUseFieldArray } from './ts';
import { getIn } from './utils/object-manager';

const useFieldArray = <Values extends object = AnyState>({
  fieldArray,
  name,
}: FieldArrayParams<Values>): ResultUseFieldArray => {
  const refName = useRef(name);
  refName.current = name;

  const {
    form: { $values },
  } = fieldArray;

  const push = useUnit(fieldArray.push);
  const remove = useUnit(fieldArray.remove);

  const values = useUnit($values);

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

  const count = useMemo(() => (getIn(values, refName.current, []) as any[]).length, [values]);

  return {
    map,
    remove: (index: number) => remove({ fieldName: refName.current, index }),
    push: (value: any | any[]) => push({ fieldName: refName.current, value }),
    count,
  };
};

export default useFieldArray;
