import React, { useCallback, useEffect, useRef } from 'react';
import {
  ControllerHof,
  ControllerInjectedResult,
  FieldState,
  FormState,
  FormFactory,
  AnyState,
  ErrorsInline,
  FieldsInline,
  Message,
} from '../ts';
import { useStoreMap } from 'effector-react';
import { getIn, makeConsistentKey } from '../utils/object-manager';
import { initialFieldState } from '../default-states';

type UseFormParamsWithFactory<Values> = {
  form: FormFactory<Values>;
};

type UseFormResultWithFactory = {
  controller: ControllerHof;
  handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
};

const useForm = <Values extends AnyState = AnyState>({
  form,
}: UseFormParamsWithFactory<Values>): UseFormResultWithFactory => {
  const {
    $values,
    $form,
    $fieldsInline,
    $errorsInline,
    $outerErrorsInline,

    setValue,
    setOrDeleteError,
    setErrorsInlineState,
    setFieldState,
    setSubmitted,
    resetOuterFieldStateFlags,
    setOrDeleteOuterError,

    setOuterErrorsInlineState,
    validateForm,
    submit,

    onChangeFieldBrowser,
    onFocusFieldBrowser,
    onBlurFieldBrowser,
    fieldInit,
  } = form;

  useEffect(() => {
    validateForm();
  }, []);

  const controller = useCallback<ControllerHof>(({ name: nameProp, validate }) => {
    return (): ControllerInjectedResult => {
      const refName = useRef<string>(makeConsistentKey(nameProp));
      refName.current = makeConsistentKey(nameProp);

      useEffect(() => {
        fieldInit({ name: refName.current });
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
          onChange: (eventOrValue) => onChangeFieldBrowser({ event: eventOrValue, name: refName.current }),
          onFocus: (event) => onFocusFieldBrowser({ event, name: refName.current }),
          onBlur: (event) => onBlurFieldBrowser({ event, name: refName.current }),
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

  return {
    controller,
    handleSubmit,
  };
};

export default useForm;
