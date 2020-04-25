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

import { AnyIndividual, Individual, IndividualConstructorSettings } from "./individual/individual";
import { Blueprint, BlueprintConstructorSettings } from "./individual/blueprint/blueprint";
import { Group } from "./individual/group";
import { AnyGenotype, UnresolvedGenotype } from "./individual/data";
import { List } from "./genotype/list";
import { Objective } from "./individual/evaluation/objective";
import { ResolvedBlueprint } from "./individual/blueprint/blueprint_aliases";
import { CollectionConstructorSettings } from "./collection";

/**
 *
 * @param settings
 * @category creation
 */
export function individual<G extends AnyGenotype, P>(
  settings: IndividualConstructorSettings<G, P>,
): Individual<G, P> {
  return new Individual(settings);
}

/**
 *
 * @param settings
 * @category creation
 */
export function blueprint<G extends UnresolvedGenotype, P>(
  settings: BlueprintConstructorSettings<G, P>,
): ResolvedBlueprint<G, P> {
  return new Blueprint(settings) as any;
}

/**
 *
 * @param data
 * @category creation
 */
export function list<T>(data: T[]): List<T> {
  return new List(data);
}

/**
 *
 * @param data
 * @category creation
 */
export function group<I extends AnyIndividual>(data: I[] | CollectionConstructorSettings<I> = {}): Group<I> {
  if (Array.isArray(data)) {
    return new Group({ members: data });
  }

  return new Group(data);
}

/**
 *
 * @param value
 * @param weight
 * @category creation
 */
export const objective = (value: number, weight: number) => new Objective(value, weight);

/**
 *
 * @param value
 * @category creation
 */
export const minimize = (value: number) => objective(value, -1);

/**
 *
 * @param value
 * @category creation
 */
export const maximize = (value: number) => objective(value, 1);
