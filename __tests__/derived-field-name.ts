import {DerivedFieldType} from "../src/ts-derived-field-type";
import createForm from "../src/factories/create-form";
import {useForm} from "../src";

// ### Test for TS util "DerivedFieldType"
// Check list:
// 1. autocomplete IDE
// 2. typescript type validation

type Values = {
  firstName: string;
  city: {
    id: string;
    name: string;
  };
};

const user: Values = { firstName: '', city: { id: '', name: '' } };
const obj = { a: '', b: '', c: { a: '', b: '' } };

type AbstractValues = Record<string, any>;

// ##### case 1

// 'firstName' | 'city' | 'city.id' | 'city.name'
type Result = DerivedFieldType<Values>;
const k1: Result = 'firstName'; // ok
const k2: Result = 'city'; // ok
const k3: Result = 'city.id'; // ok
const k4: Result = 'city.name'; // ok
const k5: Result = 'a'; // error
const k6: Result = 'city.a'; // error

// ##### case 2

const myMethod = <V extends Values>(values: V, field: DerivedFieldType<V>) => {
  return { field, values };
};

// field: 'firstName' | 'city' | 'city.id' | 'city.name'
myMethod(user, 'firstName'); // ok
myMethod(user, 'city'); // ok
myMethod(user, 'city.id'); // ok
myMethod(user, 'city.name'); // ok
myMethod(user, 'a'); // error
myMethod(user, 'city.a'); // error

// ##### case 3

type ResultA = DerivedFieldType<AbstractValues>;
const kA1: ResultA = ''; // ok
const kA2: ResultA = 'a'; // ok
const kA3: ResultA = 'a.b'; // ok

// ##### case 4

const myMethodA = <V extends AbstractValues>(values: V, field: DerivedFieldType<V>) => {
  return { field, values };
};

myMethodA(user, 'firstName'); // ok
myMethodA(user, 'city'); // ok
myMethodA(user, 'city.id'); // ok
myMethodA(user, 'city.name'); // ok
myMethodA(user, 'a'); // error
myMethodA(user, 'a.b'); // error

myMethodA(obj, 'a'); // ok
myMethodA(obj, 'b'); // ok
myMethodA(obj, 'c'); // ok
myMethodA(obj, 'c.a'); // ok
myMethodA(obj, 'c.b'); // ok
myMethodA(obj, 'd'); // error
myMethodA(obj, 'c.d'); // error

// case 5
myMethodA({a: {b: {c: {d: {e: {f: {end: 'end'}}}}}}}, 'a'); // ok
myMethodA({a: {b: {c: {d: {e: {f: {end: 'end'}}}}}}}, 'a.b.c.d'); // ok
myMethodA({a: {b: {c: {d: {e: {f: {end: 'end'}}}}}}}, 'a.b.c.d.e.f'); // ok
myMethodA({a: {b: {c: {d: {e: {f: {end: 'end'}}}}}}}, 'a.b.c.d.e.f.end'); // ok

// case 6 with form fabric

const form = createForm<Values>()
const {controller} = useForm({form})
controller({name: 'firstName'}); // ok
controller({name: 'city'}); // ok
controller({name: 'city.id'}); // ok
controller({name: 'city.name'}); // ok
controller({name: 'a'}); // error
controller({name: 'a.b'}); // error

// case 7 array
type ResultWithArray = DerivedFieldType<{firstName: string; contacts: {contactName: string}[]}>;
const kRA1: ResultWithArray = 'contacts'; // ok

// for fix "unused errors" ↓
// @ts-ignore
const arr = [k1, k2, k3, k4, k5, k6]
// @ts-ignore
const arr2 = [kA1, kA2, kA3]
// @ts-ignore
const arr3 = [kRA1]
// for fix "unused errors" ↑
