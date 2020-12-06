// TODO need to finish
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { useForm } from '../src';
import { createForm } from '../src/factories/create-form';

interface Values {
  username?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
}

const initialState: Values = { username: 'Initial username' };

const Input = ({ controller, label }) => {
  const { input } = controller();

  return (
    <div className="input-wrap">
      <label>{label}</label>
      <input {...input} value={input.value || ''} role="textbox" className="input" placeholder={label} />
    </div>
  );
};

const SimpleForm = ({ form }) => {
  const { handleSubmit, controller } = useForm<Values>({ form });

  return (
    <form onSubmit={handleSubmit}>
      <Input label="Username" controller={controller({ name: 'username' })} />
      <Input label="First name" controller={controller({ name: 'profile.firstName' })} />
      <Input label="Last name" controller={controller({ name: 'profile.lastName' })} />
      <button type="submit">submit</button>
    </form>
  );
};

describe('GlobalStore', () => {
  test('onChange username', () => {
    const form = createForm();
    render(<SimpleForm form={form} />);
    const input = screen.getByPlaceholderText('Username');
    fireEvent.change(input, { target: { value: 'test' } });
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toMatchSnapshot();
  });

  test('onChange username ($values)', () => {
    const form = createForm({ initialValues: initialState });
    render(<SimpleForm form={form} />);
    const input = screen.getByPlaceholderText('Username');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(form.$values.getState()).toMatchSnapshot();
  });
});
