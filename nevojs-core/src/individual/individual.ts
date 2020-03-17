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
 * distributed under the License is distributed on an "AS IS" BzASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import { Genotype, GenotypeData, State } from "./data";
import { Objective, SerializedObjective } from "./evaluation/objective";
import { toArray, Resolved, deepClone, id } from "../util";
import { CrossoverMethod } from "../operators/crossover";
import { MutationMethod } from "../operators/mutation";
import { IndividualDefaults } from "./individual_defaults";
import { EvaluationData, EvaluationFunction } from "./evaluation/evaluation_function";
import { serialize, deserialize, Serializable, SerializableObject, isSerializable } from "../serialization";

/**
 *
 */
export interface IndividualConstructorSettings<G extends Genotype, P> {
  genotype: G;
  phenotype?: (genotype: G, state: any) => P;
  state?: State;
}

/**
 *
 */
export interface SerializedIndividual {
  genotype: Serializable;
  state: State;
  objectives: SerializedObjective[];
}

/**
 *
 */
export interface IndividualSerializationSettings<G extends Genotype, P> {
  genotype?: (data: GenotypeData<G>) => Serializable;
  state?: (state: any) => SerializableObject;
  check?: boolean;
  deepClone?: boolean;
}

/**
 *
 */
export interface IndividualDeserializationSettings<G extends Genotype, P> {
  genotype: (data: any) => G;
  phenotype?: (genotype: G, state: any) => P;
  state?: (data: SerializableObject) => State;
}

/**
 *
 */
export type ResolvedIndividual<G extends Genotype | Promise<Genotype>, P> = Individual<Resolved<G>, P>;

/**
 *
 */
export type AnyIndividual = Individual<any, any>;

/**
 *
 */
export class Individual<G extends Genotype, P> extends IndividualDefaults<G, P> {
  /**
   *
   * @param serialized
   * @param settings
   */
  public static deserialize<G extends Genotype, P = undefined>(
    serialized: SerializedIndividual,
    settings: IndividualDeserializationSettings<G, P>,
  ): Individual<G, P> {
    serialized = deserialize(serialized);

    const genotype = settings.genotype(serialized.genotype);
    const phenotype = settings.phenotype;

    const stateFunc = settings.state ?? id;
    const state = deserialize(serialize(stateFunc(serialized.state)));

    const individual = new Individual({ genotype, phenotype, state });

    const objectives = serialized.objectives.map(Objective.deserialize);
    individual.setObjectives(objectives);

    return individual;
  }

  /**
   *
   * @param data
   * @param settings
   */
  public static fromJSON<G extends Genotype, P = undefined>(
    data: string,
    settings: IndividualDeserializationSettings<G, P>,
  ): Individual<G, P> {
    return Individual.deserialize(JSON.parse(data), settings);
  }

  /**
   *
   */
  public readonly phenotypeFunc: (genotype: G, state: any) => P;

  /**
   *
   */
  public readonly genotype: G;

  /**
   *
   */
  public readonly phenotype: P;

  /**
   *
   */
  public readonly state: State;

  /**
   *
   */
  private _objectives: Objective[] = [];

  /**
   *
   * @param settings
   */
  public constructor(settings: IndividualConstructorSettings<G, P>) {
    super();

    const state = settings.state ?? {};

    this.genotype = settings.genotype;
    this.phenotypeFunc = settings.phenotype ?? (() => (undefined as unknown as P));
    this.phenotype = this.phenotypeFunc(this.genotype, state);

    this.state = state;
  }

  /**
   *
   * @param func
   */
  public evaluate<T extends void | Promise<void>>(
    func: EvaluationFunction<G, P> = this.evaluationFunc!,
  ): T {
    if (typeof func !== "function") {
      throw new TypeError();
    }

    const evaluation = func(this);
    const assignEvaluation = (data: EvaluationData) => this.setObjectives(toArray(data));

    return evaluation instanceof Promise
      ? evaluation.then(assignEvaluation) as T
      : assignEvaluation(evaluation) as T;
  }

  /**
   *
   */
  public objectives(): Objective[] {
    return this._objectives.slice();
  }

