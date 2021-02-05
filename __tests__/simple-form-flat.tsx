import React from 'react';
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

const renderForm = ({ inputRender, form }: any) => {
  const Input: React.FC<InputProps> = ({ controller, label }) => {
    const { input, error, isShowError } = controller();

    if (inputRender) {
      inputRender(input.name);
    }

    return (
      <div role="wrapper-for-input" className="input-wrap">
        <label>{label}</label>
        <input {...input} value={input.value || ''} role="textbox" className="input" placeholder={label} />
        {isShowError && <span>{error}</span>}
      </div>
    );
  };

  const SimpleForm = () => {
    const { handleSubmit, controller } = useForm({ form, meta: { formName: 'simpleForm' } });

    return (
      <form onSubmit={handleSubmit}>
        <Input label="Username" controller={controller({ name: 'username' })} />
        <Input label="First name" controller={controller({ name: 'profile.firstName', flat: true })} />
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
};

describe('SimpleFormFlat', () => {
  test('onChange profile.firstName $values', () => {
    const form = createForm();
    renderForm({ form });
    const input = screen.getByPlaceholderText('First name');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(form.$values.getState()).toMatchSnapshot();
  });

  test('onChange profile.lastName $values', () => {
    const form = createForm();
    renderForm({ form });
    const input = screen.getByPlaceholderText('Last name');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(form.$values.getState()).toMatchSnapshot();
  });

  test('onChange profile.firstName, profile.lastName  $values', () => {
    const form = createForm();
    renderForm({ form });
    const input1 = screen.getByPlaceholderText('First name');
    fireEvent.change(input1, { target: { value: 'test1' } });
    const input2 = screen.getByPlaceholderText('Last name');
    fireEvent.change(input2, { target: { value: 'test2' } });
    expect(form.$values.getState()).toMatchSnapshot();
  });

  test('meta and onSubmit', () => {
    const fn = jest.fn(() => null);
    const form = createForm({ onSubmit: fn });
    renderForm({ form });
    const buttonSubmit = screen.getByText('submit');
    fireEvent.click(buttonSubmit);
    // @ts-ignore
    expect(fn.mock.calls[0][0]).toMatchSnapshot();
  });
});
