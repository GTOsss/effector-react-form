import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { createEvent } from 'effector';
import { useUnit } from 'effector-react';
import { useForm } from '../src';
import { Controller } from '../src/ts';
import { setIn, removeFromInlineMap } from '../src/utils/object-manager';
import { Form } from '../src/ts';
import createForm from '../src/factories/create-form';

const renderForm = ({ form }: { form: Form<any> }) => {
  const validateRequired = (value) => (value ? undefined : 'Field is required');

  type Values = {
    fields: Array<{ value: string; id: number | string }>;
  };

  const removeFirstElement = createEvent();

  const { $fieldsInline, $values } = form;

  $fieldsInline.on(removeFirstElement, (inlineState) => removeFromInlineMap(inlineState, 'fields[0]'));
  $values.on(removeFirstElement, (state) => setIn(state, 'fields', state.fields.slice(1)));

  interface InputProps {
    controller: Controller;
    label: string;
  }

  const Input: React.FC<InputProps> = ({ controller, label }) => {
    const { input, fieldState, form, error } = controller();

    const isShowError = form.submitted || form.hasOuterError || fieldState.blurred;

    return (
      <div role="wrapper-for-input" className="input-wrap">
        <label>{label}</label>
        <input {...input} value={input.value || ''} role="textbox" className="input" placeholder={label} />
        {isShowError && error && <span>{error}</span>}
      </div>
    );
  };

  const SimpleForm = () => {
    const { handleSubmit, controller } = useForm<Values>({ form });

    const { fields } = useUnit($values);

    return (
      <form onSubmit={handleSubmit}>
        {fields.map((el, i) => (
          <Input
            key={el.id}
            controller={controller({ name: `fields[${i}].value`, validate: validateRequired })}
            label={`value № ${i}`}
          />
        ))}
        <button type="submit">submit</button>
        <button type="button" onClick={() => removeFirstElement()}>
          remove first element
        </button>
      </form>
    );
  };

  render(<SimpleForm />);
};

const initialValues = {
  fields: [
    { value: '', id: 1 },
    { value: '', id: 2 },
  ],
};

describe('UnmountField', () => {
  test('render fields', () => {
    const form = createForm({ initialValues });
    renderForm({ form });
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toMatchSnapshot();
  });

  test('render fields after removed', () => {
    const form = createForm({ initialValues });
    renderForm({ form });
    const remove = screen.getByText('remove first element');
    fireEvent.click(remove);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toMatchSnapshot();
  });

  test('render fields after submit and removed', () => {
    const form = createForm({ initialValues });
    renderForm({ form });
    const submit = screen.getByText('submit');
    fireEvent.click(submit);
    const remove = screen.getByText('remove first element');
    fireEvent.click(remove);
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  });

  test('$form after submit and removed', () => {
    const form = createForm({ initialValues });
    renderForm({ form });
    const submit = screen.getByText('submit');
    fireEvent.click(submit);
    const remove = screen.getByText('remove first element');
    fireEvent.click(remove);
    expect(form.$form.getState()).toMatchSnapshot();
  });

  test('$errorsInline after submit > removed', () => {
    const form = createForm({ initialValues });
    renderForm({ form });
    const submit = screen.getByText('submit');
    fireEvent.click(submit);
    const remove = screen.getByText('remove first element');
    fireEvent.click(remove);
    expect(form.$errorsInline.getState()).toMatchSnapshot();
  });

  test('$errorsInline after submit > removed > submit', () => {
    const form = createForm({ initialValues });
    renderForm({ form });
    const submit = screen.getByText('submit');
    fireEvent.click(submit);
    const remove = screen.getByText('remove first element');
    fireEvent.click(remove);
    fireEvent.click(submit);
    expect(form.$errorsInline.getState()).toMatchSnapshot();
  });

  test('$values after change 1,2 > removed', () => {
    const form = createForm({ initialValues });
    renderForm({ form });
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'value 1' } });
    fireEvent.change(inputs[1], { target: { value: 'value 2' } });
    const remove = screen.getByText('remove first element');
    fireEvent.click(remove);
    expect(form.$values.getState()).toMatchSnapshot();
  });

  test('$values after removed > onChange("test")', () => {
    const form = createForm({ initialValues });
    renderForm({ form });
    const submit = screen.getByText('submit');
    fireEvent.click(submit);
    const remove = screen.getByText('remove first element');
    fireEvent.click(remove);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(form.$values.getState()).toMatchSnapshot();
  });
});
