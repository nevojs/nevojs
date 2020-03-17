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

import { isNumber, isPositiveInt, pick, sum } from "../util";
import { AnyIndividual } from "../individual/individual";
import { ScalarizationMethod } from "../individual/multiobjective_optimization/scalarization";

/**
 *
 */
export type SelectionMethod<I extends AnyIndividual = any> = (
  amount: number,
  individuals: I[],
  target: ScalarizationMethod<I>,
) => I[];

/**
 *
 * @param amount
 * @param individuals
 * @param target
 * @category selection
 */
export const best: SelectionMethod = (
  amount,
  individuals,
  target,
) => individuals.sort((a, b) => target(b) - target(a)).slice(0, amount);

/**
 *
 * @param amount
 * @param individuals
 * @param target
 * @category selection
 */
export const worst: SelectionMethod = (
  amount,
  individuals,
  target,
) => individuals.sort((a, b) => target(a) - target(b)).slice(0, amount);

/**
 *
 * @param amount
 * @param individuals
 * @category selection
 */
export const random: SelectionMethod = (
  amount,
  individuals,
) => pick(individuals, amount);

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
  const winner = settings.winner ?? best as SelectionMethod<I>;
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

  return (amount, individuals, target) => {
    if (!duplicates && amount > individuals.length) {
      throw new RangeError("");
    }

    if (size > individuals.length) {
      throw new RangeError("");
    }

    const picked: typeof individuals = new Array(amount);
    const clone = individuals.slice();

    for (let i = 0; i < amount; i++) {
      const sample = pick(clone, size);
      const [selected] = winner(1, sample, target);

      picked[i] = selected;

      if (!duplicates) {
        clone.splice(clone.indexOf(selected), 1);
      }
    }

    return picked;
  }
}

/**
 *
 * @param fitness
 * @category selection
 */
export const proportionate = (fitness: number[]): SelectionMethod => (amount, individuals) => {
  const amountOfIndividuals = individuals.length;
  const fitnessSum = sum(fitness);

  return Array.from(new Array(amount)).map(() => {
    const roll = Math.random();

    let currentProbability = 0;
    const probabilities = fitness.map(x => currentProbability += x / fitnessSum);

    for (let i = 0; i < amountOfIndividuals; i++) {
      if (roll < probabilities[i]) {
        return individuals[i];
      }
    }

    return individuals[amountOfIndividuals - 1];
  });
};

/**
 *
 * @param amount
 * @param individuals
 * @param target
 * @category selection
 */
export const roulette: SelectionMethod = (amount, individuals, target) => {
  const method = proportionate(individuals.map(target));
  return method(amount, individuals, target);
};

/**
 *
 * @param amount
 * @param individuals
 * @param target
 * @category selection
 */
export const rank: SelectionMethod = (amount, individuals, target) => {
  individuals.sort((a, b) => target(a) - target(b));
  const method = proportionate(individuals.map((_, i) => i + 1));

  return method(amount, individuals, target);
};
