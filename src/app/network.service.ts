import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { SimulationNodeDatum } from 'd3-force';

export interface NodeData extends SimulationNodeDatum {
  id: string;
  type: string;
}

export interface EdgeData {
  source: string | NodeData;
  target: string | NodeData;
  value: number;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  // Allow null to signal a full refresh
  private nodeSubject = new Subject<NodeData | null>();
  private removeNodeSubject = new Subject<string>();
  private edgeSubject = new Subject<EdgeData | null>();
  private modifyEdgeSubject = new Subject<EdgeData>();
  private removeEdgeSubject = new Subject<{ source: string, target: string }>();
  private highlightPathSubject = new Subject<{ source: string, target: string, type: string }[]>();

  nodeObservable$ = this.nodeSubject.asObservable();
  removeNodeObservable$ = this.removeNodeSubject.asObservable();
  edgeObservable$ = this.edgeSubject.asObservable();
  modifyEdgeObservable$ = this.modifyEdgeSubject.asObservable();
  removeEdgeObservable$ = this.removeEdgeSubject.asObservable();
  highlightPathObservable$ = this.highlightPathSubject.asObservable();

  private nodes: NodeData[] = [];
  private edges: EdgeData[] = [];

  constructor(private http: HttpClient) {}

  addNode(node: NodeData) {
    console.log(node);
    // console.log("Call to addNode")
    // console.log("Value of nodes before adding", [...this.nodes]);
    this.nodes.push(node);
    // console.log("Value of nodes after adding", [...this.nodes]);
    
    this.nodeSubject.next(node);
  }

  removeNode(nodeId: string) {
    this.nodes = this.nodes.filter(node => node.id !== nodeId);
    this.edges = this.edges.filter(edge => this.getNodeId(edge.source) !== nodeId && this.getNodeId(edge.target) !== nodeId);
    this.removeNodeSubject.next(nodeId);
  }

  addEdge(edge: EdgeData) {
    if (!this.edges.some(e => this.areNodesEqual(e.source, edge.source) && this.areNodesEqual(e.target, edge.target))) {
      this.edges.push(edge);
      // Also add reverse edge for undirected visualization.
      this.edges.push({ source: edge.target, target: edge.source, value: edge.value });
      this.edgeSubject.next(edge);
    }
  }

  modifyEdge(edge: EdgeData) {
    const edgeIndex = this.edges.findIndex(e => this.areNodesEqual(e.source, edge.source) && this.areNodesEqual(e.target, edge.target));
    if (edgeIndex !== -1) {
      this.edges[edgeIndex].value = edge.value;
      const reverseEdgeIndex = this.edges.findIndex(e => this.areNodesEqual(e.source, edge.target) && this.areNodesEqual(e.target, edge.source));
      if (reverseEdgeIndex !== -1) {
        this.edges[reverseEdgeIndex].value = edge.value;
      }
      this.modifyEdgeSubject.next(edge);
    }
  }

  removeEdge(source: string, target: string) {
    this.edges = this.edges.filter(e => !(this.areNodesEqual(e.source, source) && this.areNodesEqual(e.target, target)));
    this.edges = this.edges.filter(e => !(this.areNodesEqual(e.source, target) && this.areNodesEqual(e.target, source)));
    this.removeEdgeSubject.next({ source, target });
  }

  highlightPath(pathEdges: { source: string, target: string, type: string }[]) {
    this.highlightPathSubject.next(pathEdges);
  }

  requestEntanglement(endpoint1: string, endpoint2: string): Observable<any> {
    return this.http.post('/request_entanglement', { endpoint1, endpoint2 });
  }

  getShortestPathCost(node1: string, node2: string): number | null {
    const distances: { [key: string]: number } = {};
    const visited: { [key: string]: boolean } = {};
    this.nodes.forEach(node => {
      distances[node.id] = Infinity;
      visited[node.id] = false;
    });
    distances[node1] = 0;
    for (let i = 0; i < this.nodes.length; i++) {
      const nearestNode = this.getNearestNode(distances, visited);
      if (nearestNode === null) break;
      visited[nearestNode] = true;
      this.edges.forEach(edge => {
        const { source, target, value } = edge;
        const sourceId = typeof source === 'string' ? source : source.id;
        const targetId = typeof target === 'string' ? target : target.id;
        if (sourceId === nearestNode && !visited[targetId] && distances[nearestNode] + value < distances[targetId]) {
          distances[targetId] = distances[nearestNode] + value;
        }
        if (targetId === nearestNode && !visited[sourceId] && distances[nearestNode] + value < distances[sourceId]) {
          distances[sourceId] = distances[nearestNode] + value;
        }
      });
    }
    return distances[node2] === Infinity ? null : distances[node2];
  }

  importNetwork(configStr: string): void {
    try {
        const config = JSON.parse(configStr);
        if (config.nodes && config.edges) {
            // Convert raw nodes into NodeData format
            this.nodes = config.nodes.map((node: any) => ({
                id: node.id,
                type: node.type,
                x: node.x || 0,
                y: node.y || 0,
                fx: node.fx || null,
                fy: node.fy || null
            }));

            // Convert edges into EdgeData format
            this.edges = config.edges.map((edge: any) => ({
                source: this.getNodeById(edge.source.id) || edge.source,
                target: this.getNodeById(edge.target.id) || edge.target,
                value: edge.value
            }));

            console.log("Imported network:", this.nodes, this.edges);
            this.nodeSubject.next(null);
            this.edgeSubject.next(null);
        } else {
            console.error("Invalid network configuration format.");
        }
    } catch (err) {
        console.error("Error parsing network configuration:", err);
    }
}

// Export network configuration as JSON.
exportNetwork(): string {
    const config = {
        nodes: this.nodes,
        edges: this.edges.map(edge => ({
            source: { id: this.getNodeId(edge.source), type: this.getNodeType(edge.source) },
            target: { id: this.getNodeId(edge.target), type: this.getNodeType(edge.target) },
            value: edge.value
        }))
    };
    return JSON.stringify(config, null, 2);
}

// Helper functions to retrieve node ID and type
private getNodeById(id: string): NodeData | undefined {
    return this.nodes.find(node => node.id === id);
}

private getNodeId(node: string | NodeData): string {
    return typeof node === 'string' ? node : node.id;
}

private getNodeType(node: string | NodeData): string {
    return typeof node === 'string' ? 'unknown' : node.type;
}

  // Getters for local network state.
  getNodes(): NodeData[] {
    return this.nodes;
  }

  getEdges(): EdgeData[] {
    return this.edges;
  }

  private getNearestNode(distances: { [key: string]: number }, visited: { [key: string]: boolean }): string | null {
    let minDistance = Infinity;
    let nearestNode: string | null = null;
    for (const node in distances) {
      if (!visited[node] && distances[node] < minDistance) {
        minDistance = distances[node];
        nearestNode = node;
      }
    }
    return nearestNode;
  }

  private areNodesEqual(node1: string | NodeData, node2: string | NodeData): boolean {
    return this.getNodeId(node1) === this.getNodeId(node2);
  }
}
