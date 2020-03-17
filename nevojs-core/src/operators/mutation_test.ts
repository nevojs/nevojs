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

import { MutationMethod, alternateGene, inversion, map, scramble, swap } from "./mutation";

function returnsFunction(method: MutationMethod<any>): void {
  it("returns a function", () => {
    expect(method).toBeInstanceOf(Function);
  });
}

const sampleData = [2, 3, 4];

describe("map", () => {
  const increment = (x: number) => x + 1;

  returnsFunction(map(increment));

  it("returns unchanged data if the 'rate' setting is set to 0", () => {
    const genes = [1, 2, 3];
    const method = map(increment, { rate: 0 });

    expect(method(genes)).toEqual(genes);
  });

  it("returns fully mutated data if the 'rate' setting is set to 1", () => {
    const genes = [1, 2, 3];
    const method = map(increment, { rate: 1 });

    expect(method(genes)).toEqual([2, 3, 4]);
  });
});

describe("alternateGene", () => {
  returnsFunction(alternateGene(Math.random));

  it("alternates one element in given array", () => {
    const method = alternateGene(Math.random);

    const data = sampleData.slice();
    const mutated = method(data.slice());

    const different = mutated.filter((value, i) => value !== data[i]);
    expect(different.length).toBe(1);
  });

  it("alternates element at exact index if provided as a number", () => {
    const i = 1;
    const method = alternateGene(Math.random, { index: i });

    const data = sampleData.slice();
    const mutated = method(data.slice());

    expect(mutated[i]).not.toBe(data[i]);
  });

  it("alternates element at exact index if provided as a function", () => {
    const i = 1;
    const method = alternateGene(Math.random, { index: () => i });

    const data = sampleData.slice();
    const mutated = method(data.slice());

    expect(mutated[i]).not.toBe(data[i]);
  });

  it("throws TypeError if index is out of bounds", () => {
    const method = alternateGene(Math.random, { index: 100 });
    const data = sampleData.slice();

    expect(() => method(data)).toThrow(TypeError);
  });
});

describe("inversion", () => {
  returnsFunction(inversion);

  it("reverses elements in given array", () => {
    const data = sampleData.slice();
    const method = inversion();

    const mutated = method(data);

    expect(mutated).toEqual(data.reverse());
  });
});

describe("swap", () => {
  returnsFunction(swap);

  it("swaps two random elements", () => {
    const data = sampleData.slice();
    const method = swap();

    const mutated = method(data);

    const different = mutated.filter((value, i) => value !== sampleData[i]);
    expect(different.length).toBe(2);
  });
});

describe("scramble", () => {
  returnsFunction(scramble);
});
