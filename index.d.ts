import {Store, Event} from 'effector';
import {SyntheticEvent} from 'react';

type AnyState = Record<string, any>;

export type ErrorsInline = Record<string, Message>;

export type FieldsInline = Record<string, FieldState>

export type Message = string | null | undefined;

type Messages<Values> = {
  [key in keyof Values]?: Values[key] extends AnyState
    ? Messages<Values[key]> : Message;
};

export type SubmitParams<Values> = {
  values: Values,
  errors: Messages<Values>,
  errorsInline: ErrorsInline,
  fieldsInline: FieldsInline,
  form: FormState,
};

export type OnSubmit<Values> = (params: SubmitParams<Values>) => void;

export type FormState = {
  submitted: boolean,
  hasError: boolean,
  forcedError: boolean,
}

export type FieldState = {
  touched: boolean,
  changed: boolean,
  blurred: boolean,
  active: boolean,
};

export type ControllerParams = {
  name: string,
  validate?: (value: any) => Message,
};

export type SetOrDeleteErrorParams = {
  field: string,
  error?: Message,
  forced?: boolean,
};

export type ControllerInjectedResult = {
  input: {
    name: string,
    value,
    onChange: (event: any) => void,
    onFocus: (event: any) => void,
    onBlur: (event: any) => void,
  },
  error: Message,
  form: FormState,
  validate?: (value: any) => Message,
  setFieldState: ({field: string, state: FieldState}) => void;
  setOrDeleteError: ({field: string, error: Message}) => void;
  fieldState: FieldState,
};

export type Controller = () => ControllerInjectedResult;

export type ControllerHof = (a: ControllerParams) => Controller;

type ResultHook<Values> = {
  controller: ControllerHof,
  handleSubmit: (onSubmit: OnSubmit<Values>) => (e: SyntheticEvent<HTMLFormElement>) => void,
  setValue: Event<{field: string, value: any}>,
  setOrDeleteError: Event<SetOrDeleteErrorParams>,
  setErrorsInlineState: (errorsInlineState: ErrorsInline) => void,
  $values: Store<Values>,
  $errorsInline: Store<Record<string, Message>>,
  $errors: Store<Messages<Values>>,
  $form: Store<FormState>,
  $fieldsInline: Store<Record<string, FieldState>>
}

export type FormValidate<Values> = ({values: Values, errorsInline: ErrorsInline}) => ErrorsInline;

type UseFormParams<Values> = undefined | {
  $values?: Store<Values>
  $errorsInline?: Store<Record<string, Message>>,
  $fieldsInline?: Store<Record<string, FieldState>>,
  $form?: Store<FormState>,
  validate?: FormValidate,
}

declare const useForm: <Values extends AnyState = AnyState>(
  params?: UseFormParams<Values>,
) => ResultHook<Values>;

declare const setIn: <O extends AnyState = AnyState, V = any>(
  object: O,
  path: string,
  value: V,
) => O;

declare const deleteIn: <O extends AnyState = AnyState>(
  object: O,
  path: string,
  removeEmpty: boolean = false,
  inDeep: boolean = true,
) => O;

declare const getIn: <O extends AnyState = AnyState, V = any>(
  object: O,
  path: string,
  removeEmpty: boolean = false,
  inDeep: boolean = true,
) => V = any;

declare const mapInlineToMapNested: <O extends AnyState = AnyState, R extends AnyState>(
  inlineMap: O,
) => R;
