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

import { List } from "./list";
import { ImpureMutationMethod, PureMutationMethod } from "../operators/mutation";
import * as serializationUtil from "../serialization";

describe("List", () => {
  describe("generate", () => {
    it("returns an instance of List", () => {
      const list = List.generate(3, i => i);

      expect(list).toBeInstanceOf(List);
    });

    it("provides an index as the callback's first argument", () => {
      const func = jest.fn(i => i);
      List.generate(3, func);

      expect(func.mock.calls[0][0]).toBe(0);
      expect(func.mock.calls[1][0]).toBe(1);
      expect(func.mock.calls[2][0]).toBe(2);
    });

    it("calls the given func n times for n-element list", () => {
      const func = jest.fn(i => i);
      List.generate(3, func);

      expect(func.mock.calls.length).toBe(3);
    });
  });

  describe("data", () => {
    it("returns an array", () => {
      const list = new List([1, 2, 3]);

      expect(list.data()).toBeInstanceOf(Array);
    });

    it("returns shallow copy of the data", () => {
      const data = [1, 2, 3];
      const list = new List(data);

      expect(list.data()).not.toBe(data);
    });

    it("returns current data", () => {
      const data = [1, 2, 3];
      const list = new List(data);

      expect(list.data()).toEqual(data);
    });
  });

  describe("length", () => {
    it("returns an amount of elements in the list", () => {
      const list = new List([1, 2, 3]);

      expect(list.length).toBe(3);
    });
  });

  describe("mutate", () => {
    it("doesn't return any value", () => {
      const list = new List([1, 2, 3]);
      expect(list.mutate(x => x)).toBe(undefined);
    });

    it("changes the data (pure mutation)", () => {
      const method: PureMutationMethod<number[]> = data => data.map(gene => gene + 1);
      const list = new List([1, 2, 3]);
      list.mutate(method);

      expect(list.data()).toEqual([2, 3, 4]);
    });

    it("changes the data (impure mutation)", () => {
      interface Gene {
        value: number;
      }

      const method: ImpureMutationMethod<Gene[]> = data => {
        data.forEach(gene => {
          gene.value += 1;
        });

        return null;
      };

      const list = new List([
        { value: 1 },
        { value: 2 },
        { value: 3 },
      ]);
      list.mutate(method);

      expect(list.data()).toEqual([
        { value: 2 },
        { value: 3 },
        { value: 4 },
      ]);
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
      const copy = list.clone(data => data.map(gene => gene + 1));

      expect(copy.data()).toEqual([2, 3, 4]);
    });
  });

  describe("__serialize", () => {
    it("returns the data", () => {
      const list = new List([1, 2, 3]);
      expect(list.__serialize()).toEqual([1, 2, 3]);
    });

    it("calls 'serialize' utility function to transform non-serializable values", () => {
      const list = new List([1, 2, 3]);
      const spy = jest.spyOn(serializationUtil, "serialize");
      list.__serialize();

      expect(spy.mock.calls.length).toBe(1);
      spy.mockClear();
    });
  });
});
