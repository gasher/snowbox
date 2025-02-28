import validatejs from 'validate.js';

export const buildInitialState = (fieldList) => (
  hocInitialValues = {},
  propsInitialValues,
) => {
  const state = {
    valid: true,
    touched: false,
    error: null,
    submitted: false,
    fields: {},
  };

  const values = propsInitialValues ? propsInitialValues : hocInitialValues;

  fieldList.forEach(field => {
    state.fields[field] = {
      valid: true,
      touched: false,
      error: null,
      value: typeof values[field] == 'undefined' ? null : values[field],
    };
  });

  return state;
};

export const getData = (fieldList) => (state) => {
  return fieldList.reduce((data, field) => ({
    ...data,
    [field]: state.fields[field].value,
  }), {});
};

export const validate = (fieldList, constraints) => (state) => {
  const errors = validatejs(getData(fieldList)(state), constraints);

  let isFormValid = true;

  fieldList.forEach(field => {
    const error = errors && errors[field] ? errors[field][0] : null;

    isFormValid = isFormValid && !error;

    state = {
      ...state,
      valid: isFormValid,
      fields: {
        ...state.fields,
        [field]: { ...state.fields[field], error, valid: !error },
      },
    };
  });

  return state;
};

export const handleChange = (fieldList, constraints) => (
  state,
  field,
  value
) => {
  if (!fieldList.includes(field)) {
    throw new Error(`[Snowbox Form] Unknown field: ${field}`);
  }

  let newState = {
    ...state,
    fields: {
      ...state.fields,
      [field]: { ...state.fields[field], value },
    }
  };

  return validate(fieldList, constraints)(newState);
};

export const handleBlur = (fieldList) => (state, field) => {
  if (!fieldList.includes(field)) {
    throw new Error(`[Snowbox Form] Unknown field: ${field}`);
  }

  return {
    ...state,
    touched: true,
    fields: {
      ...state.fields,
      [field]: { ...state.fields[field], touched: true },
    },
  };
};

export const handleServerErrors = (fieldList) => (state, errors) => {
  const newState = fieldList.reduce((acc, field) => ({
    ...acc,
    valid: acc.valid && !errors[field],
    submitted: false,
    fields: {
      ...acc.fields,
      [field]: {
        ...acc.fields[field],
        error: errors[field] || null,
        valid: !errors[field],
      },
    },
  }), state);

  if (errors._error) {
    newState.error = errors._error;
    newState.valid = false;
  }

  return newState;
};

export const handleSubmit = (fieldList) => (state) => {
  const newState = fieldList.reduce((acc, field) => ({
    ...acc,
    fields: {
      ...acc.fields,
      [field]: { ...acc.fields[field], touched: true },
    },
  }), state);

  if (newState.valid) {
    newState.submitted = true;
  }

  return newState;
};

const createFormService = (fieldList, constraints) => ({
  buildInitialState: buildInitialState(fieldList),
  getData: getData(fieldList),
  validate: validate(fieldList, constraints),
  handleChange: handleChange(fieldList, constraints),
  handleBlur: handleBlur(fieldList),
  handleServerErrors: handleServerErrors(fieldList),
  handleSubmit: handleSubmit(fieldList),
});

export default createFormService;
