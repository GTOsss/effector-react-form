import {
  combine,
  createEffect,
  createEvent as createEventNative,
  createStore as createStoreNative,
  forward,
  guard,
  is,
  sample,
} from 'effector';
import { SyntheticEvent } from 'react';
import { CreateFieldParams, Field, FieldState, FormState, Message, SubmitFieldParams } from '../ts';
import { initialFieldState, initialFormState } from '../default-states';
import { getValue } from '../utils/dom-helper';
import { setIn } from '../utils/object-manager';

const createField = <Value = any, Meta = any>({
  name,
  validate,
  mapSubmit = (params) => params,
  onSubmit: onSubmitArg,
  onSubmitGuardFn = () => true,
  onChange: onChangeArg,
  onChangeGuardFn = () => true,
  initialValue,
  initialMeta = {} as any,
  domain,
  resetOuterErrorBySubmit = true,
  resetOuterErrorByOnChange = true,
}: CreateFieldParams<Value, Value, Meta> = {}): Field<Value> => {
  const createEvent = domain ? domain.createEvent : createEventNative;
  const createStore = domain ? domain.createStore : createStoreNative;

  const setMeta = createEvent<Meta>(`Field_${name}_SetMeta`);

  const setValue = createEvent<Value>(`Field_${name}_SetValue`);
  const setOrDeleteError = createEvent<Message>(`Field_${name}_SetOrDeleteError`);
  const setFieldState = createEvent<FieldState>(`Field_${name}_SetFieldState`);
  const setSubmitted = createEvent<boolean>(`Field_${name}_SetSubmitted`);
  const resetOuterFieldStateFlags = createEvent(`Field_${name}_ResetOuterFieldStateFlags`);
  const resetOuterError = createEvent(`Field_${name}_ResetOuterError`);
  const setOrDeleteOuterError = createEvent<Message>(`Field_${name}_SetOrDeleteOuterError`);
  const reset = createEvent(`Field_${name}_Reset`);

  const validateField = createEvent(`Field_${name}_ValidateField`);
  const submit = createEvent(`Field_${name}_Submit`);
  const onSubmit = createEvent<SubmitFieldParams<Value, Meta>>(`Field_${name}_OnSubmit`);
  const onChange = createEvent<SubmitFieldParams<Value, Meta>>(`Field_${name}_OnChange`);

  const $value = createStore<Value>(initialValue || (null as Value), { name: `Field_${name}_$value` });
  const $error = createStore<Message>(null, { name: `Field_${name}_$errorsInline` });
  const $outerError = createStore<Message>(null, { name: `Field_${name}_$outerErrorsInline` });
  const $fieldInline = createStore<FieldState>(initialFieldState, { name: `Field_${name}_$fieldInline` });
  const $fieldInlineInitData = createStore(initialFieldState, { name: `Field_${name}_$fieldInlineInitData` });
  const $field = createStore<FormState>(initialFormState, { name: `Field_${name}_$form` });
  const $meta = createStore<Meta>(initialMeta, { name: `Field_${name}_$meta` });

  const $allFieldState = combine({
    value: $value,
    error: $error,
    outerError: $outerError,
    fieldInline: $fieldInline,
    field: $field,
    meta: $meta,
  });

  const onChangeFieldBrowser = createEvent<{ event: SyntheticEvent }>(`Field_${name}_OnChange`);
  const onChangeField = onChangeFieldBrowser.map<Value>(({ event }) => getValue(event));
  const onFocusFieldBrowser = createEvent<{ event: SyntheticEvent }>(`Field_${name}_OnFocus`);
  const onBlurFieldBrowser = createEvent<{ event: SyntheticEvent }>(`Field_${name}_OnBlur`);
  const resetOuterErrorOnByOnChangeFx = createEffect(async () => {
    resetOuterError();
  });

  const validateByValues = (params: SubmitFieldParams) => {
    const error = validate && validate(params);
    return error;
  };

  if (resetOuterErrorByOnChange) {
    sample({
      source: onChangeField,
      target: resetOuterErrorOnByOnChangeFx,
    });
  }

  forward({
    from: submit,
    to: [validateField, resetOuterFieldStateFlags],
  });

  if (resetOuterErrorBySubmit) {
    forward({
      from: submit,
      to: resetOuterError,
    });
  }

  sample({
    source: $allFieldState,
    clock: validateField,
    fn: (params) => validateByValues(params),
    target: $error,
  });
  sample({
    source: $allFieldState,
    clock: $value,
    fn: (params) => validateByValues(params),
    target: $error,
  });

  sample({
    source: $allFieldState,
    clock: guard({
      source: submit,
      filter: $allFieldState.map(onSubmitGuardFn),
    }),
    fn: mapSubmit,
    target: onSubmit,
  });

  sample({
    source: $allFieldState,
    clock: guard({
      source: onChangeFieldBrowser,
      filter: $allFieldState.map(onChangeGuardFn),
    }),
    fn: mapSubmit,
    target: onChange,
  });

  if (onSubmitArg) {
    if (is.effect(onSubmitArg) || is.event(onSubmitArg)) {
      forward({
        from: onSubmit,
        to: onSubmitArg,
      });
    } else if (typeof onSubmitArg === 'function') {
      onSubmit.watch(onSubmitArg);
    }
  }

  if (onChangeArg) {
    if (is.effect(onChangeArg) || is.event(onChangeArg)) {
      forward({
        from: onChange,
        to: onChangeArg,
      });
    } else if (typeof onChangeArg === 'function') {
      onChange.watch(onChangeArg);
    }
  }

  $value
    .on(setValue, (_, value) => value)
    .on(onChangeField, (_, value) => value)
    .reset(reset);

  $error.on(setOrDeleteError, (_, error) => error).reset(reset);

  $outerError
    .on(setOrDeleteOuterError, (_, error) => error)
    .on(resetOuterError, () => null)
    .reset(reset);

  $fieldInline
    .on(setOrDeleteOuterError, (state) => ({
      ...state,
      touchedAfterOuterError: false,
      changedAfterOuterError: false,
      blurredAfterOuterError: false,
    }))
    .on(resetOuterFieldStateFlags, (state) => ({
      ...state,
      touchedAfterOuterError: false,
      changedAfterOuterError: false,
      blurredAfterOuterError: false,
    }))
    .on(setFieldState, (_, newState) => newState);

  sample({
    source: $fieldInlineInitData,
    clock: reset,
    target: $fieldInline,
  });

  $field
    .on($outerError.updates, (state, outerError) => setIn(state, 'hasOuterError', Boolean(outerError)))
    .on(submit, (state) => setIn(state, 'submitted', true))
    .on(setSubmitted, (state, value) => setIn(state, 'submitted', value))
    .on($error.updates, (state, error) => setIn(state, 'hasError', Boolean(error)))
    .reset(reset);

  $meta.on(setMeta, (state, meta) => meta || state).reset(reset);

  // Field {

  sample({
    source: {
      fieldInline: $fieldInline,
      outerError: $outerError,
    },
    clock: onFocusFieldBrowser,
    fn: ({ fieldInline, outerError }) => ({
      ...fieldInline,
      active: true,
      touched: true,
      touchedAfterOuterError: Boolean(outerError),
    }),
    target: $fieldInline,
  });
  sample({
    source: {
      fieldInline: $fieldInline,
      outerError: $outerError,
    },
    clock: onChangeFieldBrowser,
    fn: ({ fieldInline, outerError }) => ({
      ...fieldInline,
      changed: true,
      changedAfterOuterError: Boolean(outerError),
    }),
    target: $fieldInline,
  });
  sample({
    source: {
      fieldInline: $fieldInline,
      outerError: $outerError,
    },
    clock: onBlurFieldBrowser,
    fn: ({ fieldInline }) => ({
      ...fieldInline,
      active: false,
      blurred: true,
      blurredAfterOuterError: fieldInline.touchedAfterOuterError,
    }),
    target: $fieldInline,
  });

  /// }

  return {
    setValue,
    setOrDeleteError,
    setFieldState,
    setSubmitted,
    resetOuterFieldStateFlags,
    resetOuterError,
    setOrDeleteOuterError,
    validateField,
    submit,
    reset,
    onSubmit,

    setMeta,

    $value,
    $error,
    $outerError,
    $fieldInline,
    $field,
    $meta,
    $allFieldState,

    onChangeFieldBrowser,
    onFocusFieldBrowser,
    onBlurFieldBrowser,

    name,
  };
};

export default createField;
