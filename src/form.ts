import {useCallback, useEffect, useMemo, SyntheticEvent, useRef} from 'react';
import {
  ControllerHof,
  OnSubmit,
  ControllerInjectedResult,
  FieldState,
  FormState,
  Messages,
  ResultHook,
  UseFormParams, AnyState, ErrorsInline, FieldsInline, SetOrDeleteErrorParams,
} from '../index';
import {createStore, createEvent} from 'effector';
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
  forcedError: false,
};

const useForm = <Values extends AnyState>({
  $values: $valuesProp,
  $errorsInline: $errorsInlineProp,
  $fieldsInline: $fieldsInlineProp,
  $form: $formProp,
  // validate,
}: UseFormParams<Values> = {}): ResultHook<Values> => {

  const willMount = useRef(true);

  const validateMapByName = useRef<Record<string, any>>({});
  validateMapByName.current = {};
  const setValue = useMemo(() => createEvent<{field: string, value: any}>(`hookForm_SetValue`), []);
  const setOrDeleteError = useMemo(() => createEvent<SetOrDeleteErrorParams>(`hookForm_SetError`), []);
  const setErrorsInlineState = useMemo(() => createEvent<ErrorsInline>(`hookForm_SetErrorsInlineState`), []);
  const setFieldState = useMemo(() => createEvent<{field: string, state: FieldState}>(`hookForm_SetFieldState`), []);
  const setSubmitted = useMemo(() => createEvent<boolean>(`hookForm_SetSubmitted`), []);

  const $values = useMemo(() => $valuesProp || createStore<Values>({} as Values), []);
  const $errorsInline = useMemo(() => $errorsInlineProp || createStore<ErrorsInline>({}), []);
  const $errors = useMemo(() => $errorsInline.map((state) => mapInlineToMapNested<Messages<Values>>(state)), []);
  const $fieldsInline = useMemo(() => $fieldsInlineProp || createStore<FieldsInline>({}), []);
  const $form = useMemo(() => $formProp || createStore<FormState>(initialFormState), []);

  if (willMount.current) {
    $fieldsInline.on(setFieldState, (state, {field, state: fieldState}) => {
      return ({...state, [field]: fieldState});
    });
  }

  const validateForm = useCallback(() => {
    const values = $values.getState();
    const errorsInlineState = {};
    Object.entries(validateMapByName.current).forEach(([name, validate]) => {
      const error = validate && validate(getIn(values, name));
      if (error) {
        errorsInlineState[name] = validate && validate(getIn(values, name));
      }
    });
    setErrorsInlineState(errorsInlineState);
  }, []);

  const values = useStore<Values>($values);

  useEffect(() => {
    validateForm();
  }, [values]);

  useEffect(() => {
    $values.on(setValue, (state, {field, value}) => setIn(state, field, value));

    $errorsInline.on(setOrDeleteError, (state, {field, error}) =>
      error ? {...state, [field]: error} : deleteIn(state, field, false, false));

    $errorsInline.on(setErrorsInlineState, (_, errorsInline) => errorsInline);

    $form.on(setOrDeleteError, (state, {forced = true}) => ({...state, forcedError: forced}));

    $form.on(setSubmitted, (state, value) => setIn(state, 'submitted', value));

    $form.on($errorsInline.updates, (state, errorsInline) =>
      setIn(state, 'hasError', Boolean(Object.keys(errorsInline).length)));

    validateForm();
  }, []);

  const controller = useCallback<ControllerHof>(({
    name,
    validate,
  }) => {
    validateMapByName.current[name] = validate;

    return (): ControllerInjectedResult => {
      const onChangeBrowser = useMemo(() => createEvent<any>(`hookForm_OnChange_${name}`), []);
      const onChange = useMemo(() => onChangeBrowser.map((eventOrValue) => getValue(eventOrValue)), []);
      const onFocusBrowser = useMemo(() => createEvent<any>(`hookForm_OnFocus_${name}`), []);
      const onBlurBrowser = useMemo(() => createEvent<any>(`hookForm_OnBlur_${name}`), []);

      useEffect(() => {
        $values.on(onChange, (state, value) => setIn(state, name, value));

        $fieldsInline.on(onFocusBrowser, (state) => {
          return {...state, [name]: {...state[name], touched: true, active: true}};
        });
        $fieldsInline.on(onChangeBrowser, (state) => {
          return {...state, [name]: {...state[name], changed: true}};
        });
        $fieldsInline.on(onBlurBrowser, (state) => {
          return {...state, [name]: {...state[name], blurred: true, active: false}};
        });

        setFieldState({field: name, state: initialFieldState});

      }, []);

      const values = useStore<Values>($values);
      const errorsInline = useStore<ErrorsInline>($errorsInline);

      const value = getIn(values, name);
      const error = errorsInline[name];

      const fieldsState = useStore<FieldsInline>($fieldsInline);
      const fieldState = fieldsState[name] || initialFieldState;

      const formState = useStore<FormState>($form);

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
        setOrDeleteError,
      };
    };
  }, []);

  const handleSubmit = (onSubmit: OnSubmit<Values>) => (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);

    validateForm();

    onSubmit({
      values: $values.getState(),
      errors: $errors.getState(),
      errorsInline: $errorsInline.getState(),
      fieldsInline: $fieldsInline.getState(),
      form: $form.getState(),
    });
  };

  willMount.current = false;

  return {
    controller,
    handleSubmit,
    setValue,
    setOrDeleteError,
    setErrorsInlineState,
    $values,
    $errorsInline,
    $errors,
    $fieldsInline,
    $form,
  };
};

export default useForm;
