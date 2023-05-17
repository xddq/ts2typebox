// Arbitrary example types

type Age = number;

export type Address = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
};

export type Contact = {
  phone: string;
  email: string;
};

export type Person = {
  name: string;
  age: number;
  address: Address;
  contact: Contact;
};
