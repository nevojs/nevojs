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

import { AnyIndividual } from "../individual";
import { ScalarizationMethod } from "./scalarization";
import { best } from "../../operators/selection";

/**
 *
 * @param members
 * @category multi-objective-optimization
 */
export function nonDominatedSort<I extends AnyIndividual>(
  members: I[],
): I[][] {
  const frontiers: I[][] = [];
  const map: WeakMap<I, { dominating: I[]; dominationCount: number }> = new Map();

  const frontier: I[] = [];
  for (const member of members) {
    const dominating: I[] = [];
    let dominationCount = 0;

    for (const rival of members) {
      if (rival === member) {
        continue;
      }

      if (member.dominates(rival)) {
        dominating.push(rival);
      } else if (rival.dominates(member)) {
        dominationCount += 1;
      }
    }

    map.set(member, { dominating, dominationCount });
    if (dominationCount === 0) {
      frontier.push(member);
    }
  }

  frontiers.push(frontier);

  let i = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const frontier: I[] = [];
    for (const member of frontiers[i]) {
      const { dominating } = map.get(member)!;

      for (const q of dominating) {
        const data = map.get(q)!;

        let dominationCountQ = data.dominationCount;
        dominationCountQ -= 1;
        map.set(q, { dominationCount: dominationCountQ, dominating: data.dominating });

        if (dominationCountQ === 0) {
          frontier.push(q);
        }
      }
    }

    if (frontier.length === 0) {
      break;
    }

    i += 1;
    frontiers.push(frontier);
  }

  return frontiers;
}

/**
 *
 * @param individuals
 * @category multi-objective-optimization
 */
export function crowdingDistance<I extends AnyIndividual>(individuals: I[]): WeakMap<I, number> {
  const l = individuals.length;
  const distance = new WeakMap<I, number>();

  for (const individual of individuals) {
    distance.set(individual, 0);
  }

  for (let i = 0; i < individuals[0].objectives().length; i++) {
    const criteria: ScalarizationMethod<I> = individual => individual.objective(i).fitness();
    const selection = best(criteria);

    const sorted = selection(individuals.length, individuals);

    distance.set(sorted[0], Infinity);
    distance.set(sorted[l - 1], Infinity);

    const norm = individuals[0].objectives().length * (sorted[l - 1].objective(i).fitness() - sorted[0].objective(i).fitness());

    for (let j = 1; j < l - 1; j++) {
      const value = distance.get(sorted[j]);
      const previous = sorted[j - 1];
      const next = sorted[j + 1];

      distance.set(sorted[j], value! + (next.objective(i).fitness() - previous.objective(i).fitness()) / norm);
    }
  }

  return distance;
}

/**
 *
 * @param individual
 * @param fronts
 * @category multi-objective-optimization
 */
export function rank(individual: AnyIndividual, fronts: AnyIndividual[][]): number {
  const front = fronts.find(front => front.includes(individual));

  if (front === undefined || !fronts.includes(front)) {
    throw new Error();
  }

  return fronts.indexOf(front) + 1;
}
