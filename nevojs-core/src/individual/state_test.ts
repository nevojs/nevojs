/**
 * @license
 * Copyright 2020 Aleksander Ciesielski. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as fc from "fast-check";
import { State } from "./state";
import { SerializableValue, SerializedValueIdentifier } from "../serialization";

describe("State", () => {
  describe("constructor", () => {
    it("throws a TypeError if the initial data is specified and is not an object literal", () => {
      fc.assert(fc.property(fc.anything(), (data: any) => {
        fc.pre(data !== undefined && data !== null && data.constructor !== Object);

        expect(() => {
          new State(data);
        }).toThrow(TypeError);
      }));
    });
  });

  describe("computeAll", () => {
    it("returns a shallow copy of the data passed in the constructor if unbound", () => {
      fc.assert(fc.property(fc.dictionary(fc.string(), fc.integer()), (data) => {
        const state = new State(data);

        expect(state.computeAll()).toEqual(data);
        expect(state.computeAll()).not.toBe(data);
      }));
    });

    it("returns computed data if bounded", () => {
      fc.assert(fc.property(fc.dictionary(fc.string(), fc.integer()), (data) => {
        const state = new State();

        for (const [key, value] of Object.entries(data)) {
          state.bind({ [key]: () => value });
        }

        expect(state.computeAll()).toEqual(data);
      }));
    });
  });

  describe("bind", () => {
    it("properly binds the data", () => {
      fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => {
        const state = new State();
        state.bind({
          a: () => a,
          b: () => b,
        });

        expect(state.computeAll()).toEqual({ a, b });
      }));
    });

    it("throws a TypeError if the data is not an object literal", () => {
      fc.assert(fc.property(fc.anything(), (data: any) => {
        fc.pre(data === undefined || data === null || data.constructor !== Object);

        const state = new State();

        expect(() => {
          state.bind(data);
        }).toThrow(TypeError);
      }));
    });
  });

  describe("compute", () => {
    it("returns the computed value for the given key", () => {
      fc.assert(fc.property(fc.anything(), (value) => {
        const state = new State();
        state.bind({ x: () => value as SerializableValue });

        expect(state.compute("x")).toBe(value);
      }));
    });

    it("throws an Error if the value for the given key is not bound", () => {
      const state = new State();

      expect(() => {
        state.compute("x");
      }).toThrow(Error);
    });
  });

  describe("clone", () => {
    it("returns an instance of State", () => {
      const state = new State();
      expect(state.clone()).toBeInstanceOf(State);
    });

    it("clones a current state data (unbounded)", () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const state = new State({ value });
        const copy = state.clone();

        expect(copy.compute("value")).toBe(value);
      }));
    });

    it("clones a current state data (bounded)", () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const state = new State();
        state.bind({ x: () => value });
        const copy = state.clone();

        expect(copy.compute("x")).toBe(value);
      }));
    });

    it("modifies cloned data using a function if given", () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const state = new State({ value });
        const copy = state.clone((data) => ({ value: data.value + 1 }));

        expect(copy.compute("value")).toBe(value + 1);
      }));
    });

    it("does not clone bindings", () => {
      fc.assert(fc.property(fc.integer(), fc.integer(), (initialValue, newValue) => {
        fc.pre(initialValue !== newValue);

        const data = { value: initialValue };
        const state = new State();
        state.bind({ x: () => data.value });

        const copy = state.clone();

        data.value = newValue;

        expect(state.compute("x")).not.toBe(copy.compute("x"));
      }));
    });

    it("throws a TypeError if the cloning function is specified and is not a function", () => {
      fc.assert(fc.property(fc.anything(), (func) => {
        fc.pre(func !== undefined && typeof func !== "function");

        const state = new State();

        expect(() => {
          // @ts-expect-error
          state.clone(func);
        }).toThrow(TypeError);
      }));
    });
  });

  describe("bindings", () => {
    it("returns an object with the bindings", () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const binding = () => value;

        const state = new State();
        state.bind({ x: binding });

        expect(state.bindings().x).toBe(binding);
      }));
    });

    it("returns a shallow copy that cannot be used to mutate internal bindings", () => {
      fc.assert(fc.property(fc.integer(), fc.integer(), (initialValue, newValue) => {
        fc.pre(initialValue !== newValue);

        const state = new State();
        state.bind({ x: () => initialValue });
        state.bindings().x = () => newValue;

        expect(state.compute("x")).toBe(initialValue);
      }));
    });
  });

  describe("serialize", () => {
    it("returns an object literal with the current state", () => {
      type StateData = {
        a: number;
        b: number;
      }

      fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => {
        const state = new State<StateData>({ a });
        state.bind({ b: () => b });

        expect(state.serialize()).toEqual({ a, b });
      }));
    });

    it("transforms non-serializable values into string equivalents", () => {
      const state = new State({
        inf: Infinity,
        negInf: -Infinity,
        nan: NaN,
        undef: undefined,
      });

      expect(state.serialize()).toEqual({
        inf: SerializedValueIdentifier.PositiveInfinity,
        negInf: SerializedValueIdentifier.NegativeInfinity,
        nan: SerializedValueIdentifier.NotANumber,
        undef: SerializedValueIdentifier.Undefined,
      });
    });

    it("transforms the data using the function if given", () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const state = new State({ value });
        const serialized = state.serialize(
          ({ value }) => ({ value: value + 1 }),
        );

        expect(serialized.value).toBe(value + 1);
      }));
    });

    it("throws a TypeError if the function was specified but is not a valid function", () => {
      fc.assert(fc.property(fc.anything(), (func) => {
        fc.pre(func !== undefined && typeof func !== "function");

        const state = new State();

        expect(() => {
          // @ts-expect-error
          state.serialize(func);
        }).toThrow(TypeError);
      }));
    });

    it("throws an Error if the data cannot be serialized", () => {
      class Wrapper<T> {
        public constructor(public readonly value: T) {}
      }

      // @ts-expect-error
      const state = new State({ value: new Wrapper(5) });

      expect(() => {
        state.serialize();
      }).toThrow(Error);
    });

    it("throws an Error if the transformed data cannot be serialized", () => {
      class Wrapper<T> {
        public constructor(public readonly value: T) {}
      }

      const state = new State({ value: 5 });

      expect(() => {
        // @ts-expect-error
        state.serialize(({ value }) => ({ value: new Wrapper(value) }));
      }).toThrow(Error);
    });
  });

  describe("toJSON", () => {
    it("returns a string", () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const state = new State({ value });

        expect(typeof state.toJSON()).toBe("string");
      }));
    });

    it("calls 'serialize' method once", () => {
      const state = new State({ a: 1, b: 2, c: 3 });
      const spy = jest.spyOn(state, "serialize");

      state.toJSON();

      expect(spy).toBeCalledTimes(1);
      spy.mockClear();
    });
  });

  describe("deserialize", () => {
    it("returns an instance of State", () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const state = State.deserialize({ value });

        expect(state).toBeInstanceOf(State);
      }));
    });

    it("sets the serialized data as the initial state", () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const state = State.deserialize({ value });

        expect(state.initial).toEqual({ value });
      }));
    });

    it("binds the serialized data", () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const state = State.deserialize({ value });

        expect(state.compute("value")).toBe(value);
      }));
    });

    it("transforms non-serializable values' string equivalents to corresponding values", () => {
      const state = State.deserialize({
        inf: SerializedValueIdentifier.PositiveInfinity,
        negInf: SerializedValueIdentifier.NegativeInfinity,
        nan: SerializedValueIdentifier.NotANumber,
        undef: SerializedValueIdentifier.Undefined,
      });

      expect(state.initial).toEqual({
        inf: Infinity,
        negInf: -Infinity,
        nan: NaN,
        undef: undefined,
      });
    });
  });

  describe("fromJSON", () => {
    it("returns an instance of State with valid data", () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const serialized = JSON.stringify({ value });
        const state = State.fromJSON(serialized);

        expect(state.initial).toEqual({ value });
      }));
    });

    it("calls 'deserialize' method once", () => {
      const serialized = JSON.stringify({ a: 1, b: 2, c: 3 });
      const spy = jest.spyOn(State, "deserialize");

      State.fromJSON(serialized);

      expect(spy).toBeCalledTimes(1);
      spy.mockClear();
    });
  });
});
