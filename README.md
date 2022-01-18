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

<b>initalValues</b>: an object with initial values of your form fields.

Example:
    const initialValues = {
      name: "John",
      lastName: "Smith"
    }
 <b>meta</b>: an object with initial values of your form fields.

Example:

    const initialValues = {
      name: "John",
      lastName: "Smith"
    }

 <b>mapSubmit</b>: an object with initial values of your form fields.

Example:
    const initialValues = {
      name: "John",
      lastName: "Smith"
    }
<b>onSubmit</b>: an object with initial values of your form fields.

Example:
    const initialValues = {
      name: "John",
      lastName: "Smith"
    }
<b>mapOnChange</b>: an object with initial values of your form fields.

Example:
    const initialValues = {
      name: "John",
      lastName: "Smith"
    }
<b>onChange</b>: an object with initial values of your form fields.

Example:
    const initialValues = {
      name: "John",
      lastName: "Smith"
    }

[Examples](https://effector-react-form.webstap.ru/en/examples/simple-form)
