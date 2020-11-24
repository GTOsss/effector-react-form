import {
  combine,
  createEvent as createEventNative,
  createStore as createStoreNative,
  forward,
  is,
  sample,
} from 'effector';
import { SyntheticEvent } from 'react';
import {
  ControllerParams,
  CreateFormParams,
  ErrorsInline,
  FieldsInline,
  FieldState,
  Form,
  FormState,
  Message,
  SetOrDeleteErrorParams,
  SubmitParams,
} from '../ts';
import { initialFieldState, initialFormState } from '../default-states';
import { getValue } from '../utils/dom-helper';
import { deleteIn, getIn, setIn } from '../utils/object-manager';

const createForm = <Values = any, Meta = any>({
  validate,
  mapSubmit = (params) => params,
  onSubmit: onSubmitArg,
  onChange: onChangeArg,
  initialValues,
  initialMeta = {},
  domain,
}: CreateFormParams<Values> = {}): Form<Values> => {
  const createEvent = domain ? domain.createEvent : createEventNative;
  const createStore = domain ? domain.createStore : createStoreNative;

  const setMeta = createEvent<Meta>(`Form_SetValue`);

  const setValue = createEvent<{ field: string; value: any }>(`Form_SetValue`);
  const setOrDeleteError = createEvent<SetOrDeleteErrorParams>(`Form_SetOrDeleteError`);
  const setErrorsInlineState = createEvent<ErrorsInline>(`Form_SetErrorsInlineState`);
  const setFieldState = createEvent<{ field: string; state: FieldState }>(`Form_SetFieldState`);
  const setSubmitted = createEvent<boolean>(`Form_SetSubmitted`);
  const resetOuterFieldStateFlags = createEvent('Form_ResetOuterFieldStateFlags');
  const setOrDeleteOuterError = createEvent<{ field: string; error: Message }>('Form_SetOrDeleteOuterError');

  const setOuterErrorsInlineState = createEvent<ErrorsInline>('Form_SetOuterErrorsInlineState');
  const validateForm = createEvent('Form_ValidateForm');
  const submit = createEvent('Form_Submit');
  const onSubmit = createEvent<SubmitParams<Values, Meta>>('Form_OnSubmit');
  const onChange = createEvent<SubmitParams<Values, Meta>>('Form_OnChange');

  const $values = createStore<Values>(initialValues || ({} as Values));
  const $errorsInline = createStore<ErrorsInline>({});
  const $outerErrorsInline = createStore<ErrorsInline>({});
  const $fieldsInline = createStore<FieldsInline>({});
  const $form = createStore<FormState<Meta>>(initialFormState);
  const $meta = createStore<Meta>(initialMeta);

  const $allFormState = combine({
    values: $values,
    errorsInline: $errorsInline,
    outerErrorsInline: $outerErrorsInline,
    fieldsInline: $fieldsInline,
    form: $form,
    meta: $meta,
  });

  const onChangeFieldBrowser = createEvent<{ event: SyntheticEvent; name: string }>(`Form_OnChange`);
  const onChangeField = onChangeFieldBrowser.map<{ value: any; name: string }>(({ name, event }) => ({
    value: getValue(event),
    name,
  }));
  const onFocusFieldBrowser = createEvent<{ event: SyntheticEvent; name: string }>(`Form_OnFocus`);
  const onBlurFieldBrowser = createEvent<{ event: SyntheticEvent; name: string }>(`Form_OnBlur`);
  const fieldInit = createEvent<{ name: string; validate?: ControllerParams['validate'] }>(`Form_fieldInit`);

  const validateByValues = ({ values, fieldsInline }) => {
    const errorsInlineState = {};

    Object.entries<FieldState>(fieldsInline).forEach(([name, { validate }]) => {
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
  };

  forward({
    from: submit,
    to: [validateForm, resetOuterFieldStateFlags],
  });

  sample({
    source: $allFormState,
    clock: submit,
    fn: mapSubmit,
    target: onSubmit,
  });

  sample({
    source: $allFormState,
    clock: onChangeFieldBrowser,
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

  sample({
    source: { values: $values, fieldsInline: $fieldsInline },
    clock: validateForm,
    fn: (params) => validateByValues(params),
    target: $errorsInline,
  });
  sample({
    source: { values: $values, fieldsInline: $fieldsInline },
    clock: $values,
    fn: (params) => validateByValues(params),
    target: $errorsInline,
  });

  $values
    .on(setValue, (state, { field, value }) => setIn(state, field, value))
    .on(onChangeField, (state, { value, name }) => setIn(state, name, value));

  $errorsInline
    .on(setOrDeleteError, (state, { field, error }) =>
      error ? { ...state, [field]: error } : deleteIn(state, field, false, false),
    )
    .on(setErrorsInlineState, (_, errorsInline) => errorsInline);

  $outerErrorsInline
    .on(setOrDeleteOuterError, (state, { field, error }) =>
      error ? { ...state, [field]: error } : deleteIn(state, field, false, false),
    )
    .on(setOuterErrorsInlineState, (_, errorsInline) => errorsInline);

  $fieldsInline
    .on(setOrDeleteOuterError, (state, { field }) => ({
      ...state,
      [field]: {
        ...state[field],
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
      return { ...state, [field]: fieldState };
    })
    .on(fieldInit, (state, { name, validate }) =>
      state[name] ? state : { ...state, [name]: { ...initialFieldState, validate } },
    );

  $form
    .on($outerErrorsInline.updates, (state, outerErrors) =>
      setIn(state, 'hasOuterError', Boolean(Object.keys(outerErrors).length)),
    )
    .on(submit, (state) => setIn(state, 'submitted', true))
    .on(setSubmitted, (state, value) => setIn(state, 'submitted', value))
    .on($errorsInline.updates, (state, errorsInline) =>
      setIn(state, 'hasError', Boolean(Object.keys(errorsInline).length)),
    );

  $meta.on(setMeta, (state, meta) => meta || state);

  /// Field {

  sample({
    source: combine({
      fieldsInline: $fieldsInline,
      outerErrorsInline: $outerErrorsInline,
    }),
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
    source: combine({
      fieldsInline: $fieldsInline,
      outerErrorsInline: $outerErrorsInline,
    }),
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
    source: combine({
      fieldsInline: $fieldsInline,
      outerErrorsInline: $outerErrorsInline,
    }),
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
    setOrDeleteError,
    setErrorsInlineState,
    setFieldState,
    setSubmitted,
    resetOuterFieldStateFlags,
    setOrDeleteOuterError,
    setOuterErrorsInlineState,
    validateForm,
    submit,
    onSubmit,

    setMeta,

    $values,
    $errorsInline,
    $outerErrorsInline,
    $fieldsInline,
    $form,

    onChangeFieldBrowser,
    onFocusFieldBrowser,
    onBlurFieldBrowser,
    fieldInit,
  };
};

export default createForm;
