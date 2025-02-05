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

	constructor(private quantumService: QuantumService, private netService: NetworkService) { }

	ngAfterViewInit() { }

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
		this.quantumService.removeNode(this.nodeId).subscribe({
			next: response => {
				console.log(response);
				console.log("Removing node");
				this.netService.removeNode(this.nodeId);
			},
			error: error => {
				console.error('There was an error!', error);
			}
		});
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
		this.quantumService.removeEdge(this.node1, this.node2).subscribe({
			next: response => {
				console.log(response);
				console.log("Removing edge between", this.node1, "and", this.node2);
				this.netService.removeEdge(this.node1, this.node2);
			},
			error: error => {
				console.error('There was an error!', error);
			}
		});
	}

	isEdgeValid(node1: string, node2: string, cost: number): boolean {
		const shortestPath = this.netService.getShortestPathCost(node1, node2);
		return shortestPath === null || cost <= shortestPath;
	}

	requestEntanglement() {
		this.quantumService.requestEntanglement(this.endpoint1, this.endpoint2).subscribe({
			next: response => {
				let link_order: { source: string, target: string, type: string }[] = [];
				
				console.log('Path:', response.path);
				console.log('Entanglement:', response);

				let path = response.path;

				response.operations.forEach((op:any) => {
					if(op.type == "link_generation") {
						link_order.push({
							source: op.nodes[0],
							target: op.nodes[1],
							type: op.status == "failed" ? "failed_g" : op.status
						});
					} else if(op.type == "swap" && op.status == "failed") {
						var index0 = path.findIndex((node: string) => node == op.inputs[0][0]);
						var index1 = path.findIndex((node: string) => node == op.inputs[1][0]);
						
						console.log("failed", op, index0, index1);

						for(
							let i = index0 - index1 < 0 ? index0 : index1; 
							i < (index0 - index1 < 0 ? index1 : index0); 
							i++
						) {
							link_order.push({
								source: path[i],
								target: path[i+1],
								type: "failed_s"
							});
							console.log("pushing", link_order[link_order.length - 1]);
						}
					}
				});
				// console.log('Entanglement swaps:', response.entanglement_swaps);
				this.netService.highlightPath(link_order);
			},
			error: error => {
				console.error('Error requesting entanglement:', error);
			}
		});
	}

	importNetwork(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			const file = input.files[0];
			const reader = new FileReader();
			reader.onload = (e) => {
				const configStr = e.target?.result as string;
				this.quantumService.importNetwork(configStr).subscribe({
					next: response => {
						console.log("Backend network imported:", response);
						this.netService.importNetwork(configStr);
					},
					error: err => console.error("Error importing network to backend:", err)
				});
			};
			reader.readAsText(file);
		}
	}

	// Export network configuration and save as JSON file.
	exportNetwork() {
		const configStr = this.netService.exportNetwork();
		const blob = new Blob([configStr], { type: 'application/json' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'network-config.json';
		a.click();
		window.URL.revokeObjectURL(url);
	}

	clearNetwork() {
		this.quantumService.clearNetwork().subscribe({
			next: response => {
				console.log("Backend network cleared:", response);
				// Clear local state by importing an empty network configuration.
				this.netService.importNetwork('{"nodes": [], "edges": []}');
			},
			error: err => console.error("Error clearing backend network:", err)
		});
	}
}
