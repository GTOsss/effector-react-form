import React from 'react';
import {render, fireEvent, screen} from '@testing-library/react';
import {createStore, createEvent} from 'effector';
import {useStore} from 'effector-react';
import {useForm} from '../';
import {Controller, OnSubmit, FormState} from '../../index';
import {setIn} from '../utils/object-manager';

const renderForm = () => {
  const validateRequired = (value) => value ? undefined : 'Field is required';

  type Values = {
    fields: Array<{value: string, id: number | string}>,
  };

  const removeFirstElement = createEvent();

  const $values = createStore<Values>({
    fields: [
      {value: '', id: 1},
      {value: '', id: 2},
    ],
  });

  $values.on(removeFirstElement, (state) => setIn(state, 'fields', state.fields.slice(1)));

  const $form = createStore<FormState>({
    submitted: false,
    hasError: false,
    forcedError: false,
  });

  const $errorsInline = createStore({});

  interface InputProps {
    controller: Controller,
    label: string,
  }

  const Input: React.FC<InputProps> = ({
    controller,
    label,
  }) => {
    const {input, fieldState, form, error} = controller();

    const isShowError = form.submitted || form.forcedError || fieldState.blurred;

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
        {isShowError && error && (<span>{error}</span>)}
      </div>
    );
  };

  const SimpleForm = () => {
    const {handleSubmit, controller} = useForm<Values>({$values, $form, $errorsInline});

    const {fields} = useStore($values);

    const onSubmit: OnSubmit<Values> = () => {
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        {fields.map((el, i) => (
          <Input
            key={el.id}
            controller={controller({name: `fields[${i}].value`, validate: validateRequired})}
            label={`value № ${i}`}
          />
        ))}
        <button type="submit">submit</button>
        <button
          type="button"
          onClick={() => removeFirstElement()}
        >
          remove first element
        </button>
      </form>
    );
  };

  render(<SimpleForm />);

  return {
    $errorsInline,
    $values,
    $form,
  };
};

describe('UnmountField', () => {
  test('render fields', () => {
    renderForm();
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toMatchSnapshot();
  });

  test('render fields after removed', () => {
    renderForm();
    const remove = screen.getByText('remove first element');
    fireEvent.click(remove);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toMatchSnapshot();
  });

  test('render fields after submit and removed', () => {
    renderForm();
    const submit = screen.getByText('submit');
    fireEvent.click(submit);
    const remove = screen.getByText('remove first element');
    fireEvent.click(remove);
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });

  test('$form after submit and removed', () => {
    const {$form} = renderForm();
    const submit = screen.getByText('submit');
    fireEvent.click(submit);
    const remove = screen.getByText('remove first element');
    fireEvent.click(remove);
    expect($form.getState()).toMatchSnapshot();
  });

  test('$errorsInline after submit > removed', () => {
    const {$errorsInline} = renderForm();
    const submit = screen.getByText('submit');
    fireEvent.click(submit);
    const remove = screen.getByText('remove first element');
    fireEvent.click(remove);
    expect($errorsInline.getState()).toMatchSnapshot();
  });

  test('$errorsInline after submit > removed > submit', () => {
    const {$errorsInline} = renderForm();
    const submit = screen.getByText('submit');
    fireEvent.click(submit);
    const remove = screen.getByText('remove first element');
    fireEvent.click(remove);
    fireEvent.click(submit);
    expect($errorsInline.getState()).toMatchSnapshot();
  });
});


