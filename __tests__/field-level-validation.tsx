import { Controller } from '../src/ts';
import React from 'react';
import { useForm } from '../src';
import { render, screen, fireEvent, act } from '@testing-library/react';
import createForm from '../src/factories/create-form';

// interface Values {
//   username?: string;
//   profile?: {
//     firstName?: string;
//     lastName?: string;
//   };
// }

interface InputProps {
  controller: Controller;
  label: string;
}

const validateRequired = (value) => (value ? undefined : 'Field is required');

const Input: React.FC<InputProps> = ({ controller, label }) => {
  const { input, fieldState, form, error } = controller();

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
      {isShowError && <span>{error}</span>}
    </div>
  );
};

const FieldLevelValidation = ({ form }) => {
  const { handleSubmit, controller } = useForm({ form });

  return (
    <form onSubmit={handleSubmit}>
      <Input label="Username" controller={controller({ name: 'username' })} />
      <Input label="First name" controller={controller({ name: 'profile.firstName', validate: validateRequired })} />
      <Input label="Last name" controller={controller({ name: 'profile.lastName' })} />
      <button type="submit">submit</button>
      <button
        type="button"
        onClick={() =>
          form.setOrDeleteError({
            field: 'profile.firstName',
            error: 'First name is not valid',
          })
        }
      >
        set error for firstName
      </button>
    </form>
  );
};

describe('FieldLevelValidation', () => {
  test('submit', () => {
    const form = createForm();
    render(<FieldLevelValidation form={form} />);
    const buttonSubmit = screen.getByText('submit');
    fireEvent.click(buttonSubmit);
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });

  test('onFocus, onBlur', () => {
    const form = createForm();
    render(<FieldLevelValidation form={form} />);
    const inputFirstName = screen.getByPlaceholderText('First name');
    fireEvent.focus(inputFirstName);
    fireEvent.blur(inputFirstName);
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });

  test('onFocus, onChange: "t" -> ""', () => {
    const form = createForm();
    render(<FieldLevelValidation form={form} />);
    const inputFirstName = screen.getByPlaceholderText('First name');
    fireEvent.focus(inputFirstName);
    fireEvent.change(inputFirstName, { target: { value: 't' } });
    fireEvent.change(inputFirstName, { target: { value: '' } });
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });

  test('onFocus, onChange: "t" -> "", onBlur', () => {
    const form = createForm();
    render(<FieldLevelValidation form={form} />);
    const inputFirstName = screen.getByPlaceholderText('First name');
    fireEvent.focus(inputFirstName);
    fireEvent.change(inputFirstName, { target: { value: 't' } });
    fireEvent.change(inputFirstName, { target: { value: '' } });
    fireEvent.blur(inputFirstName);
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });

  test('reset event', () => {
    const form = createForm();
    render(<FieldLevelValidation form={form} />);
    const inputFirstName = screen.getByPlaceholderText('First name');
    act(() => {
      fireEvent.focus(inputFirstName);
      fireEvent.change(inputFirstName, { target: { value: 't' } });
      fireEvent.blur(inputFirstName);
      form.reset();
    });
    expect(form.$allFormState.getState()).toMatchSnapshot();
  });
});
