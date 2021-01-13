import useForm from './use-form';
import useFieldArray from './use-field-array';
import useError from './use-error';
import createFieldArray from './factories/create-field-array';
import createForm from './factories/create-form';
import { deleteIn, getIn, setIn, makeNested, removeFromInlineMap } from './utils/object-manager';
import { getInTs } from './utils/object-manager/get-in-ts';

export * from './utils/object-manager/get-name';
export * from './utils/object-manager/get-name-str';
export * from './ts';
export {
  createForm,
  createFieldArray,
  useForm,
  useError,
  useFieldArray,
  deleteIn,
  getIn,
  setIn,
  makeNested,
  removeFromInlineMap,
  getInTs,
};
