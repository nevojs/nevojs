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

import { EvaluationData, EvaluationFunction } from "./evaluation/evaluation_function";
import { Genotype, GenotypeData } from "./data";
import { Objective, SerializedObjective } from "./evaluation/objective";
import { deepClone, Resolved, toArray } from "../util";
import { deserialize, isSerializable, Serializable, SerializableObject, serialize } from "../serialization";
import { CrossoverMethod } from "../operators/crossover";
import { IndividualDefaults, Default } from "./individual_defaults";
import { MutationMethod } from "../operators/mutation";

/**
 *
 */
export type PhenotypeFunction<G extends Genotype, P> = (genotype: G, state: any) => P;

/**
 *
 */
export interface IndividualConstructorSettings<G extends Genotype, P> {
  genotype: G;
  phenotype?: PhenotypeFunction<G, P>;
  state?: SerializableObject;
}

/**
 *
 */
export interface IndividualCloneSettings<G extends Genotype, P> {
  genotype?: (data: GenotypeData<G>) => GenotypeData<G>;
  state?: (state: any) => any;
}

/**
 *
 */
export interface SerializedIndividual {
  genotype: Serializable;
  state: SerializableObject;
  objectives: SerializedObjective[];
}

/**
 *
 */
export interface IndividualSerializationSettings<G extends Genotype, P> {
  genotype?: (data: GenotypeData<G>) => Serializable;
  state?: (state: any) => SerializableObject;
  check?: boolean;
}

/**
 *
 */
export interface IndividualDeserializationSettings<G extends Genotype, P> {
  genotype: (data: any) => G;
  phenotype?: (genotype: G, state: any) => P;
  state?: (data: SerializableObject) => SerializableObject;
}

/**
 *
 */
export type UnresolvedGenotype = Genotype | Promise<Genotype>;

/**
 *
 */
export type ResolvedIndividual<G extends UnresolvedGenotype, P> = Individual<Resolved<G>, P>;

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
    const deserialized = deserialize(serialized) as SerializedIndividual;

    const genotype = settings.genotype(deserialized.genotype);
    const phenotype = settings.phenotype;

    const state = settings.state
      ? settings.state(deserialized.state)
      : deserialized.state;

    const individual = new Individual({ genotype, phenotype, state });

    const objectives = deserialized.objectives.map(Objective.deserialize);
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
  public readonly phenotypeFunc: PhenotypeFunction<G, P>;

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
  public readonly state: SerializableObject;

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
    func: EvaluationFunction<G, P> = this.getDefault(Default.Evaluation),
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
   * @param settings
   */
  public clone(
    settings: IndividualCloneSettings<G, P> = {}
  ): Individual<G, P> {
    const genotype = this.genotype.clone(settings.genotype) as G;
    const phenotype = this.phenotypeFunc;
    const state = deepClone(settings.state ? settings.state(this.state) : this.state);

    const individual = new Individual({ genotype, phenotype, state });
    individual.setObjectives(this.objectives().map(objective => objective.clone()));
    this.applyDefaults(individual);

    return individual;
  }

  /**
   *
   * @param method
   */
  public mutate(method: MutationMethod<GenotypeData<G>> = this.getDefault(Default.Mutation)): void {
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

    if (settings.state !== undefined && typeof settings.state !== "function") {
      throw new TypeError();
    }

    const state = settings.state
      ? settings.state(this.state)
      : this.state;

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

    return serialize({ genotype, state, objectives });
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
    method: CrossoverMethod<GenotypeData<G>> = this.getDefault(Default.Crossover),
    settings: Partial<IndividualConstructorSettings<G, P>> = {},
  ): Individual<G, P>[] {
    const phenotype = settings.phenotype ?? this.phenotypeFunc;

    if (typeof method !== "function") {
      throw new TypeError();
    }

    const partnerGenotypes = partners.map(partner => partner.genotype);
    const childrenGenotypes = this.genotype.offspring(partnerGenotypes, method) as G[];

    return childrenGenotypes.map(genotype => {
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
