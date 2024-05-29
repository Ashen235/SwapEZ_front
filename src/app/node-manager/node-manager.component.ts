import { Component, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QuantumService } from '../quantum.service';
import { NetworkService, NodeData, EdgeData } from '../network.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-node-manager',
  templateUrl: './node-manager.component.html',
  styleUrls: ['./node-manager.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule]
})
export class NodeManagerComponent implements AfterViewInit {
  nodeId: string = '';
  nodeType: string = 'endpoint';
  node1: string = '';
  node2: string = '';
  edgeCost: number = 0;
  endpoint1: string = '';
  endpoint2: string = '';

  constructor(private quantumService: QuantumService, private netService: NetworkService) {}

  ngAfterViewInit() {}

  addNode() {
    if (this.nodeType === 'endpoint') {
      this.quantumService.addEndpoint(this.nodeId).subscribe({
        next: response => {
          console.log(response);
          console.log("Adding endpoint node");
          this.netService.addNode({ id: this.nodeId, type: this.nodeType });
          console.log("Endpoint node added");
        },
        error: error => {
          console.error('There was an error!', error);
        }
      });
    } else {
      this.quantumService.addRepeater(this.nodeId).subscribe({
        next: response => {
          console.log(response);
          console.log("Adding repeater node");
          this.netService.addNode({ id: this.nodeId, type: this.nodeType });
          console.log("Repeater node added");
        },
        error: error => {
          console.error('There was an error!', error);
        }
      });
    }
  }

  removeNode() {
    console.log("Removing node:", this.nodeId);
    this.netService.removeNode(this.nodeId);
  }

  addEdge() {
    if (this.isEdgeValid(this.node1, this.node2, this.edgeCost)) {
      this.quantumService.addEdge(this.node1, this.node2, this.edgeCost).subscribe({
        next: response => {
          console.log(response);
          console.log("Adding edge between", this.node1, "and", this.node2, "with cost", this.edgeCost);
          this.netService.addEdge({ source: this.node1, target: this.node2, value: this.edgeCost });
        },
        error: error => {
          console.error('There was an error!', error);
        }
      });
    } else {
      console.error('The edge length does not satisfy the triangle inequality.');
    }
  }

  modifyEdge() {
    if (this.isEdgeValid(this.node1, this.node2, this.edgeCost)) {
      this.quantumService.modifyEdge(this.node1, this.node2, this.edgeCost).subscribe({
        next: response => {
          console.log(response);
          console.log("Modifying edge between", this.node1, "and", this.node2, "to new cost", this.edgeCost);
          this.netService.modifyEdge({ source: this.node1, target: this.node2, value: this.edgeCost });
        },
        error: error => {
          console.error('There was an error!', error);
        }
      });
    } else {
      console.error('The new edge length does not satisfy the triangle inequality.');
    }
  }

  removeEdge() {
    this.netService.removeEdge(this.node1, this.node2);
  }

  isEdgeValid(node1: string, node2: string, cost: number): boolean {
    const shortestPath = this.netService.getShortestPathCost(node1, node2);
    return shortestPath === null || cost <= shortestPath;
  }

  requestEntanglement() {
    this.quantumService.requestEntanglement(this.endpoint1, this.endpoint2).subscribe({
      next: response => {
        console.log('Entanglement path:', response.path);
        console.log('EPR pairs:', response.epr_pairs);
        console.log('Entanglement swaps:', response.entanglement_swaps);
      },
      error: error => {
        console.error('Error requesting entanglement:', error);
      }
    });
  }
}
