import { render, screen, fireEvent } from '@testing-library/react';
import { createStore, sample } from 'effector';
import React from 'react'
import { ControllerField, createField, useField } from "../src";
import { initialFieldState } from '../src/default-states';

interface InputProps {
  controller: ControllerField;
  label: string;
}

const validateLength = ({ value }) => {
  if (value && value.length < 3) {
    return 'Min length is 3 characters'
  } else if (!value) {
    return 'Field is required'
  }
  return undefined;
}

const Input: React.FC<InputProps> = ({ controller, label }) => {
  const { input } = controller();

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
    </div>
  );
};

const Field = ({ field }) => {
  const { handleSubmit, controller, submit } = useField({ field });

  return (
    <form onSubmit={handleSubmit}>
      <Input label="Username" controller={controller()} />
      <button onClick={submit}>
        submit
      </button>
    </form>
  );
};

describe('Single field', () => {
  test('submit', () => {
    const field = createField();
    render(<Field field={field} />);
    const buttonSubmit = screen.getByText('submit')
    fireEvent.click(buttonSubmit);
    expect(field.$field.getState().submitted).toEqual(true);
  })

  test('submit snapshot', () => {
    const field = createField();
    render(<Field field={field} />);
    const buttonSubmit = screen.getByText('submit')
    fireEvent.click(buttonSubmit);
    const inputs = screen.getAllByRole('wrapper-for-input');
    expect(inputs).toMatchSnapshot();
  })

  test('onChange', () => {
    const field = createField();
    render(<Field field={field} />);
    const input = screen.getByPlaceholderText('Username');
    fireEvent.change(input, { target: { value: 'login' }});
    expect(field.$value.getState()).toBe('login');
  })

  test('validate minLength', () => {
    const field = createField({ validate: validateLength });
    render(<Field field={field} />);
    const input = screen.getByPlaceholderText('Username');
    const buttonSubmit = screen.getByText('submit')

    fireEvent.click(buttonSubmit);
    expect(field.$error.getState()).toEqual('Field is required');

    fireEvent.change(input, { target: { value: 'lo' } });
    fireEvent.click(buttonSubmit);
    expect(field.$error.getState()).toEqual('Min length is 3 characters');
  })

  test('Field inline', () => {
    const field = createField({ validate: validateLength });
    render(<Field field={field} />);

    expect(field.$fieldInline.getState()).toEqual(initialFieldState);

    const input = screen.getByPlaceholderText('Username');
    fireEvent.change(input, { target: { value: 'name' }});

    expect(field.$fieldInline.getState()).toEqual({ ...initialFieldState, changed: true });

    fireEvent.focus(input);
    expect(field.$fieldInline.getState()).toEqual({ ...initialFieldState, changed: true, touched: true, active: true });

    fireEvent.focusOut(input);
    expect(field.$fieldInline.getState()).toEqual({ ...initialFieldState, changed: true, touched: true, active: false, blurred: true });
  })

  test('Outer validation', () => {
    const field = createField({ validate: validateLength });
    const $outerErrorText = createStore('Outer error');

    sample({
      source: $outerErrorText,
      clock: field.onSubmit,
      target: field.setOrDeleteOuterError,
    })

    render(<Field field={field} />);

    expect(field.$fieldInline.getState()).toEqual(initialFieldState);

    const input = screen.getByPlaceholderText('Username');
    const buttonSubmit = screen.getByText('submit')

    fireEvent.click(buttonSubmit);
    expect(field.$outerError.getState()).toEqual('Outer error');

    
    fireEvent.focus(input);
    expect(field.$fieldInline.getState()).toEqual({
      ...initialFieldState,
      changed: false,
      touched: true,
      active: true,
      blurred: false,
      touchedAfterOuterError: true,
    });

    fireEvent.change(input, { target: { value: 'name' } });

    expect(field.$fieldInline.getState()).toEqual({
      ...initialFieldState,
      active: true,
      changed: true,
      touched: true,
      changedAfterOuterError: true,
      touchedAfterOuterError: true
    });


    fireEvent.focusOut(input);
    expect(field.$fieldInline.getState()).toEqual({
      ...initialFieldState,
      changed: true,
      touched: true,
      active: false,
      blurred: true,
      changedAfterOuterError: true,
      touchedAfterOuterError: true,
      blurredAfterOuterError: true
    });
  })
})