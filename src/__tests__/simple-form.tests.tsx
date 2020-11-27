import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { useForm } from '../';
import { Controller } from '../../index';
import createForm from '../factories/create-form';
import { createEvent } from 'effector';

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
};

describe('SimpleForm', () => {
  test('onChange username, test performance', () => {
    const form = createForm();
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
    const form = createForm();
    renderForm({ form });
    expect(form.$fieldsInline.getState()).toMatchSnapshot();
  });

  test('onChange username', () => {
    const form = createForm();
    renderForm({ form });
    const input = screen.getByPlaceholderText('Username');
    fireEvent.change(input, { target: { value: 'test' } });
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toMatchSnapshot();
  });

  test('onChange profile.fistName', () => {
    const form = createForm();
    renderForm({ form });
    const input = screen.getByPlaceholderText('First name');
    fireEvent.change(input, { target: { value: 'test' } });
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toMatchSnapshot();
  });

  test('setError profile.firstName', () => {
    const form = createForm();
    renderForm({ form });
    const button = screen.getByText('set error for firstName');
    fireEvent.click(button);
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });

  test('setError profile.firstName and submit', () => {
    const form = createForm();
    renderForm({ form });
    const button = screen.getByText('set error for firstName');
    fireEvent.click(button);
    const buttonSubmit = screen.getByText('submit');
    fireEvent.click(buttonSubmit);
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });

  test('setError profile.firstName, change and submit', () => {
    const form = createForm();
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
    const form = createForm();
    renderForm({ form });
    const button = screen.getByText('set error for firstName');
    fireEvent.click(button);
    const inputFirstName = screen.getByPlaceholderText('First name');
    fireEvent.focus(inputFirstName);
    expect(form.$fieldsInline.getState()).toMatchSnapshot();
  });

  test('meta', () => {
    const form = createForm();
    renderForm({ form });
    expect(form.$form.getState()).toMatchSnapshot();
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

  test('onSubmit callback call count', () => {
    const fn = jest.fn(() => null);
    const form = createForm({ onSubmit: fn });
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
    const form = createForm({ onSubmit });
    renderForm({ form });
    const input = screen.getByPlaceholderText('First name');
    fireEvent.change(input, { target: { value: 'test' } });
    const buttonSubmit = screen.getByText('submit');
    fireEvent.click(buttonSubmit);
    expect(fn.mock.calls.length).toBe(1);
  });
});
