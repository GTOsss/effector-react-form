import React from 'react';
import { createStore } from 'effector';
import { render, fireEvent, screen } from '@testing-library/react';
import { useForm } from '../src';
import { getIn } from '../src/utils/object-manager';
import { createForm } from '../src/factories/create-form';
import { MapSubmit, Controller } from '../src/ts';

interface MappedValues {
  profile: {
    firstName?: string;
  };
  info: {
    username?: string;
  };
}

interface Values {
  username?: string;
  profile?: {
    firstName?: string;
  };
}

// @ts-ignore
const mapSubmit: MapSubmit<Values, MappedValues> = ({ values, ...rest }) => {
  const currentValues = {
    profile: { firstName: getIn(values, 'profile.firstName') },
    info: { username: getIn(values, 'username') },
  };

  return { ...rest, values: currentValues };
};

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
        <Input label="Username" controller={controller({ name: 'username' })} />
        <Input label="First name" controller={controller({ name: 'profile.firstName' })} />
        <button type="submit">submit</button>
      </form>
    );
  };

  render(<SimpleForm />);

  return { $fieldsInline };
};

describe('MapSubmit', () => {
  test('onSubmit form without mapSubmit', () => {
    const onSubmit = jest.fn(() => null);
    const form = createForm({ onSubmit });
    renderForm({ form });
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test username' } });
    fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: 'test first name' } });
    const buttonSubmit = screen.getByText('submit');
    fireEvent.click(buttonSubmit);
    // @ts-ignore
    expect(onSubmit.mock.calls[0][0]).toMatchSnapshot();
  });

  test('onSubmit form with mapSubmit', () => {
    const onSubmit = jest.fn(() => null);
    const form = createForm({ onSubmit, mapSubmit });
    renderForm({ form });
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test username' } });
    fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: 'test first name' } });
    const buttonSubmit = screen.getByText('submit');
    fireEvent.click(buttonSubmit);
    // @ts-ignore
    expect(onSubmit.mock.calls[0][0]).toMatchSnapshot();
  });

  test('onChange form without mapSubmit', () => {
    const onChange = jest.fn(() => null);
    const form = createForm({ onChange });
    renderForm({ form });
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test username' } });
    fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: 'test first name' } });
    // @ts-ignore
    expect(onChange.mock.calls[1][0]).toMatchSnapshot();
  });

  test('onChange form with mapSubmit', () => {
    const onChange = jest.fn(() => null);
    const form = createForm({ onChange, mapSubmit });
    renderForm({ form });
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'test username' } });
    fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: 'test first name' } });
    // @ts-ignore
    expect(onChange.mock.calls[1][0]).toMatchSnapshot();
  });
});
