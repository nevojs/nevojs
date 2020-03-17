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
  IndividualDeserializationSettings, ResolvedIndividual,
  SerializedIndividual,
} from "../individual";
import { Genotype, State } from "../data";
import { Resolved } from "../../util";
import { IndividualDefaults } from "../individual_defaults";

/**
 *
 */
export interface BlueprintCreationSettings<G extends Genotype | Promise<Genotype>, P> extends BlueprintConstructorSettings<G, P> {
  arg: () => any;
  state: () => any;
}

/**
 *
 */
export interface BlueprintConstructorSettings<G extends Genotype | Promise<Genotype>, P> {
  genotype: (arg: any) => G;
  phenotype?: (genotype: Resolved<G>, state: State) => P;
}

/**
 *
 */
type BlueprintSpawnOutput<G extends Genotype | Promise<Genotype>, P> = ResolvedIndividual<G, P> | Promise<ResolvedIndividual<G, P>>;

/**
 *
 */
export class Blueprint<G extends Genotype | Promise<Genotype>, P> extends IndividualDefaults<Resolved<G>, P> {
  /**
   *
   */
  public readonly genotypeFunc: (arg: any) => G;

  /**
   *
   */
  public readonly phenotypeFunc: (genotype: Resolved<G>, state: any) => P;

  /**
   *
   * @param settings
   */
  public constructor(settings: BlueprintConstructorSettings<G, P>) {
    super();

    this.genotypeFunc = settings.genotype;
    this.phenotypeFunc = settings.phenotype ?? (() => (undefined as unknown as P));
  }

  /**
   *
   */
  public spawn(
    settings: Partial<BlueprintCreationSettings<G, P>> = {},
  ): BlueprintSpawnOutput<G, P> {
    const arg = settings.arg ? settings.arg() : undefined;
    const genotype = settings.genotype === undefined
      ? this.genotypeFunc(arg)
      : settings.genotype(arg);

    if (genotype instanceof Promise) {
      return genotype.then(data => {
        return this.spawn({ ...settings, genotype: () => data });
      });
    }

    const phenotype = settings.phenotype ?? this.phenotypeFunc;
    const state = settings.state;

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
    settings: Partial<BlueprintCreationSettings<G, P>> = {},
  ): BlueprintSpawnOutput<G, P>[] {
    const individuals: BlueprintSpawnOutput<G, P>[] = new Array(amount);

    let async = false;
    for (let i = 0; i < amount; i++) {
      individuals[i] = this.spawn(settings);

      if (!async && individuals[i] instanceof Promise) {
        async = true;
      }
    }

    return (async
      ? Promise.all(individuals)
      : individuals
    ) as BlueprintSpawnOutput<G, P>[];
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
    settings.phenotype = settings.phenotype ? settings.phenotype : this.phenotypeFunc;

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
