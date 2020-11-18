import { SyntheticEvent } from 'react';
import { combine, createEvent, createStore, sample } from 'effector';
import {
  CreateFormParams,
  FormFactory,
  ErrorsInline,
  FieldsInline,
  FieldState,
  FormState,
  Message,
  SetOrDeleteErrorParams,
} from '../ts';
import { initialFormState, initialFieldState } from '../default-states';
import { setIn, getIn, deleteIn } from '../utils/object-manager';
import { getValue } from '../utils/dom-helper';

export const createForm = <Values>({
  validate,
  mapSubmit,
  onSubmit,
  onChange: onChangeForm,
}: CreateFormParams<Values>): FormFactory<Values> => {
  const setValue = createEvent<{ field: string; value: any }>(`hookForm_SetValue`);
  const setOrDeleteError = createEvent<SetOrDeleteErrorParams>(`hookForm_SetOrDeleteError`);
  const setErrorsInlineState = createEvent<ErrorsInline>(`hookForm_SetErrorsInlineState`);
  const setFieldState = createEvent<{ field: string; state: FieldState }>(`hookForm_SetFieldState`);
  const setSubmitted = createEvent<boolean>(`hookForm_SetSubmitted`);
  const resetOuterFieldStateFlags = createEvent('hookForm_ResetOuterFieldStateFlags');
  const setOrDeleteOuterError = createEvent<{ field: string; error: Message }>('hookForm_SetOrDeleteOuterError');

  const setOuterErrorsInlineState = createEvent<ErrorsInline>('hookForm_SetOuterErrorsInlineState');
  const validateForm = createEvent('hookForm_ValidateForm');
  const submit = createEvent('hookForm_Submit');

  const $values = createStore<Values>({} as Values);
  const $errorsInline = createStore<ErrorsInline>({});
  const $outerErrorsInline = createStore<ErrorsInline>({});
  const $fieldsInline = createStore<FieldsInline>({});
  const $form = createStore<FormState>(initialFormState);

  const onChangeFieldBrowser = createEvent<{ event: SyntheticEvent; name: string }>(`hookForm_OnChange`);
  const onChangeField = onChangeFieldBrowser.map<{ value: any; name: string }>((eventOrValue) => ({
    value: getValue(eventOrValue),
    name,
  }));
  const onFocusFieldBrowser = createEvent<{ event: SyntheticEvent; name: string }>(`hookForm_OnFocus`);
  const onBlurFieldBrowser = createEvent<{ event: SyntheticEvent; name: string }>(`hookForm_OnBlur`);
  const fieldInit = createEvent<{ name: string }>(`hookForm_fieldInit`);

  const validateByValues = (values) => {
    const errorsInlineState = {};

    Object.entries<FieldState>($fieldsInline.getState()).forEach(([name, { validate }]) => {
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
    .on(fieldInit, (state, { name }) => (state[name] ? { ...state, [name]: initialFieldState } : state));

  $form.on($outerErrorsInline.updates, (state, outerErrors) => ({
    ...state,
    hasOuterError: Boolean(Object.keys(outerErrors).length),
  }));

  $form.on(setSubmitted, (state, value) => setIn(state, 'submitted', value));

  $form.on($errorsInline.updates, (state, errorsInline) =>
    setIn(state, 'hasError', Boolean(Object.keys(errorsInline).length)),
  );

  /// Field {

  if (onChangeForm) {
    const $allFormState = sample({
      source: {
        values: $values,
        errorsInline: $errorsInline,
        outerErrorsInline: $outerErrorsInline,
        fieldsInline: $fieldsInline,
        form: $form,
      },
      clock: onChangeFieldBrowser,
    });

    if (mapSubmit) {
      const $mappedAllFormState = $allFormState.map(mapSubmit);
      $mappedAllFormState.watch(onChangeForm);
    } else {
      $allFormState.watch(onChangeForm);
    }
  }

  $values.on(onChangeField, (state, { value, name }) => setIn(state, name, value));

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
