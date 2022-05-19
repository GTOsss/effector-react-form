import {createForm, useForm} from '../src';
import {renderHook} from '@testing-library/react-hooks'

describe('useForm hook', () => {
  test('controller return exact value for falsy form value', () => {

    const form = createForm({
      initialValues: {
        falseValue: false,
        emptyStringValue: "",
        zero: 0
      }
    })

    const {result: { current: falseValue}} = renderHook(() => {
      const { controller } = useForm({form: form});
      return controller({name: "falseValue", })()
    });

    const {result: { current: emptyStringValue}} = renderHook(() => {
      const { controller } = useForm({form: form});
      return controller({name: "emptyStringValue"})()
    });

    const {result: { current: zero}} = renderHook(() => {
      const { controller } = useForm({form: form});
      return controller({name: "zero"})()
    })

   expect(falseValue.input.value).toEqual(false);
   expect(emptyStringValue.input.value).toEqual("");
   expect(zero.input.value).toEqual(0);
  });
});
