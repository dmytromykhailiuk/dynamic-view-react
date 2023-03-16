import React, { JSXElementConstructor, ReactElement } from 'react';
import { FormControl, FormGroup, FormArray, ValidationErrors, InputType, Handler, ValidatorFn as Validator, AsyncValidatorFn as AsyncValidator } from 'react-reactive-form';
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
type MemorizedElement = ReactElement<any, string | JSXElementConstructor<any>> | null;
export type WrapperFn = (input: {
    control: FormGroup | FormControl | FormArray;
    config: any;
    formState: React.MutableRefObject<{
        [key: string]: any;
    }>;
    model: React.MutableRefObject<{
        [key: string]: any;
    }>;
    submit: () => void;
    children: JSX.Element;
}) => JSX.Element | MemorizedElement;
export type ControlFn = (input: {
    control: FormGroup | FormControl | FormArray;
    config: any;
    formState: React.MutableRefObject<{
        [key: string]: any;
    }>;
    model: React.MutableRefObject<{
        [key: string]: any;
    }>;
    submit: () => void;
    children?: JSX.Element;
}) => JSX.Element | MemorizedElement;
export type TypeFn<T = FormGroup | FormControl | FormArray> = (input: {
    handler: ((inputType?: InputType | undefined, value?: string | undefined) => Handler) | ((inputType?: InputType | undefined, value?: string | undefined) => Handler);
    control: T;
    field: T;
    config: any;
    formState: React.MutableRefObject<{
        [key: string]: any;
    }>;
    model: React.MutableRefObject<{
        [key: string]: any;
    }>;
    submit: () => void;
    children?: JSX.Element;
}) => JSX.Element | MemorizedElement;
export type TypeArrayFn = TypeFn<FormArray> & {
    add: (index?: number) => void;
    remove: (index?: number) => void;
};
export type ValidatorFn = Validator;
export type AsyncValidatorFn = AsyncValidator;
export declare const DynamicView: {
    registerWrappers: (wrappers: {
        name: string;
        component: WrapperFn;
    }[]) => void;
    registerControls: (controls: {
        name: string;
        component: ControlFn;
    }[]) => void;
    registerTypes: (types: {
        name: string;
        component: TypeFn;
    }[]) => void;
    registerValidators: (validators: {
        name: string;
        component: ValidatorFn;
    }[]) => void;
    registerAsyncValidators: (asyncValidators: {
        name: string;
        component: AsyncValidatorFn;
    }[]) => void;
};
interface CallbackInput {
    model: {
        [key: string]: any;
    };
    formState: {
        [key: string]: any;
    };
    valid: boolean;
    errors: ValidationErrors;
}
export declare const DynamicViewComponent: ({ fields, model: modelInput, formState: formStateInput, onSubmit, onChange, withForm, }: {
    fields: FieldConfig[];
    model: {
        [key: string]: any;
    };
    formState?: {
        [key: string]: any;
    };
    onSubmit?: (_: CallbackInput) => void;
    onChange?: (_: CallbackInput) => void;
    withForm?: boolean;
}) => JSX.Element;
export {};
