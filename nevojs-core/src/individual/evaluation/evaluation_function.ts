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

import { AnyGenotype } from "../data";
import { Individual } from "../individual";
import { Objective } from "./objective";

/**
 *
 */
export type Evaluation = Objective | Objective[];

/**
 *
 */
export type EvaluationFunction<G extends AnyGenotype, P> = (individual: Individual<G, P>) => Evaluation | Promise<Evaluation>;
