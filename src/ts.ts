import { Store, Event, Domain } from 'effector';
import React from 'react';

export type AnyState = Record<string, any>;

export type ErrorsInline = Record<string, Message>;

export type FieldsInline = Record<string, FieldState>;

export type Message = string | null | undefined;

export type Messages<Values> = {
  [key in keyof Values]?: Values[key] extends AnyState ? Messages<Values[key]> : Message;
};

export type SubmitParams<Values = any, Meta = any> = {
  values: Values;
  errorsInline: ErrorsInline;
  fieldsInline: FieldsInline;
  form: FormState;
  meta: Meta;
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

export type SetValueParams = {
  field: string;
  value: any;
};

export type SetOrDeleteErrorParams = {
  field: string;
  error?: Message;
};

export type SetFieldStateParams = {
  field: string;
  state: FieldState;
};

export type SetOrDeleteOuterErrorParams = {
  field: string;
  error: Message;
};

export type FieldInitParams = {
  name: string;
  validate?: ControllerParams['validate'];
};

export type ControllerInjectedResult<Meta = any> = {
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

export type Controller<Meta = any> = () => ControllerInjectedResult<Meta>;

export type ControllerHof<Meta = any> = (a: ControllerParams) => Controller<Meta>;

export type FormValidateParams<Values> = {
  values: Values;
  errorsInline: ErrorsInline;
};

export type FormValidate<Values> = (params: FormValidateParams<Values>) => ErrorsInline;

export type MapSubmit<Values, ResultValues, Meta = any> = (
  params: SubmitParams<Values, Meta>,
) => SubmitParams<ResultValues, Meta>;

export type OnSubmit<Values, Meta = any> = (params: SubmitParams<Values, Meta>) => void;

export type OnChange<Values, Meta = any> = OnSubmit<Values, Meta>;

export type UseErrorParams<Values> = {
  name: string;
  form: Form<Values>;
};

export type UseErrorResult<Meta = any> = {
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

export type CreateFormParams<Values = any, MappedValues = any, Meta = any> = {
  validate?: FormValidate<Values>;
  mapSubmit?: MapSubmit<Values, MappedValues, Meta>;
  onSubmit?: OnSubmit<Values, Meta>;
  onChange?: OnChange<Values, Meta>;
  initialValues?: Values;
  initialMeta?: Meta;
  domain?: Domain;
};

export type Form<Values = any, Meta = any> = {
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
  reset: Event<any>;

  setMeta: Event<any>;

  setOuterErrorsInlineState: Event<any>;
  validateForm: Event<any>;
  submit: Event<any>;
  onSubmit: Event<SubmitParams<Values, Meta>>;

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
  domain?: Domain;
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
