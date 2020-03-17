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

import { Objective, SerializedObjective } from "./objective";

function compareObjectives(objA: Objective, objB: Objective): boolean {
  return objA.value === objB.value && objA.weight === objB.weight;
}

describe("Objective", () => {
  const objective = new Objective(5, 3);

  describe("value", () => {
    it("returns the value passed to objective when created", () => {
      expect(objective.value).toBe(5);
    });
  });

  describe("weight", () => {
    it("returns the weight passed to objective when created", () => {
      expect(objective.weight).toBe(3);
    });
  });

  describe("fitness", () => {
    it("returns computed fitness (value * weight)", () => {
      expect(objective.fitness()).toBe(15);
    });
  });

  describe("clone", () => {
    const copy = objective.clone();

    it("returns a instance of Objective", () => {
      expect(copy).toBeInstanceOf(Objective);
    });

    it("does not equal original objective", () => {
      expect(copy).not.toBe(objective);
    });

    it("has the same value and weight as the original objective", () => {
      expect(compareObjectives(objective, copy)).toBe(true);
    });
  });

  describe("serialize", () => {
    const serialized = objective.serialize();

    it("returns an object", () => {
      expect(serialized).toBeInstanceOf(Object);
    });

    describe("value", () => {
      it("is equal to the value in original objective converted to string", () => {
        const objective = new Objective(5, 3);
        const serialized = objective.serialize();

        expect(serialized.value).toBe(5);
      });

      it("is equal to the value in original objective converted to string (Infinity)", () => {
        const objective = new Objective(Infinity, 3);
        const serialized = objective.serialize();

        expect(serialized.value).toBe("__POSITIVE_INFINITY__");
      });

      it("is equal to the value in original objective converted to string (-Infinity)", () => {
        const objective = new Objective(-Infinity, 3);
        const serialized = objective.serialize();

        expect(serialized.value).toBe("__NEGATIVE_INFINITY__");
      });
    });
  });

  describe("deserialize", () => {
    const serialized: SerializedObjective = {
      value: 5,
      weight: 3,
    };

    const deserialized = Objective.deserialize(serialized);

    it("returns instance of Objective", () => {
      expect(deserialized).toBeInstanceOf(Objective);
    });

    it("returns objective with valid value", () => {
      expect(deserialized.value).toBe(serialized.value);
    });

    it("returns objective with valid weight", () => {
      expect(deserialized.weight).toBe(serialized.weight);
    });
  });

  describe("toJSON", () => {
    it("returns JSON of serialized objective", () => {
      const objective = new Objective(3, 2);
      const data = objective.toJSON();

      expect(data).toBe('{"value":3,"weight":2}'); // eslint-disable-line
    });
  });
});
