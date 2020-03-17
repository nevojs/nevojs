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

import { randomGauss, shuffle } from "../util";

/**
 *
 */
export type PureMutationMethod<D> = (data: D) => D;

/**
 *
 */
export type ImpureMutationMethod<D> = (data: D) => void;

/**
 *
 */
export type MutationMethod<D> = PureMutationMethod<D> | ImpureMutationMethod<D>;

/**
 *
 */
export type MutationMapFunction<T, U = T> = (value: T, i: number, arr: T[]) => U;

/**
*
*/
export interface MutationMapSettings<T> {
  rate?: number | MutationMapFunction<T, number>;
}

/**
 *
 * @param func
 * @param settings
 */
export function map<T, U extends T | void = T>(
  func: MutationMapFunction<T, U>,
  settings: MutationMapSettings<T> = {},
): U extends T ? PureMutationMethod<T[]> : ImpureMutationMethod<T[]> {
  const rate = settings.rate ?? 1;

  if (typeof func !== "function") {
    throw new TypeError();
  }

  if (typeof rate !== "number" && typeof rate !== "function") {
    throw new TypeError();
  }

  if (typeof rate === "number" && (0 > rate || rate > 1)) {
    throw new TypeError();
  }

  const method: PureMutationMethod<T[]> = genes => genes.map((gene, i) => {
    const probability = typeof rate === "function"
      ? rate(gene, i, genes)
      : rate;

    if (probability > Math.random()) {
      const x = func(gene, i, genes);

      if (x) {
        return x as unknown as T;
      }
    }

    return gene;
  });

  return method as any;
}

/**
 *
 */
export interface MutationBoundSettings {
  min?: number;
  max?: number;
}

/**
 *
 * @param func
 * @param settings
 * @category mutation
 */
export function bound(
  func: PureMutationMethod<number>,
  settings: MutationBoundSettings = {},
): PureMutationMethod<number> {
  const min = settings.min ?? -Infinity;
  const max = settings.max ?? Infinity;

  if (min > max) {
    throw new TypeError();
  }

  return gene => {
    const value = (func(gene) ?? gene) as number;

    return Math.min(Math.max(value, min), max);
  }
}

/**
 *
 */
export interface AlternateGeneSettings<T> {
  index?: number | ((genes: T[]) => number);
}

/**
 *
 * @param func
 * @param settings
 * @category mutation
 */
export function alternateGene<T>(
  func: MutationMapFunction<T>,
  settings: AlternateGeneSettings<T> = {},
): PureMutationMethod<T[]> {
  return genes => {
    const unresolvedIndex = settings.index ?? Math.floor(Math.random() * genes.length);
    const index = typeof unresolvedIndex === "function"
      ? unresolvedIndex(genes)
      : unresolvedIndex;

    if (index > genes.length - 1 || 0 > genes.length) {
      throw new TypeError();
    }

    genes[index] = func(genes[index], index, genes);
    return genes;
  }
}

/**
 *
 */
export interface AlternatePartSettings<T> {
  start?: number | ((genes: T[]) => number);
  end?: number | ((genes: T[], start: number) => number);
}

/**
 *
 * @param func
 * @param settings
 * @category mutation
 */
export function alternatePart<T>(
  func: (data: T[], start: number, end: number) => T[],
  settings: AlternatePartSettings<T> = {},
): PureMutationMethod<T[]> {
  return genes => {
    const unresolvedStart = settings.start ?? Math.floor(Math.random() * (genes.length - 1));
    const start = typeof unresolvedStart === "function"
      ? unresolvedStart(genes)
      : unresolvedStart;

    const unresolvedEnd = settings.end ?? Math.floor(Math.random() * (genes.length - start - 1) + start + 1);
    const end = typeof unresolvedEnd === "function"
      ? unresolvedEnd(genes, start)
      : unresolvedEnd;

    const mutated = func(genes.slice(start, end + 1), start, end);
    for (let i = start; i < end + 1; i++) {
      genes[i] = mutated[i - start];
    }

    return genes;
  }
}

/**
 *
 * @param gene
 * @category mutation
 */
export const flip: PureMutationMethod<number> = gene => Number(!gene);

/**
 *
 * @param settings
 * @category mutation
 */
export function inversion<T = any>(settings?: AlternatePartSettings<T>): PureMutationMethod<T[]> {
  return alternatePart(genes => genes.reverse(), settings);
}

/**
 *
 * @param settings
 * @category mutation
 */
export function swap<T>(settings?: AlternatePartSettings<T>): PureMutationMethod<T[]> {
  return alternatePart(genes => {
    const start = 0;
    const end = genes.length - 1;

    [genes[start], genes[end]] = [genes[end], genes[start]];
    return genes;
  }, settings);
}

/**
 *
 * @param settings
 * @category mutation
 */
export function scramble<T>(settings?: AlternatePartSettings<T>): PureMutationMethod<T[]> {
  return alternatePart(shuffle, settings);
}

/**
 * @category mutation
 */
export function gauss(): PureMutationMethod<number> {
  return gene => gene + randomGauss();
}
