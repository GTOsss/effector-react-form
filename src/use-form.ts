import React, { useCallback, useEffect, useRef } from 'react';
import { useUnit, useStoreMap } from 'effector-react';
import {
  ControllerHof,
  ControllerInjectedResult,
  FieldState,
  FormState,
  Form,
  AnyState,
  ErrorsInline,
  FieldsInline,
  Message,
  SetOrDeleteErrorParams,
  SetValueParams,
  SetValuesParams,
  SetFieldStateParams,
  SetOrDeleteOuterErrorParams,
  FieldInitParams,
} from './ts';
import { getIn, makeConsistentKey } from './utils/object-manager';
import { initialFieldState } from './default-states';

type UseFormParamsWithFactory<Values extends object, Meta> = {
  form: Form<Values>;
  meta?: Meta;
  resetUnmount?: boolean;
};

type UseFormResultWithFactory<Values> = {
  controller: ControllerHof;
  handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  setMeta: (meta: any) => void;
  setValue: (params: SetValueParams) => void;
  setValues: (params: SetValuesParams<Values>) => void;
  setOrDeleteError: (params: SetOrDeleteErrorParams) => SetOrDeleteErrorParams;
  setFieldState: (params: SetFieldStateParams) => SetFieldStateParams;
  setOrDeleteOuterError: (params: SetOrDeleteOuterErrorParams) => SetOrDeleteOuterErrorParams;
  setOuterErrorsInlineState: (params: ErrorsInline) => ErrorsInline;
  validateForm: () => void;
  submit: (e: any) => void;
  reset: () => void;
  fieldInit: (params: FieldInitParams) => FieldInitParams;
};

const useForm = <Values extends AnyState = AnyState, Meta = any>({
  form,
  meta,
  resetUnmount = true,
}: UseFormParamsWithFactory<Values, Meta>): UseFormResultWithFactory<Values> => {
  const { $values, $form, $fieldsInline, $errorsInline, $outerErrorsInline } = form;

  const setMeta = useUnit(form.setMeta);
  const setValue = useUnit(form.setValue);
  const setValues = useUnit(form.setValues);

  const setOrDeleteError = useUnit(form.setOrDeleteError);
  const setFieldState = useUnit(form.setFieldState);
  const setOrDeleteOuterError = useUnit(form.setOrDeleteOuterError);

  const setOuterErrorsInlineState = useUnit(form.setOuterErrorsInlineState);
  const validateForm = useUnit(form.validateForm) as any;
  const submit = useUnit(form.submit) as any;
  const reset = useUnit(form.reset) as any;

  const onChangeFieldBrowser = useUnit(form.onChangeFieldBrowser);
  const onFocusFieldBrowser = useUnit(form.onFocusFieldBrowser);
  const onBlurFieldBrowser = useUnit(form.onBlurFieldBrowser);
  const fieldInit = useUnit(form.fieldInit);

  useEffect(() => {
    validateForm();

    return () => {
      if (resetUnmount) {
        reset();
      }
    };
  }, []);

  useEffect(() => {
    setMeta(meta);
  }, [meta]);

  const controller = useCallback<ControllerHof>(({ name: nameProp, validate, flat }) => {
    return (): ControllerInjectedResult => {
      const refName = useRef<string>(makeConsistentKey(nameProp));
      refName.current = makeConsistentKey(nameProp);
      const refFlat = useRef<boolean>(flat);
      refFlat.current = flat;

      useEffect(() => {
        fieldInit({ name: refName.current, validate, flat });
      }, []);

      const value = useStoreMap({
        store: $values,
        keys: [refName.current],
        fn: (values, [field]) => (flat ? values[field] : getIn(values, field)) ?? null,
      });

      const innerError = useStoreMap({
        store: $errorsInline,
        keys: [refName.current],
        fn: (errorsInline, [field]) => errorsInline[field] || null,
      });
      const outerError = useStoreMap<ErrorsInline, Message, [string]>({
        store: $outerErrorsInline,
        keys: [refName.current],
        fn: (outerErrorsInline, [field]) => outerErrorsInline[field] || null,
      });
      const error = outerError || innerError;

      const fieldState = useStoreMap<FieldsInline, FieldState, [string]>({
        store: $fieldsInline,
        keys: [refName.current],
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
          name: refName.current,
          value,
          onChange: (eventOrValue) =>
            onChangeFieldBrowser({ event: eventOrValue, name: refName.current, flat: refFlat.current }),
          onFocus: (event) => onFocusFieldBrowser({ event, name: refName.current }),
          onBlur: (event) => onBlurFieldBrowser({ event, name: refName.current }),
        },
        form: formState,
        meta,
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

  return {
    controller,
    handleSubmit,
    setMeta,
    setValue,
    setValues,
    setOrDeleteError,
    setFieldState,
    setOrDeleteOuterError,
    setOuterErrorsInlineState,
    validateForm,
    submit,
    reset,
    fieldInit,
  };
};

export default useForm;
