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
import { CrossoverMethod, uniform } from "../operators/crossover";
import { List, ListGenerateFunction } from "./list";
import { MutationMethod } from "../operators/mutation";

describe("List", () => {
  describe("generate", () => {
    it("returns an instance of List", () => {
      const list = List.generate(3, (i) => i);

      expect(list).toBeInstanceOf(List);
    });

    it("provides an index as the callback's first argument", () => {
      const func = jest.fn((i) => i);
      List.generate(3, func);

      expect(func.mock.calls[0][0]).toBe(0);
      expect(func.mock.calls[1][0]).toBe(1);
      expect(func.mock.calls[2][0]).toBe(2);
    });

    it("calls the given func n times for n-element list", () => {
      fc.assert(fc.property(fc.integer(1, 30), (size) => {
        const func = jest.fn((i) => i);
        List.generate(size, func);

        expect(func.mock.calls.length).toBe(size);
      }));
    });

    it("throws a TypeError if the size is not a positive integer number", () => {
      fc.assert(fc.property(fc.anything(), (size) => {
        fc.pre(
          0 >= (size as number) ||
          (size as number) % 1 > 0 ||
          isNaN(size as number)
        );

        expect(() => {
          List.generate(size as number, (i) => i);
        }).toThrow(TypeError);
      }));
    });

    it("throws a TypeError if the callback is not a function", () => {
      fc.assert(fc.property(fc.anything(), (func) => {
        fc.pre(typeof func !== "function");

        expect(() => {
          List.generate(5, func as ListGenerateFunction<unknown>);
        }).toThrow(TypeError);
      }));
    });
  });

  describe("constructor", () => {
    it("throws a TypeError if the data is not an array", () => {
      fc.assert(fc.property(fc.anything(), (data) => {
        fc.pre(!Array.isArray(data));

        expect(() => {
          new List(data as unknown[]);
        }).toThrow(TypeError);
      }));
    });
  });

  describe("data", () => {
    it("returns an array", () => {
      const list = new List([1, 2, 3]);

      expect(list.data()).toBeInstanceOf(Array);
    });

    it("does not return the same array that was passed when creating", () => {
      fc.assert(fc.property(fc.array(fc.anything(), 50), (data) => {
        const list = new List(data);

        expect(list.data()).not.toBe(data);
      }));
    });

    it("returns current data", () => {
      fc.assert(fc.property(fc.array(fc.anything(), 50), (data) => {
        const list = new List(data);

        expect(list.data()).toEqual(data);
      }));
    });
  });

  describe("length (get)", () => {
    it("returns an amount of elements in the list", () => {
      fc.assert(fc.property(fc.array(fc.anything(), 30), (data) => {
        const list = new List(data);

        expect(list.length).toBe(data.length);
      }));
    });
  });

  describe("mutate", () => {
    it("doesn't return any value", () => {
      const list = new List([1, 2, 3]);
      const result = list.mutate((x) => x);

      expect(result).toBe(undefined);
    });

    it("changes the data", () => {
      const method: MutationMethod<number[]> = (data) => data.map((gene) => gene + 1);

      const list = new List([1, 2, 3]);
      list.mutate(method);

      expect(list.data()).toEqual([2, 3, 4]);
    });

    it("throws a TypeError if the method is not a function", () => {
      fc.assert(fc.property(fc.anything(), (method) => {
        fc.pre(typeof method !== "function");

        const list = new List([1, 2, 3]);

        expect(() => {
          list.mutate(method as MutationMethod<number[]>);
        }).toThrow(TypeError);
      }));
    });

    it("throws a TypeError if the data after mutation is not an array", () => {
      const list = new List([1, 2, 3]);

      expect(() => {
        list.mutate(() => undefined as any);
      }).toThrow(TypeError);
    });
  });

  describe("offspring", () => {
    it("returns an array with instances of List", () => {
      const a = new List([1, 2, 3]);
      const b = new List([6, 7, 8]);

      const offspring = a.offspring([b], uniform());
      expect(offspring.every((child) => child instanceof List)).toBe(true);
    });

    it("throws a TypeError if the method is not a function", () => {
      fc.assert(fc.property(fc.anything(), (method) => {
        fc.pre(typeof method !== "function");

        const a = new List([1, 2, 3]);
        const b = new List([6, 7, 8]);

        expect(() => {
          a.offspring([b], method as CrossoverMethod<number[]>);
        }).toThrow(TypeError);
      }));
    });

    it("throws a TypeError if the second argument is not an array", () => {
      fc.assert(fc.property(fc.anything(), (partners) => {
        fc.pre(!Array.isArray(partners));

        const list = new List([1, 2, 3]);

        expect(
          () => list.offspring(partners as (typeof list)[], uniform()),
        ).toThrow(TypeError);
      }));
    });
  });

  describe("crossover", () => {
    it("returns an array filled with instances of List", () => {
      const a = new List([1, 2, 3]);
      const b = new List([6, 7, 8]);

      const children = a.crossover(20, [b], uniform());
      expect(children.every((child) => child instanceof List)).toBe(true);
    });

    it("returns correct amount of children", () => {
      fc.assert(fc.property(fc.integer(1, 100), (amount) => {
        const a = new List([1, 2, 3]);
        const b = new List([6, 7, 8]);

        const children = a.crossover(amount, [b], uniform());
        expect(children.length).toBe(amount);
      }));
    });

    it("calls List.prototype.offspring method", () => {
      const a = new List([1, 2, 3]);
      const b = new List([6, 7, 8]);

      const spy = jest.spyOn(a, "offspring");
      a.offspring([b], uniform());

      expect(spy).toBeCalledTimes(1);
      spy.mockClear();
    });

    it("throws a TypeError if the amount is not a positive integer number", () => {
      fc.assert(fc.property(fc.anything(), (amount) => {
        fc.pre(
          typeof amount !== "number" ||
          0 >= amount ||
          amount % 1 > 0
        );

        const a = new List([1, 2, 3]);
        const b = new List([6, 7, 8]);

        expect(
          () => a.crossover(amount as number, [b], uniform()),
        ).toThrow(TypeError);
      }));
    });
  });

  describe("clone", () => {
    it("returns an instance of List", () => {
      const list = new List([1, 2, 3]);
      const copy = list.clone();

      expect(copy).toBeInstanceOf(List);
    });

    it("returns a List that is not the same as the original one", () => {
      const list = new List([1, 2, 3]);
      const copy = list.clone();

      expect(copy).not.toBe(list);
    });

    it("clones the data using a function if passed", () => {
      const list = new List([1, 2, 3]);
      const copy = list.clone((data) => data.map((gene) => gene + 1));

      expect(copy.data()).toEqual([2, 3, 4]);
    });

    it("throws a TypeError if the function was passed but is invalid", () => {
      fc.assert(fc.property(fc.anything(), (func) => {
        fc.pre(typeof func !== "function" && func !== undefined);

        const list = new List([1, 2, 3]);

        expect(
          () => list.clone(func as ((data: number[]) => number[])),
        ).toThrow(TypeError);
      }));
    });
  });

  describe("__serialize", () => {
    it("returns the data", () => {
      fc.assert(fc.property(fc.array(fc.integer(), 30), (data) => {
        const list = new List(data);

        expect(list.__serialize()).toEqual(data);
      }));
    });
  });
});
