import { deserialize, serialize, SerializableObject } from "../serialization";

type StateData<T extends SerializableObject> = {
  [K in keyof T]: () => T[K];
}

export class State<T extends SerializableObject> {
  public static deserialize<T extends SerializableObject>(data: T): State<T> {
    return new State(deserialize(data) as T);
  }

  public static fromJSON<T extends SerializableObject>(data: string): State<T> {
    return State.deserialize(JSON.parse(data) as T);
  }

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
