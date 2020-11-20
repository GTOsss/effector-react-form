import React, { useCallback, useEffect, useRef } from 'react';
import { useEvent } from 'effector-react';
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
} from './ts';
import { useStoreMap } from 'effector-react';
import { getIn, makeConsistentKey } from './utils/object-manager';
import { initialFieldState } from './default-states';

type UseFormParamsWithFactory<Values, Meta> = {
  form: Form<Values>;
  meta?: Meta;
};

type UseFormResultWithFactory = {
  controller: ControllerHof;
  handleSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
};

const useForm = <Values extends AnyState = AnyState, Meta = any>({
  form,
  meta,
}: UseFormParamsWithFactory<Values, Meta>): UseFormResultWithFactory => {
  const { $values, $form, $fieldsInline, $errorsInline, $outerErrorsInline } = form;

  const setMeta = useEvent(form.setMeta);

  const setOrDeleteError = useEvent(form.setOrDeleteError);
  const setFieldState = useEvent(form.setFieldState);
  const setOrDeleteOuterError = useEvent(form.setOrDeleteOuterError);

  const setOuterErrorsInlineState = useEvent(form.setOuterErrorsInlineState);
  const validateForm = useEvent(form.validateForm) as any;
  const submit = useEvent(form.submit) as any;

  const onChangeFieldBrowser = useEvent(form.onChangeFieldBrowser);
  const onFocusFieldBrowser = useEvent(form.onFocusFieldBrowser);
  const onBlurFieldBrowser = useEvent(form.onBlurFieldBrowser);
  const fieldInit = useEvent(form.fieldInit);

  useEffect(() => {
    validateForm();
  }, []);

  useEffect(() => {
    setMeta(meta);
  }, [meta]);

  const controller = useCallback<ControllerHof>(({ name: nameProp, validate }) => {
    return (): ControllerInjectedResult => {
      const refName = useRef<string>(makeConsistentKey(nameProp));
      refName.current = makeConsistentKey(nameProp);

      useEffect(() => {
        fieldInit({ name: refName.current, validate });
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
        meta: {},
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
