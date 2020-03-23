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

import { Genotype, GenotypeData } from "./data";
import { CrossoverMethod } from "../operators/crossover";
import { EvaluationFunction } from "./evaluation/evaluation_function";
import { Individual } from "./individual";
import { MutationMethod } from "../operators/mutation";

/**
 *
 */
export enum Default {
  Evaluation = "evaluation",
  Mutation = "mutation",
  Crossover = "crossover",
}

/**
 *
 */
export type DefaultsValues<G extends Genotype, P> = {
  [Default.Evaluation]: EvaluationFunction<G, P>;
  [Default.Mutation]: MutationMethod<GenotypeData<G>>;
  [Default.Crossover]: CrossoverMethod<GenotypeData<G>>;
  [unknownDefault: string]: unknown;
}

type DefaultKey = Default | (Default[keyof Default] & string);

/**
 *
 */
export abstract class IndividualDefaults<G extends Genotype, P> {
  protected data: Partial<DefaultsValues<G, P>> = {};

  /**
   *
   * @param field
   * @param data
   */
  public setDefault<T extends DefaultKey>(
    field: T,
    data: DefaultsValues<G, P>[T],
  ): void {
    this.data[field] = data;
  }

  /**
   *
   * @param field
   */
  public hasDefault(field: Default): boolean {
    return this.data[field] !== undefined;
  }

  /**
   *
   * @param field
   */
  public getDefault<T extends DefaultKey>(field: T): DefaultsValues<G, P>[T] {
    return this.data[field] as DefaultsValues<G, P>[T];
  }

  /**
   *
   * @param individual
   */
  protected applyDefaults(individual: Individual<G, P>): void {
    const fields = Object.values(Default)
      .filter(value => typeof value === "string") as Default[];

    for (const field of fields) {
      if (!this.hasDefault(field)) {
        continue;
      }

      individual.setDefault(field, this.getDefault(field));
    }
  }
}
