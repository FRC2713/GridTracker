import clsx from "clsx";
import {
  Component,
  createMemo,
  createSignal,
  For,
  Index,
  Match,
  Switch,
} from "solid-js";
import { Link } from "./Link";
export type NodeType = "cone" | "cube" | "hybrid";

const typeStyles: Record<NodeType, string> = {
  cone: "#facc15",
  cube: "#9333ea",
  hybrid: "#06b6d4",
};

type LinkMember = {
  node: number;
  occupied: boolean;
};

type LinkCandidate = LinkMember[];

const initialGrid: boolean[][] = [
  Array(9).fill(false, 0),
  Array(9).fill(false, 0),
  Array(9).fill(false, 0),
];

function findLinks(row: boolean[]): number[] {
  const links: number[] = [];
  for (let index = 0; index < row.length - 2; index++) {
    if (links.includes(index)) {
      continue;
    }
    const group = row.slice(index, index + 3);
    if (group.every((n) => n)) {
      links.push(index, index + 1, index + 2);
    }
  }
  return links;
}

const [grid, setGrid] = createSignal(initialGrid);

interface NodeProps {
  address: { row: number; node: number };
  priority?: boolean;
  inLink: boolean;
}

interface BaseNodeProps extends NodeProps {
  color: string;
}

export function BaseNode(props: BaseNodeProps) {
  const occupied = createMemo(
    () => grid()[props.address.row][props.address.node]
  );
  return (
    <div
      class={clsx(
        "transition ease-in-out duration-100 w-full h-ful flex flex-row items-center rounded-lg justify-center",
        props.color,
        !occupied() && `bg-opacity-30`
      )}
      onClick={() => {
        setGrid((prev) => {
          prev[props.address.row][props.address.node] = !occupied();
          return [...prev];
        });
      }}
    >
      {props.inLink && <Link class="stroke-black h-32 w-32" />}
      {props.priority && <Link class="stroke-white h-32 w-32 animate-spin" />}
    </div>
  );
}

export function CubeNode(props: NodeProps) {
  return <BaseNode {...props} color="bg-purple-600" />;
}

export function ConeNode(props: NodeProps) {
  return <BaseNode {...props} color="bg-yellow-400" />;
}

export function HybridNode(props: NodeProps) {
  return <BaseNode {...props} color="bg-teal-500" />;
}

const App: Component = () => {
  const linkCandidates = createMemo(() => {
    const allLinkGroups: Map<number, LinkCandidate[]> = new Map();
    grid().forEach((row, rowIndex) => {
      const links: LinkCandidate[] = [];
      row.forEach((n, nodeIndex) => {
        if (nodeIndex < row.length - 2) {
          links.push([
            { node: nodeIndex, occupied: n },
            { node: nodeIndex + 1, occupied: row[nodeIndex + 1] },
            { node: nodeIndex + 2, occupied: row[nodeIndex + 2] },
          ]);
        }
      });
      allLinkGroups.set(rowIndex, links);
    });
    return allLinkGroups;
  });

  const linkNodes = createMemo(() => {
    const links: Record<number, LinkCandidate[]> = { 0: [], 1: [], 2: [] };
    linkCandidates().forEach((row, rowIndex) => {
      links[rowIndex] = row.reduce((foundLinks: LinkCandidate[], c) => {
        if (
          c.every((n) => n.occupied) &&
          !foundLinks.some((l) =>
            l.some((n) => c.some((m) => m.node === n.node))
          )
        ) {
          foundLinks.push(c);
        }
        return foundLinks;
      }, []);
    });
    return links;
  });

  const priorityNodesNew = createMemo(() => {
    const priorityNodes: number[][] = [[], [], []];
    linkCandidates().forEach((row, rowIndex) => {
      const linkIndices = linkNodes()
        [rowIndex].map((c) => c.map((n) => n.node))
        .flat();
      console.log("linkIndices", linkIndices);
      row.forEach((candidate) => {
        if (
          candidate.filter((n) => n.occupied && !linkIndices.includes(n.node))
            .length === 2
        ) {
          console.log("found candidate", candidate);
          priorityNodes[rowIndex].push(candidate.find((n) => !n.occupied).node);
        }
      });
    });
    return priorityNodes;
  });

  return (
    <div class="w-full h-screen bg-gray-800 text-white p-8 flex flex-col gap-4">
      <Index each={grid()}>
        {(row, rowIndex) => (
          <div class="flex flex-row w-full h-full gap-2">
            <Index each={row()}>
              {(node, nodeIndex) => (
                <Switch
                  fallback={<div>{`[${rowIndex},${nodeIndex}] Not Found`}</div>}
                >
                  <Match when={rowIndex < 2 && [1, 4, 7].includes(nodeIndex)}>
                    <CubeNode
                      address={{ row: rowIndex, node: nodeIndex }}
                      priority={priorityNodesNew()[rowIndex]?.includes(
                        nodeIndex
                      )}
                      inLink={linkNodes()[rowIndex]?.some((l) =>
                        l.some((n) => n.node === nodeIndex)
                      )}
                    />
                  </Match>
                  <Match
                    when={
                      rowIndex < 2 && [0, 2, 3, 5, 6, 8].includes(nodeIndex)
                    }
                  >
                    <ConeNode
                      address={{ row: rowIndex, node: nodeIndex }}
                      priority={priorityNodesNew()[rowIndex]?.includes(
                        nodeIndex
                      )}
                      inLink={linkNodes()[rowIndex]?.some((l) =>
                        l.some((n) => n.node === nodeIndex)
                      )}
                    />
                  </Match>
                  <Match when={rowIndex === 2}>
                    <HybridNode
                      address={{ row: rowIndex, node: nodeIndex }}
                      priority={priorityNodesNew()[rowIndex]?.includes(
                        nodeIndex
                      )}
                      inLink={linkNodes()[rowIndex]?.some((l) =>
                        l.some((n) => n.node === nodeIndex)
                      )}
                    />
                  </Match>
                </Switch>
              )}
            </Index>
          </div>
        )}
      </Index>
    </div>
  );
};

export default App;
