import React, { JSXElementConstructor, memo, ReactElement, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  FieldGroup,
  FieldArray,
  FieldControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormArray,
  ValidationErrors,
  InputType,
  Handler,
  ValidatorFn as Validator,
  AsyncValidatorFn as AsyncValidator,
} from 'react-reactive-form';

export interface FieldConfig {
  defaultValue?: any;
  control?: string;
  modelOptions?: {
    updateOn: 'change' | 'blur' | 'submit';
  };
  key?: string;
  type?: string;
  props?: {
    [key: string]: any;
  };
  fieldGroup?: FieldConfig[];
  fieldArray?: FieldConfig;
  hide?: boolean;
  expressions?: {
    [key: string]: string;
  };
  wrappers?: string[];
}

const getDefaultModelFromConfig = (config: any[]): any => {
  return config.reduce((acc, el) => {
    if (!el.key && el.fieldGroup && !el.fieldArray) {
      const modelFromParent = el.defaultValue || {};

      const modelFromChildren = getDefaultModelFromConfig(el.fieldGroup);

      return { ...acc, ...modelFromParent, ...modelFromChildren };
    }

    if (el.key && 'defaultValue' in el && !el.fieldGroup && !el.fieldArray) {
      return { ...acc, [el.key]: el.defaultValue };
    }

    if (el.key && el.fieldGroup && !el.fieldArray) {
      const modelFromParent = el.defaultValue || {};

      const modelFromChildren = getDefaultModelFromConfig(el.fieldGroup);

      return { ...acc, [el.key]: { ...modelFromParent, ...modelFromChildren } };
    }

    if (el.key && el.fieldArray) {
      const modelFromParent: any[] = el.defaultValue || [];

      const modelFromChildren = getDefaultModelFromConfig([el.fieldArray]);

      return { ...acc, [el.key]: modelFromParent.map((el) => ({ ...el, ...modelFromChildren })) };
    }

    return acc;
  }, {});
};

type MemorizedElement = ReactElement<any, string | JSXElementConstructor<any>> | null;

export type WrapperFn = (input: {
  control: FormGroup | FormControl | FormArray;
  config: any;
  formState: React.MutableRefObject<{ [key: string]: any }>;
  model: React.MutableRefObject<{ [key: string]: any }>;
  submit: () => void;
  children: JSX.Element;
}) => JSX.Element | MemorizedElement;

export type ControlFn = (input: {
  control: FormGroup | FormControl | FormArray;
  config: any;
  formState: React.MutableRefObject<{ [key: string]: any }>;
  model: React.MutableRefObject<{ [key: string]: any }>;
  submit: () => void;
  children?: JSX.Element;
}) => JSX.Element | MemorizedElement;

export type TypeFn<T = FormGroup | FormControl | FormArray> = (input: {
  handler:
    | ((inputType?: InputType | undefined, value?: string | undefined) => Handler)
    | ((inputType?: InputType | undefined, value?: string | undefined) => Handler);
  control: T;
  field: T;
  config: any;
  formState: React.MutableRefObject<{ [key: string]: any }>;
  model: React.MutableRefObject<{ [key: string]: any }>;
  submit: () => void;
  children?: JSX.Element;
}) => JSX.Element | MemorizedElement;

export type TypeArrayFn = TypeFn<FormArray> & {
  add: (index?: number) => void;
  remove: (index?: number) => void;
};

export type ValidatorFn = Validator;
export type AsyncValidatorFn = AsyncValidator;

const allWrappers: { [key: string]: WrapperFn } = {};
const allControls: { [key: string]: ControlFn } = {};
const allValidators: { [key: string]: ValidatorFn } = {};
const allAsyncValidators: { [key: string]: AsyncValidatorFn } = {};
const allTypes: { [key: string]: TypeFn } = {};

