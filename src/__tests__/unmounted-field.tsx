import React from 'react';
import {render, fireEvent, screen} from '@testing-library/react';
import {createStore, createEvent} from 'effector';
import {useStore} from 'effector-react';
import {useForm} from '../';
import {Controller, FormState} from '../../index';
import {setIn, removeFromInlineMap} from '../utils/object-manager';

const renderForm = () => {
  const validateRequired = (value) => value ? undefined : 'Field is required';

  type Values = {
    fields: Array<{value: string, id: number | string}>,
  };

  const removeFirstElement = createEvent();

  const $fieldsInline = createStore({});
  const $values = createStore<Values>({
    fields: [
      {value: '', id: 1},
      {value: '', id: 2},
    ],
  });

  $fieldsInline.on(removeFirstElement, (inlineState) => removeFromInlineMap(inlineState, 'fields[0]'));
  $values.on(removeFirstElement, (state) => setIn(state, 'fields', state.fields.slice(1)));

  const $form = createStore<FormState>({
    submitted: false,
    hasError: false,
    hasOuterError: false,
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

    const isShowError = form.submitted || form.hasOuterError || fieldState.blurred;

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
    const {handleSubmit, controller} = useForm<Values>({$values, $fieldsInline, $form, $errorsInline, onSubmit: () => {}});

    const {fields} = useStore($values);

    return (
      <form onSubmit={handleSubmit}>
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

  test('$values after change 1,2 > removed', () => {
    const {$values} = renderForm();
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], {target: {value: 'value 1'}});
    fireEvent.change(inputs[1], {target: {value: 'value 2'}});
    const remove = screen.getByText('remove first element');
    fireEvent.click(remove);
    expect($values.getState()).toMatchSnapshot();
  });

  test('$values after removed > onChange("test")', () => {
    const {$values} = renderForm();
    const submit = screen.getByText('submit');
    fireEvent.click(submit);
    const remove = screen.getByText('remove first element');
    fireEvent.click(remove);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, {target: {value: 'test'}});
    expect($values.getState()).toMatchSnapshot();
  });
});


