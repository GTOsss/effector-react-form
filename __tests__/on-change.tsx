import React from 'react';
import { createStore } from 'effector';
import { render, fireEvent, screen } from '@testing-library/react';
import { useForm } from '../src';
import { Controller } from '../src/ts';
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

const renderForm = ({ form }) => {
  const $fieldsInline = createStore({});

  const Input: React.FC<InputProps> = ({ controller, label }) => {
    const { input, error, isShowError } = controller();

    return (
      <div role="wrapper-for-input" className="input-wrap">
        <label>{label}</label>
        <input {...input} value={input.value || ''} role="textbox" className="input" placeholder={label} />
        {isShowError && <span>{error}</span>}
      </div>
    );
  };

  const SimpleForm = () => {
    const { handleSubmit, controller } = useForm({ form });

    return (
      <form onSubmit={handleSubmit}>
        <Input
          label="Username"
          controller={controller({ name: 'username', validate: (value) => (value === 't' ? 'error' : undefined) })}
        />
        <Input label="First name" controller={controller({ name: 'profile.firstName' })} />
        <Input label="Last name" controller={controller({ name: 'profile.lastName' })} />
        <button type="submit">submit</button>
        <button
          type="button"
          onClick={() =>
            form.setOrDeleteOuterError({
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

  render(<SimpleForm />);

  return { $fieldsInline };
};

describe('onChange', () => {
  test('onChange after change("t")', () => {
    const onChange = (values) => values;
    const mockOnChange = jest.fn(onChange);
    const form = createForm({ onChange: mockOnChange });

    renderForm({ form });
    const input = screen.getByPlaceholderText('Username');
    fireEvent.change(input, { target: { value: 't' } });
    expect(mockOnChange.mock.calls.length).toBe(0);
    expect(mockOnChange.mock.results[0]).toMatchSnapshot();
  });

  test('onChange after change("te")', () => {
    const onChange = (values) => values;
    const mockOnChange = jest.fn(onChange);
    const form = createForm({ onChange: mockOnChange });

    renderForm({ form });
    const input = screen.getByPlaceholderText('Username');
    fireEvent.change(input, { target: { value: 't' } });
    fireEvent.change(input, { target: { value: 'te' } });
    expect(mockOnChange.mock.calls.length).toBe(1);
    expect(mockOnChange.mock.results[0]).toMatchSnapshot();
  });
});
