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

import {
  Individual,
  IndividualDeserializationSettings, PhenotypeFunction, ResolvedIndividual,
  SerializedIndividual,
} from "../individual";
import { IndividualDefaults } from "../individual_defaults";
import { Resolved } from "../../util";
import { SerializableObject } from "../../serialization";
import { State } from "../state";
import { UnresolvedGenotype } from "../data";

/**
 *
 */
export type BlueprintGenotypeFunction<G extends UnresolvedGenotype> = (arg: any) => G;

/**
 *
 */
export type BlueprintPhenotypeFunction<G extends UnresolvedGenotype, P> = PhenotypeFunction<Resolved<G>, P>;

/**
 *
 */
export interface BlueprintConstructorSettings<G extends UnresolvedGenotype, P> {
  genotype: BlueprintGenotypeFunction<G>;
  phenotype?: BlueprintPhenotypeFunction<G, P>;
}

/**
 *
 */
export interface BlueprintCreationSettings<G extends UnresolvedGenotype, P> extends Partial<BlueprintConstructorSettings<G, P>> {
  arg?: () => any;
  state?: () => SerializableObject;
}

/**
 *
 */
type BlueprintSpawnOutput<G extends UnresolvedGenotype, P> = ResolvedIndividual<G, P> | Promise<ResolvedIndividual<G, P>>;

/**
 *
 */
export class Blueprint<G extends UnresolvedGenotype, P> extends IndividualDefaults<Resolved<G>, P> {
  /**
   *
   */
  public readonly genotypeFunc: BlueprintGenotypeFunction<G>;

  /**
   *
   */
  public readonly phenotypeFunc: BlueprintPhenotypeFunction<G, P>;

  /**
   *
   * @param settings
   */
  public constructor(settings: BlueprintConstructorSettings<G, P>) {
    super();

    const defaultPhenotypeFunc = () => undefined as unknown as P;

    this.genotypeFunc = settings.genotype;
    this.phenotypeFunc = settings.phenotype ?? defaultPhenotypeFunc;
  }

  /**
   *
   */
  public spawn(
    settings: BlueprintCreationSettings<G, P> = {},
  ): BlueprintSpawnOutput<G, P> {
    const arg = settings.arg ? settings.arg() : undefined;
    const genotype = settings.genotype
      ? settings.genotype(arg)
      : this.genotypeFunc(arg);

    if (genotype instanceof Promise) {
      return genotype.then(resolvedGenotype => {
        return this.spawn({ ...settings, genotype: () => resolvedGenotype });
      });
    }

    const phenotype = settings.phenotype ?? this.phenotypeFunc;
    const state: State<any> = new State(settings.state
      ? settings.state()
      : {});

    const individual = new Individual({
      genotype: genotype as Resolved<G>,
      phenotype,
      state,
    });

    this.applyDefaults(individual);
    return individual;
  }

  /**
   *
   * @param amount
   * @param settings
   */
  public create(
    amount: number,
    settings?: BlueprintCreationSettings<G, P>,
    check: boolean = true,
  ): BlueprintSpawnOutput<G, P>[] {
    const individuals: BlueprintSpawnOutput<G, P>[] = new Array(amount);
    let async = false;

    for (let i = 0; i < amount; i++) {
      const spawn = this.spawn(settings);
      individuals[i] = spawn;

      if (check && !async && spawn instanceof Promise) {
        async = true;
      }
    }

    if (async) {
      return Promise.all(individuals) as unknown as BlueprintSpawnOutput<G, P>[];
    }

    return individuals;
  }

  /**
   *
   * @param serialized
   * @param settings
   */
  public deserialize(
    serialized: SerializedIndividual,
    settings: IndividualDeserializationSettings<Resolved<G>, P>,
  ): ResolvedIndividual<G, P> {
    settings.phenotype = settings.phenotype ?? this.phenotypeFunc;

    const individual = Individual.deserialize(serialized, settings);
    this.applyDefaults(individual);

    return individual;
  }

  /**
   *
   * @param data
   * @param settings
   */
  public fromJSON(
    data: string,
    settings: IndividualDeserializationSettings<Resolved<G>, P>,
  ): ResolvedIndividual<G, P> {
    return this.deserialize(JSON.parse(data), settings);
  }
}
