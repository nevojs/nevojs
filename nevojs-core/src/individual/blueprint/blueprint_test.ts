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

import * as fc from "fast-check";
import {
  Blueprint,
  BlueprintCreationSettings,
  BlueprintGenotypeFunction,
  BlueprintPhenotypeFunction
} from "./blueprint";
import { AnyGenotype } from "../data";
import { List } from "../../genotype/list";
import { Individual, SerializedIndividual } from "../individual";
import { $Individual } from "../../util_types";
import { Objective } from "../evaluation/objective";
import { uniform } from "../../operators/crossover";
import { swap } from "../../operators/mutation";
import { State } from "../state";
import { SerializableObject } from "../../serialization";
import { Default } from "../default_properties";

describe("Blueprint", () => {
  describe("constructor", () => {
    it("throws a TypeError if the genotype is not a function", () => {
      fc.assert(fc.property(fc.anything(), genotype => {
        fc.pre(typeof genotype !== "function");

        expect(() => {
          new Blueprint({ genotype: genotype as BlueprintGenotypeFunction<AnyGenotype> });
        }).toThrow(TypeError);
      }));
    });

    it("throws a TypeError if the phenotype is specified and is not a function", () => {
      fc.assert(fc.property(fc.anything(), phenotype => {
        fc.pre(phenotype !== undefined && typeof phenotype !== "function");

        expect(() => {
          new Blueprint({
            genotype: () => new List([]),
            phenotype: phenotype as BlueprintPhenotypeFunction<AnyGenotype, unknown>,
          });
        }).toThrow(TypeError);
      }));
    });
  });

  describe("spawn", () => {
    it("returns an instance of Individual if the genotype function is synchronous", () => {
      const blueprint = new Blueprint({
        genotype: () => new List([]),
      });

      expect(blueprint.spawn()).toBeInstanceOf(Individual);
    });

    it("returns a Promise if the genotype function is asynchronous", async () => {
      const blueprint = new Blueprint({
        genotype: async () => new List([]),
      });

      const individual = blueprint.spawn();

      expect(individual).toBeInstanceOf(Promise);
    });

    it("properly assigns a genotype (sync)", () => {
      fc.assert(fc.property(fc.array(fc.anything(), 50), data => {
        const blueprint = new Blueprint({
          genotype: () => new List(data),
        });

        const individual = blueprint.spawn() as $Individual<typeof blueprint>;

        expect(individual.genotype).toBeInstanceOf(List);
        expect(individual.genotype.data()).toEqual(data);
      }));
    });

    it("properly assigns a genotype (async)", () => {
      fc.assert(fc.asyncProperty(fc.array(fc.anything(), 50), async data => {
        const blueprint = new Blueprint({
          genotype: async () => new List(data),
        });

        const individual = await blueprint.spawn();

        expect(individual.genotype).toBeInstanceOf(List);
      }));
    });

    it("passes argument to a genotype function provided as 'arg' field when creating", () => {
      fc.assert(fc.property(fc.anything(), argValue => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const func = jest.fn(arg => new List([]));
        const blueprint = new Blueprint({ genotype: func });

        blueprint.spawn({ arg: () => argValue });
        expect(func.mock.calls[0][0]).toBe(argValue);
      }));
    });

    it("properly assigns a phenotype", () => {
      const blueprint = new Blueprint({
        genotype: () => new List([5, 6, 7]),
        phenotype: genotype => ({
          dataSquared() {
            return genotype.data().map(x => x ** 2);
          },
        }),
      });

      const individual = blueprint.spawn() as $Individual<typeof blueprint>;

      expect(individual.phenotype.dataSquared()).toEqual([25, 36, 49]);
    });

    it("passes a genotype as the first argument of the phenotype function (sync)", () => {
      const genotype = new List([]);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const phenotype = jest.fn(genotype => undefined);

      const blueprint = new Blueprint({
        genotype: () => genotype,
        phenotype,
      });

      blueprint.spawn();
      expect(phenotype.mock.calls[0][0]).toBe(genotype);
    });

    it("passes a genotype as the first argument of the phenotype function (async)", async () => {
      const genotype = new List([]);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const phenotype = jest.fn(genotype => undefined);

      const blueprint = new Blueprint({
        genotype: async () => genotype,
        phenotype,
      });

      await blueprint.spawn();
      expect(phenotype.mock.calls[0][0]).toBe(genotype);
    });

    it("passes a state as the second argument of the phenotype function", () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const phenotype = jest.fn((genotype, state) => undefined);

      const blueprint = new Blueprint({
        genotype: () => new List([]),
        phenotype,
      });

      blueprint.spawn();
      expect(phenotype.mock.calls[0][1]).toBeInstanceOf(State);
    });

    it("does not return a Promise because of the asynchronous phenotype function", async () => {
      const blueprint = new Blueprint({
        genotype: () => new List([]),
        phenotype: async () => undefined,
      });

      const individual = blueprint.spawn();

      expect(individual).toBeInstanceOf(Individual);
    });

    it("does not resolve phenotype that is an instance of Promise", () => {
      const blueprint = new Blueprint({
        genotype: () => new List([]),
        phenotype: async () => undefined,
      });

      const individual = blueprint.spawn() as $Individual<typeof blueprint>;

      expect(individual.phenotype).toBeInstanceOf(Promise);
    });

    it("sets phenotype to undefined if unspecified", () => {
      const blueprint = new Blueprint({
        genotype: () => new List([]),
      });

      const individual = blueprint.spawn() as $Individual<typeof blueprint>;

      expect(individual.phenotype).toBe(undefined);
    });

    it("assigns a default evaluation to the individual", () => {
      const blueprint = new Blueprint({
        genotype: () => new List([]),
      });

      const evaluation = () => new Objective(5, 2);
      blueprint.setDefault(Default.Evaluation, evaluation);

      const individual = blueprint.spawn() as $Individual<typeof blueprint>;

      expect(individual.getDefault(Default.Evaluation)).toBe(evaluation);
    });

    it("assigns a default mutation to the individual", () => {
      const blueprint = new Blueprint({
        genotype: () => new List([1, 2, 3]),
      });

      const mutation = swap();
      blueprint.setDefault(Default.Mutation, mutation);

      const individual = blueprint.spawn() as $Individual<typeof blueprint>;

      expect(individual.getDefault(Default.Mutation)).toBe(mutation);
    });

    it("assigns a default crossover to the individual", () => {
      const blueprint = new Blueprint({
        genotype: () => new List([1, 2, 3]),
      });

      const crossover = uniform();
      blueprint.setDefault(Default.Crossover, crossover);

      const individual = blueprint.spawn() as $Individual<typeof blueprint>;

      expect(individual.getDefault(Default.Crossover)).toBe(crossover);
    });

    it("properly overrides genotype using given function", () => {
      fc.assert(fc.property(fc.array(fc.anything()), data => {
        const blueprint = new Blueprint({
          genotype: () => new List<unknown>([1, 2, 3]),
        });

        const individual = blueprint.spawn({ genotype: () => new List(data) }) as $Individual<typeof blueprint>;
        expect(individual.genotype.data()).toEqual(data);
      }));
    });

    it("properly overrides phenotype using given function", () => {
      fc.assert(fc.property(fc.array(fc.anything()), data => {
        const blueprint = new Blueprint({
          genotype: () => new List([]),
        });

        const individual = blueprint.spawn({ phenotype: () => data }) as $Individual<typeof blueprint>;
        expect(individual.phenotype).toBe(data);
      }));
    });

    it("properly overrides state using given function", () => {
      const blueprint = new Blueprint({
        genotype: () => new List([]),
      });

      const state = { a: 123, b: 42 };
      const individual = blueprint.spawn({ state: () => state }) as $Individual<typeof blueprint>;

      expect(individual.state.computed()).toEqual(state);
    });

    it("throws a TypeError if the settings object is specified but is not an object", () => {
      fc.assert(fc.property(fc.anything(), settings => {
        fc.pre(typeof settings !== "object" && settings !== undefined);

        const blueprint = new Blueprint({
          genotype: () => new List([]),
        });

        expect(() => {
          blueprint.spawn(settings as BlueprintCreationSettings<List<never>, unknown>);
        }).toThrow(TypeError);
      }));
    });

    it("throws a TypeError if the genotype overriding function is specified but is not a function", () => {
      fc.assert(fc.property(fc.anything(), func => {
        fc.pre(typeof func !== "function" && func !== undefined);

        const blueprint = new Blueprint({
          genotype: () => new List([]),
        });

        expect(() => {
          blueprint.spawn({ genotype: func as BlueprintGenotypeFunction<List<never>> });
        }).toThrow(TypeError);
      }));
    });

    it("throws a TypeError if the phenotype overriding function is specified but is not a function", () => {
      fc.assert(fc.property(fc.anything(), func => {
        fc.pre(typeof func !== "function" && func !== undefined);

        const blueprint = new Blueprint({
          genotype: () => new List([]),
        });

        expect(() => {
          blueprint.spawn({ phenotype: func as BlueprintPhenotypeFunction<List<never>, unknown> });
        }).toThrow(TypeError);
      }));
    });

    it("throws a TypeError if the state overriding function is specified but is not a function", () => {
      fc.assert(fc.property(fc.anything(), func => {
        fc.pre(typeof func !== "function" && func !== undefined);

        const blueprint = new Blueprint({
          genotype: () => new List([]),
        });

        expect(() => {
          blueprint.spawn({ state: func as () => SerializableObject });
        }).toThrow(TypeError);
      }));
    });
  });

  describe("create", () => {
    it("throws a TypeError if the amount is not a positive integer", () => {
      fc.assert(fc.property(fc.anything(), amount => {
        fc.pre(typeof amount !== "number" || 0 >= amount || amount % 1 > 0);

        const blueprint = new Blueprint({
          genotype: () => new List([]),
        });

        expect(() => {
          blueprint.create(amount as number);
        }).toThrow(TypeError);
      }));
    });

    it("returns an array filled with instances of Individual", () => {
      const blueprint = new Blueprint({
        genotype: () => new List([]),
      });

      const individuals = blueprint.create(10);
      expect(individuals.every(ind => ind instanceof Individual)).toBe(true);
    });

    it("returns correct amount of individuals", () => {
      fc.assert(fc.property(fc.integer(1, 300), amount => {
        const blueprint = new Blueprint({
          genotype: () => new List([]),
        });

        const individuals = blueprint.create(amount);
        expect(individuals.length).toBe(amount);
      }));
    });

    it("calls 'spawn' method for each created individual", () => {
      fc.assert(fc.property(fc.integer(1, 300), amount => {
        const blueprint = new Blueprint({
          genotype: () => new List([]),
        });

        const spy = jest.spyOn(blueprint, "spawn");
        blueprint.create(amount);

        expect(spy).toBeCalledTimes(amount);
        spy.mockClear();
      }));
    });

    it("returns a Promise if the genotype function is asynchronous", () => {
      const blueprint = new Blueprint({
        genotype: async () => new List([]),
      });

      const individuals = blueprint.create(50);
      expect(individuals).toBeInstanceOf(Promise);
    });
  });

  describe("deserialize", () => {
    it("returns an instance of Individual", () => {
      const blueprint = new Blueprint({
        genotype: () => new List([]),
      });

      const serialized: SerializedIndividual = { genotype: [], state: {}, objectives: [] };
      const deserialized = blueprint.deserialize(serialized, { genotype: data => new List(data) });

      expect(deserialized).toBeInstanceOf(Individual);
    });

    it("calls Individual.deserialize", () => {
      const spy = jest.spyOn(Individual, "deserialize");

      const blueprint = new Blueprint({
        genotype: () => new List([]),
      });

      const serialized: SerializedIndividual = { genotype: [], state: {}, objectives: [] };
      blueprint.deserialize(serialized, { genotype: data => new List(data) });

      expect(spy).toBeCalledTimes(1);
      spy.mockClear();
    });

    it("infers the phenotype from the blueprint declaration", () => {
      fc.assert(fc.property(fc.anything(), value => {
        const blueprint = new Blueprint({
          genotype: () => new List([]),
          phenotype: () => ({ value }),
        });

        const serialized: SerializedIndividual = { genotype: [], state: {}, objectives: [] };
        const deserialized = blueprint.deserialize(serialized, { genotype: data => new List(data) });

        expect(deserialized.phenotype.value).toBe(value);
      }));
    });
  });

  describe("fromJSON", () => {
    it("calls 'deserialize' method", () => {
      const blueprint = new Blueprint({
        genotype: () => new List([]),
      });
      const spy = jest.spyOn(blueprint, "deserialize");

      const serialized: SerializedIndividual = { genotype: [], state: {}, objectives: [] };
      blueprint.fromJSON(JSON.stringify(serialized), { genotype: data => new List(data) });

      expect(spy).toBeCalledTimes(1);
      spy.mockClear();
    });
  });
});
