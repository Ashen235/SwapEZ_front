import { Component } from '@angular/core';
import { NodeManagerComponent } from './node-manager/node-manager.component';
import { NetworkVisualizationComponent } from './network-visualization/network-visualization.component';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    HttpClientModule,  // Ensure HttpClientModule is provided here
    NodeManagerComponent,
    NetworkVisualizationComponent
  ]
})
export class AppComponent {
  title = 'SwapEZ';
}
