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

import { isPositiveInt, choose, range, shuffle } from "../util";

/**
 *
 */
export type CrossoverMethod<D> = (parents: D[]) => D[];

/**
 *
 */
export interface UniformCrossoverSettings {
  alpha: number;
}

/**
 *
 * @param settings
 * @category crossover
 */
export function uniform(settings: Partial<UniformCrossoverSettings> = {}): CrossoverMethod<any[]> {
  if (typeof settings !== "object") {
    throw new TypeError();
  }

  const alpha = settings.alpha ?? 0.5;

  if (typeof alpha !== "number" || alpha > 1 || 0 > alpha || isNaN(alpha)) {
    throw new TypeError();
  }

  return parents => {
    const [parentA, parentB] = parents;

    const childA = new Array(parentA.length);
    const childB = new Array(parentB.length);

    for (let i = 0; i < parentA.length; i++) {
      const x = Math.random();

      childA[i] = x > alpha ? parentB[i] : parentA[i];
      childB[i] = x > alpha ? parentA[i] : parentB[i];
    }

    return [childA, childB];
  };
}

/**
 *
 */
export interface PointCrossoverSettings {
  points: number | number[];
  start: number;
  end: number;
}

/**
 *
 * @param settings
 * @category crossover
 */
export function point(settings: Partial<PointCrossoverSettings> = {}): CrossoverMethod<any[]> {
  const points = settings.points ?? 2;

  return parents => {
    const [parentA, parentB] = parents;

    if (parents.length !== 2 || parentA.length !== parentB.length) {
      throw new TypeError();
    }

    const start = settings.start ?? 0;
    const end = settings.end ?? parentA.length - 1;

    let POINTS: number[];
    if (Array.isArray(points)) {
      if (points.some(point => !isPositiveInt(point) || start > point || point > end)) {
        throw new TypeError();
      }

      POINTS = points;
    } else {
      if (!isPositiveInt(points)) {
        throw new TypeError();
      }

      POINTS = shuffle(range(0, end - start)).slice(0, points);
    }

    POINTS.push(parentA.length);
    POINTS.sort((a, b) => a - b);

    if (1 > POINTS[0] || POINTS[POINTS.length - 1] > end + 1) {
      // throw new Error();
    }

    const segmentsA = new Array(POINTS.length);
    const segmentsB = new Array(POINTS.length);

    let flag = true;
    for (let i = 0; i < POINTS.length; i++) {
      const segmentStart = POINTS[i - 1] || 0;
      const segmentEnd = POINTS[i];

      segmentsA[i] = (flag ? parentA : parentB).slice(segmentStart, segmentEnd);
      segmentsB[i] = (flag ? parentB : parentA).slice(segmentStart, segmentEnd);

      flag = !flag;
    }

    return [
      segmentsA.reduce((acc, x) => acc.concat(x), []),
      segmentsB.reduce((acc, x) => acc.concat(x), []),
    ];
  };
}

/**
 *
 * @category crossover
 */
export function ordered(): CrossoverMethod<any[]> {
  return parents => {
    const points = range(0, parents[0].length - 1);
    const [start, end] = choose(points, 2).sort((a, b) => a - b);

    const A = [parents[0], parents[1]];
    const B = [parents[1], parents[0]];

    const children: any[] = new Array(2);

    for (let i = 0; i < 2; i++) {
      const swath = A[i].slice(start, end);
      const remaining = A[i].slice(0, start).concat(A[i].slice(end));
      remaining.sort((a: any, b: any) => B[i].indexOf(a) - B[i].indexOf(b));
      remaining.splice(start, 0, ...swath);

      children[i] = remaining;
    }

    return children;
  };
}

/**
 *
 */
export interface BlendCrossoverSettings {
  alpha: number;
}

/**
 *
 * @param settings
 * @category crossover
 */
export function blend(settings: Partial<BlendCrossoverSettings> = {}): CrossoverMethod<number[]> {
  const alpha = settings.alpha ?? 0.5;

  return parents => {
    const children = new Array(2);
    const [parentA, parentB] = parents;

    if (
      parents.length !== 2 ||
      parentA.length !== parentB.length
    ) {
      throw new TypeError();
    }

    for (let i = 0; i < 2; i++) {
      children[i] = parentA.map((_, i) => {
        const [a, b] = [parentA[i], parentB[i]].sort((a, b) => a - b);

        const offset = alpha * (b - a);
        const min = a - offset;
        const max = b + offset;

        return Math.random() * (max - min) + min;
      });
    }

    return children;
  };
}
/**
 *
 */
export interface SimulatedBinaryCrossoverSettings {
  distributionIndex: number;
}

/**
 *
 * @param settings
 * @category crossover
 */
export function simulatedBinary(settings: Partial<SimulatedBinaryCrossoverSettings> = {}): CrossoverMethod<number[]> {
  const distributionIndex = settings.distributionIndex ?? 3;

  return parents => {
    const u = Math.random();
    const x = 1 / (distributionIndex + 1);

    const beta = (0.5 >= u ? 2 * u : 1 / (2 * (1 - u))) ** x;

    const childA: number[] = new Array(parents[0].length);
    const childB: number[] = new Array(parents[0].length);

    for (let i = 0; i < parents[0].length; i++) {
      childA[i] = 0.5 * ((1 + beta) * parents[0][i] + (1 - beta) * parents[1][i]);
      childB[i] = 0.5 * ((1 - beta) * parents[0][i] + (1 + beta) * parents[1][i]);
    }

    return [childA, childB];
  };
}