export const DynamicView = {
  registerWrappers: (wrappers: { name: string; component: WrapperFn }[]) => {
    wrappers.forEach(({ name, component }) => {
      if (allWrappers[name]) {
        throw new Error(`You already registered "${name}" Wrapper!`);
      }

      allWrappers[name] = component;
    });
  },
  registerControls: (controls: { name: string; component: ControlFn }[]) => {
    controls.forEach(({ name, component }) => {
      if (allControls[name]) {
        throw new Error(`You already registered "${name}" Control!`);
      }

      allControls[name] = component;
    });
  },
  registerTypes: (types: { name: string; component: TypeFn }[]) => {
    types.forEach(({ name, component }) => {
      if (allTypes[name]) {
        throw new Error(`You already registered "${name}" Type!`);
      }

      allTypes[name] = component;
    });
  },
  registerValidators: (validators: { name: string; component: ValidatorFn }[]) => {
    validators.forEach(({ name, component }) => {
      if (allValidators[name]) {
        throw new Error(`You already registered "${name}" Validator!`);
      }

      allValidators[name] = component;
    });
  },
  registerAsyncValidators: (asyncValidators: { name: string; component: AsyncValidatorFn }[]) => {
    asyncValidators.forEach(({ name, component }) => {
      if (allAsyncValidators[name]) {
        throw new Error(`You already registered "${name}" AsyncValidator!`);
      }

      allAsyncValidators[name] = component;
    });
  },
};

const RenderWrappers = memo(
  ({ control, config, wrappers = config.wrappers || [], formState, model, children, submit }: any) =>
    wrappers.reduce((acc: any, wrapper: any) => {
      const Wrapper = allWrappers[wrapper];

      if (!Wrapper) {
        throw new Error(`Wrapper "${wrapper}" was not regitered!`);
      }

      return (
        <Wrapper control={control} config={config} formState={formState} model={model} submit={submit}>
          {acc}
        </Wrapper>
      );
    }, children),
);

const getValidatorsByConfig = (config: any) =>
  (config.validators || []).map((validator: string) => {
    if (!allValidators[validator]) {
      throw new Error(`Validator "${validator}" was not regitered!`);
    }
    return allValidators[validator];
  });

const getAsyncValidatorsByConfig = (config: any) =>
  (config.asyncValidators || []).map((asyncValidator: string) => {
    if (!allAsyncValidators[asyncValidator]) {
      throw new Error(`AsyncValidator "${asyncValidator}" was not regitered!`);
    }
    return allAsyncValidators[asyncValidator];
  });

const updateObjectByPath = (object: any, path: any[], value: any) => {
  path.reduce((acc, el, index) => {
    if (index === path.length - 1) {
      acc[el] = value;
    }

    return acc[el];
  }, object);

  return { ...object };
};

const getValueByPath = (object: any, path: any) => path.reduce((acc: any, el: any) => acc[el], object);

const setModelByPath = (localModelRef: any, path: any[], value: any) => {
  localModelRef.current = updateObjectByPath(localModelRef.current, path, value);
};

const createChildControl = (config: any, model: any) => {
  const validators = getValidatorsByConfig(config);
  const asyncValidators = getAsyncValidatorsByConfig(config);
  const updateOn = config.modelOptions?.updateOn || 'change';

  if (config.fieldArray) {
    return new FormArray([], { validators, asyncValidators, updateOn });
  }
  if (config.fieldGroup) {
    return new FormGroup({}, { validators, asyncValidators, updateOn });
  }
  return new FormControl(model ?? config.defaultValue, { validators, asyncValidators, updateOn });
};

const UpdateModelWithControlValueComponent = ({ model, control, path, children, debounce }: any) => {
  useEffect(() => {
    control.valueChanges.subscribe((value: any) => {
      if (getValueByPath(model.current, path) !== value) {
        setModelByPath(model, path, value);
      }
    });

    return () => {
      control.valueChanges.unsubscribe();
    };
  }, [model]);

  return <>{children}</>;
};

const runExpressions = (config: any, fieldState: any, model: any, formState: any, field: any) => {
  const _ = { model, fieldState, formState, field };

  if (!config.expressions) {
    return config;
  }

  return Object.entries(config.expressions).reduce(
    (acc, [key, expression]) => {
      const path = key.split('.');

      try {
        return updateObjectByPath(acc, path, eval(expression as string));
      } catch (e) {
        console.error(e);
        return acc;
      }
    },
    { ...config },
  );
};

