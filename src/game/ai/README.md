# AI

`installAlgorithms(engine)` in `algorithms.js` registers five algorithms: DFS, greedy best-first search, A*, minimax and MCTS. Expert difficulty uses MCTS. Unknown or obsolete algorithm identifiers fall back to the configured default (A* initially); persisted selections are validated before use.

| Module                     | Responsibility                                                 |
| -------------------------- | -------------------------------------------------------------- |
| `strategies/uninformed.js` | DFS                                                            |
| `strategies/search.js`     | Greedy best-first and A*-style action search                   |
| `strategies/minimax.js`    | Alternating MAX/MIN with worst-case opponent replies           |
| `strategies/mcts.js`       | UCB selection, expansion, random rollout and backpropagation   |
| `priority-queue.js`        | Shared minimum-priority queue                                  |
| `catalog.js`               | Compatibility exports of resolved names and difficulty presets |
| `evaluation.js`            | Physics-based shot scoring                                     |
| `context.js`               | Per-search state, yielding, metrics and candidate summaries    |

The search curriculum comes from the supplied Uninformed Search, Informed Search, Adversarial Search and MCTS slide decks.

The shot-action tree has four levels: target, angle, power and spin. DFS explores attack targets before table-centre and guard targets so the default budget reaches opponent shots. It tests complete shots for a knock-off goal and returns the best evaluated shot or a fixed fallback if the goal is not reached within its budget. A configured depth below four reports a cutoff.

Bidirectional search was removed: it first simulated complete shots to discover winning leaves, then met forward/backward frontiers on their action prefixes. Those winning shots were already known, so the prefix traversal added work without finding a new solution. Friction, collisions and knock-offs do not provide a practical inverse physics transition, and the game has many possible winning end states rather than one known destination. Saved `bidirectional` selections use the existing obsolete-selection fallback.

Greedy search orders by h; A* orders by g + h. The physics-based heuristic is not admissible, so this bounded A*-style search does not guarantee an optimal path. Minimax uses a root shortlist and depth limit to keep the continuous game's discretized action tree manageable. MCTS uses a scored root shortlist and bounded rollout depth. It stores the board reached by each tree edge so replies remain aimed from the positions where they were generated. The tree uses deterministic physics and random rollouts apply aim noise only when the selected difficulty supplies it. Both adversarial searches use a limited set of replies and neither guarantees an optimal shot.

Shot evaluation uses the same time limit and noise model as normal play, and repeats a simulation only when aim noise can change the result.

Strategies receive engine/context helpers explicitly and return actions plus inspection data. Yield through `slice(ctx)` inside long searches, keep random seeds explicit in tests, and preserve the same knock-off rule in playable and headless matches.

`src/config/ai.ts` owns labels, accuracy/noise/mistakes, think times, search goals/budgets, and benchmark initial values. The resolved values arrive through `config.ts` and compatibility exports in `catalog.js`. Think time is a minimum in milliseconds of animation time. AI Battle caps the minimum at `playback.battleThinkLimit` seconds. A configured zero adds no wait. Search runs to completion and yields cooperatively. Per-decision options can override budget defaults. Shared pen and physics tuning comes from their own configuration sections.

Search behavior is covered by [search tests](../../../tests/ai-search.test.js) and [boundary tests](../../../tests/ai-boundaries.test.js). When adding an algorithm, update its default, validation, strategy, inspector description, and tests together.
