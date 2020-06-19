// TODO need to finish
import React from 'react';
import {render, fireEvent, screen} from '@testing-library/react';
import {createStore} from 'effector';
import {useForm} from '../';
import {OnSubmit} from '../../index';

interface Values {
  username?: string,
  profile?: {
    firstName?: string,
    lastName?: string,
  }
}

const initialState: Values = {username: 'Initial username'};

const $values = createStore(initialState);

const Input = ({
  controller,
  label,
}) => {
  const {input} = controller();

  return (
    <div className="input-wrap">
      <label>{label}</label>
      <input
        {...input}
        value={input.value || ''}
        role="textbox"
        className="input"
        placeholder={label}
      />
    </div>
  );
};

const SimpleForm = () => {
  const {handleSubmit, controller} = useForm<Values>({$values});

  const onSubmit: OnSubmit<Values> = ({values}) => {
    alert(JSON.stringify(values, null, '  '));
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
    </form>
  );
}


describe('GlobalStore', () => {
  test('onChange username', () => {
    render(<SimpleForm />);
    const input = screen.getByPlaceholderText('Username');
    fireEvent.change(input, {target: {value: 'test'}});
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toMatchSnapshot();
  });

  test('onChange username ($values)', () => {
    render(<SimpleForm />);
    const input = screen.getByPlaceholderText('Username');
    fireEvent.change(input, {target: {value: 'test'}});
    expect($values.getState()).toMatchSnapshot();
  });
});


