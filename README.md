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

import { DynamicViewComponent, DynamicView, FieldConfig, TypeFn, ControlFn, WrapperFn } from '@dmytromykhailiuk/dynamic-view-react';

const Input: TypeFn = ({ handler, config }) => {
  return (
    <div>
      {config?.props?.label && <div>{ config?.props?.label }</div>}
      <input {...handler()} placeholder={config?.props?.placeholder || ''} />
    </div>
  )
}

const FriendsList: TypeFn = ({ children, add }: any) => (
  <div>
    <h2>Friends list</h2>
    { children }
    <button style={{ marginTop: '30px' }} onClick={add}>Add friend</button>
  </div>
);

const Checkbox: TypeFn = ({ handler, config: { props: { label } } }) => {
  return <div>
    <input {...handler('checkbox')} />
    <span>{ label }</span>
  </div> 
}

const SubmitButton: ControlFn = memo(({ submit }) => {
  return <button style={{ marginTop: '30px' }} onClick={submit}>Submit</button>
});

const FriendInformation: WrapperFn = ({ children, control }) => {
  const position = ((control.parent as FormArray).controls || []).findIndex(el => el === control) + 1;

  const removeFriendInformation = useCallback(() => {
    control.parent.meta.remove(position - 1);
  }, [position])

  return <div>
    <h4>Friend { position } Information</h4>
    { children }
    <button onClick={removeFriendInformation}>remove friend information</button>
  </div>
}

DynamicView.registerTypes([
  { name: 'input', component: Input },
  { name: 'checkbox', component: Checkbox },
  { name: 'friends-list', component: FriendsList }
]);

DynamicView.registerControls([
  { name: 'submit-button', component: SubmitButton }
]);

DynamicView.registerWrappers([
  { name: 'friend-information', component: FriendInformation }
]);

const fields: FieldConfig[] = [
  {
    key: 'firstName',
    type: 'input',
    props: {
      label: 'Your First Name',
      placeholder: 'Write your first name...'
    },
    expressions: {
      'props.label': 'String(model?.firstName || "").split(" ").length > 1 ? "Your Full Name" : "Your First Name"'
    }
  },
  {
    key: 'secondName',
    type: 'input',
    props: {
      label: 'Your Second Name',
      placeholder: 'Write your second name...'
    },
    expressions: {
      hide: 'String(model?.firstName || "").split(" ").length > 1'
    }
  },
  {
    key: 'showFriendsList',
    type: 'checkbox',
    props: {
      label: 'Show friends list'
    }
  },
  {
    key: 'friends',
    type: 'friends-list',
    expressions: {
      hide: '!model?.showFriendsList'
    },
    fieldArray: {
      wrappers: ['friend-information'],
      fieldGroup: [
        {
          key: 'name',
          type: 'input',
          props: {
            label: 'Friend Name',
            placeholder: 'Write your friend name...'
          }
        },
        {
          key: 'phoneNumber',
          type: 'input',
          props: {
            label: 'Friend phone number',
            placeholder: 'Write your friend phone number...'
          }
        }
      ]
    }
  },
  {
    control: 'submit-button'
  }
]

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
