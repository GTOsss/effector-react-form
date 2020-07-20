import React from 'react';
import {useForm} from '../index';
import {render, screen, fireEvent} from '@testing-library/react';
import useError from '../error';
import {Controller} from '../../index';

// interface Values {
//   username?: string,
//   profile?: {
//     firstName?: string,
//     lastName?: string,
//   }
// }

interface InputProps {
  controller: Controller,
  label: string,
}

const validateRequired = (value) => value ? undefined : 'Field is required';

const Input: React.FC<InputProps> = ({
  controller,
  label,
}) => {
  const {input, fieldState, form, error} = controller();

  const isShowError = error && (form.submitted || form.hasOuterError || fieldState.blurred);

  return (
    <div role="wrapper-for-input" className="input-wrap">
      <label>{label}</label>
      <input
        {...input}
        value={input.value || ''}
        role="textbox"
        className={`input${isShowError ? ' input-error' : ''}`}
        placeholder={label}
      />
      {isShowError && (<span>{error}</span>)}
    </div>
  );
};

const FieldLevelValidation = () => {
  const {handleSubmit, controller, setOrDeleteError, ...rest} = useForm({
    onSubmit: () => {
    },
  });
  const userNameError = useError({...rest, name: 'username'});
  const profileFirstNameError = useError({...rest, name: 'profile.firstName'});

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Username"
        controller={controller({name: 'username', validate: validateRequired})}
      />
      <Input
        label="First name"
        controller={controller({name: 'profile.firstName', validate: validateRequired})}
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
      {userNameError.isShowError && <span role="error">{userNameError.error}</span>}
      {profileFirstNameError.isShowError && <span role="error">{profileFirstNameError.error}</span>}
    </form>
  );
};

describe('useError', () => {
  test('submit, render', () => {
    render(<FieldLevelValidation />);
    const buttonSubmit = screen.getByText('submit');
    fireEvent.click(buttonSubmit);
    const errors = screen.getAllByRole('error');
    expect(errors).toMatchSnapshot();
  });
});