function areEqual(prevProps: any, nextProps: any) {
  return (
    prevProps.modelData === nextProps.modelData &&
    JSON.stringify(prevProps.formState) === JSON.stringify(nextProps.formState) &&
    prevProps.control.valid === nextProps.control.valid &&
    JSON.stringify(prevProps.control.errors) === JSON.stringify(nextProps.control.errors) &&
    prevProps.control.touched === nextProps.control.touched &&
    JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config) &&
    prevProps.dirty === nextProps.dirty
  );
}

const FieldResolver = memo(({ config: oldConfig, model, formState, control, path, submit }: any) => {
  const config = runExpressions(
    oldConfig,
    getValueByPath(model.current, path),
    model.current,
    formState.current,
    control,
  );

  if (config.hide) {
    return <></>;
  }

  if (config.control) {
    if (!allControls[config.control]) {
      throw new Error(`Control "${config.control}" was not regitered!`);
    }

    const Control = allControls[config.control];

    return (
      <RenderWrappers control={control} model={model} config={config} formState={formState} submit={submit}>
        <Control control={control} model={model} config={config} formState={formState} submit={submit} />
      </RenderWrappers>
    );
  }

  if (!config.key && config.fieldGroup) {
    return (
      <RenderWrappers control={control} model={model} config={config} formState={formState} submit={submit}>
        {config.fieldGroup.map((config: any, i: number) => {
          let childControl = control;

          if (config.key && !control.get(config.key)) {
            childControl = createChildControl(config, getValueByPath(model.current, [...path, config.key]));
            control.addControl(config.key, childControl);
          }

          if (config.key && control.get(config.key)) {
            childControl = control.get(config.key);
          }

          const updatedConfig = runExpressions(
            config,
            getValueByPath(model.current, config.key ? [...path, config.key] : path),
            model.current,
            formState.current,
            childControl,
          );

          if (updatedConfig.hide) {
            return <></>;
          }

          return (
            <RenderWrappers
              control={childControl}
              key={i}
              model={model}
              config={updatedConfig}
              formState={formState}
              submit={submit}
            >
              <FieldResolver
                config={updatedConfig}
                formState={formState}
                model={model}
                modelData={JSON.stringify(
                  getValueByPath(model.current, updatedConfig.key ? [...path, updatedConfig.key] : path),
                )}
                control={childControl}
                path={updatedConfig.key ? [...path, updatedConfig.key] : path}
                submit={submit}
              />
            </RenderWrappers>
          );
        })}
      </RenderWrappers>
    );
  }

  if (config.key && !config.fieldGroup && !config.fieldArray) {
    if (getValueByPath(model.current, path) !== undefined && getValueByPath(model.current, path) !== control.value) {
      control.setValue(getValueByPath(model.current, path));
    }

    if (!allTypes[config.type]) {
      throw new Error(`Type "${config.type}" was not regitered!`);
    }

    const Type = allTypes[config.type];

    const updatedConfig = runExpressions(
      config,
      getValueByPath(model.current, path),
      model.current,
      formState.current,
      control,
    );

    if (updatedConfig.hide) {
      return <></>;
    }

    return (
      <RenderWrappers control={control} model={model} config={updatedConfig} formState={formState} submit={submit}>
        <FieldControl
          name={updatedConfig.key}
          options={{
            validators: getValidatorsByConfig(updatedConfig),
            asyncValidators: getAsyncValidatorsByConfig(updatedConfig),
          }}
          meta={{ config: updatedConfig, formState, model, fieldState: getValueByPath(model.current, path) }}
          render={({ handler, meta, ...rest }) => (
            <UpdateModelWithControlValueComponent
              debounce={meta.config.modelOptions?.debounce}
              model={model}
              control={control}
              path={path}
              setModelByPath={setModelByPath}
            >
              <Type {...(meta as any)} handler={handler} field={{ ...rest } as any} />
            </UpdateModelWithControlValueComponent>
          )}
        />
      </RenderWrappers>
    );
  }

  if (config.key && config.fieldArray) {
    if (!allTypes[config.type]) {
      throw new Error(`Type "${config.type}" was not regitered!`);
    }

    const Type = allTypes[config.type];

    if (control.value.length > getValueByPath(model.current, path).length) {
      [...new Array(control.value.length - getValueByPath(model.current, path).length)].forEach(() => {
        control.removeAt(control.value.length - 1);
      });
    }

    if (control.value.length < getValueByPath(model.current, path).length) {
      [...new Array(getValueByPath(model.current, path).length - control.value.length)].forEach((_, i) => {
        let childControl = createChildControl(
          config.fieldArray,
          getValueByPath(model.current, path)[control.value.length + i],
        );

        control.push(childControl);
      });
    }

    const add = (beforeIndex?: number) => {
      if (beforeIndex === undefined || typeof beforeIndex !== 'number') {
        setModelByPath(
          model,
          [...path, control.controls.length],
          getDefaultModelFromConfig(config.fieldArray.fieldGroup || []),
        );
        control.push(createChildControl(config.fieldArray, undefined));
      } else {
        setModelByPath(model, path, [
          ...getValueByPath(model.current, path).slice(0, beforeIndex),
          getDefaultModelFromConfig(config.fieldArray.fieldGroup || []),
          ...getValueByPath(model.current, path).slice(beforeIndex),
        ]);
        control.insert(beforeIndex, createChildControl(config.fieldArray, undefined));
      }
    };

    const remove = (index?: number) => {
      if (!control.controls.length) {
        return;
      }

      const indexToRemove = index !== undefined && typeof index === 'number' ? index : control.controls.length - 1;

      setModelByPath(model, path, [
        ...getValueByPath(model.current, path).slice(0, indexToRemove),
        ...getValueByPath(model.current, path).slice(indexToRemove + 1),
      ]);
      control.removeAt(indexToRemove);
    };

    return (
      <RenderWrappers control={control} model={model} config={config} formState={formState} submit={submit}>
        <FieldArray
          control={control}
          name={config.key}
          meta={{
            config,
            path,
            control,
            formState,
            model,
            fieldState: getValueByPath(model.current, path),
            add,
            remove,
          }}
          render={({ handler, meta: { control, path, ...meta }, ...rest }) => (
            <UpdateModelWithControlValueComponent
              debounce={meta.config.modelOptions?.debounce}
              model={meta.model}
              control={control}
              path={path}
              setModelByPath={setModelByPath}
            >
              <Type {...(meta as any)} handler={handler} field={{ ...rest } as any}>
                <>
                  {(getValueByPath(model.current, path) || []).map((_: any, i: number) => {
                    const updatedConfig = runExpressions(
                      meta.config,
                      getValueByPath(model.current, [...path, i]),
                      model.current,
                      formState.current,
                      control,
                    );

                    if (updatedConfig.hide) {
                      return (
                        <RenderWrappers
                          key={i}
                          control={control.at(i)}
                          model={model}
                          config={updatedConfig.fieldArray}
                          formState={formState}
                          submit={submit}
                        ></RenderWrappers>
                      );
                    }

                    return (
                      <RenderWrappers
                        key={i}
                        control={control.at(i)}
                        model={model}
                        config={updatedConfig.fieldArray}
                        formState={formState}
                        submit={submit}
                      >
                        <FieldGroup
                          control={control.at(i)}
                          meta={{
                            config: updatedConfig,
                            formState,
                            model,
                            fieldState: getValueByPath(model.current, [...path, i]),
                          }}
                          render={() => (
                            <FieldResolver
                              config={{ fieldGroup: meta.config.fieldArray.fieldGroup || meta.config.fieldArray }}
                              model={model}
                              modelData={JSON.stringify(getValueByPath(model.current, [...path, i]))}
                              formState={formState}
                              control={control.at(i)}
                              path={[...path, i]}
                              submit={submit}
                            />
                          )}
                        />
                      </RenderWrappers>
                    );
                  })}
                </>
              </Type>
            </UpdateModelWithControlValueComponent>
          )}
        />
      </RenderWrappers>
    );
  }

  if (config.key && config.fieldGroup) {
    if (!allTypes[config.type]) {
      throw new Error(`Type "${config.type}" was not regitered!`);
    }

    const Type = allTypes[config.type];

    const updatedConfig = runExpressions(
      config,
      getValueByPath(model.current, path),
      model.current,
      formState.current,
      control,
    );

    if (updatedConfig.hide) {
      return <></>;
    }

    return (
      <RenderWrappers control={control} model={model} config={updatedConfig} formState={formState} submit={submit}>
        <FieldGroup
          control={control}
          meta={{ config: updatedConfig, formState, model, fieldState: getValueByPath(model.current, path) }}
          render={({ handler, meta, ...rest }) => (
            <UpdateModelWithControlValueComponent
              debounce={meta.config.modelOptions?.debounce}
              model={model}
              control={control}
              path={path}
              setModelByPath={setModelByPath}
            >
              <Type {...(meta as any)} handler={handler} field={{ ...rest } as any}>
                <FieldResolver
                  config={{ fieldGroup: meta.config.fieldGroup }}
                  model={model}
                  modelData={JSON.stringify(getValueByPath(model.current, path))}
                  formState={formState}
                  control={control}
                  path={path}
                  submit={submit}
                />
              </Type>
            </UpdateModelWithControlValueComponent>
          )}
        />
      </RenderWrappers>
    );
  }

  return <></>;
}, areEqual);

