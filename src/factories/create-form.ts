import {
  combine,
  createEvent as createEventNative,
  createStore as createStoreNative,
  forward,
  guard,
  is,
  sample,
} from 'effector';
import { SyntheticEvent } from 'react';
import {
  CreateFormParams,
  ErrorsInline,
  FieldInitParams,
  FieldsInline,
  FieldState,
  Form,
  FormState,
  ResetOuterErrorParams,
  SetFieldStateParams,
  SetOrDeleteErrorParams,
  SetOrDeleteOuterErrorParams,
  SetValueParams,
  SetValuesParams,
  SubmitParams,
} from '../ts';
import { initialFieldState, initialFormState } from '../default-states';
import { getValue } from '../utils/dom-helper';
import {
  deleteIn,
  getIn,
  GetName,
  getName,
  getNameStr,
  GetNameStr,
  makeConsistentKey,
  setIn,
} from '../utils/object-manager';

const createForm = <Values extends object = any, Meta = any>({
  name,
  validate,
  mapSubmit = (params) => params,
  onSubmit: onSubmitArg,
  onSubmitGuardFn = ({ form }) => !form.hasError,
  onChange: onChangeArg,
  onChangeGuardFn = ({ form }) => !form.hasError,
  initialValues,
  initialMeta = {} as any,
  domain,
  resetOuterErrorsBySubmit = true,
  resetOuterErrorByOnChange = true,
}: CreateFormParams<Values, Values, Meta> = {}): Form<Values> => {
  const createEvent = domain ? domain.createEvent : createEventNative;
  const createStore = domain ? domain.createStore : createStoreNative;

  const setMeta = createEvent<Meta>(`Form_${name}_SetMeta`);

  const setValue = createEvent<SetValueParams>(`Form_${name}_SetValue`);
  const setValues = createEvent<SetValuesParams<Values>>(`Form_${name}_SetValues`);
  const setOrDeleteError = createEvent<SetOrDeleteErrorParams>(`Form_${name}_SetOrDeleteError`);
  const setErrorsInlineState = createEvent<ErrorsInline>(`Form_${name}_SetErrorsInlineState`);
  const setFieldState = createEvent<SetFieldStateParams>(`Form_${name}_SetFieldState`);
  const setSubmitted = createEvent<boolean>(`Form_${name}_SetSubmitted`);
  const resetOuterFieldStateFlags = createEvent(`Form_${name}_ResetOuterFieldStateFlags`);
  const resetOuterErrors = createEvent(`Form_${name}_ResetOuterErrors`);
  const resetOuterError = createEvent<ResetOuterErrorParams>(`Form_${name}_ResetOuterError`);
  const setOrDeleteOuterError = createEvent<SetOrDeleteOuterErrorParams>(`Form_${name}_SetOrDeleteOuterError`);
  const reset = createEvent(`Form_${name}_Reset`);

  const setOuterErrorsInlineState = createEvent<ErrorsInline>(`Form_${name}_SetOuterErrorsInlineState`);
  const validateForm = createEvent(`Form_${name}_ValidateForm`);
  const submit = createEvent(`Form_${name}_Submit`);
  const onSubmit = createEvent<SubmitParams<Values, Meta>>(`Form_${name}_OnSubmit`);
  const onChange = createEvent<SubmitParams<Values, Meta>>(`Form_${name}_OnChange`);

  const $values = createStore<Values>(initialValues || ({} as Values), { name: `Form_${name}_$values` });
  const $errorsInline = createStore<ErrorsInline>({}, { name: `Form_${name}_$errorsInline` });
  const $outerErrorsInline = createStore<ErrorsInline>({}, { name: `Form_${name}_$outerErrorsInline` });
  const $fieldsInline = createStore<FieldsInline>({}, { name: `Form_${name}_$fieldsInline` });
  const $form = createStore<FormState>(initialFormState, { name: `Form_${name}_$form` });
  const $meta = createStore<Meta>(initialMeta, { name: `Form_${name}_$meta` });

  const $allFormState = combine({
    values: $values,
    errorsInline: $errorsInline,
    outerErrorsInline: $outerErrorsInline,
    fieldsInline: $fieldsInline,
    form: $form,
    meta: $meta,
  });

  const onChangeFieldBrowser = createEvent<{ event: SyntheticEvent; name: string; flat?: boolean }>(
    `Form_${name}_OnChange`,
  );
  const onChangeField = onChangeFieldBrowser.map<{ value: any; name: string; flat?: boolean }>(
    ({ name, event, flat }) => ({
      value: getValue(event),
      name,
      flat,
    }),
  );
  const onFocusFieldBrowser = createEvent<{ event: SyntheticEvent; name: string }>(`Form_${name}_OnFocus`);
  const onBlurFieldBrowser = createEvent<{ event: SyntheticEvent; name: string }>(`Form_${name}_OnBlur`);
  const fieldInit = createEvent<FieldInitParams>(`Form_${name}_fieldInit`);

  const validateByValues = ({ values, fieldsInline, ...rest }: SubmitParams) => {
    const errorsInlineState = {};

    Object.entries<FieldState>(fieldsInline).forEach(([name, { validate }]) => {
      const error = validate && validate(getIn(values, name));
      if (error) {
        errorsInlineState[name] = validate && validate(getIn(values, name));
      }
    });

    if (validate) {
      const formLevelErrorsInlineState = validate({ ...rest, values, errorsInline: errorsInlineState, fieldsInline });
      Object.entries(formLevelErrorsInlineState).forEach(([name, error]) => {
        if (error) {
          errorsInlineState[name] = error;
        } else {
          delete errorsInlineState[name];
        }
      });
    }

    return errorsInlineState;
  };

  if (resetOuterErrorByOnChange) {
    sample({
      source: onChangeField,
      fn: ({ name }) => name,
      target: resetOuterError,
    });
  }

  forward({
    from: submit,
    to: [validateForm, resetOuterFieldStateFlags],
  });

  if (resetOuterErrorsBySubmit) {
    forward({
      from: submit,
      to: resetOuterErrors,
    });
  }

  sample({
    source: resetOuterErrors,
    fn: () => ({}),
    target: $outerErrorsInline,
  });

  sample({
    source: $allFormState,
    clock: validateForm,
    fn: (params) => validateByValues(params),
    target: $errorsInline,
  });
  sample({
    source: $allFormState,
    clock: $values,
    fn: (params) => validateByValues(params),
    target: $errorsInline,
  });

  sample({
    source: $allFormState,
    clock: guard({
      source: submit,
      filter: $allFormState.map(onSubmitGuardFn),
    }),
    fn: mapSubmit,
    target: onSubmit,
  });

  sample({
    source: $allFormState,
    clock: guard({
      source: onChangeFieldBrowser,
      filter: $allFormState.map(onChangeGuardFn),
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

  $values
    .on(setValue, (state, { field, value }) => setIn(state, field, value))
    .on(setValues, (_, values) => values)
    .on(onChangeField, (state, { value, name, flat }) =>
      flat ? { ...state, [name]: value } : setIn(state, name, value),
    )
    .reset(reset);

  $errorsInline
    .on(setOrDeleteError, (state, { field, error }) =>
      error ? { ...state, [makeConsistentKey(field)]: error } : deleteIn(state, field, false, false),
    )
    .on(setErrorsInlineState, (_, errorsInline) => errorsInline)
    .reset(reset);

  $outerErrorsInline
    .on(setOrDeleteOuterError, (state, { field, error }) =>
      error ? { ...state, [makeConsistentKey(field)]: error } : deleteIn(state, field, false, false),
    )
    .on(setOuterErrorsInlineState, (_, errorsInline) => errorsInline)
    .on(resetOuterError, (errors, field) => deleteIn(errors, field, false, false))
    .reset(reset);

  $fieldsInline
    .on(setOrDeleteOuterError, (state, { field }) => ({
      ...state,
      [makeConsistentKey(field)]: {
        ...state[makeConsistentKey(field)],
        touchedAfterOuterError: false,
        changedAfterOuterError: false,
        blurredAfterOuterError: false,
      },
    }))
    .on(resetOuterFieldStateFlags, (state) => {
      const newState = {};
      Object.entries<FieldState>(state).forEach(
        ([field, state]) =>
          (newState[field] = {
            ...state,
            touchedAfterOuterError: false,
            changedAfterOuterError: false,
            blurredAfterOuterError: false,
          }),
      );
      return newState;
    })
    .on(setFieldState, (state, { field, state: fieldState }) => {
      return { ...state, [makeConsistentKey(field)]: fieldState };
    })
    .on(fieldInit, (state, { name, validate, flat }) =>
      state[flat ? name : makeConsistentKey(name)]
        ? {
            ...state,
            [flat ? name : makeConsistentKey(name)]: {
              ...state[flat ? name : makeConsistentKey(name)],
              ...initialFieldState,
              validate,
            },
          }
        : { ...state, [flat ? name : makeConsistentKey(name)]: { ...initialFieldState, validate } },
    )
    .reset(reset);

  $form
    .on($outerErrorsInline.updates, (state, outerErrors) =>
      setIn(state, 'hasOuterError', Boolean(Object.keys(outerErrors).length)),
    )
    .on(submit, (state) => setIn(state, 'submitted', true))
    .on(setSubmitted, (state, value) => setIn(state, 'submitted', value))
    .on($errorsInline.updates, (state, errorsInline) =>
      setIn(state, 'hasError', Boolean(Object.keys(errorsInline).length)),
    )
    .reset(reset);

  $meta.on(setMeta, (state, meta) => meta || state).reset(reset);

  /// Field {

  sample({
    source: {
      fieldsInline: $fieldsInline,
      outerErrorsInline: $outerErrorsInline,
    },
    clock: onFocusFieldBrowser,
    fn: ({ fieldsInline, outerErrorsInline }, { name }) => ({
      ...fieldsInline,
      [name]: {
        ...fieldsInline[name],
        active: true,
        touched: true,
        touchedAfterOuterError: Boolean(outerErrorsInline[name]),
      },
    }),
    target: $fieldsInline,
  });
  sample({
    source: {
      fieldsInline: $fieldsInline,
      outerErrorsInline: $outerErrorsInline,
    },
    clock: onChangeFieldBrowser,
    fn: ({ fieldsInline, outerErrorsInline }, { name }) => ({
      ...fieldsInline,
      [name]: {
        ...fieldsInline[name],
        changed: true,
        changedAfterOuterError: Boolean(outerErrorsInline[name]),
      },
    }),
    target: $fieldsInline,
  });
  sample({
    source: {
      fieldsInline: $fieldsInline,
      outerErrorsInline: $outerErrorsInline,
    },
    clock: onBlurFieldBrowser,
    fn: ({ fieldsInline, outerErrorsInline }, { name }) => ({
      ...fieldsInline,
      [name]: {
        ...fieldsInline[name],
        active: false,
        blurred: true,
        blurredAfterOuterError: Boolean(outerErrorsInline[name]),
      },
    }),
    target: $fieldsInline,
  });

  /// }

  return {
    setValue,
    setValues,
    setOrDeleteError,
    setErrorsInlineState,
    setFieldState,
    setSubmitted,
    resetOuterFieldStateFlags,
    resetOuterErrors,
    setOrDeleteOuterError,
    setOuterErrorsInlineState,
    validateForm,
    submit,
    reset,
    onSubmit,

    setMeta,

    $values,
    $errorsInline,
    $outerErrorsInline,
    $fieldsInline,
    $form,
    $meta,
    $allFormState,

    onChangeFieldBrowser,
    onFocusFieldBrowser,
    onBlurFieldBrowser,
    fieldInit,

    getName: getName as GetName<Values>,
    getNameStr: getNameStr as GetNameStr<Values>,

    name,
  };
};

export default createForm;
