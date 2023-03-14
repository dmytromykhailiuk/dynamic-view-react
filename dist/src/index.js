"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicViewComponent = exports.DynamicView = void 0;
const react_1 = __importStar(require("react"));
const react_reactive_form_1 = require("react-reactive-form");
const getDefaultModelFromConfig = (config) => {
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
            const modelFromParent = el.defaultValue || [];
            const modelFromChildren = getDefaultModelFromConfig([el.fieldArray]);
            return { ...acc, [el.key]: modelFromParent.map((el) => ({ ...el, ...modelFromChildren })) };
        }
        return acc;
    }, {});
};
const allWrappers = {};
const allControls = {};
const allValidators = {};
const allAsyncValidators = {};
const allTypes = {};
exports.DynamicView = {
    registerWrappers: (wrappers) => {
        wrappers.forEach(({ name, component }) => {
            if (allWrappers[name]) {
                throw new Error(`You already registered "${name}" Wrapper!`);
            }
            allWrappers[name] = component;
        });
    },
    registerControls: (controls) => {
        controls.forEach(({ name, component }) => {
            if (allControls[name]) {
                throw new Error(`You already registered "${name}" Control!`);
            }
            allControls[name] = component;
        });
    },
    registerTypes: (types) => {
        types.forEach(({ name, component }) => {
            if (allTypes[name]) {
                throw new Error(`You already registered "${name}" Type!`);
            }
            allTypes[name] = component;
        });
    },
    registerValidators: (validators) => {
        validators.forEach(({ name, component }) => {
            if (allValidators[name]) {
                throw new Error(`You already registered "${name}" Validator!`);
            }
            allValidators[name] = component;
        });
    },
    registerAsyncValidators: (asyncValidators) => {
        asyncValidators.forEach(({ name, component }) => {
            if (allAsyncValidators[name]) {
                throw new Error(`You already registered "${name}" AsyncValidator!`);
            }
            allAsyncValidators[name] = component;
        });
    },
};
const RenderWrappers = (0, react_1.memo)(({ control, config, wrappers = config.wrappers || [], formState, model, children, submit }) => wrappers.reduce((acc, wrapper) => {
    const Wrapper = allWrappers[wrapper];
    if (!Wrapper) {
        throw new Error(`Wrapper "${wrapper}" was not regitered!`);
    }
    return (react_1.default.createElement(Wrapper, { control: control, config: config, formState: formState, model: model, submit: submit }, acc));
}, children));
const getValidatorsByConfig = (config) => (config.validators || []).map((validator) => {
    if (!allValidators[validator]) {
        throw new Error(`Validator "${validator}" was not regitered!`);
    }
    return allValidators[validator];
});
const getAsyncValidatorsByConfig = (config) => (config.asyncValidators || []).map((asyncValidator) => {
    if (!allAsyncValidators[asyncValidator]) {
        throw new Error(`AsyncValidator "${asyncValidator}" was not regitered!`);
    }
    return allAsyncValidators[asyncValidator];
});
const updateObjectByPath = (object, path, value) => {
    path.reduce((acc, el, index) => {
        if (index === path.length - 1) {
            acc[el] = value;
        }
        return acc[el];
    }, object);
    return { ...object };
};
const getValueByPath = (object, path) => path.reduce((acc, el) => acc[el], object);
const setModelByPath = (localModelRef, path, value) => {
    localModelRef.current = updateObjectByPath(localModelRef.current, path, value);
};
const createChildControl = (config, model) => {
    var _a;
    const validators = getValidatorsByConfig(config);
    const asyncValidators = getAsyncValidatorsByConfig(config);
    const updateOn = ((_a = config.modelOptions) === null || _a === void 0 ? void 0 : _a.updateOn) || 'change';
    if (config.fieldArray) {
        return new react_reactive_form_1.FormArray([], { validators, asyncValidators, updateOn });
    }
    if (config.fieldGroup) {
        return new react_reactive_form_1.FormGroup({}, { validators, asyncValidators, updateOn });
    }
    return new react_reactive_form_1.FormControl(model !== null && model !== void 0 ? model : config.defaultValue, { validators, asyncValidators, updateOn });
};
const UpdateModelWithControlValueComponent = ({ model, control, path, children, debounce }) => {
    (0, react_1.useEffect)(() => {
        control.valueChanges.subscribe((value) => {
            if (getValueByPath(model.current, path) !== value) {
                setModelByPath(model, path, value);
            }
        });
        return () => {
            control.valueChanges.unsubscribe();
        };
    }, [model]);
    return react_1.default.createElement(react_1.default.Fragment, null, children);
};
const runExpressions = (config, fieldState, model, formState, field) => {
    const _ = { model, fieldState, formState, field };
    if (!config.expressions) {
        return config;
    }
    return Object.entries(config.expressions).reduce((acc, [key, expression]) => {
        const path = key.split('.');
        try {
            return updateObjectByPath(acc, path, eval(expression));
        }
        catch (e) {
            console.error(e);
            return acc;
        }
    }, { ...config });
};
function areEqual(prevProps, nextProps) {
    return (prevProps.modelData === nextProps.modelData &&
        JSON.stringify(prevProps.formState) === JSON.stringify(nextProps.formState) &&
        prevProps.control.valid === nextProps.control.valid &&
        JSON.stringify(prevProps.control.errors) === JSON.stringify(nextProps.control.errors) &&
        prevProps.control.touched === nextProps.control.touched &&
        JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config) &&
        prevProps.dirty === nextProps.dirty);
}
const FieldResolver = (0, react_1.memo)(({ config: oldConfig, model, formState, control, path, submit }) => {
    const config = runExpressions(oldConfig, getValueByPath(model.current, path), model.current, formState.current, control);
    if (config.hide) {
        return react_1.default.createElement(react_1.default.Fragment, null);
    }
    if (config.control) {
        if (!allControls[config.control]) {
            throw new Error(`Control "${config.control}" was not regitered!`);
        }
        const Control = allControls[config.control];
        return (react_1.default.createElement(RenderWrappers, { control: control, model: model, config: config, formState: formState, submit: submit },
            react_1.default.createElement(Control, { control: control, model: model, config: config, formState: formState, submit: submit })));
    }
    if (!config.key && config.fieldGroup) {
        return (react_1.default.createElement(RenderWrappers, { control: control, model: model, config: config, formState: formState, submit: submit }, config.fieldGroup.map((config, i) => {
            let childControl = control;
            if (config.key && !control.get(config.key)) {
                childControl = createChildControl(config, getValueByPath(model.current, [...path, config.key]));
                control.addControl(config.key, childControl);
            }
            if (config.key && control.get(config.key)) {
                childControl = control.get(config.key);
            }
            const updatedConfig = runExpressions(config, getValueByPath(model.current, config.key ? [...path, config.key] : path), model.current, formState.current, childControl);
            if (updatedConfig.hide) {
                return react_1.default.createElement(react_1.default.Fragment, null);
            }
            return (react_1.default.createElement(RenderWrappers, { control: childControl, key: i, model: model, config: updatedConfig, formState: formState, submit: submit },
                react_1.default.createElement(FieldResolver, { config: updatedConfig, formState: formState, model: model, modelData: JSON.stringify(getValueByPath(model.current, updatedConfig.key ? [...path, updatedConfig.key] : path)), control: childControl, path: updatedConfig.key ? [...path, updatedConfig.key] : path, submit: submit })));
        })));
    }
    if (config.key && !config.fieldGroup && !config.fieldArray) {
        if (getValueByPath(model.current, path) !== undefined && getValueByPath(model.current, path) !== control.value) {
            control.setValue(getValueByPath(model.current, path));
        }
        if (!allTypes[config.type]) {
            throw new Error(`Type "${config.type}" was not regitered!`);
        }
        const Type = allTypes[config.type];
        const updatedConfig = runExpressions(config, getValueByPath(model.current, path), model.current, formState.current, control);
        if (updatedConfig.hide) {
            return react_1.default.createElement(react_1.default.Fragment, null);
        }
        return (react_1.default.createElement(RenderWrappers, { control: control, model: model, config: updatedConfig, formState: formState, submit: submit },
            react_1.default.createElement(react_reactive_form_1.FieldControl, { name: updatedConfig.key, options: {
                    validators: getValidatorsByConfig(updatedConfig),
                    asyncValidators: getAsyncValidatorsByConfig(updatedConfig),
                }, meta: { config: updatedConfig, formState, model, fieldState: getValueByPath(model.current, path) }, render: ({ handler, meta, ...rest }) => {
                    var _a;
                    return (react_1.default.createElement(UpdateModelWithControlValueComponent, { debounce: (_a = meta.config.modelOptions) === null || _a === void 0 ? void 0 : _a.debounce, model: model, control: control, path: path, setModelByPath: setModelByPath },
                        react_1.default.createElement(Type, { ...meta, handler: handler, field: { ...rest } })));
                } })));
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
                let childControl = createChildControl(config.fieldArray, getValueByPath(model.current, path)[control.value.length + i]);
                control.push(childControl);
            });
        }
        const add = (beforeIndex) => {
            if (beforeIndex === undefined || typeof beforeIndex !== 'number') {
                setModelByPath(model, [...path, control.controls.length], getDefaultModelFromConfig(config.fieldArray.fieldGroup || []));
                control.push(createChildControl(config.fieldArray, undefined));
            }
            else {
                setModelByPath(model, path, [
                    ...getValueByPath(model.current, path).slice(0, beforeIndex),
                    getDefaultModelFromConfig(config.fieldArray.fieldGroup || []),
                    ...getValueByPath(model.current, path).slice(beforeIndex),
                ]);
                control.insert(beforeIndex, createChildControl(config.fieldArray, undefined));
            }
        };
        const remove = (index) => {
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
        return (react_1.default.createElement(RenderWrappers, { control: control, model: model, config: config, formState: formState, submit: submit },
            react_1.default.createElement(react_reactive_form_1.FieldArray, { control: control, name: config.key, meta: {
                    config,
                    path,
                    control,
                    formState,
                    model,
                    fieldState: getValueByPath(model.current, path),
                    add,
                    remove,
                }, render: ({ handler, meta: { control, path, ...meta }, ...rest }) => {
                    var _a;
                    return (react_1.default.createElement(UpdateModelWithControlValueComponent, { debounce: (_a = meta.config.modelOptions) === null || _a === void 0 ? void 0 : _a.debounce, model: meta.model, control: control, path: path, setModelByPath: setModelByPath },
                        react_1.default.createElement(Type, { ...meta, handler: handler, field: { ...rest } },
                            react_1.default.createElement(react_1.default.Fragment, null, (getValueByPath(model.current, path) || []).map((_, i) => {
                                const updatedConfig = runExpressions(meta.config, getValueByPath(model.current, [...path, i]), model.current, formState.current, control);
                                if (updatedConfig.hide) {
                                    return (react_1.default.createElement(RenderWrappers, { key: i, control: control.at(i), model: model, config: updatedConfig.fieldArray, formState: formState, submit: submit }));
                                }
                                return (react_1.default.createElement(RenderWrappers, { key: i, control: control.at(i), model: model, config: updatedConfig.fieldArray, formState: formState, submit: submit },
                                    react_1.default.createElement(react_reactive_form_1.FieldGroup, { control: control.at(i), meta: {
                                            config: updatedConfig,
                                            formState,
                                            model,
                                            fieldState: getValueByPath(model.current, [...path, i]),
                                        }, render: () => (react_1.default.createElement(FieldResolver, { config: { fieldGroup: meta.config.fieldArray.fieldGroup || meta.config.fieldArray }, model: model, modelData: JSON.stringify(getValueByPath(model.current, [...path, i])), formState: formState, control: control.at(i), path: [...path, i], submit: submit })) })));
                            })))));
                } })));
    }
    if (config.key && config.fieldGroup) {
        if (!allTypes[config.type]) {
            throw new Error(`Type "${config.type}" was not regitered!`);
        }
        const Type = allTypes[config.type];
        const updatedConfig = runExpressions(config, getValueByPath(model.current, path), model.current, formState.current, control);
        if (updatedConfig.hide) {
            return react_1.default.createElement(react_1.default.Fragment, null);
        }
        return (react_1.default.createElement(RenderWrappers, { control: control, model: model, config: updatedConfig, formState: formState, submit: submit },
            react_1.default.createElement(react_reactive_form_1.FieldGroup, { control: control, meta: { config: updatedConfig, formState, model, fieldState: getValueByPath(model.current, path) }, render: ({ handler, meta, ...rest }) => {
                    var _a;
                    return (react_1.default.createElement(UpdateModelWithControlValueComponent, { debounce: (_a = meta.config.modelOptions) === null || _a === void 0 ? void 0 : _a.debounce, model: model, control: control, path: path, setModelByPath: setModelByPath },
                        react_1.default.createElement(Type, { ...meta, handler: handler, field: { ...rest } },
                            react_1.default.createElement(FieldResolver, { config: { fieldGroup: meta.config.fieldGroup }, model: model, modelData: JSON.stringify(getValueByPath(model.current, path)), formState: formState, control: control, path: path, submit: submit }))));
                } })));
    }
    return react_1.default.createElement(react_1.default.Fragment, null);
}, areEqual);
const useSmartRef = (data) => {
    const ref = (0, react_1.useRef)(data);
    (0, react_1.useMemo)(() => {
        if (JSON.stringify(ref.current) === JSON.stringify(data)) {
            ref.current = data;
        }
    }, [data]);
    return ref;
};
const useObjectChange = (onChangeCallback, defaultValue = null) => {
    const ref = (0, react_1.useRef)(defaultValue);
    const next = (0, react_1.useCallback)((value) => {
        if (JSON.stringify(value) === JSON.stringify(ref.current)) {
            onChangeCallback(value);
        }
        ref.current = value;
    }, [onChangeCallback]);
    return next;
};
const DynamicViewComponent = ({ fields, model: modelInput, formState: formStateInput = {}, onSubmit = () => { }, onChange = () => { }, withForm = false, }) => {
    const formControl = (0, react_1.useMemo)(() => react_reactive_form_1.FormBuilder.group({}), []);
    const defaultModel = (0, react_1.useMemo)(() => getDefaultModelFromConfig(fields), [fields]);
    const config = (0, react_1.useMemo)(() => ({ fieldGroup: fields }), [fields]);
    const model = useSmartRef({ ...defaultModel, ...modelInput });
    const formState = useSmartRef(formStateInput);
    const next = useObjectChange(onChange, {
        model: model.current,
        formState: formState.current,
        valid: formControl.valid,
        errors: formControl.errors,
    });
    (0, react_1.useMemo)(() => formControl.updateValueAndValidity(), [config]);
    const submit = (0, react_1.useCallback)(() => onSubmit({
        model: model.current,
        formState: formState.current,
        valid: formControl.valid,
        errors: formControl.errors,
    }), [onSubmit]);
    return (react_1.default.createElement(react_reactive_form_1.FieldGroup, { control: formControl, meta: { withForm, formControl, formState, submit, model, next, config }, render: ({ meta: { withForm, submit, formControl, model, formState, next, config } }) => {
            next({
                model: model.current,
                formState: formState.current,
                valid: formControl.valid,
                errors: formControl.errors,
            });
            const field = (react_1.default.createElement(FieldResolver, { control: formControl, config: config, model: model, modelData: JSON.stringify(model.current), formState: formState, path: [], submit: submit }));
            return withForm ? react_1.default.createElement("form", { onSubmit: (e) => e.preventDefault() },
                " ",
                field,
                " ") : field;
        } }));
};
exports.DynamicViewComponent = DynamicViewComponent;
//# sourceMappingURL=index.js.map