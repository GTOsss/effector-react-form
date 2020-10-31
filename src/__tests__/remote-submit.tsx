import { Controller } from '../../index';
import React from 'react';
import { useForm } from '../index';
import { render, screen, fireEvent } from '@testing-library/react';
import { createEvent } from 'effector';

const submit = createEvent();

// interface Values {
//   username?: string,
//   profile?: {
//     firstName?: string,
//     lastName?: string,
//   }
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

const RemoteSubmit = ({ onSubmit }) => {
  const { handleSubmit, controller, setOrDeleteError } = useForm({ onSubmit, submit });

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
            setOrDeleteError({
              field: 'profile.firstName',
              error: 'First name is not valid',
            })
          }
        >
          set error for firstName
        </button>
      </form>

      <button onClick={submit as any}>remote submit</button>
    </div>
  );
};

describe('RemoteSubmit', () => {
  test('remoteSubmit', () => {
    render(<RemoteSubmit onSubmit={() => {}} />);
    const remoteSubmitButton = screen.getByText('remote submit');
    fireEvent.click(remoteSubmitButton);
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });

  test('remoteSubmit mockSubmit', () => {
    const mockSubmit = jest.fn(() => {});
    render(<RemoteSubmit onSubmit={mockSubmit} />);
    const remoteSubmitButton = screen.getByText('remote submit');
    fireEvent.click(remoteSubmitButton);
    expect(mockSubmit.mock.calls[0][0]).toMatchSnapshot();
  });
});
