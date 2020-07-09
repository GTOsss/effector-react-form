import {useCallback, useEffect, useMemo, useRef} from 'react';
import {
  ControllerHof,
  ControllerInjectedResult,
  FieldState,
  FormState,
  ResultHook,
  UseFormParams, AnyState, ErrorsInline, FieldsInline, SetOrDeleteErrorParams, Message,
} from '../index';
import {createStore, createEvent, sample, combine} from 'effector';
import {useStore} from 'effector-react';
import {getValue} from './utils/dom-helper';
import {setIn, getIn, deleteIn} from './utils/object-manager';

const initialFieldState: FieldState = {
  active: false,
  touched: false,
  changed: false,
  blurred: false,
  touchedAfterOuterError: false,
  changedAfterOuterError: false,
  blurredAfterOuterError: false,
};

const initialFormState: FormState = {
  submitted: false,
  hasError: false,
  hasOuterError: false,
};

const useForm = <Values extends AnyState>({
  $values: $valuesProp,
  $errorsInline: $errorsInlineProp,
  $outerErrorsInline: $outerErrorsInlineProp,
  $fieldsInline: $fieldsInlineProp,
  $form: $formProp,
  validate,
  onSubmit,
  onChange: onChangeForm,
}: UseFormParams<Values> = {}): ResultHook<Values> => {

  const willMount = useRef(true);

  const validateMapByNameRef = useRef<Record<string, any>>({});
  validateMapByNameRef.current = {};
  const setValue = useMemo(() => createEvent<{field: string, value: any}>(`hookForm_SetValue`), []);
  const setOrDeleteError = useMemo(() => createEvent<SetOrDeleteErrorParams>(`hookForm_SetOrDeleteError`), []);
  const setErrorsInlineState = useMemo(() => createEvent<ErrorsInline>(`hookForm_SetErrorsInlineState`), []);
  const setFieldState = useMemo(() => createEvent<{field: string, state: FieldState}>(`hookForm_SetFieldState`), []);
  const setSubmitted = useMemo(() => createEvent<boolean>(`hookForm_SetSubmitted`), []);
  const resetOuterFieldStateFlags = useMemo(() => createEvent('hookForm_ResetOuterFieldStateFlags'), []);
  const setOrDeleteOuterError = useMemo(() => createEvent<{field: string, error: Message}>('hookForm_SetOrDeleteOuterError'), []);
  const setOuterErrorsInlineState = useMemo(() => createEvent<ErrorsInline>('hookForm_SetOuterErrorsInlineState'), []);

  const $values = useMemo(() => $valuesProp || createStore<Values>({} as Values), []);
  const $errorsInline = useMemo(() => $errorsInlineProp || createStore<ErrorsInline>({}), []);
  const $outerErrorsInline = useMemo(() => $outerErrorsInlineProp || createStore<ErrorsInline>({}), []);
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

    Object.entries(validateMapByNameRef.current).forEach(([name, validate]) => {
      const error = validate && validate(getIn(values, name));
      if (error) {
        errorsInlineState[name] = validate && validate(getIn(values, name));
      }
    });

    if (validate) {
      const formLevelErrorsInlineState = validate({values, errorsInline: errorsInlineState});
      Object.entries(formLevelErrorsInlineState).forEach(([name, error]) => {
        if (error) {
          errorsInlineState[name] = error;
        } else {
          delete errorsInlineState[name];
        }
      });
    }

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

    $outerErrorsInline.on(setOrDeleteOuterError, (state, {field, error}) =>
      error ? {...state, [field]: error} : deleteIn(state, field, false, false));

    $outerErrorsInline.on(setOuterErrorsInlineState, (_, errorsInline) => errorsInline);

    $fieldsInline.on(setOrDeleteOuterError, (state, {field}) => ({
      ...state,
      [field]: {
        ...state[field],
        touchedAfterOuterError: false,
        changedAfterOuterError: false,
        blurredAfterOuterError: false,
      }
    }))

    $fieldsInline.on(resetOuterFieldStateFlags, (state) => {
      const newState = {};
      Object.entries(state).forEach(([field, state]) => (
        newState[field] = {
          ...state,
          touchedAfterOuterError: false,
          changedAfterOuterError: false,
          blurredAfterOuterError: false,
        }
      ));
      return newState;
    });

    $form.on($outerErrorsInline.updates, (state, outerErrors) =>
      ({...state, hasOuterError: Boolean(Object.keys(outerErrors).length)}));

    $form.on(setSubmitted, (state, value) => setIn(state, 'submitted', value));

    $form.on($errorsInline.updates, (state, errorsInline) =>
      setIn(state, 'hasError', Boolean(Object.keys(errorsInline).length)));

    validateForm();

    return () => {
      $values.off(setValue);

      $errorsInline.off(setOrDeleteError);
      $errorsInline.off(setErrorsInlineState);

      $form.off(setOrDeleteError);
      $form.off(setSubmitted);
      $form.off($errorsInline);
    };
  }, []);

  const controller = useCallback<ControllerHof>(({
    name: nameProp,
    validate,
  }) => {
    validateMapByNameRef.current[nameProp] = validate;

    return (): ControllerInjectedResult => {
      const refName = useRef<string>(nameProp);
      refName.current = nameProp;

      const onChangeBrowser = useMemo(() => createEvent<any>(`hookForm_OnChange_${refName.current}`), []);
      const onChange = useMemo(() => onChangeBrowser.map((eventOrValue) => getValue(eventOrValue)), []);
      const onFocusBrowser = useMemo(() => createEvent<any>(`hookForm_OnFocus_${refName.current}`), []);
      const onBlurBrowser = useMemo(() => createEvent<any>(`hookForm_OnBlur_${refName.current}`), []);

      useEffect(() => {
        if (onChangeForm) {
          const $allFormState = sample({
            source: {
              values: $values,
              errorsInline: $errorsInline,
              outerErrorsInline: $outerErrorsInline,
              fieldsInline: $fieldsInline,
              form: $form,
            },
            clock: onChangeBrowser,
          });

          $allFormState.watch(onChangeForm)
        }

        $values.on(onChange, (state, value) => setIn(state, refName.current, value));

        sample({
          source: combine({
            fieldsInline: $fieldsInline,
            outerErrorsInline: $outerErrorsInline,
          }),
          clock: onFocusBrowser,
          fn: ({fieldsInline, outerErrorsInline}) => ({
            ...fieldsInline, [refName.current]: {
              ...fieldsInline[refName.current],
              active: true,
              touched: true,
              touchedAfterOuterError: Boolean(outerErrorsInline[refName.current]),
            },
          }),
          target: $fieldsInline
        });
        sample({
          source: combine({
            fieldsInline: $fieldsInline,
            outerErrorsInline: $outerErrorsInline,
          }),
          clock: onChangeBrowser,
          fn: ({fieldsInline, outerErrorsInline}) => ({
            ...fieldsInline,
            [refName.current]: {
              ...fieldsInline[refName.current],
              changed: true,
              changedAfterOuterError: Boolean(outerErrorsInline[refName.current])
            },
          }),
          target: $fieldsInline
        });
        sample({
          source: combine({
            fieldsInline: $fieldsInline,
            outerErrorsInline: $outerErrorsInline,
          }),
          clock: onBlurBrowser,
          fn: ({fieldsInline, outerErrorsInline}) => ({
            ...fieldsInline, [refName.current]: {
              ...fieldsInline[refName.current],
              active: false,
              blurred: true,
              blurredAfterOuterError: Boolean(outerErrorsInline[refName.current])
            },
          }),
          target: $fieldsInline
        });

        setFieldState({field: refName.current, state: initialFieldState});

        return () => {
          $values.off(onChange);
        };
      }, []);

      const values = useStore<Values>($values);
      const errorsInline = useStore<ErrorsInline>($errorsInline);
      const outerErrorsInline = useStore<ErrorsInline>($outerErrorsInline);

      const value = getIn(values, nameProp);
      const innerError = errorsInline[nameProp];
      const outerError = outerErrorsInline[nameProp];
      const error = innerError || outerError;

      const fieldsState = useStore<FieldsInline>($fieldsInline);
      const fieldState = fieldsState[nameProp] || initialFieldState;

      const formState = useStore<FormState>($form);

      const isShowInnerError = (formState.submitted || fieldState.blurred) && Boolean(innerError);
      const isShowOuterError = (!fieldState.changedAfterOuterError) && Boolean(outerError);
      const isShowError = isShowInnerError || isShowOuterError;

      return {
        input: {
          name: nameProp,
          value,
          onChange: onChangeBrowser,
          onFocus: onFocusBrowser,
          onBlur: onBlurBrowser,
        },
        form: formState,
        fieldState,
        error,
        innerError,
        outerError,
        isShowError,
        isShowOuterError,
        isShowInnerError,
        validate,
        setFieldState,
        setOrDeleteError,
        setOrDeleteOuterError,
        setOuterErrorsInlineState,
      };
    };
  }, []);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setSubmitted(true);

    validateForm();
    resetOuterFieldStateFlags();

    onSubmit({
      values: $values.getState(),
      errorsInline: $errorsInline.getState(),
      fieldsInline: $fieldsInline.getState(),
      form: $form.getState(),
    });
  }

  willMount.current = false;

  return {
    controller,
    handleSubmit,
    setValue,
    setOrDeleteError,
    setErrorsInlineState,
    setOrDeleteOuterError,
    setOuterErrorsInlineState,
    $values,
    $errorsInline,
    $outerErrorsInline,
    $fieldsInline,
    $form,
  };
};

export default useForm;
