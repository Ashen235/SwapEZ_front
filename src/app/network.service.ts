import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

export interface NodeData {
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
  private nodeSubject = new Subject<NodeData>();
  private removeNodeSubject = new Subject<string>();
  private edgeSubject = new Subject<EdgeData>();
  private modifyEdgeSubject = new Subject<EdgeData>();
  private removeEdgeSubject = new Subject<{ source: string, target: string }>();

  nodeObservable$ = this.nodeSubject.asObservable();
  removeNodeObservable$ = this.removeNodeSubject.asObservable();
  edgeObservable$ = this.edgeSubject.asObservable();
  modifyEdgeObservable$ = this.modifyEdgeSubject.asObservable();
  removeEdgeObservable$ = this.removeEdgeSubject.asObservable();

  private nodes: NodeData[] = [];
  private edges: EdgeData[] = [];

  constructor(private http: HttpClient) {}

  addNode(node: NodeData) {
    this.nodes.push(node);
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
      this.edges.push({ source: edge.target, target: edge.source, value: edge.value });
      this.edgeSubject.next(edge);
    }
  }

  modifyEdge(edge: EdgeData) {
    const edgeIndex = this.edges.findIndex(e => this.areNodesEqual(e.source, edge.source) && this.areNodesEqual(e.target, edge.target));
    if (edgeIndex !== -1) {
      this.edges[edgeIndex] = edge;
      const reverseEdgeIndex = this.edges.findIndex(e => this.areNodesEqual(e.source, edge.target) && this.areNodesEqual(e.target, edge.source));
      if (reverseEdgeIndex !== -1) {
        this.edges[reverseEdgeIndex] = { source: edge.target, target: edge.source, value: edge.value };
      }
      this.modifyEdgeSubject.next(edge);
    }
  }

  removeEdge(source: string, target: string) {
    this.edges = this.edges.filter(e => !(this.areNodesEqual(e.source, source) && this.areNodesEqual(e.target, target)));
    this.edges = this.edges.filter(e => !(this.areNodesEqual(e.source, target) && this.areNodesEqual(e.target, source)));
    this.removeEdgeSubject.next({ source, target });
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

  private getNodeId(node: string | NodeData): string {
    return typeof node === 'string' ? node : node.id;
  }

  private areNodesEqual(node1: string | NodeData, node2: string | NodeData): boolean {
    return this.getNodeId(node1) === this.getNodeId(node2);
  }
}
