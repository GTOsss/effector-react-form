import React, { useCallback, useEffect } from 'react';
import { useEvent, useStore } from 'effector-react';
import {
  FieldState,
  FormState,
  AnyState,
  Message,
  ControllerFieldHof,
  ControllerFieldInjectedResult,
  Field,
} from './ts';

type UseFieldParamsWithFactory<Value extends object, Meta> = {
  field: Field<Value>;
  meta?: Meta;
  resetUnmount?: boolean;
};

type UseFieldResultWithFactory<Value> = {
  controller: ControllerFieldHof;
  handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  setMeta: (meta: any) => void;
  setValue: (params: Value) => void;
  setOrDeleteError: (error: Message) => void;
  setFieldState: (fieldState: FieldState) => void;
  setOrDeleteOuterError: (error: Message) => void;
  validateForm: () => void;
  submit: (e: any) => void;
  reset: () => void;
};

const useField = <Value extends AnyState = AnyState, Meta = any>({
  field,
  meta,
  resetUnmount = true,
}: UseFieldParamsWithFactory<Value, Meta>): UseFieldResultWithFactory<Value> => {
  const { $value, $field, $fieldInline, $error, $outerError } = field;

  const setMeta = useEvent(field.setMeta);
  const setValue = useEvent(field.setValue);

  const setOrDeleteError = useEvent(field.setOrDeleteError);
  const setFieldState = useEvent(field.setFieldState);
  const setOrDeleteOuterError = useEvent(field.setOrDeleteOuterError);

  const validateForm = useEvent(field.validateField) as any;
  const submit = useEvent(field.submit) as any;
  const reset = useEvent(field.reset) as any;

  const onChangeFieldBrowser = useEvent(field.onChangeFieldBrowser);
  const onFocusFieldBrowser = useEvent(field.onFocusFieldBrowser);
  const onBlurFieldBrowser = useEvent(field.onBlurFieldBrowser);

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

  const controller = useCallback<ControllerFieldHof>(() => {
    return (): ControllerFieldInjectedResult => {
      const value = useStore($value);

      const innerError = useStore($error);

      const outerError = useStore($outerError);
      const error = outerError || innerError;

      const fieldInline = useStore<FieldState>($fieldInline);

      const { submitted: fieldSubmitted } = useStore<FormState>($field);

      const { hasError: fieldHasError } = useStore<FormState>($field);
      const { hasOuterError: fieldHasOuterError } = useStore<FormState>($field);
      const fieldState: FormState = {
        submitted: fieldSubmitted,
        hasError: fieldHasError,
        hasOuterError: fieldHasOuterError,
      };

      const isShowInnerError = (fieldState.submitted || fieldInline.blurred) && Boolean(innerError);
      const isShowOuterError = !fieldInline.changedAfterOuterError && Boolean(outerError);
      const isShowError = isShowInnerError || isShowOuterError;

      return {
        input: {
          value,
          onChange: (event) => onChangeFieldBrowser({ event }),
          onFocus: (event) => onFocusFieldBrowser({ event }),
          onBlur: (event) => onBlurFieldBrowser({ event }),
        },
        field: fieldState,
        meta,
        fieldInline,
        error,
        innerError,
        outerError,
        isShowError,
        isShowOuterError,
        isShowInnerError,
        setFieldState,
        setOrDeleteError,
        setOrDeleteOuterError,
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
    setOrDeleteError,
    setFieldState,
    setOrDeleteOuterError,
    validateForm,
    submit,
    reset,
  };
};

export default useField;
