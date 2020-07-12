import {Controller} from '../../index';
import React from 'react';
import {useForm, useFieldArray} from '../index';
import {render, screen, fireEvent} from '@testing-library/react';
import {createStore} from 'effector';

const getId = (() => {
  let counter = 0;

  return () => counter += 1;
})();

const $values = createStore({});
const $fieldsInline = createStore({});

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

const FormItems = ({controller, name, onPush}) => {
  const {map, push, remove} = useFieldArray({name, $values, $fieldsInline});

  return (
    <div className="formsItem" role="formItem">
      {map(({fieldName, index, field}) => (
        <div key={field.id} className="formItem">
          <Input
            label="Username"
            controller={controller({name: `${fieldName}.username`, validate: validateRequired})}
          />
          <Input
            label="First name"
            controller={controller({name: `${fieldName}.profile.firstName`, validate: validateRequired})}
          />
          <button type="button" onClick={() => remove(index)}>
            remove form item
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onPush(push)}>
        add form item with values
      </button>
    </div>
  );
};

const FieldArray = ({onPush}) => {
  const {handleSubmit, controller} = useForm({
    onSubmit: () => null,
    $values,
    $fieldsInline,
  });

  return (
    <form onSubmit={handleSubmit}>
      <FormItems name="parents" controller={controller} onPush={onPush} />
      <button type="submit">submit</button>
    </form>
  );
};

describe('FieldArray', () => {
  test('render', () => {
    render(<FieldArray onPush={() => null} />);
    const formItems = screen.getAllByRole('formItem');
    expect(formItems).toMatchSnapshot();
  });

  test('add form item with values > render', () => {
    render(<FieldArray onPush={(push) => push({id: getId(), username: 'gto', profile: {firstName: 'Timofey'}})} />);
    const addFormItem = screen.getByText('add form item with values');
    fireEvent.click(addFormItem);
    const formItems = screen.getAllByRole('formItem');
    expect(formItems).toMatchSnapshot();
  });

  test('add form item with values > $values', () => {
    render(<FieldArray onPush={(push) => push({id: getId(), username: 'gto', profile: {firstName: 'Timofey'}})} />);
    const addFormItem = screen.getByText('add form item with values');
    fireEvent.click(addFormItem);
    expect($values.getState()).toMatchSnapshot();
  });

  test('add form item with values (x3) > $values', () => {
    const formItems = [
      {id: getId(), username: '0'},
      {id: getId(), username: '1'},
      {id: getId(), username: '2'},
    ];

    let counter = 0;
    const onPush = (push) => {
      push(formItems[counter++]);
    };
    render(<FieldArray onPush={onPush} />);
    const addFormItem = screen.getByText('add form item with values');
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    expect($values.getState()).toMatchSnapshot();
  });

  test('add form item with values (x3) > remove(1) > $values', () => {
    const formItems = [
      {id: getId(), username: '0'},
      {id: getId(), username: '1'},
      {id: getId(), username: '2'},
    ];

    let counter = 0;
    const onPush = (push) => {
      push(formItems[counter++]);
    };
    render(<FieldArray onPush={onPush} />);
    const addFormItem = screen.getByText('add form item with values');
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    const removeFormItem = screen.getAllByText('remove form item');
    fireEvent.click(removeFormItem[1]);
    expect($values.getState()).toMatchSnapshot();
  });

  test('add form item with values (x3) > remove(1) > $fieldsInline', () => {
    const formItems = [
      {id: getId(), username: '0'},
      {id: getId(), username: '1'},
      {id: getId(), username: '2'},
    ];

    let counter = 0;
    const onPush = (push) => {
      push(formItems[counter++]);
    };
    render(<FieldArray onPush={onPush} />);
    const addFormItem = screen.getByText('add form item with values');
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    const removeFormItem = screen.getAllByText('remove form item');
    fireEvent.click(removeFormItem[1]);
    expect($fieldsInline.getState()).toMatchSnapshot();
  });
});
