import {useCallback, useEffect, useMemo, SyntheticEvent} from 'react';
import {
  ControllerHof,
  OnSubmit,
  ControllerInjectedResult,
  FieldState,
  FormState,
  Message,
  Messages,
  ResultHook,
  UseFormParams,
} from '../index';
import {createStore, createEvent, restore} from 'effector';
import {useStore} from 'effector-react';
import {getValue} from './utils/dom-helper';
import {setIn, getIn, deleteIn, mapInlineToMapNested} from './utils/object-manager';

const initialFieldState: FieldState = {
  touched: false,
  changed: false,
  blurred: false,
  active: false,
};

const initialFormState = {
  submitted: false,
  hasError: false,
};

const useForm = <Values extends Record<string, unknown>>({
  $values: $valuesProp,
  $errorsInline: $errorsInlineProp,
  $fieldsInline: $fieldsInlineProp,
  $form: $formProp,
}: UseFormParams<Values> = {}): ResultHook<Values> => {
  const setIsMounted = useMemo(() => createEvent<boolean>(), []);
  const $isMounted = useMemo(() => restore(setIsMounted, false), []);
  const validateMapByName: Record<string, any> = useMemo(() => ({}), []);
  const setValue = useMemo(() => createEvent<{name: string, value: any}>(`hookForm_SetValue`), []);
  const setError = useMemo(() => createEvent<{field: string, error: Message}>(`hookForm_SetError`), []);
  const setFieldState = useMemo(() => createEvent<{field: string, state: FieldState}>(`hookForm_SetFieldState`), []);
  const setSubmitted = useMemo(() => createEvent<boolean>(`hookForm_SetSubmitted`), []);

  const $values = useMemo(() => $valuesProp || createStore<Values>({} as Values), []);
  const $errorsInline = useMemo(() => $errorsInlineProp || createStore<Record<string, Message>>({}), []);
  const $errors = useMemo(() => $errorsInline.map((state) => mapInlineToMapNested<Messages<Values>>(state)), []);
  const $fieldsInline = useMemo(() => $fieldsInlineProp || createStore<Record<string, FieldState>>({}), []);
  const $form = useMemo(() => $formProp || createStore<FormState>(initialFormState), []);

  useEffect(() => {
    $values.on(setValue, (state, {name, value}) => {
      return setIn(state, name, value);
    });

    $errorsInline.on(setError, (state, {field, error}) => {
      if (error) {
        return {...state, [field]: error};
      }

      return deleteIn(state, field, false, false);
    });

    $fieldsInline.on(setFieldState, (state, {field, state: fieldState}) =>
      ({...state, [field]: fieldState}));

    $form.on(setSubmitted, (state, value) => setIn(state, 'submitted', value));

    $form.on($errorsInline.updates, (state, errorsInline) =>
      setIn(state, 'hasError', Boolean(Object.keys(errorsInline).length)));

    setIsMounted(true);
  }, []);

  const controller = useCallback<ControllerHof>(({
    name,
    validate,
  }) => {
    validateMapByName[name] = validate;

    return (): ControllerInjectedResult => {
      const onChangeBrowser = useMemo(() => createEvent<any>(`hookForm_OnChange_${name}`), []);
      const onChange = useMemo(() => onChangeBrowser.map((eventOrValue) => getValue(eventOrValue)), []);
      const onFocusBrowser = useMemo(() => createEvent<any>(`hookForm_OnFocus_${name}`), []);
      const onBlurBrowser = useMemo(() => createEvent<any>(`hookForm_OnBlur_${name}`), []);

      const formIsMounted = useStore($isMounted);

      useEffect(() => {
        $values.on(onChange, (state, value) => setIn(state, name, value));

        $errorsInline.on(onChange, (state, value) => {
          const message = validate && validate(value);

          if (message) {
            return {...state, [name]: message};
          }

          return deleteIn(state, name, false, false);
        });

        $fieldsInline.on(onFocusBrowser, (state) => {
          return {...state, [name]: {...state[name], touched: true, active: true}};
        });
        $fieldsInline.on(onChangeBrowser, (state) => {
          return {...state, [name]: {...state[name], changed: true}}
        });
        $fieldsInline.on(onBlurBrowser, (state) => {
          return {...state, [name]: {...state[name], blurred: true, active: false}};
        });
      }, []);

      useEffect(() => {
        setFieldState({field: name, state: initialFieldState});
      }, [formIsMounted]);

      const values = useStore($values);
      const errorsInline = useStore($errorsInline);

      const value = getIn(values, name);
      const error = errorsInline[name];

      const fieldsState = useStore($fieldsInline);
      const fieldState = fieldsState[name] ||  initialFieldState;

      const formState = useStore($form);

      return {
        input: {
          name,
          value,
          onChange: onChangeBrowser,
          onFocus: onFocusBrowser,
          onBlur: onBlurBrowser,
        },
        form: formState,
        fieldState,
        error,
        validate,
        setFieldState,
      };
    }
  }, []);

  const handleSubmit = (onSubmit: OnSubmit<Values>) => (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    Object.entries(validateMapByName).forEach(([name, validate]) => {
      const error = validate && validate(getIn($values.getState(), name));
      if (error) {
        setError({field: name, error});
      }
    });

    onSubmit({
      values: $values.getState(),
      errors: $errors.getState(),
      errorsInline: $errorsInline.getState(),
      fieldsInline: $fieldsInline.getState(),
      form: $form.getState(),
    });
  };

  return {
    controller,
    handleSubmit,
    setValue,
    setError,
    $values,
    $errorsInline,
    $errors,
    $fieldsInline,
  }
};

export default useForm;
