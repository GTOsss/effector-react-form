import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { useForm } from '../src';
import { Controller, Form } from '../src/ts';
import createForm from '../src/factories/create-form';
import { createEvent } from 'effector';

type Values = {
  username?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
};

type InputProps = {
  controller: Controller;
  label: string;
};

const renderForm = ({ inputRender, form }: { inputRender?: any; form: Form<Values> }) => {
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
        <Input label="Username" controller={controller({ name: form.getName('username') })} />
        <Input label="First name" controller={controller({ name: form.getName('profile', 'firstName') })} />
        <Input label="Last name" controller={controller({ name: form.getName('profile', 'lastName') })} />
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

describe('SimpleFormTs', () => {
  test('onChange username, test performance', () => {
    const form = createForm<Values>();

    const mapRenders = {
      username: 0,
      'profile.firstName': 0,
      'profile.lastName': 0,
    };
    const renderCallback = (name) => {
      mapRenders[name] += 1;
    };
    renderForm({ inputRender: renderCallback, form });
    const input = screen.getByPlaceholderText('Username');
    fireEvent.change(input, { target: { value: 't' } });
    fireEvent.change(input, { target: { value: 'te' } });
    fireEvent.change(input, { target: { value: 'tes' } });
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.change(input, { target: { value: 'tests' } });
    expect(mapRenders).toMatchSnapshot();
  });

  test('$fieldsInline after render', () => {
    const form = createForm<Values>();
    renderForm({ form });
    expect(form.$fieldsInline.getState()).toMatchSnapshot();
  });

  test('onChange username', () => {
    const form = createForm<Values>();
    renderForm({ form });
    const input = screen.getByPlaceholderText('Username');
    fireEvent.change(input, { target: { value: 'test' } });
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toMatchSnapshot();
  });

  test('onChange profile.fistName', () => {
    const form = createForm<Values>();
    renderForm({ form });
    const input = screen.getByPlaceholderText('First name');
    fireEvent.change(input, { target: { value: 'test' } });
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toMatchSnapshot();
  });

  test('setError profile.firstName', () => {
    const form = createForm<Values>();
    renderForm({ form });
    const button = screen.getByText('set error for firstName');
    fireEvent.click(button);
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });

  test('setError profile.firstName and submit', () => {
    const form = createForm<Values>();
    renderForm({ form });
    const button = screen.getByText('set error for firstName');
    fireEvent.click(button);
    const buttonSubmit = screen.getByText('submit');
    fireEvent.click(buttonSubmit);
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });

  test('setError profile.firstName, change and submit', () => {
    const form = createForm<Values>();
    renderForm({ form });
    const button = screen.getByText('set error for firstName');
    fireEvent.click(button);
    const buttonSubmit = screen.getByText('submit');
    fireEvent.click(buttonSubmit);
    const inputFirstName = screen.getByPlaceholderText('First name');
    fireEvent.change(inputFirstName, { target: { value: 't' } });
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });

  test('$fieldsInline after setError profile.firstName and focus firstName', () => {
    const form = createForm<Values>();
    renderForm({ form });
    const button = screen.getByText('set error for firstName');
    fireEvent.click(button);
    const inputFirstName = screen.getByPlaceholderText('First name');
    fireEvent.focus(inputFirstName);
    expect(form.$fieldsInline.getState()).toMatchSnapshot();
  });

  test('meta', () => {
    const form = createForm<Values>();
    renderForm({ form });
    expect(form.$form.getState()).toMatchSnapshot();
  });

  test('meta and onSubmit', () => {
    const fn = jest.fn(() => null);
    const form = createForm<Values>({ onSubmit: fn });
    renderForm({ form });
    const buttonSubmit = screen.getByText('submit');
    fireEvent.click(buttonSubmit);
    // @ts-ignore
    expect(fn.mock.calls[0][0]).toMatchSnapshot();
  });

  test('onSubmit callback call count', () => {
    const fn = jest.fn(() => null);
    const form = createForm<Values>({ onSubmit: fn });
    renderForm({ form });
    const input = screen.getByPlaceholderText('First name');
    fireEvent.change(input, { target: { value: 'test' } });
    const buttonSubmit = screen.getByText('submit');
    fireEvent.click(buttonSubmit);
    expect(fn.mock.calls.length).toBe(1);
  });

  test('onSubmit event call count', () => {
    const fn = jest.fn(() => null);
    const onSubmit = createEvent<any>();
    onSubmit.watch(fn);
    const form = createForm<Values>({ onSubmit });
    renderForm({ form });
    const input = screen.getByPlaceholderText('First name');
    fireEvent.change(input, { target: { value: 'test' } });
    const buttonSubmit = screen.getByText('submit');
    fireEvent.click(buttonSubmit);
    expect(fn.mock.calls.length).toBe(1);
  });
});