  /**
   *
   * @param index
   */
  public objective(index: number): Objective {
    const objective = this._objectives[index];

    if (objective === undefined) {
      throw new TypeError("");
    }

    return objective;
  }

  /**
   *
   * @param objectives
   */
  public setObjectives(objectives: Objective[]): void {
    if (!Array.isArray(objectives)) {
      throw new TypeError("");
    }

    this._objectives = objectives.slice();
  }

  /**
   *
   */
  public fitness(): number[] {
    return this._objectives.map(objective => objective.fitness());
  }

  /**
   *
   */
  public values(): number[] {
    return this._objectives.map(objective => objective.value);
  }

  /**
   *
   * @param func
   * @param func2
   */
  public clone(
    func?: (genotype: GenotypeData<G>) => GenotypeData<G>,
    func2?: (state: State) => State,
  ): Individual<G, P> {
    const genotype = this.genotype.clone(func) as G;
    const phenotype = this.phenotypeFunc;
    const state = deepClone(this.state);

    return new Individual({ genotype, phenotype, state });
  }

  /**
   *
   * @param method
   */
  public mutate(method: MutationMethod<GenotypeData<G>> = this.mutationMethod!): void {
    if (typeof method !== "function") {
      throw new TypeError();
    }

    this.genotype.mutate(method);
  }

  /**
   *
   * @param rival
   */
  public dominates(rival: AnyIndividual): boolean {
    const objectives = this.objectives();

    if (objectives.length !== rival.objectives().length) {
      throw new TypeError();
    }

    return objectives.every((objective, i) => objective.fitness() >= rival.objective(i).fitness())
      && objectives.some((objective, i) => objective.fitness() > rival.objective(i).fitness());
  }

  /**
   *
   * @param settings
   */
  public serialize(
    settings: IndividualSerializationSettings<G, P> = {},
  ): SerializedIndividual {
    const check = settings.check ?? true;
    const genotype = this.genotype.serialize(settings.genotype);
    const stateFunc = settings.state ?? id;

    if (typeof stateFunc !== "function") {
      throw new TypeError();
    }

    const state = deepClone(stateFunc(this.state) as State);

    if (check) {
      if (!isSerializable(genotype)) {
        throw new TypeError("cannot serialize");
      }

      if (typeof state !== "object" || state === null) {
        throw new TypeError();
      }

      if (!isSerializable(state)) {
        throw new TypeError("cannot serialize");
      }
    }

    const objectives = this.objectives().map(objective => objective.serialize());

    return { genotype, state, objectives };
  }

  /**
   *
   * @param settings
   */
  public toJSON(
    settings: IndividualSerializationSettings<G, P> = {},
  ): string {
    return JSON.stringify(this.serialize(settings));
  }

  /**
   *
   * @param partners
   * @param method
   * @param settings
   */
  public offspring(
    partners: Individual<G, P>[],
    method: CrossoverMethod<GenotypeData<G>> = this.crossoverMethod!,
    settings: Partial<IndividualConstructorSettings<G, P>> = {},
  ): Individual<G, P>[] {
    if (typeof method !== "function") {
      throw new TypeError();
    }

    const genotypes = partners.map(partner => partner.genotype);
    const children = this.genotype.offspring(genotypes, method) as G[];

    return children.map(genotype => {
      const phenotype = settings.phenotype ?? this.phenotypeFunc;
      const state = settings.state;

      const individual = new Individual({ genotype, phenotype, state });
      this.applyDefaults(individual);

      return individual;
    });
  }

  /**
   *
   * @param amount
   * @param partners
   * @param method
   * @param settings
   */
  public crossover(
    amount: number,
    partners: Individual<G, P>[],
    method?: CrossoverMethod<GenotypeData<G>>,
    settings?: Partial<IndividualConstructorSettings<G, P>>,
  ): Individual<G, P>[] {
    const children: Individual<G, P>[] = [];

    while (amount > children.length) {
      children.push(...this.offspring(partners, method, settings));
    }

    return children.slice(0, amount);
  }
}
