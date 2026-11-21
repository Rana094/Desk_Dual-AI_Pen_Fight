"use client";
import type { LiveDecision } from "@/game/state/types";
interface Extra {
  worstReply?: string | null;
  depth?: number;
  beam?: number;
  depthLimit?: number;
  cutoff?: boolean;
  iterations?: number;
  forwardFrontier?: number;
  backwardFrontier?: number;
  goalCandidates?: number;
  evaluated?: number;
  meetingDepth?: number;
  iters?: number;
  iter?: number;
  total?: number;
  frontier?: number;
  expanded?: number;
  found?: boolean;
  open?: number;
  finalRank?: number;
}
export function AlgorithmDetails({
  decision,
}: {
  decision: LiveDecision | null;
}) {
  if (!decision)
    return <p className="mute">Details appear after a decision.</p>;
  const x = decision.extra as Extra;
  return (
    <div>
      {decision.algo === "minimax" && (
        <>
          <h4>Minimax</h4>
          <p className="mute">
            Depth {x.depth} · root shortlist {x.beam}.
          </p>
          {x.worstReply && <p>Worst-case reply: {x.worstReply}</p>}
        </>
      )}
      {(x.iters != null || x.iter != null) && (
        <>
          <h4>MCTS</h4>
          <p className="mute">
            {x.iters || x.iter} iterations · root visits {x.total}. Node size
            shows visits.
          </p>
        </>
      )}
      {x.frontier != null && (
        <>
          <h4>Uninformed search</h4>
          <p className="mute">
            Frontier {x.frontier} · expanded {x.expanded} · goal{" "}
            {x.found
              ? "found"
              : x.cutoff
                ? "depth cutoff"
                : "not reached within budget"}
          </p>
        </>
      )}
      {x.depthLimit != null && (
        <p className="mute">
          Depth limit {x.depthLimit}
          {x.iterations != null ? ` · ${x.iterations} deepening passes` : ""}.
        </p>
      )}
      {x.goalCandidates != null && (
        <p className="mute">
          Goal discovery: {x.goalCandidates} verified shots from {x.evaluated}{" "}
          simulations.
          {x.forwardFrontier != null &&
            ` Forward frontier ${x.forwardFrontier} · backward frontier ${x.backwardFrontier}.`}
          {x.meetingDepth != null &&
            ` Frontiers met at depth ${x.meetingDepth}.`}
        </p>
      )}
      {x.open != null && (
        <>
          <h4>Informed search</h4>
          <p className="mute">Open list {x.open}</p>
          {x.finalRank != null && !decision.mistake && (
            <p>
              Final shot rank: {x.finalRank.toFixed(2)}. Ranking adds 20 ×
              knock-off rate, subtracts 30 × self knock-off rate
              {decision.algo === "astar" && " and 14 × g"}, and gives qualifying
              goal shots precedence.
            </p>
          )}
        </>
      )}
      {decision.mistake && (
        <p className="warn">Human-like slip: it picked a runner-up shot.</p>
      )}
    </div>
  );
}
