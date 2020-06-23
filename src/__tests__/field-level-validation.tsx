import {Controller, OnSubmit} from '../../index';
import React from 'react';
import {useForm} from '../index';
import {render, screen, fireEvent} from '@testing-library/react';

interface Values {
  username?: string,
  profile?: {
    firstName?: string,
    lastName?: string,
  }
}

interface InputProps {
  controller: Controller,
  label: string,
}

const validateRequired = (value) => value ? undefined : 'Field is required';

const Input: React.FC<InputProps> = ({
  controller,
  label,
}) => {
  const {input, fieldState, form, error} = controller();

  const isShowError = error && (form.submitted || form.hasOuterError || fieldState.blurred);

  return (
    <div role="wrapper-for-input" className="input-wrap">
      <label>{label}</label>
      <input
        {...input}
        value={input.value || ''}
        role="textbox"
        className={`input${isShowError ? ' input-error' : ''}`}
        placeholder={label}
      />
      {isShowError && (<span>{error}</span>)}
    </div>
  );
};

const FieldLevelValidation = () => {
  const {handleSubmit, controller, setOrDeleteError} = useForm();

  const onSubmit: OnSubmit<Values> = () => {};

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Username"
        controller={controller({name: 'username'})}
      />
      <Input
        label="First name"
        controller={controller({name: 'profile.firstName', validate: validateRequired})}
      />
      <Input
        label="Last name"
        controller={controller({name: 'profile.lastName'})}
      />
      <button type="submit">submit</button>
      <button
        type="button"
        onClick={() => setOrDeleteError({
          field: 'profile.firstName',
          error: 'First name is not valid',
        })}
      >
        set error for firstName
      </button>
    </form>
  );
}

describe('FieldLevelValidation', () => {
  test('submit', () => {
    render(<FieldLevelValidation />);
    const buttonSubmit = screen.getByText('submit');
    fireEvent.click(buttonSubmit);
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });

  test('onFocus, onBlur', () => {
    render(<FieldLevelValidation />);
    const inputFirstName = screen.getByPlaceholderText('First name');
    fireEvent.focus(inputFirstName);
    fireEvent.blur(inputFirstName);
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });

  test('onFocus, onChange: "t" -> ""', () => {
    render(<FieldLevelValidation />);
    const inputFirstName = screen.getByPlaceholderText('First name');
    fireEvent.focus(inputFirstName);
    fireEvent.change(inputFirstName, {target: {value: 't'}});
    fireEvent.change(inputFirstName, {target: {value: ''}});
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });

  test('onFocus, onChange: "t" -> "", onBlur', () => {
    render(<FieldLevelValidation />);
    const inputFirstName = screen.getByPlaceholderText('First name');
    fireEvent.focus(inputFirstName);
    fireEvent.change(inputFirstName, {target: {value: 't'}});
    fireEvent.change(inputFirstName, {target: {value: ''}});
    fireEvent.blur(inputFirstName);
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });
});
