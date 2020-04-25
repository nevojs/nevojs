import { serialize, SerializableObject } from "../serialization";

type StateData<T extends SerializableObject> = {
  [K in keyof T]: () => T[K];
}

export class State<T extends SerializableObject> {
  public readonly initial: Partial<T>;

  private readonly bindings: Partial<StateData<T>> = {};

  public constructor(data: Partial<T>) {
    this.initial = data;

    const stateData: Partial<StateData<T>> = {};

    for (const [key, value] of Object.entries(data)) {
      stateData[key as keyof T] = () => value as T[keyof T];
    }

    this.bind(stateData);
  }

  public bind(data: Partial<StateData<T>>): void {
    Object.assign(this.bindings, data);
  }

  public computed(): T {
    return Object.fromEntries(
      Object.entries(this.bindings).map(([property, func]) => [property, func()])
    );
  }

  public clone(): State<T> {
    return new State(this.computed()) as State<T>;
  }

  public serialize(): T {
    return serialize(this.computed());
  }

  public toJSON(): string {
    return JSON.stringify(this.serialize());
  }
}
