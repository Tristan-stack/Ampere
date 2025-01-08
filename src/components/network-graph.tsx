import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";

interface Node {
    id: string;
    group: number;
    consumption: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
}

interface Link {
    source: string;
    target: string;
    value: number;
}

interface Data {
    nodes: Node[];
    links: Link[];
}

interface NetworkGraphProps {
    data: Data;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!data || !svgRef.current) return;

        // Clear existing SVG content
        d3.select(svgRef.current).selectAll("*").remove();

        const container = svgRef.current?.parentElement;
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const links = data.links.map(d => ({ ...d }));
        const nodes = data.nodes.map(d => ({ ...d }));

        // Define a scale for node sizes based on consumption
        const consumptionValues = nodes.map(node => node.consumption);
        const sizeScale = d3.scaleLinear()
            .domain([Math.min(...consumptionValues), Math.max(...consumptionValues)])
            .range([10, 50]);

        const groupForce = () => {
            const strength = 0.1;
            return (alpha: number) => {
                nodes.forEach((node) => {
                    const groupNodes = nodes.filter(n => n.group === node.group);
                    const centerX = d3.mean(groupNodes, n => n.x!)!;
                    const centerY = d3.mean(groupNodes, n => n.y!)!;

                    node.vx = (node.vx ?? 0) + (centerX - node.x!) * strength * alpha;
                    node.vy = (node.vy ?? 0) + (centerY - node.y!) * strength * alpha;
                });
            };
        };

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("grouping", groupForce())
            .on("tick", ticked);

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height] as any)
            .attr("style", "max-width: 100%; height: auto;");

        const defs = svg.append("defs");
        defs.append("filter")
            .attr("id", "glow")
            .append("feGaussianBlur")
            .attr("stdDeviation", "3")
            .attr("result", "coloredBlur");

        const link = svg.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll<SVGLineElement, Link>("line")
            .data(links)
            .join("line")
            .attr("stroke-width", d => Math.sqrt(d.value));

        const node = svg.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll<SVGCircleElement, Node>("circle")
            .data(nodes)
            .join("circle")
            .attr("r", d => sizeScale(d.consumption))
            .attr("fill", d => color(d.group.toString()) as string)
            .call(d3.drag<SVGCircleElement, Node>()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        node.append("title")
            .text(d => d.id);

        const text = svg.append("g")
            .selectAll<SVGTextElement, Node>("text")
            .data(nodes)
            .join("text")
            .attr("dy", d => sizeScale(d.consumption) + 20)
            .attr("text-anchor", "middle")
            .text(d => d.id)
            .attr("class", "tooltip text-sm font-medium text-neutral-400 fill-current select-none");

        function ticked() {
            link
                .attr("x1", d => ((d.source as unknown) as Node).x!)
                .attr("y1", d => ((d.source as unknown) as Node).y!)
                .attr("x2", d => ((d.target as unknown) as Node).x!)
                .attr("y2", d => ((d.target as unknown) as Node).y!);

            node
                .attr("cx", d => d.x!)
                .attr("cy", d => d.y!);

            text
                .attr("x", d => d.x!)
                .attr("y", d => d.y!);
        }

        function dragstarted(event: any, d: Node) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event: any, d: Node) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event: any, d: Node) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        return () => {
            simulation.stop();
            if (svgRef.current) {
                d3.select(svgRef.current).selectAll("*").remove();
            }
        };
    }, [data]);

    return (
        <div ref={containerRef} className="relative w-full h-screen overflow-hidden">
            <svg ref={svgRef} width="100%" height="100%"></svg>
        </div>
    );
};

export default NetworkGraph;