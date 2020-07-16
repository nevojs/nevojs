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
import { Objective, SerializedObjective } from "./objective";
import { SerializedValueIdentifier } from "../../serialization";

describe("Objective", () => {
  describe("constructor", () => {
    it("throws a TypeError if the value is not a valid number", () => {
      fc.assert(fc.property(fc.anything(), (value) => {
        fc.pre(typeof value !== "number" || isNaN(value));

        expect(() => new Objective(value as number, 1)).toThrowError(TypeError);
      }));
    });

    it("throws a TypeError if the weight is not a valid number", () => {
      fc.assert(fc.property(fc.anything(), (weight) => {
        fc.pre(typeof weight !== "number" || isNaN(weight));

        expect(() => new Objective(1, weight as number)).toThrowError(TypeError);
      }));
    });
  });

  describe("value (get)", () => {
    it("returns the value passed to objective when created", () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const objective = new Objective(value, 1);

        expect(objective.value).toBe(value);
      }));
    });
  });

  describe("weight (get)", () => {
    it("returns the weight passed to objective when created", () => {
      fc.assert(fc.property(fc.integer(), (weight) => {
        const objective = new Objective(1, weight);

        expect(objective.weight).toBe(weight);
      }));
    });
  });

  describe("value (set)", () => {
    it("sets the value", () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const objective = new Objective(1, 1);
        objective.value = value;

        expect(objective.value).toBe(value);
      }));
    });

    it("throws a TypeError if the value is not a valid number", () => {
      fc.assert(fc.property(fc.anything(), (value) => {
        fc.pre(typeof value !== "number" || isNaN(value));

        const objective = new Objective(2, 1);

        expect(() => {
          objective.value = value as number;
        }).toThrow(TypeError);
      }));
    });
  });

  describe("weight (set)", () => {
    it("sets the weight", () => {
      fc.assert(fc.property(fc.integer(), (weight) => {
        const objective = new Objective(1, 1);
        objective.weight = weight;

        expect(objective.weight).toBe(weight);
      }));
    });

    it("throws a TypeError if the weight is not a valid number", () => {
      fc.assert(fc.property(fc.anything(), (weight) => {
        fc.pre(typeof weight !== "number" || isNaN(weight));

        const objective = new Objective(2, 1);

        expect(() => {
          objective.weight = weight as number;
        }).toThrow(TypeError);
      }));
    });
  });

  describe("fitness", () => {
    it("returns computed fitness", () => {
      fc.assert(fc.property(fc.integer(), fc.integer(), (value, weight) => {
        const objective = new Objective(value, weight);

        expect(objective.fitness()).toBe(value * weight);
      }));
    });
  });

  describe("clone", () => {
    it("returns an instance of Objective", () => {
      const objective = new Objective(-3, -2);
      const copy = objective.clone();

      expect(copy).toBeInstanceOf(Objective);
    });

    it("does not equal original objective", () => {
      const objective = new Objective(8, 4);
      const copy = objective.clone();

      expect(copy).not.toBe(objective);
    });

    it("has the same value as the original objective", () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const objective = new Objective(value, 1);
        const copy = objective.clone();

        expect(copy.value).toBe(value);
      }));
    });

    it("has the same weight as the original objective", () => {
      fc.assert(fc.property(fc.integer(), (weight) => {
        const objective = new Objective(1, weight);
        const copy = objective.clone();

        expect(copy.weight).toBe(weight);
      }));
    });
  });

  describe("serialize", () => {
    it("properly serializes value (numeric)", () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const objective = new Objective(value, 1);
        const serialized = objective.serialize();

        expect(serialized.value).toBe(value);
      }));
    });

    it("properly serializes value (Infinity)", () => {
      const objective = new Objective(Infinity, 1);
      const serialized = objective.serialize();

      expect(serialized.value).toBe(SerializedValueIdentifier.PositiveInfinity);
    });

    it("properly serializes value (-Infinity)", () => {
      const objective = new Objective(-Infinity, 1);
      const serialized = objective.serialize();

      expect(serialized.value).toBe(SerializedValueIdentifier.NegativeInfinity);
    });

    it("properly serializes weight (numeric)", () => {
      fc.assert(fc.property(fc.integer(), (weight) => {
        const objective = new Objective(1, weight);
        const serialized = objective.serialize();

        expect(serialized.weight).toBe(weight);
      }));
    });

    it("properly serializes weight (Infinity)", () => {
      const objective = new Objective(1, Infinity);
      const serialized = objective.serialize();

      expect(serialized.weight).toBe(SerializedValueIdentifier.PositiveInfinity);
    });

    it("properly serializes weight (-Infinity)", () => {
      const objective = new Objective(1, -Infinity);
      const serialized = objective.serialize();

      expect(serialized.weight).toBe(SerializedValueIdentifier.NegativeInfinity);
    });
  });

  describe("deserialize", () => {
    it("properly assigns value and weight", () => {
      fc.assert(fc.property(fc.integer(), fc.integer(), (value, weight) => {
        const serialized = { value, weight } as SerializedObjective;
        const deserialized = Objective.deserialize(serialized);

        expect(deserialized.value).toBe(value);
        expect(deserialized.weight).toBe(weight);
      }));
    });

    it("returns instance of Objective", () => {
      const serialized = { value: 1, weight: -1 } as SerializedObjective;
      const deserialized = Objective.deserialize(serialized);

      expect(deserialized).toBeInstanceOf(Objective);
    });

    it("properly deserializes value (numeric)", () => {
      fc.assert(fc.property(fc.integer(), (value) => {
        const serialized: SerializedObjective = {
          value,
          weight: 1,
        };

        const deserialized = Objective.deserialize(serialized);
        expect(deserialized.value).toBe(value);
      }));
    });

    it("properly deserializes value (Infinity)", () => {
      const serialized: SerializedObjective = {
        value: SerializedValueIdentifier.PositiveInfinity,
        weight: 1,
      };

      const deserialized = Objective.deserialize(serialized);
      expect(deserialized.value).toBe(Infinity);
    });

    it("properly deserializes value (-Infinity)", () => {
      const serialized: SerializedObjective = {
        value: SerializedValueIdentifier.NegativeInfinity,
        weight: 1,
      };

      const deserialized = Objective.deserialize(serialized);
      expect(deserialized.value).toBe(-Infinity);
    });

    it("properly deserializes weight (numeric)", () => {
      fc.assert(fc.property(fc.integer(), (weight) => {
        const serialized: SerializedObjective = {
          value: 1,
          weight,
        };

        const deserialized = Objective.deserialize(serialized);
        expect(deserialized.weight).toBe(weight);
      }));
    });

    it("properly deserializes weight (Infinity)", () => {
      const serialized: SerializedObjective = {
        value: 1,
        weight: SerializedValueIdentifier.PositiveInfinity,
      };

      const deserialized = Objective.deserialize(serialized);
      expect(deserialized.weight).toBe(Infinity);
    });

    it("properly deserializes weight (-Infinity)", () => {
      const serialized: SerializedObjective = {
        value: 1,
        weight: SerializedValueIdentifier.NegativeInfinity,
      };

      const deserialized = Objective.deserialize(serialized);
      expect(deserialized.weight).toBe(-Infinity);
    });
  });

  describe("fromJSON", () => {
    it("calls Objective.deserialize", () => {
      const data = JSON.stringify({ value: 2, weight: -1 });
      const spy = jest.spyOn(Objective, "deserialize");

      Objective.fromJSON(data);
      expect(spy).toBeCalledTimes(1);

      spy.mockClear();
    });
  });

  describe("toJSON", () => {
    it("returns JSON of serialized objective", () => {
      fc.assert(fc.property(fc.integer(), fc.integer(), (value, weight) => {
        const objective = new Objective(value, weight);
        const data = objective.toJSON();

        expect(JSON.parse(data)).toEqual({ value, weight });
      }));
    });

    it("calls Objective.prototype.serialize", () => {
      const objective = new Objective(-4, 1);
      const spy = jest.spyOn(objective, "serialize");

      objective.toJSON();
      expect(spy).toBeCalledTimes(1);

      spy.mockClear();
    });
  });
});
