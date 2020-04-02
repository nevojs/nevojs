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

import { Blueprint, BlueprintCreationSettings } from "./blueprint";
import { AnyGenotype, UnresolvedGenotype } from "../data";
import { Individual } from "../individual";
import { Resolved } from "../../util";

type BlueprintCreationMethod = "spawn" | "create";
type UnresolvedBlueprint<G extends AnyGenotype, P> = Omit<Blueprint<G, P>, BlueprintCreationMethod>;

/**
 *
 */
export type SyncBlueprint<G extends AnyGenotype, P> = UnresolvedBlueprint<G, P> & {
  spawn: (settings?: Partial<BlueprintCreationSettings<G, P>>) => Individual<G, P>;
  create: (amount: number, settings?: Partial<BlueprintCreationSettings<G, P>>) => Individual<G, P>[];
};

/**
 *
 */
export type AsyncBlueprint<G extends AnyGenotype, P> = UnresolvedBlueprint<G, P> & {
  spawn: (settings?: Partial<BlueprintCreationSettings<G, P>>) => Promise<Individual<G, P>>;
  create: (amount: number, settings?: Partial<BlueprintCreationSettings<G, P>>) => Promise<Individual<G, P>[]>;
};

/**
 *
 */
export type AnyBlueprint<G extends AnyGenotype, P> = UnresolvedBlueprint<G, P> & {
  spawn: SyncBlueprint<G, P>["spawn"] | AsyncBlueprint<G, P>["spawn"];
  create: SyncBlueprint<G, P>["create"] | AsyncBlueprint<G, P>["create"];
}

/**
 *
 */
export type ResolvedBlueprint<G extends UnresolvedGenotype, P> = G extends Promise<any>
  ? AsyncBlueprint<Resolved<G>, P>
  : SyncBlueprint<Resolved<G>, P>;
