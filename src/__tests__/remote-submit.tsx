import { Controller } from '../ts';
import React from 'react';
import { useForm } from '../index';
import { render, screen, fireEvent } from '@testing-library/react';
import createForm from '../factories/create-form';
import { createEvent } from 'effector';

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

const RemoteSubmit = ({ form }) => {
  const { handleSubmit, controller } = useForm({ form });

  return (
    <div>
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

      <button onClick={form.submit}>remote submit</button>
    </div>
  );
};

describe('RemoteSubmit', () => {
  test('remoteSubmit', () => {
    const form = createForm();
    render(<RemoteSubmit form={form} />);
    const remoteSubmitButton = screen.getByText('remote submit');
    fireEvent.click(remoteSubmitButton);
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });

  test('remoteSubmit mockSubmit', () => {
    const mockSubmit = jest.fn(() => {});
    const onSubmit = createEvent<any>();
    onSubmit.watch(mockSubmit);
    const form = createForm({ onSubmit });
    render(<RemoteSubmit form={form} />);
    const remoteSubmitButton = screen.getByText('remote submit');
    fireEvent.click(remoteSubmitButton);
    expect(mockSubmit.mock.calls.length).toBe(0);
  });
});
