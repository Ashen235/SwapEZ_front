import { Component, AfterViewInit } from '@angular/core';
import { QuantumService } from '../quantum.service';
import * as d3 from 'd3';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NetworkService } from '../network.service';

interface NodeData {
  id: string;
  type: string;
  fx?: number | null;
  fy?: number | null;
  x?: number;
  y?: number;
}

interface EdgeData {
  source: NodeData | string;
  target: NodeData | string;
  value: number;
}

@Component({
  selector: 'app-network-visualization',
  templateUrl: './network-visualization.component.html',
  styleUrls: ['./network-visualization.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule]
})

export class NetworkVisualizationComponent implements AfterViewInit {
  nodes: NodeData[] = [];
  edges: EdgeData[] = [];

  private svg!: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  private simulation!: d3.Simulation<NodeData, EdgeData>;
  private link!: d3.Selection<SVGLineElement, EdgeData, SVGGElement, unknown>;
  private node!: d3.Selection<SVGCircleElement, NodeData, SVGGElement, unknown>;
  private labels!: d3.Selection<SVGTextElement, NodeData, SVGGElement, unknown>;

  constructor(private networkService: NetworkService) {}

  ngAfterViewInit(): void {
    this.initializeGraph();
    this.networkService.nodeObservable$.subscribe(node => this.addNode(node));
    this.networkService.removeNodeObservable$.subscribe(nodeId => this.removeNode(nodeId));
    this.networkService.edgeObservable$.subscribe(edge => this.addEdge(edge));
    this.networkService.modifyEdgeObservable$.subscribe(edge => this.modifyEdge(edge));
    this.networkService.removeEdgeObservable$.subscribe(edge => this.removeEdge(edge));
  }

  initializeGraph() {
    if (typeof document !== 'undefined') {
      this.svg = d3.select<SVGSVGElement, unknown>('svg');
      console.log('SVG Element:', this.svg);

      const width = +this.svg.attr('width');
      const height = +this.svg.attr('height');
      console.log('SVG Dimensions:', width, height);

      this.simulation = d3.forceSimulation<NodeData, EdgeData>()
        .force('link', d3.forceLink<NodeData, EdgeData>().id((d: any) => d.id).distance(d => d.value * 10))
        .force('charge', d3.forceManyBody().strength(-50))
        .force('center', d3.forceCenter(width / 2, height / 2));

      this.link = this.svg.append('g')
        .attr('class', 'links')
        .selectAll<SVGLineElement, EdgeData>('line');

      this.node = this.svg.append('g')
        .attr('class', 'nodes')
        .selectAll<SVGCircleElement, NodeData>('circle');

      this.labels = this.svg.append('g')
        .attr('class', 'labels')
        .selectAll<SVGTextElement, NodeData>('text');

      this.simulation.on('tick', () => this.ticked());
    }
  }

  ticked() {
    console.log('Ticking...');
    const width = +this.svg.attr('width');
    const height = +this.svg.attr('height');

    this.link
      .attr('x1', d => Math.max(0, Math.min(width, this.getNodeX(d.source))))
      .attr('y1', d => Math.max(0, Math.min(height, this.getNodeY(d.source))))
      .attr('x2', d => Math.max(0, Math.min(width, this.getNodeX(d.target))))
      .attr('y2', d => Math.max(0, Math.min(height, this.getNodeY(d.target))))
      .attr('stroke', 'black')
      .attr('stroke-width', 2);

    this.node
      .attr('cx', d => Math.max(10, Math.min(width - 10, d.x || 0)))
      .attr('cy', d => Math.max(10, Math.min(height - 10, d.y || 0)));

    this.labels
      .attr('x', d => Math.max(10, Math.min(width - 10, d.x || 0)))
      .attr('y', d => Math.max(10, Math.min(height - 10, d.y || 0)))
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', 'white');
  }

  dragstarted(event: d3.D3DragEvent<SVGCircleElement, NodeData, NodeData>, d: NodeData, simulation: d3.Simulation<NodeData, EdgeData>) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = Math.max(10, Math.min(+this.svg.attr('width') - 10, d.x || 0));
    d.fy = Math.max(10, Math.min(+this.svg.attr('height') - 10, d.y || 0));
  }

  dragged(event: d3.D3DragEvent<SVGCircleElement, NodeData, NodeData>, d: NodeData) {
    d.fx = Math.max(10, Math.min(+this.svg.attr('width') - 10, event.x));
    d.fy = Math.max(10, Math.min(+this.svg.attr('height') - 10, event.y));
  }

  dragended(event: d3.D3DragEvent<SVGCircleElement, NodeData, NodeData>, d: NodeData, simulation: d3.Simulation<NodeData, EdgeData>) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  addNode(node: NodeData) {
    console.log('Adding node:', node.id, node.type);
    node.x = Math.max(10, Math.min(+this.svg.attr('width') - 10, node.x || +this.svg.attr('width') / 2));
    node.y = Math.max(10, Math.min(+this.svg.attr('height') - 10, node.y || +this.svg.attr('height') / 2));
    this.nodes.push(node);
    console.log('Nodes:', this.nodes);
    this.updateGraph();
  }

  removeNode(nodeId: string) {
    console.log('Removing node:', nodeId);
    this.nodes = this.nodes.filter(node => node.id !== nodeId);
    this.edges = this.edges.filter(edge => this.getNodeId(edge.source) !== nodeId && this.getNodeId(edge.target) !== nodeId);
    this.updateGraph();
  }

  addEdge(edge: EdgeData) {
    console.log('Adding edge between:', edge.source, edge.target, 'with cost:', edge.value);
    const sourceNode = this.nodes.find(node => this.getNodeId(edge.source) === node.id);
    const targetNode = this.nodes.find(node => this.getNodeId(edge.target) === node.id);

    if (sourceNode && targetNode) {
      this.edges.push({ source: sourceNode, target: targetNode, value: edge.value });
      this.edges.push({ source: targetNode, target: sourceNode, value: edge.value });
      console.log('Edges:', this.edges);
      this.updateGraph();
    } else {
      console.error('Invalid nodes specified for edge.');
    }
  }

  modifyEdge(edge: EdgeData) {
    console.log('Modifying edge between:', edge.source, edge.target, 'to new cost:', edge.value);
    const edgeIndex = this.edges.findIndex(e => this.getNodeId(e.source) === this.getNodeId(edge.source) && this.getNodeId(e.target) === this.getNodeId(edge.target));
    if (edgeIndex !== -1) {
      this.edges[edgeIndex].value = edge.value;
      const reverseEdgeIndex = this.edges.findIndex(e => this.getNodeId(e.source) === this.getNodeId(edge.target) && this.getNodeId(e.target) === this.getNodeId(edge.source));
      if (reverseEdgeIndex !== -1) {
        this.edges[reverseEdgeIndex].value = edge.value;
      }
      this.updateGraph();
    } else {
      console.error('Edge not found.');
    }
  }

  removeEdge(edge: { source: string, target: string }) {
    console.log('Removing edge between:', edge.source, edge.target);
    this.edges = this.edges.filter(e => !(this.getNodeId(e.source) === edge.source && this.getNodeId(e.target) === edge.target));
    this.edges = this.edges.filter(e => !(this.getNodeId(e.source) === edge.target && this.getNodeId(e.target) === edge.source));
    this.updateGraph();
  }

  updateGraph() {
    if (!this.simulation) {
      console.error('Simulation not initialized.');
      return;
    }

    // Update links
    this.link = this.link.data(this.edges, (d: any) => `${this.getNodeId(d.source)}-${this.getNodeId(d.target)}`);
    this.link.exit().remove();
    this.link = this.link.enter().append('line')
      .attr('stroke', 'black')
      .attr('stroke-width', 2)
      .merge(this.link);

    // Update nodes
    this.node = this.node.data(this.nodes, (d: any) => d.id);
    this.node.exit().remove();
    this.node = this.node.enter().append('circle')
      .attr('r', 20)
      .attr('fill', d => d.type === 'endpoint' ? 'red' : 'blue')
      .call(
        d3.drag<SVGCircleElement, NodeData>()
          .on('start', (event, d) => this.dragstarted(event, d, this.simulation))
          .on('drag', (event, d) => this.dragged(event, d))
          .on('end', (event, d) => this.dragended(event, d, this.simulation))
      )
      .merge(this.node);

    // Update labels
    this.labels = this.labels.data(this.nodes, (d: any) => d.id);
    this.labels.exit().remove();
    this.labels = this.labels.enter().append('text')
      .text(d => d.id)
      .attr('x', d => d.x || 0)
      .attr('y', d => d.y || 0)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', 'white')
      .style('pointer-events', 'none')
      .merge(this.labels);

    console.log('Nodes after update:', this.node.data());
    console.log('Links after update:', this.link.data());

    // Restart the simulation
    this.simulation.nodes(this.nodes);
    (this.simulation.force('link') as d3.ForceLink<NodeData, EdgeData>).links(this.edges);
    this.simulation.alpha(1).restart();
  }

  private getNodeId(node: string | NodeData): string {
    return typeof node === 'string' ? node : node.id;
  }

  private getNodeX(node: string | NodeData): number {
    return typeof node === 'string' ? this.nodes.find(n => n.id === node)?.x || 0 : node.x || 0;
  }

  private getNodeY(node: string | NodeData): number {
    return typeof node === 'string' ? this.nodes.find(n => n.id === node)?.y || 0 : node.y || 0;
  }
}