const useSmartRef = (data: any) => {
  const ref = useRef(data);

  useMemo(() => {
    if (JSON.stringify(ref.current) === JSON.stringify(data)) {
      ref.current = data;
    }
  }, [data]);

  return ref;
};

const useObjectChange = (onChangeCallback: (_: any) => void, defaultValue: any = null) => {
  const ref = useRef(defaultValue);

  const next = useCallback(
    (value: any) => {
      if (JSON.stringify(value) === JSON.stringify(ref.current)) {
        onChangeCallback(value);
      }
      ref.current = value;
    },
    [onChangeCallback],
  );

  return next;
};

interface CallbackInput {
  model: { [key: string]: any };
  formState: { [key: string]: any };
  valid: boolean;
  errors: ValidationErrors;
}

export const DynamicViewComponent = ({
  fields,
  model: modelInput,
  formState: formStateInput = {},
  onSubmit = () => {},
  onChange = () => {},
  withForm = false,
}: {
  fields: FieldConfig[];
  model: { [key: string]: any };
  formState?: { [key: string]: any };
  onSubmit?: (_: CallbackInput) => void;
  onChange?: (_: CallbackInput) => void;
  withForm?: boolean;
}) => {
  const formControl = useMemo(() => FormBuilder.group({}), []);
  const defaultModel = useMemo(() => getDefaultModelFromConfig(fields), [fields]);
  const config = useMemo(() => ({ fieldGroup: fields }), [fields]);
  const model = useSmartRef({ ...defaultModel, ...modelInput });
  const formState = useSmartRef(formStateInput);
  const next = useObjectChange(onChange, {
    model: model.current,
    formState: formState.current,
    valid: formControl.valid,
    errors: formControl.errors,
  });

  useMemo(() => formControl.updateValueAndValidity(), [config]);

  const submit = useCallback(
    () =>
      onSubmit({
        model: model.current,
        formState: formState.current,
        valid: formControl.valid,
        errors: formControl.errors,
      }),
    [onSubmit],
  );

  return (
    <FieldGroup
      control={formControl}
      meta={{ withForm, formControl, formState, submit, model, next, config }}
      render={({ meta: { withForm, submit, formControl, model, formState, next, config } }) => {
        next({
          model: model.current,
          formState: formState.current,
          valid: formControl.valid,
          errors: formControl.errors,
        });

        const field = (
          <FieldResolver
            control={formControl}
            config={config}
            model={model}
            modelData={JSON.stringify(model.current)}
            formState={formState}
            path={[]}
            submit={submit}
          />
        );

        return withForm ? <form onSubmit={(e) => e.preventDefault()}> {field} </form> : field;
      }}
    />
  );
};
