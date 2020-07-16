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
import { SerializableObject, SerializedValueIdentifier } from "../serialization";
import { Default } from "./default_properties";
import { Genotype } from "./data";
import { Individual } from "./individual";
import { List } from "../genotype/list";
import { Objective } from "./evaluation/objective";
import { State } from "./state";
import { uniform } from "../operators/crossover";

describe("Individual", () => {
  describe("deserialize", () => {
    it("returns an instance of Individual", () => {
      const serialized = { genotype: [], state: {}, objectives: [] };
      const individual = Individual.deserialize(serialized, {
        genotype: (data) => new List(data),
      });

      expect(individual).toBeInstanceOf(Individual);
    });

    it("properly creates a genotype using serialized data and given function", () => {
      fc.assert(fc.property(fc.array(fc.integer()), (data) => {
        const serialized = { genotype: data, state: {}, objectives: [] };
        const individual = Individual.deserialize(serialized, {
          genotype: (data) => new List(data),
        });

        expect(individual.genotype).toBeInstanceOf(List);
        expect(individual.genotype.data()).toEqual(data);
      }));
    });

    it("properly creates a phenotype using given function", () => {
      fc.assert(fc.property(fc.array(fc.integer()), (data) => {
        const serialized = { genotype: data, state: {}, objectives: [] };
        const individual = Individual.deserialize(serialized, {
          genotype: (data) => new List(data),
          phenotype: (genotype) => ({ firstGene: genotype.data()[0] }),
        });

        expect(individual.phenotype.firstGene).toBe(data[0]);
      }));
    });

    it("deserializes the state", () => {
      const serialized = { genotype: [], state: { a: 1, b: 2, c: 3 }, objectives: [] };
      const individual = Individual.deserialize(serialized, {
        genotype: (data) => new List(data),
      });

      expect(individual.state.computeAll()).toEqual({
        a: 1,
        b: 2,
        c: 3,
      });
    });

    it("transforms the state using given function", () => {
      const serialized = { genotype: [], state: { a: 1, b: 2, c: 3 }, objectives: [] };
      const individual = Individual.deserialize(serialized, {
        genotype: (data) => new List(data),
        state: () => ({ a: 10, b: 20, c: 30 }),
      });

      expect(individual.state.computeAll()).toEqual({
        a: 10,
        b: 20,
        c: 30,
      });
    });

    it("deserializes objectives", () => {
      const objectives = [
        { value: 3, weight: -1 },
        { value: -5, weight: 2 },
      ];
      const serialized = { genotype: [], state: {}, objectives };
      const individual = Individual.deserialize(serialized, { genotype: (data) => new List(data) });

      expect(individual.objectives().length).toBe(2);
      expect(individual.values()).toEqual([3, -5]);
      expect(individual.fitness()).toEqual([-3, -10]);
    });

    it("transforms 'magic' strings into corresponding values", () => {
      const serialized = {
        genotype: [1, 2, SerializedValueIdentifier.NotANumber, SerializedValueIdentifier.Undefined],
        state: { foo: SerializedValueIdentifier.PositiveInfinity },
        objectives: [
          { value: SerializedValueIdentifier.PositiveInfinity, weight: 1 },
          { value: 5, weight: SerializedValueIdentifier.NegativeInfinity },
        ]
      };

      const individual = Individual.deserialize(serialized, { genotype: (data) => new List(data) });

      expect(individual.genotype.data()).toEqual([1, 2, NaN, undefined]);
      expect(individual.state.computeAll()).toEqual({ foo: Infinity });

      expect(individual.objective(0).value).toBe(Infinity);
      expect(individual.objective(0).weight).toBe(1);

      expect(individual.objective(1).value).toBe(5);
      expect(individual.objective(1).weight).toBe(-Infinity);
    });

    it("throws a TypeError if the serialized individual is not an object", () => {
      fc.assert(fc.property(fc.anything(), (serialized: any) => {
        fc.pre(typeof serialized !== "object" && typeof serialized !== "function");

        expect(() => {
          Individual.deserialize(serialized, { genotype: (data) => new List(data) });
        }).toThrow(TypeError);
      }));
    });
  });

  describe("fromJSON", () => {
    it("returns an instance of Individual", () => {
      const serialized = JSON.stringify({ genotype: [], state: {}, objectives: [] });
      const individual = Individual.fromJSON(serialized, { genotype: (data) => new List(data) });

      expect(individual).toBeInstanceOf(Individual);
    });

    it("calls Individual.deserialize once", () => {
      const spy = jest.spyOn(Individual, "deserialize");

      const serialized = JSON.stringify({ genotype: [], state: {}, objectives: [] });
      Individual.fromJSON(serialized, { genotype: (data) => new List(data) });

      expect(spy).toBeCalledTimes(1);
      spy.mockClear();
    });
  });

  describe("constructor", () => {
    it("passes the genotype as the first argument in the phenotype function", () => {
      const genotype = new List([]);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const phenotype = jest.fn((genotype) => ({}));

      new Individual({ genotype, phenotype });

      expect(phenotype.mock.calls[0][0]).toBe(genotype);
    });

    it("passes an instance of State as the second argument in the phenotype function", () => {
      const genotype = new List([]);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const phenotype = jest.fn((genotype, state) => ({}));

      new Individual({ genotype, phenotype });

      expect(phenotype.mock.calls[0][1]).toBeInstanceOf(State);
    });

    it("throws a TypeError if the genotype is not defined (undefined)", () => {
      expect(() => {
        new Individual({ genotype: undefined as unknown as Genotype<any> });
      }).toThrow(TypeError);
    });

    it("throws a TypeError if the genotype is not defined (null)", () => {
      expect(() => {
        new Individual({ genotype: null as unknown as Genotype<any> });
      }).toThrow(TypeError);
    });

    it("throws a TypeError if the phenotype is specified but is not a function", () => {
      fc.assert(fc.property(fc.anything(), (phenotype: any) => {
        fc.pre(typeof phenotype !== "function" && phenotype !== undefined);

        expect(() => {
          new Individual({ genotype: new List([]), phenotype });
        }).toThrow(TypeError);
      }));
    });

    it("throws a TypeError if the state is specified but is not an instance of State", () => {
      fc.assert(fc.property(fc.anything(), (state: any) => {
        fc.pre(state !== undefined && !(state instanceof State));

        expect(() => {
          new Individual({ genotype: new List([]), state });
        }).toThrow(TypeError);
      }));
    });
  });

  describe("genotype", () => {
    it("is equal to the genotype passed in constructor", () => {
      const genotype = new List([]);
      const individual = new Individual({ genotype });

      expect(individual.genotype).toBe(genotype);
    });
  });

  describe("phenotypeFunc", () => {
    it("is equal to the phenotype function passed in constructor", () => {
      const genotype = new List([]);
      const phenotype = () => ({});

      const individual = new Individual({ genotype, phenotype });
      expect(individual.phenotypeFunc).toBe(phenotype);
    });
  });

  describe("phenotype", () => {
    it("is equal to return value of the phenotype function", () => {
      fc.assert(fc.property(fc.object(), (data) => {
        const genotype = new List([]);
        const phenotype = () => data;

        const individual = new Individual({ genotype, phenotype });
        expect(individual.phenotype).toBe(data);
      }));
    });
  });

  describe("state", () => {
    it("is an instance of State", () => {
      const genotype = new List([]);
      const individual = new Individual({ genotype });

      expect(individual.state).toBeInstanceOf(State);
    });
  });

  describe("evaluate", () => {
    it("updates the data returned by Individual.prototype.objectives()", () => {
      fc.assert(fc.property(fc.array(fc.integer()), (values) => {
        const objectives = values.map((value) => new Objective(1, value));

        const individual = new Individual({ genotype: new List([]) });
        individual.evaluate(() => objectives);

        expect(individual.objectives()).toEqual(objectives);
      }));
    });

    it("does not return any value if the function passed does not return a Promise", () => {
      fc.assert(fc.property(fc.array(fc.integer()), (values) => {
        const objectives = values.map((value) => new Objective(1, value));

        const individual = new Individual({ genotype: new List([]) });
        const evaluation = individual.evaluate(() => objectives);

        expect(evaluation).toBe(undefined);
      }));
    });

    it("returns Promise if the function passed also returns a Promise", async () => {
      fc.assert(fc.asyncProperty(fc.array(fc.integer()), async (values) => {
        const objectives = values.map((value) => new Objective(1, value));

        const individual = new Individual({ genotype: new List([]) });
        const evaluation = individual.evaluate(async () => objectives);

        expect(evaluation).toBeInstanceOf(Promise);
        expect(await evaluation).toBe(undefined);
      }));
    });

    it("throws a TypeError if the function passed is not a valid function", () => {
      fc.assert(fc.property(fc.anything(), (func: any) => {
        fc.pre(typeof func !== "function");

        const genotype = new List([]);
        const individual = new Individual({ genotype });

        expect(() => {
          individual.evaluate(func);
        }).toThrow(TypeError);
      }));
    });
  });

  describe("objectives", () => {
    it("returns an empty array if the individual was never evaluated", () => {
      const genotype = new List([]);
      const individual = new Individual({ genotype });

      expect(individual.objectives()).toEqual([]);
    });

    it("returns a copy of the array with objectives returned in the evaluation function", () => {
      fc.assert(fc.property(fc.array(fc.integer()), (values) => {
        const objectives = values.map((value) => new Objective(1, value));

        const genotype = new List([]);
        const individual = new Individual({ genotype });

        individual.evaluate(() => objectives);

        expect(individual.objectives()).not.toBe(objectives);
        expect(individual.objectives()).toEqual(objectives);
      }));
    });

    it("returns a copy of the resolved array with objectives returned in the async evaluation function", () => {
      fc.assert(fc.asyncProperty(fc.array(fc.integer()), async (values) => {
        const objectives = values.map((value) => new Objective(1, value));

        const genotype =  new List([]);
        const individual = new Individual({ genotype });

        await individual.evaluate(async () => objectives);

        expect(individual.objectives()).not.toBe(objectives);
        expect(individual.objectives()).toEqual(objectives);
      }));
    });
  });

  describe("objective", () => {
    it("returns individual's nth objective if exists", () => {
      fc.assert(fc.property(fc.array(fc.integer()), fc.nat(), (values, i) => {
        fc.pre(values.length > i);

        const objectives = values.map((value) => new Objective(1, value));
        const objective = objectives[i];

        const genotype = new List([]);
        const individual = new Individual({ genotype });
        individual.evaluate(() => objectives);

        expect(individual.objective(i)).toBe(objective);
      }));
    });

    it("throws a RangeError if the nth objective does not exist", () => {
      fc.assert(fc.property(fc.array(fc.integer()), fc.nat(), (values, i) => {
        fc.pre(i >= values.length);

        const objectives = values.map((value) => new Objective(1, value));

        const genotype = new List([]);
        const individual = new Individual({ genotype });
        individual.evaluate(() => objectives);

        expect(() => {
          individual.objective(i);
        }).toThrow(RangeError);
      }));
    });
  });

  describe("setObjectives", () => {
    it("overrides individual's objectives", () => {
      fc.assert(fc.property(fc.array(fc.integer()), (values) => {
        const objectives = values.map((value) => new Objective(1, value));

        const genotype = new List([]);
        const individual = new Individual({ genotype });

        individual.setObjectives(objectives);
        expect(individual.objectives()).toEqual(objectives);
      }));
    });

    it("throws a TypeError if the argument is not an array", () => {
      fc.assert(fc.property(fc.anything(), (objectives: any) => {
        fc.pre(!Array.isArray(objectives));

        const genotype = new List([]);
        const individual = new Individual({ genotype });

        expect(() => {
          individual.setObjectives(objectives);
        }).toThrow(TypeError);
      }));
    });
  });

  describe("fitness", () => {
    it("returns an array with computed fitness of the objectives", () => {
      fc.assert(fc.property(
        fc.array(fc.tuple(fc.integer(), fc.integer())),
        (data) => {
          const objectives = data.map(([value, weight]) => new Objective(value, weight));
          const fitness = objectives.map((objective) => objective.fitness());

          const genotype = new List([]);
          const individual = new Individual({ genotype });
          individual.setObjectives(objectives);

          expect(individual.fitness()).toEqual(fitness);
        },
      ));
    });
  });

  describe("values", () => {
    it("returns an array with values of the objectives", () => {
      fc.assert(fc.property(
        fc.array(fc.tuple(fc.integer(), fc.integer())),
        (data) => {
          const objectives = data.map(([value, weight]) => new Objective(value, weight));
          const values = objectives.map((objective) => objective.value);

          const genotype = new List([]);
          const individual = new Individual({ genotype });
          individual.setObjectives(objectives);

          expect(individual.values()).toEqual(values);
        },
      ));
    });
  });

  describe("clone", () => {
    it("returns an instance of Individual", () => {
      const genotype = new List([]);
      const individual = new Individual({ genotype });

      expect(individual.clone()).toBeInstanceOf(Individual);
    });

    it("clones the genotype", () => {
      fc.assert(fc.property(fc.array(fc.anything()), (data) => {
        const genotype = new List(data);
        const individual = new Individual({ genotype });

        const copy = individual.clone();

        expect(copy.genotype).not.toBe(individual.genotype);
        expect(copy.genotype.data()).toEqual(data);
      }));
    });

    it("clones the genotype using a function if given", () => {
      const cloneFunction = (genes: number[]) => genes.map((x) => x + 1);

      fc.assert(fc.property(fc.array(fc.integer()), (data) => {
        const genotype = new List(data);
        const individual = new Individual({ genotype });

        const copy = individual.clone({ genotype: cloneFunction });

        expect(copy.genotype.data()).toEqual(cloneFunction(data));
      }));
    });

    it("clones the genotype using a default function if specified", () => {
      const cloneFunction = (genes: number[]) => genes.map((x) => x + 1);

      fc.assert(fc.property(fc.array(fc.integer()), (data) => {
        const genotype = new List(data);
        const individual = new Individual({ genotype });
        individual.setDefault(Default.Cloning, { genotype: cloneFunction });

        const copy = individual.clone();

        expect(copy.genotype.data()).toEqual(cloneFunction(data));
      }));
    });

    it("creates a phenotype using original individual's phenotype function", () => {
      fc.assert(fc.property(fc.anything(), (data) => {
        const individual = new Individual({
          genotype: new List([]),
          phenotype: () => ({ data }),
        });

        const copy = individual.clone();

        expect(copy.phenotype).not.toBe(individual.phenotype);
        expect(copy.phenotype).toEqual(individual.phenotype);
      }));
    });

    it("creates a phenotype using a function if given", () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const individual = new Individual({
          genotype: new List([]),
          phenotype: () => ({ value }),
        });

        const copy = individual.clone({
          phenotype: () => ({ value: value + 1 }),
        });

        expect(copy.phenotype.value).toBe(individual.phenotype.value + 1);
      }));
    });

    it("creates a phenotype using a default function if specified", () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const individual = new Individual({
          genotype: new List([]),
          phenotype: () => ({ value }),
        });

        individual.setDefault(Default.Cloning, {
          phenotype: () => ({ value: value + 1 }),
        });

        const copy = individual.clone();

        expect(copy.phenotype.value).toBe(individual.phenotype.value + 1);
      }));
    });

    it("clones the state", () => {
      fc.assert(fc.property(fc.object(), (data) => {
        const state = new State(data);
        const genotype = new List([]);
        const individual = new Individual({ genotype, state });

        const copy = individual.clone();

        expect(copy.state).not.toBe(individual.state);
        expect(copy.state.computeAll()).toEqual(state.computeAll());
      }));
    });

    it("clones the state using a function if given", () => {
      fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => {
        const state = new State({ a, b });
        const genotype = new List([]);
        const individual = new Individual({ genotype, state });

        const copy = individual.clone({
          state: (data) => ({
            a: data.a + 1,
            b: data.b + 1,
          }),
        });

        expect(copy.state.compute("a")).toEqual(state.compute("a") + 1);
        expect(copy.state.compute("b")).toEqual(state.compute("b") + 1);
      }));
    });

    it("clones the state using a default function if specified", () => {
      fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => {
        const state = new State({ a, b });
        const genotype = new List([]);
        const individual = new Individual({ genotype, state });

        individual.setDefault(Default.Cloning, ({
          state: (data) => ({
            a: data.a + 1,
            b: data.b + 1,
          }),
        }));

        const copy = individual.clone();

        expect(copy.state.compute("a")).toEqual(state.compute("a") + 1);
        expect(copy.state.compute("b")).toEqual(state.compute("b") + 1);
      }));
    });

    it("clones objectives", () => {
      fc.assert(fc.property(
        fc.array(fc.tuple(fc.integer(), fc.integer())),
        (data) => {
          const objectives = data.map(([value, weight]) => new Objective(value, weight));

          const genotype = new List([]);
          const individual = new Individual({ genotype });
          individual.setObjectives(objectives);

          const copy = individual.clone();
          const areObjectivesEqual = copy.objectives().every((obj, i) => obj.fitness() === objectives[i].fitness());

          expect(areObjectivesEqual).toBe(true);
        },
      ));
    });
  });

  describe("mutate", () => {
    it("does not return any value", () => {
      fc.assert(fc.property(fc.array(fc.anything()), (data) => {
        const genotype = new List<any>([]);
        const individual = new Individual({ genotype });

        const output = individual.mutate(() => data);

        expect(output).toBe(undefined);
      }));
    });

    it("mutates the individual's genotype data using a function provided", () => {
      fc.assert(fc.property(fc.array(fc.anything()), (data) => {
        const genotype = new List<any>([]);
        const individual = new Individual({ genotype });

        individual.mutate(() => data);

        expect(genotype.data()).toEqual(data);
      }));
    });

    it("mutates the individual's genotype data using default mutation method", () => {
      fc.assert(fc.property(fc.array(fc.anything()), (data) => {
        const genotype = new List<any>([]);
        const individual = new Individual({ genotype });
        individual.setDefault(Default.Mutation, () => data);

        individual.mutate();

        expect(genotype.data()).toEqual(data);
      }));
    });

    it("calls the 'mutate' method on the individual's genotype once", () => {
      const genotype = new List([0]);
      const individual = new Individual({ genotype });

      const spy = jest.spyOn(genotype, "mutate");
      individual.mutate(() => [1]);

      expect(spy).toBeCalledTimes(1);

      spy.mockClear();
    });

    it("throws a TypeError if the method provided is not a function", () => {
      fc.assert(fc.property(fc.anything(), (method: any) => {
        fc.pre(typeof method !== "function");

        const genotype = new List([]);
        const individual = new Individual({ genotype });

        expect(() => {
          individual.mutate(method);
        }).toThrow(TypeError);
      }));
    });

    it("throws a TypeError if the default method is used and is not a function", () => {
      fc.assert(fc.property(fc.anything(), (method: any) => {
        fc.pre(typeof method !== "function");

        const genotype = new List([]);
        const individual = new Individual({ genotype });
        individual.setDefault(Default.Mutation, method);

        expect(() => {
          individual.mutate();
        }).toThrow(TypeError);
      }));
    });
  });

  describe("dominates", () => {
    it("returns true if the individual dominates the second one in every objective", () => {
      const a = new Individual({ genotype: new List([]) });
      const b = new Individual({ genotype: new List([]) });

      a.setObjectives([
        new Objective(10, 1),
        new Objective(0, -1),
      ]);

      b.setObjectives([
        new Objective(5, 1),
        new Objective(5, -1),
      ]);

      expect(a.dominates(b)).toBe(true);
    });

    it("returns false if at least one objective has lower fitness", () => {
      const a = new Individual({ genotype: new List([]) });
      const b = new Individual({ genotype: new List([]) });

      a.setObjectives([
        new Objective(10, 1),
        new Objective(6, -1),
      ]);

      b.setObjectives([
        new Objective(5, 1),
        new Objective(5, -1),
      ]);

      expect(a.dominates(b)).toBe(false);
    });

    it("returns false if all objectives have equal fitness", () => {
      const a = new Individual({ genotype: new List([]) });
      const b = new Individual({ genotype: new List([]) });

      a.setObjectives([
        new Objective(5, 1),
        new Objective(5, -1),
      ]);

      b.setObjectives([
        new Objective(5, 1),
        new Objective(5, -1),
      ]);

      expect(a.dominates(b)).toBe(false);
    });

    it("returns false if both individuals do not have any objectives", () => {
      const a = new Individual({ genotype: new List([]) });
      const b = new Individual({ genotype: new List([]) });

      a.setObjectives([]);
      b.setObjectives([]);

      expect(a.dominates(b)).toBe(false);
    });

    it("throws an Error if the number of objectives varies between individuals", () => {
      const a = new Individual({ genotype: new List([]) });
      const b = new Individual({ genotype: new List([]) });

      a.setObjectives([new Objective(1, 1)]);
      b.setObjectives([]);

      expect(() => {
        a.dominates(b);
      }).toThrow(Error);
    });
  });

  describe("serialize", () => {
    it("transforms non-serializable JSON values into string equivalents", () => {
      const individual = new Individual({
        genotype: new List([-Infinity, 5, "abc", NaN]),
        state: new State({ a: undefined, b: null, foo: { bar: Infinity } }),
      });
      individual.setObjectives([
        new Objective(Infinity, 3),
        new Objective(10, -Infinity),
      ]);

      const serialized = individual.serialize();

      expect(serialized).toEqual({
        genotype: [SerializedValueIdentifier.NegativeInfinity, 5, "abc", SerializedValueIdentifier.NotANumber],
        objectives: [
          { value: SerializedValueIdentifier.PositiveInfinity, weight: 3 },
          { value: 10, weight: SerializedValueIdentifier.NegativeInfinity },
        ],
        state: {
          a: SerializedValueIdentifier.Undefined,
          b: null,
          foo: {
            bar: SerializedValueIdentifier.PositiveInfinity,
          },
        },
      });
    });

    it("serializes genotype data gathered from genotype's '__serialize' method", () => {
      const genotype = new List([1, 2, 3]);
      const individual = new Individual({ genotype });

      const serialized = individual.serialize();

      expect(serialized.genotype).toEqual(genotype.__serialize());
    });

    it("transforms genotype data using a function if given", () => {
      fc.assert(fc.property(fc.array(fc.integer()), (data) => {
        const genotype = new List(data);
        const individual = new Individual({ genotype });

        const serialized = individual.serialize({ genotype: () => data });
        expect(serialized.genotype).toEqual(data);
      }));
    });

    it("transforms genotype data using default function is specified", () => {
      fc.assert(fc.property(fc.array(fc.integer()), (data) => {
        const genotype = new List(data);
        const individual = new Individual({ genotype });
        individual.setDefault(Default.Serialization, { genotype: () => data });

        const serialized = individual.serialize();
        expect(serialized.genotype).toEqual(data);
      }));
    });

    it("calls '__serialize' method on the genotype once", () => {
      const genotype = new List([]);
      const individual = new Individual({ genotype });

      const spy = jest.spyOn(genotype, "__serialize");
      individual.serialize();

      expect(spy).toBeCalledTimes(1);

      spy.mockClear();
    });

    it("throws a TypeError if the genotype transform function is defined but is not a function", () => {
      fc.assert(fc.property(fc.anything(), (func: any) => {
        fc.pre(typeof func !== "function" && func !== undefined);

        const genotype = new List([]);
        const individual = new Individual({ genotype });

        expect(() => {
          individual.serialize({ genotype: func });
        }).toThrow(TypeError);
      }));
    });

    it("serializes the state as an empty object if it does not have any keys", () => {
      const genotype = new List([]);
      const individual = new Individual({ genotype });

      const serialized = individual.serialize();

      expect(serialized.state).toEqual({});
    });

    it("transforms state data using a function if given", () => {
      fc.assert(fc.property(fc.dictionary(fc.string(), fc.integer()), (data) => {
        const genotype = new List([]);
        const individual = new Individual({ genotype });

        const serialized = individual.serialize({ state: () => data });

        expect(serialized.state).toEqual(data);
      }));
    });

    it("transforms state data using default function if specified", () => {
      fc.assert(fc.property(fc.dictionary(fc.string(), fc.integer()), (data) => {
        const genotype = new List([]);
        const individual = new Individual({ genotype });
        individual.setDefault(Default.Serialization, { state: () => data });

        const serialized = individual.serialize();

        expect(serialized.state).toEqual(data);
      }));
    });

    it("calls Objective.prototype.serialize for each objective", () => {
      const objective = fc.tuple(fc.integer(), fc.integer());

      fc.assert(fc.property(fc.array(objective), (data) => {
        const genotype = new List([]);
        const individual = new Individual({ genotype });

        const objectives = data.map(([value, weight]) => new Objective(value, weight));
        individual.setObjectives(objectives);

        const spies = objectives.map((objective) => jest.spyOn(objective, "serialize"));
        individual.serialize();

        const calls = spies.reduce((acc, spy) => acc + spy.mock.calls.length, 0);

        expect(calls).toBe(data.length);

        spies.forEach((spy) => spy.mockClear());
      }));
    });

    it("throws a TypeError if the state transform function is defined but is not a function", () => {
      fc.assert(fc.property(fc.anything(), (state: any) => {
        fc.pre(typeof state !== "function" && state !== undefined);

        const genotype = new List([]);
        const individual = new Individual({ genotype });

        expect(() => {
          individual.serialize({ state });
        }).toThrow(TypeError);
      }));
    });

    it("throws an Error if the genotype is not serializable", () => {
      class Gene<T> {
        public constructor(
          public readonly content: T,
        ) {}
      }

      fc.assert(fc.property(fc.array(fc.anything()), (data) => {
        fc.pre(data.length > 0);

        const genotype = new List(data.map((gene) => new Gene(gene)));
        const individual = new Individual({ genotype });

        expect(() => {
          individual.serialize();
        }).toThrow(Error);
      }));
    });

    it("throws an Error if the serialized state is not an object", () => {
      fc.assert(fc.property(fc.anything(), (data) => {
        const notDefined = data === undefined || data === null;
        const condition = notDefined || (data as any).constructor !== Object;
        fc.pre(condition);

        const genotype = new List([]);
        const individual = new Individual({ genotype });

        expect(() => {
          individual.serialize({ state: () => data as unknown as SerializableObject });
        }).toThrow(Error);
      }));
    });

    it("throws an Error if the state is not serializable object", () => {
      fc.assert(fc.property(fc.anything(), (data) => {
        const genotype = new List([]);
        const state = new State({ data: (() => data) as unknown as SerializableObject });
        const individual = new Individual({ genotype, state });

        expect(() => {
          individual.serialize();
        }).toThrow(Error);
      }));
    });
  });

  describe("toJSON", () => {
    it("returns a valid JSON data", () => {
      const genotype = fc.array(fc.integer());
      const state = fc.dictionary(fc.string(), fc.integer());

      fc.assert(fc.property(genotype, state, (genotypeData, stateData) => {
        const genotype = new List(genotypeData);
        const state = new State(stateData);
        const individual = new Individual({ genotype, state });

        const serialized = individual.toJSON();

        expect(typeof serialized).toBe("string");
        expect(() => JSON.parse(serialized)).not.toThrow(Error);
      }));
    });

    it("calls Individual.prototype.serialize once", () => {
      fc.assert(fc.property(fc.dictionary(fc.string(), fc.integer()), (data) => {
        const genotype = new List([]);
        const state = new State(data);
        const individual = new Individual({ genotype, state });

        const spy = jest.spyOn(individual, "serialize");
        individual.toJSON();

        expect(spy).toBeCalledTimes(1);
        spy.mockClear();
      }));
    });
  });

  describe("offspring", () => {
    it("returns an array with children created using crossover method", () => {
      const a = new Individual({ genotype: new List([0, 0, 0, 0]) });
      const b = new Individual({ genotype: new List([1, 1, 1, 1]) });

      const children = a.offspring([b], uniform());
      expect(children.every((child) => child instanceof Individual)).toBe(true);
    });

    it("returns correct amount of individuals", () => {
      const a = new Individual({ genotype: new List([0, 0, 0, 0]) });
      const b = new Individual({ genotype: new List([1, 1, 1, 1]) });

      const children = a.offspring([b], uniform());
      expect(children.length).toBe(2);
    });

    it("overrides the phenotype using a function if given", () => {
      const phenotype = () => ({ x: 1 });

      const a = new Individual({ genotype: new List([0, 0, 0, 0]), phenotype });
      const b = new Individual({ genotype: new List([1, 1, 1, 1]), phenotype });

      const [child] = a.offspring([b], uniform(), { phenotype: () => ({ x: 2 }) });
      expect(child.phenotype.x).toBe(2);
    });

    it("overrides the state using a function if given", () => {
      const a = new Individual({ genotype: new List([0, 0, 0, 0]) });
      const b = new Individual({ genotype: new List([1, 1, 1, 1]) });

      const [child] = a.offspring([b], uniform(), { state: () => ({ x: 5 }) });
      expect(child.state.computeAll().x).toBe(5);
    });

    it("throws a TypeError if the first argument (partners) is not an array", () => {
      fc.assert(fc.property(fc.anything(), (partners: any) => {
        fc.pre(!Array.isArray(partners));

        const individual = new Individual({ genotype: new List([1, 2, 3]) });

        expect(() => {
          individual.offspring(partners, uniform());
        }).toThrow(TypeError);
      }));
    });

    it("throws a TypeError if the second argument (method) is not a function", () => {
      fc.assert(fc.property(fc.anything(), (method: any) => {
        fc.pre(typeof method !== "function");

        const a = new Individual({ genotype: new List([0, 0, 0, 0]) });
        const b = new Individual({ genotype: new List([1, 1, 1, 1]) });

        expect(() => {
          a.offspring([b], method);
        }).toThrow(TypeError);
      }));
    });
  });

  describe("crossover", () => {
    it("calls Individual.prototype.offspring", () => {
      const a = new Individual({ genotype: new List([0, 0, 0, 0]) });
      const b = new Individual({ genotype: new List([1, 1, 1, 1]) });

      const spy = jest.spyOn(a, "offspring");
      a.crossover(10, [b], uniform());

      expect(spy).toBeCalled();
      spy.mockClear();
    });

    it("returns correct amount of Individuals", () => {
      fc.assert(fc.property(fc.integer(1, 10_000), (amount) => {
        const a = new Individual({ genotype: new List([0, 0, 0, 0]) });
        const b = new Individual({ genotype: new List([1, 1, 1, 1]) });

        const children = a.crossover(amount, [b], uniform());
        expect(children.length).toBe(amount);
      }));
    });

    it("throws a TypeError if the amount is not a positive integer number", () => {
      fc.assert(fc.property(fc.anything(), (amount: any) => {
        fc.pre(
          typeof amount !== "number" ||
          amount % 1 > 0 ||
          0 >= amount ||
          amount === Infinity
        );

        const a = new Individual({ genotype: new List([0, 0, 0, 0]) });
        const b = new Individual({ genotype: new List([1, 1, 1, 1]) });

        expect(() => {
          a.crossover(amount, [b], uniform());
        }).toThrow(TypeError);
      }));
    });
  });
});
