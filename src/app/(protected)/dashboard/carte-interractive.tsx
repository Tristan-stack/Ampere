import NetworkGraph from "@/components/network-graph";
import exp from "constants";
import { sub } from "date-fns";

const data = {
    nodes: [
      { id: "Bâtiment A", group: 1, consumption: 150 },
      { id: "A1", group: 1, consumption: 50 },
      { id: "A2", group: 1, consumption: 70 },
      { id: "Bâtiment B", group: 2, consumption: 300 },
      { id: "B1", group: 2, consumption: 100 },
      { id: "Bâtiment C", group: 3, consumption: 100 },
    ],
    links: [
      { source: "Bâtiment A", target: "Bâtiment B", value: 1 },
      { source: "Bâtiment B", target: "Bâtiment C", value: 1 },
      { source: "Bâtiment C", target: "Bâtiment A", value: 1 },
      { source: "Bâtiment A", target: "A1", value: 0.5 },
      { source: "Bâtiment A", target: "A2", value: 0.5 },
      { source: "Bâtiment B", target: "B1", value: 0.5 },
    ],
  };
  

const NetworkGraphPage = () => {
  return <NetworkGraph data={data} />;
};

export default NetworkGraphPage;