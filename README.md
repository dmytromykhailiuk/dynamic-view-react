# React Dependency Injection Module

**A way to connect Dependency Injection Container to React applications**

(This package is using @dmytromykhailiuk/dependency-injection-container package)

## Installation

```sh
npm i @dmytromykhailiuk/react-di-module
```

**Interesting packages**

- [Dependency Injection Container](https://www.npmjs.com/package/@dmytromykhailiuk/dependency-injection-container)
- [React Dependency Injection Module](https://www.npmjs.com/package/@dmytromykhailiuk/react-di-module)
- [RxJS React Redux Effects](https://www.npmjs.com/package/@dmytromykhailiuk/rx-react-redux-effect)
- [Condition Flow Engine](https://www.npmjs.com/package/@dmytromykhailiuk/condition-flow-engine)

## Example of usage

```typescript

import { Module, useInject, useObservable } from '@dmytromykhailiuk/react-di-module';

const providers = [
  // ...
  UserStoreFacade,
  // ...
];

function App() {
  return (
    <Module providers={providers}>
      <UsersComponent/>
    </Module>
  );
}

function UsersComponent() {

  const userStoreFacade = useInject<UserStoreFacade>(UserStoreFacade);

  const users = useObservable<User[]>(userStoreFacade.users$);

  return // ... render users
}

```
