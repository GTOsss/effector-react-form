# Effector-react-form
Connect your forms with state manager
## Visit [effector-react-form.webstap](https://effector-react-form.webstap.ru/en) to see full documentation and examples.

<h2>QuikStart</h2>

<h3>Install</h3>

    # Yarn
    yarn add effector-react-form

    # NPM
    npm install --save effector-react-form

<h3>Short example</h3>
<span>Create single form</span>

    import { createForm } from 'effector-react-form';

    const form = createForm<Values>({
      initialValues: {
        userName: '',
        email: '',
        password: '',
        repeatPassword: '',
      },
      onSubmit: ({ values }) => // your post method,
    });
  
<span>Set this form to our jsx</span>
    
    import { useForm } from 'effector-react-form';
    
    const validateFields = (value) => {
      if (!value) return 'Field is required';
      if (value.length < 4) return 'Minimum of 4 characters';
      return undefined;
    };

    const Form = () => {
      const { controller, handleSubmit, submit } = useForm({ form: formSignIn });
      return (
        <form onSubmit={handleSubmit}>
          <Input label="Name" controller={controller({ name: 'userName', validate: validateFields })} />
          <Input label="Name" controller={controller({ name: 'email', validate: validateFields })} />
          <Input label="Password" controller={controller({ name: 'password', validate: validateFields })} />
          <Input label="Repeat password" controller={controller({ name: 'repeatPassword', validate: validateFields })} />
          <button onClick={submit}>
            submit
          </button>
        </form>
      );
    };
<span>Custom Input component</span>

    const Input = ({ controller, label }) => {
      const { input,isShowError, error } = controller();

      return (
        <div className="input-wrap">
          <label>{label}</label>
          <input {...input} value={input.value || ''} className={'input'} />
          {isShowError && <div className="input-error-message">{error}</div>}
        </div>
      );
    };
    
<h3>createForm arguments</h3>
Accepts an object with following optional params:

<b>name</b>: form name

<b>validate</b>: function, for validation values of the form.

Example:

    const validateForm = ({ values }) => {
      const errors = {};

      if (values.newPassword !== values.repeatPassword) {
        errors.newPassword = 'passwordsDontMatch';
        errors.repeatPassword = 'passwordsDontMatch';
      }

      if (values.newPassword && values.newPassword === values.oldPassword) {
        errors.newPassword = 'passwordMustDiffer';
      }

      return errors;
    };
    


<b>mapSubmit</b>: a function that transforms data that received from the form fields before passing it to the onSubmit function.
 
<b>onSubmit</b>: a function that fires on a form submit even. 

<b>onSubmitGuardFn</b>: before the onSubmit function is executed, the value of this field is checked. By default, it contains a predicate function that checks if there are validation errors in form fields. If there are no errors, it returns true and onSubmit is triggered. You can pass your own predicate function that will accept the values ​​of the form fields and an object with meta.

<b>onChange</b>: a function that`s triggered when the form fields change.
<b>onChangeGuardFn</b>: before the onChange function is executed, the value of this field is checked. By default, it contains a predicate function that checks if there are validation errors in form fields. If there are no errors, it will return true and onChange will be fired. You can pass your own predicate function that will accept the values of the form fields and an object with meta.
 
<b>initalValues</b>: an object with initial values of your form fields.

Example:

    const initialValues = {
      name: "John",
      lastName: "Smith"
    }

<b>initialMeta</b>: an object with initial values of your form fields.
 
<b>domain</b>: takes Effector-domain in which stores and form events will be created.

<b>resetOuterErrorsBySubmit</b>: takes true / false. Determines whether outer form errors should be cleared on the onSubmit event. The default is true.

<b>resetOuterErrorByOnChange</b>: takes true / false. Determines whether outer form errors should be cleared on the onChange event. The default is true.

[Docs](https://effector-react-form.webstap.ru/en/api/unit-creators/create-form) and [Examples](https://effector-react-form.webstap.ru/en/examples/simple-form)
