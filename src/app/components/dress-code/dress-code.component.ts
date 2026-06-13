import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-dress-code',
  standalone: true,
  imports: [],
  templateUrl: './dress-code.component.html',
})
export class DressCodeComponent {
  readonly title = signal('Dress Code');
  readonly subtitle = signal('Queremos que te sientas comodo y elegante para celebrar juntos.');
}
