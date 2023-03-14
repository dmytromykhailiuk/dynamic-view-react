# JSON powered / Dynamic view and Forms in React

**A way to connect Dependency Injection Container to React applications**

(Formly clone for React! [Formly Docs](https://formly.dev/))

This package is using [react-reactive-form](https://github.com/bietkul/react-reactive-form) module under the hood!

## Installation

```sh
npm i @dmytromykhailiuk/dynamic-view-react
```

**Interesting packages**

- [Dependency Injection Container](https://www.npmjs.com/package/@dmytromykhailiuk/dependency-injection-container)
- [React Dependency Injection Module](https://www.npmjs.com/package/@dmytromykhailiuk/react-di-module)
- [RxJS React Redux Effects](https://www.npmjs.com/package/@dmytromykhailiuk/rx-react-redux-effect)
- [Condition Flow Engine](https://www.npmjs.com/package/@dmytromykhailiuk/condition-flow-engine)

## Example of usage

```typescript

import { DynamicViewComponent, DynamicView, TypeFn } from '@dmytromykhailiuk/dynamic-view-react';

const InputComponent: TypeFn = ({ config: {props}, handler, field: {touched, hasError} }) => { // example of Type declaration
  return (
    <div>
      <label>
        <span>{props.label}</span>
        <input {...handler()} />
      </label>
      <span>
        {touched && hasError('required') && 'Error message'}
      </span>
    </div>
  )}

DynamicView.registerControls([
  { name: 'submit-button', component: SubmitButtonComponent }
]);

DynamicView.registerTypes([
  { name: 'input', component: InputComponent },
  { name: 'checkbox', component: CheckboxComponent },
  { name: 'friends-list', component: FriendsListComponent },
]);

DynamicView.registerWrappers([
  { name: 'frind-information', component: InputComponent },
]);

const fields: FieldConfig[] = [
  {
    key: 'name',
    type: 'input',
    defaultValue: 'Andriy',
    props: {
      type: 'text',
      label: 'Your name',
      
    },
  },
  {
    key: 'email',
    type: 'input',
    props: {
      type: 'email',
      label: 'Your email',
    },
    expressions: {
      hide: 'model.name.length > 3'
    }
  },
  {
    key: 'password',
    type: 'input',
    props: {
      type: 'password',
      label: 'Your password',
    },
  },
  {
    key: 'isAdmin',
    type: 'checkbox',
    defaultValue: true,
    props: {
      type: 'checkbox',
      label: 'Are you admin?',
    },
  },
  {
    key: 'friends',
    type: 'friends-list',
    fieldArray: {
      wrappers: ['friend'],
      fieldGroup: [
        {
          key: 'name',
          type: 'input',
          props: {
            type: 'text',
            label: 'Friend name',
          },
        },
        {
          key: 'phone',
          type: 'input',
          props: {
            type: 'phone',
            label: 'Friend name',
          },
        },
      ],
    },
  },
  {
    control: 'submit-button',
  }
];

export const FormComponent = () => {

  const model = {
    //...
  }

  const formState = {
    //...
  }

  const onChange = (data) => {
    //...
  }

  const onSubmit = (data) => {
    //...
  }

  return (
    <DynamicViewComponent 
      fields={fields} // we can change "fields" on fly and DynamicView will rerender
      model={model} // we can change "model" on fly and DynamicView will rerender
      formState={formState} // we can change "formState" on fly and DynamicView will rerender
      onChange={onChange}
      onSubmit={onSubmit}
    />
  )
}

```
