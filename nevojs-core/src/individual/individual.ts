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
import { AnyGenotype, UnresolvedGenotype } from "./data";
import { Objective, SerializedObjective } from "./evaluation/objective";
import { Resolved, toArray } from "../util";
import { deserialize, isSerializable, Serializable, SerializableObject, serialize } from "../serialization";
import { CrossoverMethod } from "../operators/crossover";
import { Default, DefaultProperties } from "./default_properties";
import { MutationMethod } from "../operators/mutation";
import { State } from "./state";
import { $Crossover, $Data, $Mutation } from "../util_types";

/**
 *
 */
export type PhenotypeFunction<G extends AnyGenotype, P> = (genotype: G, state: State<any>) => P;

/**
 *
 */
export interface IndividualConstructorSettings<G extends AnyGenotype, P> {
  genotype: G;
  phenotype?: PhenotypeFunction<G, P>;
  state?: State<any>;
}

/**
 *
 */
export interface IndividualCloneSettings<G extends AnyGenotype, P> {
  genotype?: (data: $Data<G>) => $Data<G>;
  state?: (state: any) => any;
}

/**
 *
 */
export interface SerializedIndividual {
  genotype: Serializable;
  state: any;
  objectives: SerializedObjective[];
}

/**
 *
 */
export interface IndividualSerializationSettings<G extends AnyGenotype, P> {
  genotype?: (data: $Data<G>) => Serializable;
  state?: (data: any) => SerializableObject;
  check?: boolean;
}

/**
 *
 */
export interface IndividualDeserializationSettings<G extends AnyGenotype, P> {
  genotype: (data: any) => G;
  phenotype?: PhenotypeFunction<G, P>;
  state?: (data: SerializableObject) => any;
}

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
export type IndividualDefaultValues<G extends AnyGenotype, P> = {
  [Default.Evaluation]: EvaluationFunction<G, P>;
  [Default.Mutation]: $Mutation<G>;
  [Default.Crossover]: $Crossover<G>;
  [Default.Cloning]: IndividualCloneSettings<G, P>;
  [Default.Serialization]: IndividualSerializationSettings<G, P>;
  [unknownDefault: string]: unknown;
};

/**
 *
 */
export class Individual<G extends AnyGenotype, P> extends DefaultProperties<IndividualDefaultValues<G, P>> {
  /**
   *
   * @param serialized
   * @param settings
   */
  public static deserialize<G extends AnyGenotype, P = undefined>(
    serialized: SerializedIndividual,
    settings: IndividualDeserializationSettings<G, P>,
  ): Individual<G, P> {
    const deserialized = deserialize(serialized) as SerializedIndividual;

    const genotype = settings.genotype(deserialized.genotype);
    const phenotype = settings.phenotype;

    const state = new State(settings.state
      ? settings.state(deserialized.state)
      : deserialized.state);

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
  public static fromJSON<G extends AnyGenotype, P = undefined>(
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
  public readonly state: State<any>;

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

    const state = settings.state ?? new State({});

    this.genotype = settings.genotype;
    this.phenotypeFunc = settings.phenotype ?? (() => (undefined as unknown as P));
    this.phenotype = this.phenotypeFunc(this.genotype, state);

    this.state = state;
  }

  /**
   *
   * @param func
   */
  public evaluate(
    func: EvaluationFunction<G, P> = this.getDefault(Default.Evaluation),
  ): void | Promise<void> {
    if (typeof func !== "function") {
      throw new TypeError();
    }

    const evaluation = func(this);
    const assignEvaluation = (data: EvaluationData) => this.setObjectives(toArray(data));

    return evaluation instanceof Promise
      ? evaluation.then(assignEvaluation)
      : assignEvaluation(evaluation);
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
    settings: IndividualCloneSettings<G, P> = this.getDefault(Default.Cloning) ?? {},
  ): Individual<G, P> {
    const genotype = this.genotype.clone(settings.genotype) as G;
    const phenotype = this.phenotypeFunc;
    const state = this.state.clone();

    const individual = new Individual({ genotype, phenotype, state });
    individual.setObjectives(this.objectives().map(objective => objective.clone()));
    this.applyDefaults(individual);

    return individual;
  }

  /**
   *
   * @param method
   */
  public mutate(method: MutationMethod<$Data<G>> = this.getDefault(Default.Mutation)): void {
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
    settings: IndividualSerializationSettings<G, P> = this.getDefault(Default.Serialization) ?? {},
  ): SerializedIndividual {
    const check = settings.check ?? true;

    const data = this.genotype.__serialize() as $Data<G>;
    const genotype = settings.genotype
      ? settings.genotype(data)
      : data;

    if (settings.state !== undefined && typeof settings.state !== "function") {
      throw new TypeError();
    }

    const x = this.state.computed();
    const state = settings.state
      ? settings.state(x)
      : x;

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
    settings?: IndividualSerializationSettings<G, P>,
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
    method: CrossoverMethod<$Data<G>> = this.getDefault(Default.Crossover),
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
    method?: CrossoverMethod<$Data<G>>,
    settings?: Partial<IndividualConstructorSettings<G, P>>,
  ): Individual<G, P>[] {
    const children: Individual<G, P>[] = [];

    while (amount > children.length) {
      children.push(...this.offspring(partners, method, settings));
    }

    return children.slice(0, amount);
  }
}
