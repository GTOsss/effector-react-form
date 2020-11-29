import { Controller } from '../src/ts';
import React from 'react';
import { useForm, useFieldArray } from '../src';
import { render, screen, fireEvent } from '@testing-library/react';
import { createEvent } from 'effector';
import createForm from '../src/factories/create-form';
import createFieldArray from '../src/factories/create-field-array';

let counterGlobal = 0;
const getId = () => (counterGlobal += 1);

const reset = createEvent();

reset.watch(() => (counterGlobal = 0));

interface InputProps {
  controller: Controller;
  label: string;
}

const validateRequired = (value) => (value ? undefined : 'Field is required');

const Input: React.FC<InputProps> = ({ controller, label }) => {
  const { input, fieldState, form, error } = controller();

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
      {isShowError && <span>{error}</span>}
    </div>
  );
};

const FormItemsInner = ({ controller, name, onPushInner, fieldArray }) => {
  const { map, push, remove } = useFieldArray({ name, fieldArray });

  return (
    <div className="formItemsInner" role="formItemsInner">
      {map(({ formItemName, index, field }) => (
        <div key={field.id} className="formItem" role="formItemInner">
          <Input
            label="Username"
            controller={controller({ name: `${formItemName}.username`, validate: validateRequired })}
          />
          <Input
            label="First name"
            controller={controller({ name: `${formItemName}.profile.firstName`, validate: validateRequired })}
          />
          <button type="button" onClick={() => remove(index)}>
            remove form item inner
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onPushInner(push)}>
        add inner form item
      </button>
    </div>
  );
};

const FormItems = ({ controller, name, onPush, onPushInner, fieldArray }) => {
  const { map, push, remove } = useFieldArray({ name, fieldArray });

  return (
    <div className="formItems" role="formItems">
      {map(({ formItemName, index, field }) => (
        <div key={field.id} className="formItem" role="formItem">
          <Input
            label="Username"
            controller={controller({ name: `${formItemName}.username`, validate: validateRequired })}
          />
          <Input
            label="First name"
            controller={controller({ name: `${formItemName}.profile.firstName`, validate: validateRequired })}
          />

          <FormItemsInner
            controller={controller}
            name={`${formItemName}.inners`}
            onPushInner={onPushInner}
            fieldArray={fieldArray}
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

const FieldArray = ({ form, fieldArray, onPush, onPushInner }: any) => {
  const { handleSubmit, controller } = useForm({ form: form });

  return (
    <form onSubmit={handleSubmit}>
      <FormItems
        name="parents"
        fieldArray={fieldArray}
        controller={controller}
        onPush={onPush}
        onPushInner={onPushInner}
      />
      <button type="submit">submit</button>
    </form>
  );
};

describe('FieldArray', () => {
  test('render', () => {
    reset();
    const form = createForm();
    const fieldArray = createFieldArray({ form });
    render(<FieldArray form={form} fieldArray={fieldArray} onPush={() => null} />);
    const formItems = screen.getAllByRole('formItems');
    expect(formItems).toMatchSnapshot();
  });

  test('add form item with values > render', () => {
    reset();
    const form = createForm();
    const fieldArray = createFieldArray({ form });
    render(
      <FieldArray
        form={form}
        fieldArray={fieldArray}
        onPush={(push) => push({ id: getId(), username: 'gto', profile: { firstName: 'Timofey' } })}
      />,
    );
    const addFormItem = screen.getByText('add form item with values');
    fireEvent.click(addFormItem);
    const formItems = screen.getAllByRole('formItems');
    expect(formItems).toMatchSnapshot();
  });

  test('add form item with values > $values', () => {
    reset();
    const form = createForm();
    const fieldArray = createFieldArray({ form });
    render(
      <FieldArray
        form={form}
        fieldArray={fieldArray}
        onPush={(push) => push({ id: getId(), username: 'gto', profile: { firstName: 'Timofey' } })}
      />,
    );
    const addFormItem = screen.getByText('add form item with values');
    fireEvent.click(addFormItem);
    expect(form.$values.getState()).toMatchSnapshot();
  });

  test('add form item with values (x3) > $values', () => {
    reset();
    const formItems = [
      { id: getId(), username: '0' },
      { id: getId(), username: '1' },
      { id: getId(), username: '2' },
    ];
    const form = createForm();
    const fieldArray = createFieldArray({ form });

    let counter = 0;
    const onPush = (push) => {
      push(formItems[counter++]);
    };
    render(<FieldArray form={form} fieldArray={fieldArray} onPush={onPush} />);
    const addFormItem = screen.getByText('add form item with values');
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    expect(form.$values.getState()).toMatchSnapshot();
  });

  test('add form item with values (x3) > remove(1) > $values', () => {
    reset();
    const formItems = [
      { id: getId(), username: '0' },
      { id: getId(), username: '1' },
      { id: getId(), username: '2' },
    ];
    const form = createForm();
    const fieldArray = createFieldArray({ form });

    let counter = 0;
    const onPush = (push) => {
      push(formItems[counter++]);
    };
    render(<FieldArray form={form} fieldArray={fieldArray} onPush={onPush} />);
    const addFormItem = screen.getByText('add form item with values');
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    const removeFormItem = screen.getAllByText('remove form item');
    fireEvent.click(removeFormItem[1]);
    expect(form.$values.getState()).toMatchSnapshot();
  });

  test('add form item with values (x3) > remove(1) > $fieldsInline', () => {
    reset();
    const formItems = [
      { id: getId(), username: '0' },
      { id: getId(), username: '1' },
      { id: getId(), username: '2' },
    ];
    const form = createForm();
    const fieldArray = createFieldArray({ form });

    let counter = 0;
    const onPush = (push) => {
      push(formItems[counter++]);
    };
    render(<FieldArray form={form} fieldArray={fieldArray} onPush={onPush} />);
    const addFormItem = screen.getByText('add form item with values');
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    const removeFormItem = screen.getAllByText('remove form item');
    fireEvent.click(removeFormItem[1]);
    expect(form.$fieldsInline.getState()).toMatchSnapshot();
  });

  test('add form item with values (x3) > add inner (x3) > $values', () => {
    reset();
    const formItems = [
      { id: getId(), username: '0' },
      { id: getId(), username: '1' },
      { id: getId(), username: '2' },
    ];
    const form = createForm();
    const fieldArray = createFieldArray({ form });

    let counter = 0;
    const onPush = (push) => {
      push(formItems[counter++]);
    };

    const formItemsInner = [
      { id: getId(), username: 'inner 0' },
      { id: getId(), username: 'inner 1' },
      { id: getId(), username: 'inner 2' },
    ];
    let counterInner = 0;
    const onPushInner = (push) => {
      push(formItemsInner[counterInner++]);
    };

    render(<FieldArray form={form} fieldArray={fieldArray} onPush={onPush} onPushInner={onPushInner} />);
    const addFormItem = screen.getByText('add form item with values');
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    const addFormItemInner = screen.getAllByText('add inner form item');
    fireEvent.click(addFormItemInner[0]);
    fireEvent.click(addFormItemInner[1]);
    fireEvent.click(addFormItemInner[2]);
    expect(form.$values.getState()).toMatchSnapshot();
  });

  test('add form item with values (x3) > add inner (x3) > render', () => {
    reset();
    const formItems = [
      { id: getId(), username: '0' },
      { id: getId(), username: '1' },
      { id: getId(), username: '2' },
    ];
    let counter = 0;
    const onPush = (push) => {
      push(formItems[counter++]);
    };

    const formItemsInner = [
      { id: getId(), username: 'inner 0' },
      { id: getId(), username: 'inner 1' },
      { id: getId(), username: 'inner 2' },
    ];
    let counterInner = 0;
    const onPushInner = (push) => {
      push(formItemsInner[counterInner++]);
    };

    const form = createForm();
    const fieldArray = createFieldArray({ form });
    render(<FieldArray form={form} fieldArray={fieldArray} onPush={onPush} onPushInner={onPushInner} />);
    const addFormItem = screen.getByText('add form item with values');
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    const addFormItemInner = screen.getAllByText('add inner form item');
    fireEvent.click(addFormItemInner[0]);
    fireEvent.click(addFormItemInner[1]);
    fireEvent.click(addFormItemInner[2]);
    const formItemsDom = screen.getByRole('formItems');
    expect(formItemsDom).toMatchSnapshot();
  });

  test('add form item with values (x3) > add inner (x3) > remove form item 1 > $values', () => {
    reset();
    const formItems = [
      { id: getId(), username: '0' },
      { id: getId(), username: '1' },
      { id: getId(), username: '2' },
    ];
    let counter = 0;
    const onPush = (push) => {
      push(formItems[counter++]);
    };

    const formItemsInner = [
      { id: getId(), username: 'inner 0' },
      { id: getId(), username: 'inner 1' },
      { id: getId(), username: 'inner 2' },
    ];
    let counterInner = 0;
    const onPushInner = (push) => {
      push(formItemsInner[counterInner++]);
    };

    const form = createForm();
    const fieldArray = createFieldArray({ form });
    render(<FieldArray form={form} fieldArray={fieldArray} onPush={onPush} onPushInner={onPushInner} />);
    const addFormItem = screen.getByText('add form item with values');
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    const addFormItemInner = screen.getAllByText('add inner form item');
    fireEvent.click(addFormItemInner[0]);
    fireEvent.click(addFormItemInner[1]);
    fireEvent.click(addFormItemInner[2]);
    const removeFormItem = screen.getAllByText('remove form item');
    fireEvent.click(removeFormItem[1]);
    expect(form.$values.getState()).toMatchSnapshot();
  });

  test('add form item with values (x3) > add inner (x3) > remove form item 1 > render', () => {
    reset();
    const formItems = [
      { id: getId(), username: '0' },
      { id: getId(), username: '1' },
      { id: getId(), username: '2' },
    ];
    let counter = 0;
    const onPush = (push) => {
      push(formItems[counter++]);
    };

    const formItemsInner = [
      { id: getId(), username: 'inner 0' },
      { id: getId(), username: 'inner 1' },
      { id: getId(), username: 'inner 2' },
    ];
    let counterInner = 0;
    const onPushInner = (push) => {
      push(formItemsInner[counterInner++]);
    };

    const form = createForm();
    const fieldArray = createFieldArray({ form });
    render(<FieldArray form={form} fieldArray={fieldArray} onPush={onPush} onPushInner={onPushInner} />);
    const addFormItem = screen.getByText('add form item with values');
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    const addFormItemInner = screen.getAllByText('add inner form item');
    fireEvent.click(addFormItemInner[0]);
    fireEvent.click(addFormItemInner[1]);
    fireEvent.click(addFormItemInner[2]);
    const removeFormItem = screen.getAllByText('remove form item');
    fireEvent.click(removeFormItem[1]);
    const formItemsDom = screen.getByRole('formItems');
    expect(formItemsDom).toMatchSnapshot();
  });

  test('add form item with values (x2) > remove 1 > add inner 0 (x1) > $values', () => {
    reset();
    const formItems = [
      { id: getId(), username: '0' },
      { id: getId(), username: '1' },
    ];
    let counter = 0;
    const onPush = (push) => {
      push(formItems[counter++]);
    };

    const formItemsInner = [
      { id: getId(), username: 'inner 0' },
      { id: getId(), username: 'inner 1' },
    ];
    let counterInner = 0;
    const onPushInner = (push) => {
      push(formItemsInner[counterInner++]);
    };

    const form = createForm();
    const fieldArray = createFieldArray({ form });
    render(<FieldArray form={form} fieldArray={fieldArray} onPush={onPush} onPushInner={onPushInner} />);
    const addFormItem = screen.getByText('add form item with values');
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    const removeFormItem = screen.getAllByText('remove form item');
    fireEvent.click(removeFormItem[0]);
    const addFormItemInner = screen.getAllByText('add inner form item');
    fireEvent.click(addFormItemInner[0]);
    expect(form.$values.getState()).toMatchSnapshot();
  });

  test('add form item with values (x2) > remove 1 > add inner 0 (x1) > render', () => {
    reset();
    const formItems = [
      { id: getId(), username: '0' },
      { id: getId(), username: '1' },
    ];
    let counter = 0;
    const onPush = (push) => {
      push(formItems[counter++]);
    };

    const formItemsInner = [
      { id: getId(), username: 'inner 0' },
      { id: getId(), username: 'inner 1' },
    ];
    let counterInner = 0;
    const onPushInner = (push) => {
      push(formItemsInner[counterInner++]);
    };

    const form = createForm();
    const fieldArray = createFieldArray({ form });
    render(<FieldArray form={form} fieldArray={fieldArray} onPush={onPush} onPushInner={onPushInner} />);
    const addFormItem = screen.getByText('add form item with values');
    fireEvent.click(addFormItem);
    fireEvent.click(addFormItem);
    const removeFormItem = screen.getAllByText('remove form item');
    fireEvent.click(removeFormItem[0]);
    const addFormItemInner = screen.getAllByText('add inner form item');
    fireEvent.click(addFormItemInner[0]);
    const formItemsDom = screen.getByRole('formItems');
    expect(formItemsDom).toMatchSnapshot();
  });
});
