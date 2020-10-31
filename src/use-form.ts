import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ControllerHof,
  ControllerInjectedResult,
  FieldState,
  FormState,
  ResultHook,
  UseFormParams,
  AnyState,
  ErrorsInline,
  FieldsInline,
  SetOrDeleteErrorParams,
  Message,
} from '../index';
import { createStore, createEvent, sample, combine } from 'effector';
import { useStoreMap } from 'effector-react';
import { getValue } from './utils/dom-helper';
import { setIn, getIn, deleteIn, makeConsistentKey } from './utils/object-manager';

export const initialFieldState: FieldState = {
  _type: 'fieldMeta',
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
  submit: submitProp,
  mapSubmit,
}: UseFormParams<Values> = {}): ResultHook<Values> => {
  const willMount = useRef(true);

  const setValue = useMemo(() => createEvent<{ field: string; value: any }>(`hookForm_SetValue`), []);
  const setOrDeleteError = useMemo(() => createEvent<SetOrDeleteErrorParams>(`hookForm_SetOrDeleteError`), []);
  const setErrorsInlineState = useMemo(() => createEvent<ErrorsInline>(`hookForm_SetErrorsInlineState`), []);
  const setFieldState = useMemo(() => createEvent<{ field: string; state: FieldState }>(`hookForm_SetFieldState`), []);
  const setSubmitted = useMemo(() => createEvent<boolean>(`hookForm_SetSubmitted`), []);
  const resetOuterFieldStateFlags = useMemo(() => createEvent('hookForm_ResetOuterFieldStateFlags'), []);
  const setOrDeleteOuterError = useMemo(
    () => createEvent<{ field: string; error: Message }>('hookForm_SetOrDeleteOuterError'),
    [],
  );
  const setOuterErrorsInlineState = useMemo(() => createEvent<ErrorsInline>('hookForm_SetOuterErrorsInlineState'), []);
  const validateForm = useMemo(() => createEvent('hookForm_ValidateForm'), []);
  const submit = useMemo(() => submitProp || createEvent('hookForm_Submit'), []);

  const $values = useMemo(() => $valuesProp || createStore<Values>({} as Values), []);
  const $errorsInline = useMemo(() => $errorsInlineProp || createStore<ErrorsInline>({}), []);
  const $outerErrorsInline = useMemo(() => $outerErrorsInlineProp || createStore<ErrorsInline>({}), []);
  const $fieldsInline = useMemo(() => $fieldsInlineProp || createStore<FieldsInline>({}), []);
  const $form = useMemo(() => $formProp || createStore<FormState>(initialFormState), []);

  if (willMount.current) {
    $fieldsInline.on(setFieldState, (state, { field, state: fieldState }) => {
      return { ...state, [field]: fieldState };
    });
  }

  const validateByValues = useCallback((values) => {
    const errorsInlineState = {};

    Object.entries($fieldsInline.getState()).forEach(([name, { validate }]) => {
      const error = validate && validate(getIn(values, name));
      if (error) {
        errorsInlineState[name] = validate && validate(getIn(values, name));
      }
    });

    if (validate) {
      const formLevelErrorsInlineState = validate({ values, errorsInline: errorsInlineState });
      Object.entries(formLevelErrorsInlineState).forEach(([name, error]) => {
        if (error) {
          errorsInlineState[name] = error;
        } else {
          delete errorsInlineState[name];
        }
      });
    }

    return errorsInlineState;
  }, []);

  useEffect(() => {
    sample({
      source: $values,
      clock: validateForm,
      fn: (values) => validateByValues(values),
      target: $errorsInline,
    });
    sample({
      source: $values,
      fn: (values) => validateByValues(values),
      target: $errorsInline,
    });

    $values.on(setValue, (state, { field, value }) => setIn(state, field, value));

    $errorsInline.on(setOrDeleteError, (state, { field, error }) =>
      error ? { ...state, [field]: error } : deleteIn(state, field, false, false),
    );

    $errorsInline.on(setErrorsInlineState, (_, errorsInline) => errorsInline);

    $outerErrorsInline.on(setOrDeleteOuterError, (state, { field, error }) =>
      error ? { ...state, [field]: error } : deleteIn(state, field, false, false),
    );

    $outerErrorsInline.on(setOuterErrorsInlineState, (_, errorsInline) => errorsInline);

    $fieldsInline.on(setOrDeleteOuterError, (state, { field }) => ({
      ...state,
      [field]: {
        ...state[field],
        touchedAfterOuterError: false,
        changedAfterOuterError: false,
        blurredAfterOuterError: false,
      },
    }));

    $fieldsInline.on(resetOuterFieldStateFlags, (state) => {
      const newState = {};
      Object.entries(state).forEach(
        ([field, state]) =>
          (newState[field] = {
            ...state,
            touchedAfterOuterError: false,
            changedAfterOuterError: false,
            blurredAfterOuterError: false,
          }),
      );
      return newState;
    });

    $form.on($outerErrorsInline.updates, (state, outerErrors) => ({
      ...state,
      hasOuterError: Boolean(Object.keys(outerErrors).length),
    }));

    $form.on(setSubmitted, (state, value) => setIn(state, 'submitted', value));

    $form.on($errorsInline.updates, (state, errorsInline) =>
      setIn(state, 'hasError', Boolean(Object.keys(errorsInline).length)),
    );

    validateForm();

    submit.watch(() => {
      setSubmitted(true);

      validateForm();
      resetOuterFieldStateFlags();

      const submitParams = {
        values: $values.getState(),
        errorsInline: $errorsInline.getState(),
        fieldsInline: $fieldsInline.getState(),
        form: $form.getState(),
      };

      onSubmit(mapSubmit ? mapSubmit(submitParams) : submitParams);
    });

    return () => {
      $values.off(setValue);

      $errorsInline.off(setOrDeleteError);
      $errorsInline.off(setErrorsInlineState);

      $form.off(setOrDeleteError);
      $form.off(setSubmitted);
      $form.off($errorsInline);
    };
  }, []);

  const controller = useCallback<ControllerHof>(({ name: nameProp, validate }) => {
    return (): ControllerInjectedResult => {
      const refName = useRef<string>(makeConsistentKey(nameProp));
      refName.current = makeConsistentKey(nameProp);

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

          if (mapSubmit) {
            const $mappedAllFormState = $allFormState.map(mapSubmit);
            $mappedAllFormState.watch(onChangeForm);
          } else {
            $allFormState.watch(onChangeForm);
          }
        }

        $values.on(onChange, (state, value) => setIn(state, refName.current, value));

        sample({
          source: combine({
            fieldsInline: $fieldsInline,
            outerErrorsInline: $outerErrorsInline,
          }),
          clock: onFocusBrowser,
          fn: ({ fieldsInline, outerErrorsInline }) => ({
            ...fieldsInline,
            [refName.current]: {
              ...fieldsInline[refName.current],
              active: true,
              touched: true,
              touchedAfterOuterError: Boolean(outerErrorsInline[refName.current]),
            },
          }),
          target: $fieldsInline,
        });
        sample({
          source: combine({
            fieldsInline: $fieldsInline,
            outerErrorsInline: $outerErrorsInline,
          }),
          clock: onChangeBrowser,
          fn: ({ fieldsInline, outerErrorsInline }) => ({
            ...fieldsInline,
            [refName.current]: {
              ...fieldsInline[refName.current],
              changed: true,
              changedAfterOuterError: Boolean(outerErrorsInline[refName.current]),
            },
          }),
          target: $fieldsInline,
        });
        sample({
          source: combine({
            fieldsInline: $fieldsInline,
            outerErrorsInline: $outerErrorsInline,
          }),
          clock: onBlurBrowser,
          fn: ({ fieldsInline, outerErrorsInline }) => ({
            ...fieldsInline,
            [refName.current]: {
              ...fieldsInline[refName.current],
              active: false,
              blurred: true,
              blurredAfterOuterError: Boolean(outerErrorsInline[refName.current]),
            },
          }),
          target: $fieldsInline,
        });

        if (!$fieldsInline.getState()[refName.current]) {
          setFieldState({ field: refName.current, state: { ...initialFieldState, validate } });
        }

        return () => {
          $values.off(onChange);
        };
      }, []);

      const value = useStoreMap<Values, any, [string]>({
        store: $values,
        keys: [nameProp],
        fn: (values, [field]) => getIn(values, field) || null,
      });

      const innerError = useStoreMap<ErrorsInline, Message, [string]>({
        store: $errorsInline,
        keys: [nameProp],
        fn: (errorsInline, [field]) => errorsInline[field] || null,
      });
      const outerError = useStoreMap<ErrorsInline, Message, [string]>({
        store: $outerErrorsInline,
        keys: [nameProp],
        fn: (outerErrorsInline, [field]) => outerErrorsInline[field] || null,
      });
      const error = innerError || outerError;

      const fieldState = useStoreMap<FieldsInline, FieldState, [string]>({
        store: $fieldsInline,
        keys: [nameProp],
        fn: (fieldsInline, [field]) => fieldsInline[field] || initialFieldState,
      });

      const formSubmitted = useStoreMap<FormState, boolean, []>({
        store: $form,
        keys: [],
        fn: (formState) => formState.submitted,
      });
      const formHasError = useStoreMap<FormState, boolean, []>({
        store: $form,
        keys: [],
        fn: (formState) => formState.hasError,
      });
      const formHasOuterError = useStoreMap<FormState, boolean, []>({
        store: $form,
        keys: [],
        fn: (formState) => formState.hasOuterError,
      });
      const formState: FormState = {
        submitted: formSubmitted,
        hasError: formHasError,
        hasOuterError: formHasOuterError,
      };

      const isShowInnerError = (formState.submitted || fieldState.blurred) && Boolean(innerError);
      const isShowOuterError = !fieldState.changedAfterOuterError && Boolean(outerError);
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

  const handleSubmit = useCallback((e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    submit();
  }, []);

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
    submit,
  };
};

export default useForm;
