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

import { List } from "../genotype/list";
import { uniform } from "./crossover";

describe("uniform", () => {
  it("returns two Individual instances", () => {
    const parentA = new List(Array(5).fill(0));
    const parentB = new List(Array(5).fill(1));

    const children = parentA.offspring([parentB], uniform());

    expect(children.length).toBe(2);
    expect(children.every((child) => child instanceof List)).toBe(true);
  });

  it("calls Math.random n times", () => {
    const spy = jest.spyOn(Math, "random");

    const parentA = new List(Array(5).fill(0));
    const parentB = new List(Array(5).fill(1));
    parentA.offspring([parentB], uniform());

    expect(spy).toBeCalledTimes(5);
    spy.mockClear();
  });

  it("returns exact copies of parents if alpha is equal to 1", () => {
    const parentA = new List(Array(5).fill(0));
    const parentB = new List(Array(5).fill(1));

    const [childA, childB] = parentA.offspring([parentB], uniform({ alpha: 1 }));

    expect(parentA.data()).toEqual(childA.data());
    expect(parentB.data()).toEqual(childB.data());
  });

  it("returns exact copies of parents if alpha is equal to 0", () => {
    const parentA = new List(Array(5).fill(0));
    const parentB = new List(Array(5).fill(1));

    const [childA, childB] = parentA.offspring([parentB], uniform({ alpha: 0 }));

    expect(parentA.data()).toEqual(childB.data());
    expect(parentB.data()).toEqual(childA.data());
  });

  it("throws an error if the argument is passed but is not an object", () => {
    [false, true, 1, 0, "foobar"].forEach((settings: any) => {
      expect(() => uniform(settings)).toThrowError(TypeError);
    });

    [undefined, {}, { alpha: 0.5 }].forEach((settings: any) => {
      expect(() => uniform(settings)).not.toThrowError(TypeError);
    });
  });

  it("throws an error if the 'alpha' setting is passed and is not a number in range <0;1>", () => {
    [-0.1, 1.1, -Infinity, Infinity, NaN, "0", "foo", [], {}].forEach((alpha: any) => {
      expect(() => uniform({ alpha })).toThrowError(TypeError);
    });

    [0, 1, 0.5, -0, null, undefined].forEach((alpha: any) => {
      expect(() => uniform({ alpha })).not.toThrowError(TypeError);
    });
  });
});
