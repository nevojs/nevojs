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

import * as selection from "./selection";
import { AnyIndividual, Individual } from "../individual/individual";
import { List } from "../genotype/list";
import { SelectionMethod } from "./selection";
import { maximize } from "../creation";

function individualFixture(fitness: number) {
  const individual = new Individual({
    genotype: new List([]),
  });

  individual.evaluate(() => maximize(fitness));
  return individual;
}

const individuals = [...Array(5)].map((_, i) => individualFixture(i + 1));

interface SelectSettings<I extends AnyIndividual> {
  amount?: number;
  method: SelectionMethod;
  individuals: I[];
}

function select<I extends AnyIndividual>(settings: SelectSettings<I>): I[] {
  const method = settings.method;
  const individuals = settings.individuals;
  const amount = settings.amount ?? 1;

  return method(amount, individuals);
}

function returnsIndividualArray(method: SelectionMethod): void {
  it("returns array with Individual instances", () => {
    const result = select({ method, individuals });
    expect(result.every(x => x instanceof Individual)).toBe(true);
  });
}

function returnsCorrectAmount(method: SelectionMethod): void {
  it("returns correct amount of items", () => {
    expect(select({ method, individuals, amount: 1 }).length).toBe(1);
    expect(select({ method, individuals, amount: 3 }).length).toBe(3);
  });
}

describe("best", () => {
  returnsIndividualArray(selection.best());
  returnsCorrectAmount(selection.best());

  it("selects the best individual", () => {
    const [result] = select({ method: selection.best(), individuals });
    expect(result.objective(0).value).toBe(5);
  });
});

describe("worst", () => {
  returnsIndividualArray(selection.worst());
  returnsCorrectAmount(selection.worst());

  it("selects the worst individual", () => {
    const [result] = select({ method: selection.worst(), individuals });
    expect(result.objective(0).value).toBe(1);
  });
});

describe("random", () => {
  returnsIndividualArray(selection.random());
  returnsCorrectAmount(selection.random());
});

describe("tournament", () => {
  const method = selection.tournament({ size: 3 });

  returnsIndividualArray(method);
  returnsCorrectAmount(method);

  it("selects the best individual from the group if the tournament size is equal to group size", () => {
    const [result] = select({ method: selection.tournament({ size: individuals.length }), individuals });
    expect(result.objective(0).value).toBe(5);
  });

  it("selects the winner using different selection method if provided", () => {
    const [result] = select({ method: selection.tournament({ size: individuals.length, winner: selection.worst() }), individuals });
    expect(result.objective(0).value).toBe(1);
  });
});

describe("roulette", () => {
  returnsIndividualArray(selection.roulette());
  returnsCorrectAmount(selection.roulette());
});

describe("rank", () => {
  returnsIndividualArray(selection.rank());
  returnsCorrectAmount(selection.rank());
});
