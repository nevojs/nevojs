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

import { Individual } from "../individual";
import { List } from "../../genotype/list";
import { Objective } from "../evaluation/objective";
import { weightedSum } from "./scalarization";

describe("weightedSum", () => {
  it("returns sum of the individual fitness (single objective)", () => {
    const individual = new Individual({ genotype: new List([]) });
    individual.evaluate(() => new Objective(3, 2));

    expect(weightedSum(individual)).toBe(6);
  });

  it("returns sum of the individual fitness (multiple objectives)", () => {
    const individual = new Individual({ genotype: new List([]) });
    individual.evaluate(() => [
      new Objective(2, 2),
      new Objective(-3, 3),
      new Objective(7, 1),
    ]);

    expect(weightedSum(individual)).toBe(2);
  });

  it("returns 0 if the individual does not have any objectives", () => {
    const individual = new Individual({ genotype: new List([]) });

    expect(weightedSum(individual)).toBe(0);
  });
});
