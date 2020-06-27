import { serialize, deserialize, SerializableObject, isSerializable } from "../serialization";
import { isObjectLiteral } from "../util";

type StateBindings<T extends SerializableObject> = {
  [K in keyof T]: () => T[K];
}

export class State<T extends SerializableObject> {
  public static deserialize<T extends SerializableObject>(
    serialized: T,
    func?: (data: T) => T,
  ): State<T> {
    const data = deserialize(func ? func(serialized) : serialized);
    return new State<T>(data);
  }

  public static fromJSON<T extends SerializableObject>(
    serialized: string,
    func?: (data: T) => T,
  ): State<T> {
    return State.deserialize(JSON.parse(serialized), func);
  }

  public readonly initial: Readonly<Partial<T>>;

  private readonly _bindings: Partial<StateBindings<T>> = {};

  public bindings(): Partial<StateBindings<T>> {
    return Object.assign({}, this._bindings);
  }

  public constructor(data: Partial<T> = {}) {
    if (!isObjectLiteral(data)) {
      throw new TypeError();
    }

    this.initial = data;

    const stateData: Partial<StateBindings<T>> = {};

    for (const binding in data) {
      stateData[binding as keyof T] = () => data[binding] as T[keyof T];
    }

    this.bind(stateData);
  }

  public bind(data: Partial<StateBindings<T>>): void {
    if (!isObjectLiteral(data)) {
      throw new TypeError();
    }

    Object.assign(this._bindings, data);
  }

  public computeAll(): T {
    const entries: Partial<T> = {};

    for (const binding in this._bindings) {
      entries[binding] = this.compute(binding);
    }

    return entries as T;
  }

  public compute<K extends keyof T>(key: K): T[K] {
    const binding = this._bindings[key];

    if (binding === undefined) {
      throw new Error();
    }

    return binding();
  }

  public clone(
    func?: (data: T) => T,
  ): State<T> {
    if (func !== undefined && typeof func !== "function") {
      throw new TypeError();
    }

    const data = func === undefined
      ? this.computeAll()
      : func(this.computeAll());

    return new State<T>(data);
  }

  public serialize(func?: (data: T) => T): SerializableObject {
    if (func !== undefined && typeof func !== "function") {
      throw new TypeError();
    }

    const data = func ? func(this.computeAll()) : this.computeAll();

    if (!isObjectLiteral(data) || !isSerializable(data)) {
      throw new Error("cannot serialize");
    }

    return serialize(data);
  }

  public toJSON(func?: (data: T) => T): string {
    return JSON.stringify(this.serialize(func));
  }
}
