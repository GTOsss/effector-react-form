import { Controller } from '../ts';
import React, { useState } from 'react';
import { useForm } from '../index';
import { render, screen, fireEvent } from '@testing-library/react';
import createForm from '../factories/create-form';

interface InputProps {
  controller: Controller;
  label: string;
}

// const validateRequired = (value) => value ? undefined : 'Field is required';

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

const form1 = createForm();
const form2 = createForm();

const RemoteSubmit = () => {
  const { handleSubmit: handleSubmit1, controller: controller1 } = useForm({ form: form1 });
  const { handleSubmit: handleSubmit2, controller: controller2 } = useForm({ form: form2 });
  const [formValue, setFormValue] = useState(true);

  const onClickToggle = () => {
    setFormValue(!formValue);
  };

  return (
    <div>
      <button onClick={onClickToggle}>toggle form</button>
      {formValue ? (
        <form onSubmit={handleSubmit1} role="form" key={1}>
          form 1
          <Input label="Name" controller={controller1({ name: 'name' })} />
          <button type="submit">submit</button>
        </form>
      ) : (
        <form onSubmit={handleSubmit2} role="form" key={2}>
          form 2
          <Input label="Name" controller={controller2({ name: 'name' })} />
          <button type="submit">submit</button>
        </form>
      )}
    </div>
  );
};

describe('SeveralUseForm', () => {
  test('change and submit', () => {
    render(<RemoteSubmit />);
    const toggleForm = screen.getByText('toggle form');
    let input = screen.getByPlaceholderText('Name');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(toggleForm);
    input = screen.getByPlaceholderText('Name');
    fireEvent.change(input, { target: { value: 't' } });
    const values1 = form1.$values.getState();
    const values2 = form2.$values.getState();
    const form = screen.getByRole('form');
    expect(values1).toStrictEqual({ name: 'test' });
    expect(values2).toStrictEqual({ name: 't' });
    expect(form).toMatchSnapshot();
  });
});
