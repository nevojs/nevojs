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

/**
 *
 */
export type PickEntry<T> = {
  probability: number;
  item: T;
}

/**
 * @category helpers
 * @param entries
 */
export function pick<T>(
  entries: PickEntry<T>[]
): T {
  const sum = entries.reduce((acc, entry) => acc + entry.probability, 0);
  const threshold = Math.random();
  let total = 0;

  for (const entry of entries) {
    total += entry.probability / sum;

    if (threshold <= total) {
      return entry.item;
    }
  }

  return undefined as never;
}
