import React from 'react';
import {render} from '@testing-library/react';
import {createStore, createEvent} from 'effector';
import {Controller, OnSubmit} from '../../index';
import {useForm} from '../index';

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
    const {changedAfterOuterError, blurred} = fieldState;

    const isShowError = error && (form.submitted || !changedAfterOuterError || blurred);

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
    const {handleSubmit, controller, setOrDeleteOuterError} = useForm({$fieldsInline});

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
          onClick={() => setOrDeleteOuterError({
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


describe('test', () => {
  test('sss', () => {
    const event = createEvent();
    const nextEvent = event.map((value) => console.log('tesatgatb'));
    const $store = createStore({});
    $store.on(nextEvent, () => {});
    expect($store).toMatchSnapshot();
  });
});
