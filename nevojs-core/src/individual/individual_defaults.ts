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

export abstract class IndividualDefaults<G extends Genotype, P> {
  protected evaluationFunc?: EvaluationFunction<G, P>;
  protected mutationMethod?: MutationMethod<GenotypeData<G>>;
  protected crossoverMethod?: CrossoverMethod<GenotypeData<G>>;

  /**
   *
   * @param func
   */
  public setDefaultEvaluation(func: EvaluationFunction<G, P>): void {
    this.evaluationFunc = func;
  }

  /**
   *
   */
  public get hasDefaultEvaluation(): boolean {
    return Boolean(this.evaluationFunc);
  }

  /**
   *
   * @param func
   */
  public setDefaultMutation(func: MutationMethod<GenotypeData<G>>): void {
    this.mutationMethod = func;
  }

  /**
   *
   */
  public get hasDefaultMutation(): boolean {
    return Boolean(this.mutationMethod);
  }

  /**
   *
   * @param func
   */
  public setDefaultCrossover(func: CrossoverMethod<GenotypeData<G>>): void {
    this.crossoverMethod = func;
  }

  /**
   *
   */
  public get hasDefaultCrossover(): boolean {
    return Boolean(this.crossoverMethod);
  }

  /**
   *
   * @param individual
   */
  protected applyDefaults(individual: Individual<G, P>): void {
    if (this.evaluationFunc) {
      individual.setDefaultEvaluation(this.evaluationFunc);
    }

    if (this.mutationMethod) {
      individual.setDefaultMutation(this.mutationMethod);
    }

    if (this.crossoverMethod) {
      individual.setDefaultCrossover(this.crossoverMethod);
    }
  }
}
