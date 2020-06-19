import React from 'react';
import {createStore} from 'effector';
import {render, fireEvent, screen} from '@testing-library/react';
import {useForm} from '../';
import {Controller, OnSubmit} from '../../index';

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

const renderForm = () => {
  const $fieldsInline = createStore({});

  const Input: React.FC<InputProps> = ({
    controller,
    label,
  }) => {
    const {input, fieldState, form, error} = controller();

    const isShowError = error && (form.submitted || form.forcedError || fieldState.blurred);

    return (
      <div role="wrapper-for-input" className="input-wrap">
        <label>{label}</label>
        <input
          {...input}
          value={input.value || ''}
          role="textbox"
          className="input"
          placeholder={label}
        />
        {isShowError && (<span>{error}</span>)}
      </div>
    );
  };

  const SimpleForm = () => {
    const {handleSubmit, controller, setOrDeleteError} = useForm({$fieldsInline});

    const onSubmit: OnSubmit<Values> = () => {
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Username"
          controller={controller({name: 'username'})}
        />
        <Input
          label="First name"
          controller={controller({name: 'profile.firstName'})}
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
  };

  render(<SimpleForm />);

  return {$fieldsInline};
};

describe('SimpleForm', () => {

  test('$fieldsInline after render', () => {
    const {$fieldsInline} = renderForm();
    expect($fieldsInline.getState()).toMatchSnapshot();
  });

  test('onChange username', () => {
    renderForm();
    const input = screen.getByPlaceholderText('Username');
    fireEvent.change(input, {target: {value: 'test'}});
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toMatchSnapshot();
  });

  test('onChange profile.fistName', () => {
    renderForm();
    const input = screen.getByPlaceholderText('First name');
    fireEvent.change(input, {target: {value: 'test'}});
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toMatchSnapshot();
  });

  test('setError profile.firstName', () => {
    renderForm();
    const button = screen.getByText('set error for firstName');
    fireEvent.click(button);
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });

  test('setError profile.firstName and submit', () => {
    renderForm();
    const button = screen.getByText('set error for firstName');
    fireEvent.click(button);
    const buttonSubmit = screen.getByText('submit');
    fireEvent.click(buttonSubmit);
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });
});


