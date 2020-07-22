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

import { AnyGenotype } from "./data";
import {
  AnyIndividual,
  IndividualDefaultValues,
} from "./individual";
import { BlueprintDefaultValues } from "./blueprint/blueprint";

/**
 *
 */
export enum Default {
  Evaluation = "evaluation",
  Mutation = "mutation",
  Crossover = "crossover",
  CrossoverSettings = "crossoverSettings",
  Cloning = "cloning",
  Serialization = "serialization",
  Deserialization = "deserialization",
}

/**
 *
 */
export type DefaultValues<G extends AnyGenotype, P> =
  IndividualDefaultValues<G, P> &
  BlueprintDefaultValues<G, P>;

/**
 *
 */
export class DefaultProperties<T> {
  protected data: Partial<T> = {};

  /**
   *
   * @param field
   * @param value
   */
  public set<K extends keyof T>(
    field: K,
    value: T[K],
  ): void {
    this.data[field] = value;
  }

  /**
   *
   * @param field
   */
  public has(field: keyof T): boolean {
    return this.data[field] !== undefined;
  }

  /**
   *
   * @param field
   */
  public get<K extends keyof T>(field: K): T[K] {
    return this.data[field] as T[K];
  }

  /**
   *
   * @param individual
   */
  public apply(individual: AnyIndividual): void {
    const fields = Object.keys(this.data) as (keyof T)[];

    for (const field of fields) {
      if (!this.has(field)) {
        continue;
      }

      individual.defaults.set(field as string, this.get(field));
    }
  }
}
