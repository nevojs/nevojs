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

import { ScalarizationMethod, weightedSum } from "../individual/multiobjective_optimization/scalarization";
import { isNumber, isPositiveInt, choose } from "../util";
import { pick } from "../helpers";
import { AnyIndividual } from "../individual/individual";
import {
  crowdingDistance,
  nonDominatedSort
} from "../individual/multiobjective_optimization/multiobjective_optimization";

/**
 *
 */
export type SelectionMethod<I extends AnyIndividual = any> = (
  amount: number,
  individuals: I[],
) => I[];

/**
 *
 * @param target
 * @category selection
 */
export function best<I extends AnyIndividual>(target: ScalarizationMethod<I> = weightedSum): SelectionMethod<I> {
  return (amount, individuals) => individuals.sort((a, b) => target(b) - target(a)).slice(0, amount);
}

/**
 *
 * @param target
 * @category selection
 */
export function worst<I extends AnyIndividual>(target: ScalarizationMethod<I> = weightedSum): SelectionMethod<I> {
  return best(ind => -target(ind));
}

/**
 *
 * @category selection
 */
export function random<I extends AnyIndividual>(): SelectionMethod<I> {
  return (amount, individuals) => choose(individuals, amount);
}

/**
 *
 */
export interface TournamentSelectionSettings<I extends AnyIndividual> {
  size?: number;
  duplicates?: boolean;
  winner?: SelectionMethod<I>;
}

/**
 *
 * @param settings
 * @category selection
 */
export function tournament<I extends AnyIndividual>(
  settings: TournamentSelectionSettings<I> = {},
): SelectionMethod<I> {
  const duplicates = settings.duplicates ?? false;
  const winner = settings.winner ?? best() as SelectionMethod<I>;
  const size = settings.size ?? 2;

  if (!isNumber(size)|| !isPositiveInt(size)) {
    throw new TypeError("");
  }

  if (typeof duplicates !== "boolean") {
    throw new TypeError("");
  }

  if (typeof winner !== "function") {
    throw new TypeError("");
  }

  return (amount, individuals) => {
    if (!duplicates && amount > individuals.length) {
      throw new RangeError("");
    }

    if (size > individuals.length) {
      throw new RangeError("");
    }

    const picked: typeof individuals = new Array(amount);
    const clone = individuals.slice();

    for (let i = 0; i < amount; i++) {
      const sample = choose(clone, size);
      const [selected] = winner(1, sample);

      picked[i] = selected;

      if (!duplicates) {
        clone.splice(clone.indexOf(selected), 1);
      }
    }

    return picked;
  }
}

/**
 * @category selection
 * @param target
 */
export function roulette<I extends AnyIndividual>(target: ScalarizationMethod<I> = weightedSum): SelectionMethod<I> {
  return (amount, individuals) => {
    const items = individuals.map(item => {
      const probability = target(item);
      return { probability, item };
    });

    return Array.from(new Array(amount)).map(() => pick(items));
  };
}

/**
 *
 * @param target
 * @category selection
 */
export function rank<I extends AnyIndividual>(target: ScalarizationMethod<I> = weightedSum): SelectionMethod<I> {
  return (amount, individuals) => {
    individuals.sort((a, b) => target(a) - target(b));
    const method = roulette<I>(ind => individuals.indexOf(ind) + 1);

    return method(amount, individuals);
  };
}

/**
 *
 */
export interface NSGA2Settings<I extends AnyIndividual> {
  frontiers?: I[][];
  distances?: WeakMap<I, number>;
}

/**
 *
 * @param settings
 * @constructor
 */
export function NSGA2<I extends AnyIndividual>(settings: NSGA2Settings<I> = {}): SelectionMethod<I> {
  return (amount, individuals) => {
    const frontiers = settings.frontiers ?? nonDominatedSort(individuals);
    const selected: I[] = [];

    while (amount > selected.length) {
      const front = frontiers.shift()!;

      if (amount - selected.length >= front.length) {
        selected.push(...front);
        continue;
      }

      const distances = settings.distances ?? crowdingDistance(front);
      const sorted = front.sort((a, b) => {
        return distances.get(b)! - distances.get(a)!;
      });

      selected.push(...sorted.slice(0, amount - selected.length));
    }

    return selected;
  };
}
