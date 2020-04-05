import { serialize, SerializableObject } from "../serialization";

type StateData<T extends SerializableObject> = {
  [K in keyof T]: () => T[K];
}

export class State<T extends SerializableObject> {
  private bindings: Partial<StateData<T>> = {};

  public constructor(public readonly data: T) {}

  public bind(data: Partial<StateData<T>>): void {
    this.bindings = Object.assign(this.bindings, data);
  }

  public computeData(): T {
    return Object.fromEntries(
      Object.entries(this.bindings).map(([property, func]) => [property, func()])
    );
  }

  public clone(): State<T> {
    return new State(this.computeData());
  }

  public serialize(): T {
    return serialize(this.computeData());
  }

  public toJSON(): string {
    return JSON.stringify(this.serialize());
  }
}
