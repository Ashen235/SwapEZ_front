import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuantumService {
  private apiUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  addEndpoint(id: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/add_endpoint`, { id }, { headers });
  }

  addRepeater(id: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/add_repeater`, { id }, { headers });
  }

  addEdge(node1: string, node2: string, cost: number): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/add_edge`, { node1, node2, cost }, { headers });
  }

  modifyEdge(node1: string, node2: string, newCost: number): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/modify_edge`, { node1, node2, new_cost: newCost }, { headers });
  }

  removeNode(id: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/remove_node`, { id }, { headers });
  }

  removeEdge(node1: string, node2: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/remove_edge`, { node1, node2 }, { headers });
  }

  createEpr(node1: string, node2: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/create_epr`, { node1, node2 }, { headers });
  }

  measure(node: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/measure`, { node }, { headers });
  }

  teleport(sender: string, receiver: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/teleport`, { sender, receiver }, { headers });
  }

  superdenseCoding(sender: string, receiver: string, message: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/superdense_coding`, { sender, receiver, message }, { headers });
  }

  requestEntanglement(endpoint1: string, endpoint2: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(`${this.apiUrl}/request_entanglement`, { endpoint1, endpoint2 }, { headers });
  }

  clearNetwork(): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    // DELETE method for clearing the network.
    return this.http.delete(`${this.apiUrl}/clear_network`, { headers });
  }

  importNetwork(configStr: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const config = JSON.parse(configStr);
    return this.http.post(`${this.apiUrl}/import_network`, config, { headers });
  }
}
