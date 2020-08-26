import React from 'react';
import {createStore} from 'effector';
import {render, fireEvent, screen} from '@testing-library/react';
import {useForm} from '../';
import {getIn} from '../utils/object-manager';
import {Controller, MapSubmit} from '../../index';

interface MappedValues {
  profile: {
    firstName?: string;
  },
  info: {
    username?: string;
  }
}

interface Values {
  username?: string,
  profile?: {
    firstName?: string,
  }
}

const mapSubmit: MapSubmit<Values, MappedValues> = ({values, ...rest}) => {
  const currentValues = {
    profile: {firstName: getIn(values, 'profile.firstName')},
    info: {username: getIn(values, 'username')},
  };

  return {...rest, values: currentValues};
};

interface InputProps {
  controller: Controller,
  label: string,
}

const renderForm = ({onSubmit, onChange, mapSubmit}) => {
  const $fieldsInline = createStore({});

  const Input: React.FC<InputProps> = ({
    controller,
    label,
  }) => {
    const {input, error, isShowError} = controller();
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
    const {handleSubmit, controller} = useForm({onSubmit, onChange, mapSubmit});

    return (
      <form onSubmit={handleSubmit}>
        <Input
          label="Username"
          controller={controller({name: 'username'})}
        />
        <Input
          label="First name"
          controller={controller({name: 'profile.firstName'})}
        />
        <button type="submit">submit</button>
      </form>
    );
  };

  render(<SimpleForm />);

  return {$fieldsInline};
};

describe('MapSubmit', () => {
  test('onSubmit form without mapSubmit', () => {
    const onSubmit = jest.fn(() => null);
    renderForm({onSubmit});
    fireEvent.change(screen.getByPlaceholderText('Username'), {target: {value: 'test username'}});
    fireEvent.change(screen.getByPlaceholderText('First name'), {target: {value: 'test first name'}});
    const buttonSubmit = screen.getByText('submit');
    fireEvent.click(buttonSubmit);
    expect(onSubmit.mock.calls[0][0]).toMatchSnapshot();
  });

  test('onSubmit form with mapSubmit', () => {
    const onSubmit = jest.fn(() => null);
    renderForm({onSubmit, mapSubmit});
    fireEvent.change(screen.getByPlaceholderText('Username'), {target: {value: 'test username'}});
    fireEvent.change(screen.getByPlaceholderText('First name'), {target: {value: 'test first name'}});
    const buttonSubmit = screen.getByText('submit');
    fireEvent.click(buttonSubmit);
    expect(onSubmit.mock.calls[0][0]).toMatchSnapshot();
  });

  test('onChange form without mapSubmit', () => {
    const onChange = jest.fn(() => null);
    renderForm({onChange, onSubmit: () => null});
    fireEvent.change(screen.getByPlaceholderText('Username'), {target: {value: 'test username'}});
    fireEvent.change(screen.getByPlaceholderText('First name'), {target: {value: 'test first name'}});
    expect(onChange.mock.calls[1][0]).toMatchSnapshot();
  });

  test('onChange form with mapSubmit', () => {
    const onChange = jest.fn(() => null);
    renderForm({onChange, mapSubmit, onSubmit: () => null});
    fireEvent.change(screen.getByPlaceholderText('Username'), {target: {value: 'test username'}});
    fireEvent.change(screen.getByPlaceholderText('First name'), {target: {value: 'test first name'}});
    expect(onChange.mock.calls[1][0]).toMatchSnapshot();
  });
});



