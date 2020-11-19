import { Store, Event } from 'effector';
import React, { SyntheticEvent } from 'react';

export type AnyState = Record<string, any>;

export type ErrorsInline = Record<string, Message>;

export type FieldsInline = Record<string, FieldState>;

export type Message = string | null | undefined;

export type Messages<Values> = {
  [key in keyof Values]?: Values[key] extends AnyState ? Messages<Values[key]> : Message;
};

export type SubmitParams<Values> = {
  values: Values;
  errorsInline: ErrorsInline;
  fieldsInline: FieldsInline;
  form: FormState;
};

export type FormState = {
  submitted: boolean;
  hasError: boolean;
  hasOuterError: boolean;
};

export type FieldState = {
  _type: 'fieldMeta';
  active: boolean;
  touched: boolean;
  changed: boolean;
  blurred: boolean;
  touchedAfterOuterError: boolean;
  changedAfterOuterError: boolean;
  blurredAfterOuterError: boolean;
  validate?: (value: any) => string | undefined;
};

export type ControllerParams = {
  name: string;
  validate?: (value: any) => Message;
};

export type SetOrDeleteErrorParams = {
  field: string;
  error?: Message;
};

export type ControllerInjectedResult = {
  input: {
    name: string;
    value;
    onChange: (event: any) => void;
    onFocus: (event: any) => void;
    onBlur: (event: any) => void;
  };
  error: Message;
  innerError: Message;
  outerError: Message;
  isShowError: boolean;
  isShowOuterError: boolean;
  isShowInnerError: boolean;
  form: FormState;
  validate?: (value: any) => Message;
  setFieldState: ({ field: string, state: FieldState }) => void;
  setOrDeleteError: ({ field: string, error: Message }) => void;
  setOrDeleteOuterError: ({ field: string, error: Message }) => void;
  setOuterErrorsInlineState: (errors: ErrorsInline) => void;
  fieldState: FieldState;
};

export type Controller = () => ControllerInjectedResult;

export type ControllerHof = (a: ControllerParams) => Controller;

export type ResultHook<Values> = {
  controller: ControllerHof;
  handleSubmit: (e: SyntheticEvent<HTMLFormElement>) => void;
  setValue: Event<{ field: string; value: any }>;
  setOrDeleteError: Event<SetOrDeleteErrorParams>;
  setErrorsInlineState: (errorsInlineState: ErrorsInline) => void;
  setOrDeleteOuterError: ({ field: string, error: Message }) => void;
  setOuterErrorsInlineState: (errors: ErrorsInline) => void;
  $values: Store<Values>;
  $errorsInline: Store<ErrorsInline>;
  $outerErrorsInline: Store<ErrorsInline>;
  $form: Store<FormState>;
  $fieldsInline: Store<Record<string, FieldState>>;
  submit: Event<any>;
};

export type FormValidateParams<Values> = {
  values: Values;
  errorsInline: ErrorsInline;
};

export type FormValidate<Values> = (params: FormValidateParams<Values>) => ErrorsInline;

export type MapSubmit<Values, ResultValues> = (params: SubmitParams<Values>) => SubmitParams<ResultValues>;

export type OnSubmit<Values> = (params: SubmitParams<Values>) => void;

export type OnChange<Values> = OnSubmit<Values>;

export type UseFormParams<Values = any, MappedValues = any> =
  | undefined
  | {
      $values?: Store<Values>;
      $outerErrorsInline?: Store<ErrorsInline>;
      $errorsInline?: Store<ErrorsInline>;
      $fieldsInline?: Store<Record<string, FieldState>>;
      $form?: Store<FormState>;
      validate?: FormValidate<Values>;
      onSubmit?: OnSubmit<Values>;
      onChange?: OnChange<Values>;
      submit?: Event<any>;
      mapSubmit?: MapSubmit<Values, MappedValues>;
    };

export type UseErrorParams<Values> = {
  name: string;
  form: Form<Values>;
};

export type UseErrorResult = {
  inputValue: any;
  form: FormState;
  fieldState: FieldState;
  error: Message;
  innerError: Message;
  outerError: Message;
  isShowError: boolean;
  isShowOuterError: boolean;
  isShowInnerError: boolean;
};

export type FieldArrayParams<Values> = {
  name: string;
  fieldArray: FieldArray<Values>;
};

export type MapFieldsArrayCallbackParams = {
  formItemName: string;
  field: any;
  fields: Array<any>;
  index: number;
};

export type MapFieldArrayCallback = (params: MapFieldsArrayCallbackParams) => React.ReactNode;

export type ResultUseFieldArray = {
  map: (fn: MapFieldArrayCallback) => React.ReactNode[];
  remove: (index: number) => void;
  push: (value: any | Array<any>) => void;
};

export type CreateFormParams<Values = any, MappedValues = any> = {
  validate?: FormValidate<Values>;
  mapSubmit?: MapSubmit<Values, MappedValues>;
  onSubmit?: OnSubmit<Values>;
  onChange?: OnChange<Values>;
  initialValues?: Values;
};

export type Form<Values> = {
  $values: Store<Values>;
  $errorsInline: Store<ErrorsInline>;
  $outerErrorsInline: Store<ErrorsInline>;
  $form: Store<FormState>;
  $fieldsInline: Store<Record<string, FieldState>>;

  setValue: Event<any>;
  setOrDeleteError: Event<any>;
  setErrorsInlineState: Event<any>;
  setFieldState: Event<any>;
  setSubmitted: Event<any>;
  resetOuterFieldStateFlags: Event<any>;
  setOrDeleteOuterError: Event<any>;

  setOuterErrorsInlineState: Event<any>;
  validateForm: Event<any>;
  submit: Event<any>;

  onChangeFieldBrowser: Event<{ event: React.SyntheticEvent; name: string }>;
  onFocusFieldBrowser: Event<{ event: React.SyntheticEvent; name: string }>;
  onBlurFieldBrowser: Event<{ event: React.SyntheticEvent; name: string }>;
  fieldInit: Event<{ name: string; validate?: ControllerParams['validate'] }>;
};

export type FieldArray<Values> = {
  form: Form<Values>;
  push: Event<{ fieldName: string; value: any | any[] }>;
  remove: Event<{ fieldName: string; index: number }>;
};

export type CreateFieldArrayParams<Values> = {
  form: Form<Values>;
};

// declare const useFieldArray: <Values extends AnyState = AnyState>(
//   paramsFieldArray: FieldArrayParams,
// ) => ResultUseFieldArray<Values>;
//
// declare const setIn: <O extends AnyState = AnyState, V = any>(
//   object: O,
//   path: string,
//   value: V,
// ) => O;
//
// declare const deleteIn: <O extends AnyState = AnyState>(
//   object: O,
//   path: string,
//   removeEmpty: boolean = false,
//   inDeep: boolean = true,
// ) => O;
//
// declare const getIn: <O extends AnyState = AnyState, V = any>(
//   object: O,
//   path: string,
//   removeEmpty: boolean = false,
//   inDeep: boolean = true,
// ) => V = any;
//
// declare const makeNested: <O extends AnyState = AnyState, R extends AnyState>(
//   inlineMap: O,
// ) => R;
//
// declare const removeFromInlineMap: <O extends FieldsInline = FieldsInline, R extends FieldsInline = FieldsInline>(
//   inlineMap: O,
//   key: string,
// ) => R;
