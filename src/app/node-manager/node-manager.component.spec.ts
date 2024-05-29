import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeManagerComponent } from './node-manager.component';

describe('NodeManagerComponent', () => {
  let component: NodeManagerComponent;
  let fixture: ComponentFixture<NodeManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeManagerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NodeManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
